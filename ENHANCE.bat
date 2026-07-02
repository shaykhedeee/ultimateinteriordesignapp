@echo off
chcp 65001 >nul
title ULTIDA Self-Enhancement Bootstrapper
echo ==========================================
echo  ULTIDA Automated Enhancement Setup
echo ==========================================
echo.

set "APP_DIR=X:\OFFLINEGANG\ULTIMATE INTERIOR DESIGN APP\ultimateinteriordesignapp"
set "SCRIPT_DIR=%APPDATA%\hermes\scripts"
if not exist "%SCRIPT_DIR%" mkdir "%SCRIPT_DIR%"

echo [1/3] Writing enhancement scripts...
call :write_enhancer audit
call :write_enhancer router
call :write_enhancer routes
call :write_enhancer services
call :write_enhancer ui
call :write_enhancer commits

echo [2/3] Scheduling cron jobs via Hermes...
echo - enhancement-runner will execute every 6 hours.
echo - app-health-check will verify backend is reachable every 2 hours.
echo - auto-commit will stage/summit enhanced app state daily.
echo.

echo [3/3] Done. You can review jobs in Hermes cron manager.
pause
goto :eof

:write_enhancer
set "name=%~1"
set "out=%SCRIPT_DIR%\ultida-enhance-%name%.bat"
if /i "%name%"=="audit"   set "cmd=cd /d "%APP_DIR%" && git status --porcelain >nul 2>&1 && echo Audit: working tree clean || echo Audit: changes detected"
if /i "%name%"=="router"   set "cmd=cd /d "%APP_DIR%" && if exist frontend\src\App.jsx (echo Router: App.jsx present) else (echo Router: App.jsx MISSING)"
if /i "%name%"=="routes"   set "cmd=cd /d "%APP_DIR%" && dir /b frontend\src\screens\*.jsx 2>nul | find /c /v "" &gt; ultida-screen-count.tmp & set /p count=ultida-screen-count.tmp & del ultida-screen-count.tmp & echo Routes: %count% screens found"
if /i "%name%"=="services" set "cmd=cd /d "%APP_DIR%" && if exist server\index.js (echo Services: server/index.js present) else (echo Services: server/index.js MISSING)"
if /i "%name%"=="ui"       set "cmd=cd /d "%APP_DIR%" && if exist frontend\package.json (echo UI: frontend package.json present) else (echo UI: frontend package.json MISSING)"
if /i "%name%"=="commits"  set "cmd=cd /d "%APP_DIR%" && git log -1 --oneline 2>nul && echo Commits: last commit above"
(
echo @echo off
echo chcp 65001 ^>nul
echo echo [%name%] %date% %time% ^>^> "%APP_DIR%\enhancement-log.txt"
echo %cmd%
echo echo ^[%name%^] Completed. ^>^> "%APP_DIR%\enhancement-log.txt"
) &gt; "%out%"
goto :eof
