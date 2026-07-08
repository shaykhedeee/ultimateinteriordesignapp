# ULTIDA Generation & Connections Guide

## Files
- Deliverables: `_deliverables/nambia-pipeline/`
- Local CLI: `scripts/dev-cli.mjs`
- SKP reader/writer: `server/services/skp-reader.js`

## Local Generation (preferred, no server needed)
```bash
node scripts/dev-cli.mjs
```

## Server
- Preferred: open a **dedicated CMD or PowerShell window** and run:
```cmd
node server/index.js
```
- Then use the browser at `http://127.0.0.1:5055`.

From this Git Bash session, do NOT background-launch the server:
history shows TTY/job-control behavior can kill the listener immediately.

## SKP API routes
- `POST /api/projects/:id/skp/analyze` multipart `skpFile`
- `POST /api/projects/:id/skp/generate` JSON body `{ "edges":[...], "units": 4 }`, returns `bufferB64`
- `POST /api/projects/:id/skp/import-to-dxf` multipart `skpFile`, returns DXF attachment

If `.skp` generation is needed locally:
```bash
node -e "import('./server/services/skp-reader.js').then(m=>m.generateSkpDirect({},{fileName:'sample.skp'}).then(r=>import('fs').then(fs=>{fs.writeFileSync('sample.skp',r.buffer);console.log(r.bytes);})))"
```
