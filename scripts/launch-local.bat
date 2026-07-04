@echo off
setlocal
cd /d "%~dp0.."
echo.
echo [ULTIDA] Starting backend and frontend in separate windows...
echo [ULTIDA] Close this window only when you want to stop both processes.
echo.

start "ULTIDA Backend (port 5055)" cmd /c "scripts\\run-backend.bat"
timeout /t 2 /nobreak >nul
start "ULTIDA Frontend (port 5175)" cmd /c "scripts\\run-frontend.bat"

echo [ULTIDA] Launched.
pause
endlocal
exit /b 0
