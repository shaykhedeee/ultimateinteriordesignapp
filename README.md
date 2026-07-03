# Ultimate Interior Design App

## Environment
- backend runtime: Node.js ESM on port 5055
- python venv: `.venv` with `opencv-python-headless` for vision/cv2-dependent services
  - Windows venv Python: `.venv/Scripts/python.exe`
  - Activate venv in PowerShell: `.venv/Scripts/Activate.ps1`
  - Activate venv in CMD: `.venv/Scripts/activate.bat`
- frontend build: Vite 5.4.x

## Quick Start
- `npm run check` - syntax check backend
- `npm run build` - build frontend
- `npm run server` - start backend
- `npm run dev` - start frontend dev server
- Windows launcher: `LAUNCH.bat`

## Verified
- `npm run check` passes
- `npm run build` passes
- Python `cv2` installed in `.venv`
