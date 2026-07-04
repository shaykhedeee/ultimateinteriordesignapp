@echo off
echo Starting Ultimate Interior Design backend + AI harness evaluator...
start "Ultimate Interior Design API" cmd /c node server/index.js
timeout /t 4 /nobreak >nul
pushd scripts
node ai-harness-evaluator.js
set EXITCODE=%ERRORLEVEL%
popd
echo.
echo Evaluator exit code: %EXITCODE%
pause
exit /b %EXITCODE%
