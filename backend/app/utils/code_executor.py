import asyncio
import base64
import logging
import os
import subprocess
import sys
import tempfile
import time
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Judge0 language IDs (used when JUDGE0_API_KEY is set) ──────────────────
LANGUAGE_IDS = {
    "python": 71,
    "java": 62,
    "cpp": 54,
    "javascript": 63,
    "sql": 82,
    "c": 50,
    "csharp": 51,
    "go": 60,
}

# ── Piston language mappings (free public API) ──────────────────────────────
PISTON_LANGUAGES = {
    "python": "python",
    "javascript": "javascript",
    "java": "java",
    "cpp": "c++",
    "c": "c",
    "go": "go",
    "csharp": "csharp",
    "sql": "sqlite3",
}

# ── Local execution: file extension + command per language ──────────────────
LOCAL_LANGUAGE_CONFIG = {
    "python": {
        "ext": ".py",
        "cmd": [sys.executable],   # same Python that runs FastAPI
    },
    "javascript": {
        "ext": ".js",
        "cmd": ["node"],
    },
}

# Execution time-limit for local subprocess (seconds)
LOCAL_TIMEOUT_SECONDS = 10


# ═══════════════════════════════════════════════════════════════════════════
# Public entry-point
# ═══════════════════════════════════════════════════════════════════════════

