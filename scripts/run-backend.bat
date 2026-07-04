@echo off
setlocal
cd /d "%~dp0.."
echo Starting ULTIDA backend on 5055...
node server/index.js
pause