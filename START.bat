@echo off
setlocal
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

echo ========================================
echo   Ultimate Interior Design App Launcher
echo ========================================
echo.

set "BACKEND_PORT=5055"
set "FRONTEND_PORT=5175"

:: wait for port
:wait_for_port
set "PORT=%1"
set "NAME=%2"
set /a retries=0
:wait_loop
powershell -Command "try { $c=New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',%PORT%); $c.Close(); exit 0 } catch { exit 1 }"
if %errorlevel%==0 (
  echo [OK] %NAME% is up on port %PORT%.
  goto :eof
)
set /a retries+=1
if %retries% geq 60 (
  echo [ERROR] %NAME% did not start on port %PORT% after %retries% attempts.
  goto :eof
)
timeout /t 1 >nul
goto :wait_loop

:cleanup
echo.
echo Stopping services...
if defined BACKEND_PID taskkill /PID %BACKEND_PID% /F >nul 2>&1
if defined FRONTEND_PID taskkill /PID %FRONTEND_PID% /F >nul 2>&1
echo Done.
exit /b 0

echo [1/4] Starting backend on port %BACKEND_PORT% ...
start "UID-Backend" cmd /c "node server/index.js"
call :wait_for_port %BACKEND_PORT% "Backend"
if errorlevel 1 goto cleanup

echo [2/4] Starting frontend on port %FRONTEND_PORT% ...
start "UID-Frontend" cmd /c "npm run client"
call :wait_for_port %FRONTEND_PORT% "Frontend"
if errorlevel 1 goto cleanup

echo [3/4] Opening browser...
timeout /t 2 >nul
start http://127.0.0.1:%FRONTEND_PORT%

echo [4/4] App is running.
echo   Frontend : http://127.0.0.1:%FRONTEND_PORT%
echo   Backend  : http://127.0.0.1:%BACKEND_PORT%/api/health
echo.
echo Close this window to stop both services.
pause
goto cleanup
