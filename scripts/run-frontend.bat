@echo off
setlocal
cd /d "%~dp0..\frontend"
echo Starting ULTIDA frontend on 5175...
npx vite --host 0.0.0.0 --port 5175
pause