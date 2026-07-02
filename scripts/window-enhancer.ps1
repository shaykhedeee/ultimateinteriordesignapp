#!/usr/bin/env pwsh
param(
  [ValidateSet('audit','router','routes','services','ui','commits')]
  [string]$Stage
)

$ErrorActionPreference = 'Stop'
$AppDir = 'X:\OFFLINEGANG\ULTIMATE INTERIOR DESIGN APP\ultimateinteriordesignapp'
if (-not (Test-Path $AppDir)) { throw "Missing app dir: $AppDir" }

$Log = Join-Path $AppDir 'enhancement-log.txt'
if (-not (Test-Path $Log)) { [IO.File]::WriteAllText($Log, '') }

$entry = {
  param($s)
  $ts = Get-Date -Format 'o'
  try {
    $result = switch ($s) {
      'audit' {
        if (Test-Path (Join-Path $AppDir '.git')) { 'git repository present' } else { 'no .git found' }
      }
      'router' {
        if (Test-Path (Join-Path $AppDir 'frontend\src\App.jsx')) { 'frontend/src/App.jsx present' } else { 'frontend/src/App.jsx MISSING' }
      }
      'routes' {
        $screens = Get-ChildItem (Join-Path $AppDir 'frontend\src\screens') -Filter '*.jsx' -ErrorAction SilentlyContinue
        if ($screens) { "$($screens.Count) screens found" } else { 'no screens found' }
      }
      'services' {
        if (Test-Path (Join-Path $AppDir 'server\index.js')) { 'server/index.js present' } else { 'server/index.js MISSING' }
      }
      'ui' {
        $rootPkg = Join-Path $AppDir 'package.json'
        $frontendPkg = Join-Path $AppDir 'frontend\package.json'
        if (Test-Path $rootPkg) {
          'package.json present at app root'
        } elseif (Test-Path $frontendPkg) {
          'package.json present under frontend/'
        } else {
          'package.json MISSING in both root and frontend/'
        }
      }
      'commits' {
        if (Test-Path (Join-Path $AppDir '.git')) {
          git -C $AppDir log -1 --oneline 2>$null
        } else { 'no commits: no git repo' }
      }
    }

    Add-Content -Path $Log -Value "[$ts] [$s] OK`n$result"
    Write-Host "[$s] OK`n$result"
  }
  catch {
    Add-Content -Path $Log -Value "[$ts] [$s] FAIL: $_"
    Write-Host "[$s] FAIL: $_"
  }
}

if ($Stage) {
  & $entry $Stage
}
else {
  'audit','router','routes','services','ui','commits' | ForEach-Object { & $entry $_ }
}
