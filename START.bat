@echo off
title Ultimate Interior Design App
chcp 65001 >nul 2>&1

set "ROOT=C:\Users\methe\OFFLINEGANG\ULTIMATE INTERIOR DESIGN APP\ultimateinteriordesignapp"
set "SERVER_DIR=%ROOT%\server"

echo.
echo ==========================================
echo    ULTIMATE INTERIOR DESIGN APP - START
echo ==========================================
echo.

cd /d "%ROOT%"

echo [1/5] Cleaning stale Node processes on port 5055...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5055" ^| findstr "LISTENING"') do (
  echo Killing PID %%p on port 5055...
  taskkill /F /PID %%p >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo [2/5] Starting backend server...
start "UID-Backend" /B node "%SERVER_DIR%\index.js"

echo [3/5] Waiting for backend health...
set /a retries=0
:wait_port
timeout /t 1 /nobreak >nul
curl -s http://127.0.0.1:5055/api/health >nul 2>&1
if %errorlevel% neq 0 (
  set /a retries+=1
  if %retries% lss 30 goto wait_port
  echo WARNING: Server did not respond after 30 seconds.
  echo Check "%SERVER_DIR%" logs or run: "%SERVER_DIR%\node index.js" manually.
)

echo [4/5] Seeding demo data...
curl -s -X POST http://127.0.0.1:5055/api/demo/seed >nul 2>&1 || true

echo [5/5] Launching browser...
start http://127.0.0.1:5173

echo.
echo ==========================================
echo    APP READY
echo ==========================================
echo.
echo Backend : http://127.0.0.1:5055
echo.
echo If the app does not open:
echo   1. Run this script as Administrator
echo   2. Or open a new terminal in "%ROOT%" and run: npm run dev
echo.
pause
