@echo off
chcp 65001 >nul
title Ultimate Interior Design App - Verify
echo ==========================================
echo   Runtime Verification
echo ==========================================
echo.

set API=http://127.0.0.1:5055/api

echo [1/5] Health
curl -s %API%/health && echo.

echo [2/5] Tools registry
curl -s %API%/tools | findstr /C:"success" >nul && echo OK || echo FAIL

echo [3/5] Supported tasks
curl -s %API%/providers/supported-tasks | findstr /C:"success" >nul && echo OK || echo FAIL

echo [4/5] Settings providers
curl -s %API%/settings/providers | findstr /C:"success" >nul && echo OK || echo FAIL

echo [5/5] Latest render helper
curl -s "%API%/projects/1/renders?latest=1" | findstr /C:"renderId" >nul && echo OK || echo FAIL

echo.
echo Done.
pause
