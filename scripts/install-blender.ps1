# Install Blender (guarded) for ULTIDA deterministic base renders.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/install-blender.ps1
# Optional: set a target install dir, e.g.
#   $env:BLENDER_INSTALL_DIR = "D:\Blender"; .\scripts\install-blender.ps1
$ErrorActionPreference = 'Stop'

$InstallDir = $env:BLENDER_INSTALL_DIR
if (-not $InstallDir) { $InstallDir = 'C:\Program Files\Blender Foundation\Blender 4.2' }

# Disk guard: Blender needs ~2.5 GB free (download + extraction overhead).
$freeMB = (Get-PSDrive C).Free / 1MB
if ($freeMB -lt 2500) {
  Write-Host "ABORT: need >=2500 MB free on C:; only $([math]::Round($freeMB)) MB available." -ForegroundColor Red
  Write-Host "Free space, move the pagefile, or set `$env:BLENDER_INSTALL_DIR to another drive, then re-run." -ForegroundColor Yellow
  exit 1
}

Write-Host "Installing Blender to $InstallDir ..." -ForegroundColor Cyan
winget install --id Blender.Blender -e --silent --accept-package-agreements --accept-source-agreements `
  --location $InstallDir

# Verify and report the path ULTIDA's blender-renderer.js already searches.
$bin = Join-Path $InstallDir 'blender.exe'
if (Test-Path $bin) {
  Write-Host "OK: blender.exe found at $bin" -ForegroundColor Green
  Write-Host "ULTIDA's /scene/blender-export will now produce real Cycles base renders." -ForegroundColor Green
} else {
  Write-Host "Installed, but blender.exe not at expected path. Add it to PATH or set BLENDER_PATH." -ForegroundColor Yellow
}
