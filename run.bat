@echo off
title AI Interview Preparation Portal Launcher

echo ========================================================
echo   Starting AI Interview Preparation Portal (Backend & Frontend)
echo ========================================================
echo.

REM Get script directory path
set SCRIPT_DIR=%~dp0

REM Launch Backend in a new window
echo [1/2] Starting Backend (FastAPI on http://localhost:8000)...
start "Backend Server (FastAPI)" cmd /k "cd /d %SCRIPT_DIR%backend && (if exist venv\Scripts\activate call venv\Scripts\activate) && uvicorn main:app --reload --port 8000"

REM Launch Frontend in a new window
echo [2/2] Starting Frontend (Vite React on http://localhost:5173)...
start "Frontend Server (Vite)" cmd /k "cd /d %SCRIPT_DIR%frontend && npm run dev"

echo.
echo ========================================================
echo Both Backend and Frontend services are launching!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend Web App: http://localhost:5173
echo ========================================================
echo.
pause
