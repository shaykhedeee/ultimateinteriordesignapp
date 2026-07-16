@echo off
chcp 65001 >nul
title Ultimate Interior Design App Launcher
echo ==========================================
echo   Ultimate Interior Design App
echo ==========================================
echo.

cd /d "X:\OFFLINEGANG\ULTIMATE INTERIOR DESIGN APP\ultimateinteriordesignapp"

echo [1/2] Starting backend API on http://127.0.0.1:5055 ...
start "UID Backend" cmd /c "node server/index.js"

echo [2/2] Starting frontend dev server on http://127.0.0.1:5175 ...
start "UID Frontend" cmd /c "npm run client"

echo.
echo Both servers are starting in separate windows.
echo   - API:  http://127.0.0.1:5055
echo   - App:  http://127.0.0.1:5175
echo.
echo Press any key to exit this launcher...
pause >nul
