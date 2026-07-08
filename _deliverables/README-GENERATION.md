# Ultimate Interior Design OS — Generation Guide

## Offline/Local best path
Run on-demand generation with Node ESM writers:
```bash
node scripts/dev-cli.mjs
```
Output: `_deliverables/nambia-pipeline/`

## Best server connection on Windows
Open a dedicated CMD/PowerShell window and run:
```bash
cd "C:\Users\USER\Documents\Muskans autocad solution\THE ULTIMATE INTERIOR DESIGN APPLICATION"
node server/index.js
```
Then use `http://127.0.0.1:5055` from the frontend. Do not background this from bash shell.
