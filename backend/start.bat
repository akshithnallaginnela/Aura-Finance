@echo off
title AuraFinance AIML Backend
cd %~dp0

echo ========================================================
echo   AuraFinance - Starting Python AIML Backend Server     
echo ========================================================

:: Check for python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ and add it to system PATH.
    pause
    exit /b 1
)

:: Check for uv
where uv >nul 2>nul
if %errorlevel% eq 0 (
    echo [INFO] Detected fast Python package manager 'uv'.
    if not exist .venv (
        echo [INFO] Creating virtual environment with uv...
        uv venv .venv
    )
    echo [INFO] Installing requirements via uv...
    uv pip install -r requirements.txt
) else (
    echo [INFO] 'uv' not found. Falling back to standard virtualenv + pip.
    if not exist .venv (
        echo [INFO] Creating virtual environment via venv...
        python -m venv .venv
    )
    echo [INFO] Installing requirements via pip...
    call .venv\Scripts\activate
    python -m pip install --upgrade pip
    pip install -r requirements.txt
)

echo [SUCCESS] Dependencies satisfied. Starting Flask server on port 5000...
set FLASK_APP=app.py
set FLASK_DEBUG=1
call .venv\Scripts\activate
python app.py
