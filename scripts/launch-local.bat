@echo off
setlocal
cd /d "%~dp0.."
echo Killing stale Node on 5055/5175...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5055 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5175 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul
echo Starting backend...
start "ULTIDA-Backend" cmd /c node server/index.js
timeout /t 3 /nobreak >nul
echo Starting frontend...
start "ULTIDA-Frontend" cmd /c npm.cmd run client
echo Done. Open http://127.0.0.1:5175
endlocal
