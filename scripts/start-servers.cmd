@echo off
setlocal
set PORT=5055
cd /d "%~dp0.."
echo Using project root: %cd%
echo Starting ULTIDA server on port %PORT% ...
start "ULTIDA Server" /B node server/index.js > storage\server.log 2>&1
echo Server launch command issued.
echo Waiting 3 seconds...
timeout /t 3 /nobreak
echo Checking server log...
if exist storage\server.log (
  type storage\server.log | findstr /i "listening\|error\|exception\|trace" || echo(no_matching_lines
) else (
  echo server_log_missing
)
echo.
echo Latest log tail:
type storage\server.log 2>nul | powershell -Command "$input | Select-Object -Last 20"
echo.
echo Quick port probe:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:%PORT%/' -UseBasicParsing -TimeoutSec 5; 'http_' + $r.StatusCode } catch { 'connect_failed' }"
echo.
echo Detached server remains running. Server logs: storage\server.log
echo To tail live: powershell Get-Content storage\server.log -Wait
endlocal
pause