async def execute_code(
    code: str,
    language: str,
    stdin: str = "",
    expected_output: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Execute code with the best available engine:
      1. Judge0  – if JUDGE0_API_KEY is configured in .env
      2. Piston  – free public API (requires internet)
      3. Local   – subprocess on this machine (Python & JS, works offline)
    """
    lang = language.lower()

    if settings.JUDGE0_API_KEY:
        return await _execute_via_judge0(code, lang, stdin, expected_output)

    # Try Piston first (more language support)
    result = await _execute_via_piston(code, lang, stdin, expected_output)
    if not result.get("_piston_failed"):
        return result

    # Piston failed → run locally via thread-safe subprocess
    logger.info("Piston unavailable – using local subprocess execution (language=%s)", lang)
    return await _execute_locally(code, lang, stdin, expected_output)


# ═══════════════════════════════════════════════════════════════════════════
# 1. Judge0
# ═══════════════════════════════════════════════════════════════════════════

async def _execute_via_judge0(
    code: str,
    language: str,
    stdin: str = "",
    expected_output: Optional[str] = None,
) -> Dict[str, Any]:
    language_id = LANGUAGE_IDS.get(language, 71)
    encoded_code = base64.b64encode(code.encode()).decode()
    encoded_stdin = base64.b64encode(stdin.encode()).decode() if stdin else ""

    headers = {
        "X-RapidAPI-Key": settings.JUDGE0_API_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "Content-Type": "application/json",
    }
    payload = {
        "source_code": encoded_code,
        "language_id": language_id,
        "stdin": encoded_stdin,
        "expected_output": base64.b64encode(expected_output.encode()).decode() if expected_output else None,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{settings.JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            result = resp.json()

        stdout = _decode_b64(result.get("stdout", ""))
        stderr = _decode_b64(result.get("stderr", ""))
        compile_output = _decode_b64(result.get("compile_output", ""))

        return {
            "status": result.get("status", {}).get("description", "Unknown"),
            "stdout": stdout,
            "stderr": stderr or compile_output,
            "execution_time_ms": int(float(result.get("time", 0)) * 1000),
            "memory_used_kb": result.get("memory", 0),
            "exit_code": result.get("exit_code"),
        }
    except Exception as e:
        logger.error("Judge0 error: %s", e)
        return {"status": "Error", "stdout": "", "stderr": str(e),
                "execution_time_ms": 0, "memory_used_kb": 0}


# ═══════════════════════════════════════════════════════════════════════════
# 2. Piston (free public API)
# ═══════════════════════════════════════════════════════════════════════════

async def _execute_via_piston(
    code: str,
    language: str,
    stdin: str = "",
    expected_output: Optional[str] = None,
) -> Dict[str, Any]:
    """Returns _piston_failed=True when the API is unreachable."""
    piston_lang = PISTON_LANGUAGES.get(language, "python")
    payload = {
        "language": piston_lang,
        "version": "*",
        "files": [{"content": code}],
        "stdin": stdin,
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.post(
                "https://emkc.org/api/v2/piston/execute", json=payload
            )
            if res.status_code == 200:
                data = res.json()
                run_stage = data.get("run", {})
                compile_stage = data.get("compile", {})

                stdout = run_stage.get("stdout", "")
                stderr = (
                    run_stage.get("stderr", "") or compile_stage.get("stderr", "")
                )
                exit_code = run_stage.get("code", 0)

                status = "Accepted"
                if compile_stage.get("code", 0) != 0:
                    status = "Compilation Error"
                elif exit_code != 0:
                    status = "Runtime Error"

                if expected_output and status == "Accepted":
                    if stdout.strip() != expected_output.strip():
                        status = "Wrong Answer"

                return {
                    "status": status,
                    "stdout": stdout,
                    "stderr": stderr,
                    "execution_time_ms": 150,
                    "memory_used_kb": 2048,
                    "exit_code": exit_code,
                }
    except Exception as e:
        logger.warning("Piston API unavailable: %s", e)

    return {
        "_piston_failed": True,
        "status": "Error", "stdout": "", "stderr": "",
        "execution_time_ms": 0, "memory_used_kb": 0,
    }


# ═══════════════════════════════════════════════════════════════════════════
# 3. Local subprocess  (works on Windows regardless of event-loop policy)
# ═══════════════════════════════════════════════════════════════════════════

def _run_subprocess_sync(
    cmd: list,
    code: str,
    stdin_text: str,
    expected_output: Optional[str],
) -> Dict[str, Any]:
    """
    Synchronous helper that writes code to a temp file and runs it.
    Called via asyncio.to_thread so it never blocks the event loop,
    and works with both WindowsProactorEventLoopPolicy and
    WindowsSelectorEventLoopPolicy (uvicorn's default on Windows).
    """
    tmp_path = None
    ext = ".py" if cmd[0] == sys.executable else ".js"
    try:
        # Write code to temp file
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=ext, delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(code)
            tmp_path = tmp.name

        full_cmd = cmd + [tmp_path]
        stdin_bytes = stdin_text.encode("utf-8") if stdin_text else b""

        start = time.monotonic()
        try:
            proc = subprocess.run(
                full_cmd,
                input=stdin_bytes,
                capture_output=True,
                timeout=LOCAL_TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired:
            return {
                "status": "Time Limit Exceeded",
                "stdout": "",
                "stderr": f"Time limit exceeded ({LOCAL_TIMEOUT_SECONDS}s)",
                "execution_time_ms": LOCAL_TIMEOUT_SECONDS * 1000,
                "memory_used_kb": 0,
                "exit_code": -1,
            }
        except FileNotFoundError:
            exe = cmd[0]
            return {
                "status": "Runtime Error",
                "stdout": "",
                "stderr": (
                    f"Executable '{exe}' not found on the server. "
                    "Install it or configure JUDGE0_API_KEY in .env."
                ),
                "execution_time_ms": 0,
                "memory_used_kb": 0,
                "exit_code": 1,
            }

        elapsed_ms = int((time.monotonic() - start) * 1000)
        stdout = proc.stdout.decode("utf-8", errors="replace")
        stderr = proc.stderr.decode("utf-8", errors="replace")
        exit_code = proc.returncode

        if exit_code != 0:
            status = "Runtime Error"
        else:
            status = "Accepted"
            if expected_output is not None:
                if stdout.strip() != expected_output.strip():
                    status = "Wrong Answer"

        return {
            "status": status,
            "stdout": stdout,
            "stderr": stderr,
            "execution_time_ms": elapsed_ms,
            "memory_used_kb": 0,
            "exit_code": exit_code,
        }

    except Exception as e:
        logger.exception("Unexpected error in local subprocess execution")
        return {
            "status": "Runtime Error",
            "stdout": "",
            "stderr": str(e),
            "execution_time_ms": 0,
            "memory_used_kb": 0,
            "exit_code": 1,
        }
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


async def _execute_locally(
    code: str,
    language: str,
    stdin: str = "",
    expected_output: Optional[str] = None,
) -> Dict[str, Any]:
    """Async wrapper around _run_subprocess_sync using asyncio.to_thread."""
    cfg = LOCAL_LANGUAGE_CONFIG.get(language)
    if cfg is None:
        return {
            "status": "Error",
            "stdout": "",
            "stderr": (
                f"Local execution does not support '{language}'. "
                "Configure JUDGE0_API_KEY in .env for full language support."
            ),
            "execution_time_ms": 0,
            "memory_used_kb": 0,
            "exit_code": 1,
        }

    # asyncio.to_thread offloads the blocking subprocess.run to a thread pool,
    # avoiding NotImplementedError on Windows with SelectorEventLoop (uvicorn).
    return await asyncio.to_thread(
        _run_subprocess_sync, cfg["cmd"], code, stdin, expected_output
    )


# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════

def _decode_b64(value: Optional[str]) -> str:
    if not value:
        return ""
    try:
        return base64.b64decode(value).decode("utf-8", errors="replace")
    except Exception:
        return value
