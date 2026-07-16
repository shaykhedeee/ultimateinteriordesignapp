@echo off
setlocal
cd /d "%~dp0.."
echo [ULTIDA] Validating backend on 5055...
node scripts/verify-ai-endpoints.js
echo.
echo [ULTIDA] If backend is not running, start it with scripts\run-backend.bat
endlocal
exit /b 0
