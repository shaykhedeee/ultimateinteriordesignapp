@echo off
setlocal
cd /d "%~dp0..\server"
echo Starting ULTIDA backend on 5055...
node index.js
pause