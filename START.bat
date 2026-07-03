@echo off
title Ultimate Interior Design App
chcp 65001 >nul 2>&1

set "ROOT=C:\\Users\\methe\\OFFLINEGANG\\ULTIMATE INTERIOR DESIGN APP\\ultimateinteriordesignapp"
set "SERVER_DIR=%ROOT%\\server"

echo.
echo ==========================================
echo    ULTIMATE INTERIOR DESIGN APP - START
echo ==========================================
echo.

cd /d "%ROOT%"

echo [1/4] Resetting backend port 5055...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5055 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }" 2>nul

echo [2/4] Starting backend server...
start "UID-Backend" powershell -NoProfile -Command "Set-Location '%SERVER_DIR%'; Write-Host 'Backend starting...'; node index.js"

echo [3/4] Waiting for backend health...
powershell -NoProfile -Command "$t=0; while($t -lt 30){ try { $r=Invoke-WebRequest -Uri 'http://127.0.0.1:5055/api/health' -UseBasicParsing; if($r.StatusCode -eq 200){ exit 0 } } catch {}; Start-Sleep -Seconds 1; $t++ } exit 1"

echo [4/4] Seeding demo data...
curl -s -X POST http://127.0.0.1:5055/api/demo/seed >nul 2>&1 || true

echo.
echo ==========================================
echo    VERIFYING CRITICAL ENDPOINTS
echo ==========================================
echo.

echo --- health ---
curl -s http://127.0.0.1:5055/api/health
echo.

echo --- tools list ---
curl -s http://127.0.0.1:5055/api/tools | tail -c 400
echo.

echo --- providers/supported-tasks ---
curl -s http://127.0.0.1:5055/api/providers/supported-tasks | tail -c 400
echo.

echo --- settings providers ---
curl -s http://127.0.0.1:5055/api/settings/providers | tail -c 400
echo.

set "PROJECT=demo_proj_1"
echo --- project renders (%PROJECT%) ---
curl -s "http://127.0.0.1:5055/api/projects/%PROJECT%/renders?latest=1" | tail -c 400
echo.

echo --- elevation generate ---
curl -s -X POST "http://127.0.0.1:5055/api/projects/%PROJECT%/elevations/generate" -H "Content-Type: application/json" -d "{\"wallFace\":\"front\"}" | tail -c 400
echo.

echo --- free model executor ---
curl -s -X POST "http://127.0.0.1:5055/api/providers/free-model/execute" -H "Content-Type: application/json" -d '{"taskType":"quick_render","payload":{"prompt":"modern living room"}}' | tail -c 500
echo.

echo.
echo ==========================================
echo    APP READY
echo ==========================================
echo.
echo Backend : http://127.0.0.1:5055
echo.
echo To open the frontend:
echo   1. Open a new terminal in "%ROOT%"
echo   2. Run: npm run dev
echo   3. Open the URL shown (usually http://127.0.0.1:5173)
echo.
echo If backend did not start:
echo   - Run this script as Administrator
echo   - Or open PowerShell and run from "%SERVER_DIR%": node index.js
echo.
pause
