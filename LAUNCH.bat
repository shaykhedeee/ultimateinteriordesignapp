@echo off
chcp 65001 >nul
title Ultimate Interior Design App - Local Launcher
echo ==========================================
echo  Ultimate Interior Design App
echo ==========================================
echo.

set "APP_DIR=%~dp0"
if not exist "%APP_DIR%node_modules" (
    echo [1/2] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo npm install failed. Ensure Node.js is installed.
        pause
        exit /b 1
    )
) else (
    echo [1/2] Dependencies already installed.
)

echo.
echo [2/2] Starting backend + frontend...
echo   Backend : http://127.0.0.1:5055
echo   Frontend: http://127.0.0.1:5175
echo.
echo Press Ctrl+C to stop both servers.
echo.

start "ULTIDA-Backend" cmd /c "cd /d "%APP_DIR%" && node server/index.js"
timeout /t 2 /nobreak >nul
start "ULTIDA-Frontend" cmd /c "cd /d "%APP_DIR%" && npm run client"

pause
