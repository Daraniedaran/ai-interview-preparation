# Runs the end-to-end API smoke test against a fresh server instance.
# Usage: powershell -ExecutionPolicy Bypass -File run_tests.ps1
$ErrorActionPreference = "Stop"
$Port = 8000
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

# 1. Make sure the port is free (kill any leftover server on it)
$busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($busy) {
    Write-Host "Port $Port is in use. Killing process $($busy.OwningProcess) ..."
    Stop-Process -Id $busy.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# 2. Ensure database tables + seed data exist (seed.py is idempotent)
Write-Host "Seeding database (idempotent)..."
& python seed.py | Out-Null

# 3. Start the server in a background job (must share this PowerShell process)
Write-Host "Starting API server on port $Port ..."
$job = Start-Job -ScriptBlock {
    param($root)
    Set-Location $root
    & python -m uvicorn main:app --host 127.0.0.1 --port 8000
} -ArgumentList $Root

# 4. Wait for /health
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 1
    try {
        $h = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 3
        if ($h.status -eq "healthy") { $ready = $true; break }
    } catch { }
}
if (-not $ready) {
    Write-Host "Server failed to start. Job output:"
    Receive-Job $job -Keep | Out-String | Write-Host
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "Server is healthy."

# 5. Run the smoke test
& python smoke_test.py "http://127.0.0.1:$Port"
$code = $LASTEXITCODE

# 6. Cleanup
Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -Force -ErrorAction SilentlyContinue
Write-Host "Server stopped. Smoke test exit code: $code"
exit $code
