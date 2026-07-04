@echo off
setlocal
cd /d "%~dp0.."
echo Verifying ULTIDA AI endpoints...
node scripts/verify-ai-endpoints.js
pause