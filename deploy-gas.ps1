#!/usr/bin/env pwsh
# deploy-gas.ps1
# Push backend to GAS + redeploy Web App
# Usage: .\deploy-gas.ps1 [-message "optional description"]

param(
  [string]$message = "auto-redeploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$ROOT = "D:\AI CURSER\Band Management By SoulCiety"
# DEPLOYMENT_ID: set env var GAS_DEPLOYMENT_ID to override, or update the fallback below
$DEPLOYMENT_ID = if ($env:GAS_DEPLOYMENT_ID) { $env:GAS_DEPLOYMENT_ID } else { "AKfycbxbJ15GWQIl9loFneJeooAhTPM5iYW460k04s2n1BGtN6RuKjnQUFWd3NNrqYmX64UI" }

Set-Location $ROOT

# ── Auth: clasp always uses ~/.clasprc.json — swap in project credentials ──
$LOCAL_AUTH  = Join-Path $ROOT ".clasprc.json"
$HOME_CLASP  = "$env:USERPROFILE\.clasprc.json"
$BACKUP_CLASP = "$env:USERPROFILE\.clasprc.json.bak"
$didSwap = $false
if (Test-Path $LOCAL_AUTH) {
  if (Test-Path $HOME_CLASP) { Copy-Item $HOME_CLASP $BACKUP_CLASP -Force }
  Copy-Item $LOCAL_AUTH $HOME_CLASP -Force
  $didSwap = $true
  Write-Host "   Swapped in project credentials (krumum.piano@gmail.com)" -ForegroundColor DarkGray
} else {
  Write-Host "   WARNING: .clasprc.json not found -- using current global credentials" -ForegroundColor Yellow
}

# ── Step 1: Flatten frontend HTML templates to root so clasp picks them up ──
Write-Host ""
Write-Host "Flattening frontend HTML templates to root..." -ForegroundColor DarkCyan
$copiedFiles = @()
Get-ChildItem -Path "frontend" -Filter "*.html" | ForEach-Object {
  $dest = Join-Path $ROOT $_.Name
  Copy-Item $_.FullName $dest -Force
  $copiedFiles += $dest
}
Write-Host "   Copied $($copiedFiles.Count) HTML file(s)"

try {
  Write-Host ""
  Write-Host "[1/2] Pushing to Google Apps Script..." -ForegroundColor Cyan
  $pushResult = clasp push --force 2>&1
  Write-Host $pushResult
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed!" -ForegroundColor Red
    exit 1
  }
  Write-Host "Push complete" -ForegroundColor Green
} finally {
  # ── Cleanup: remove the temporarily flattened HTML files ──
  $copiedFiles | ForEach-Object { if (Test-Path $_) { Remove-Item $_ -Force } }
  Write-Host "   Cleaned up $($copiedFiles.Count) temporary file(s)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[2/2] Redeploying Web App ($message)..." -ForegroundColor Cyan
$deployResult = clasp deploy --deploymentId $DEPLOYMENT_ID --description $message 2>&1
Write-Host $deployResult
if ($LASTEXITCODE -ne 0) {
  Write-Host "Deploy failed!" -ForegroundColor Red
  exit 1
}
Write-Host "Redeploy complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Web App URL (unchanged):"
Write-Host "   https://script.google.com/macros/s/$DEPLOYMENT_ID/exec" -ForegroundColor Yellow

# ── Restore previous global credentials ──
if ($didSwap -and (Test-Path $BACKUP_CLASP)) {
  Copy-Item $BACKUP_CLASP $HOME_CLASP -Force
  Write-Host "   Restored previous global credentials" -ForegroundColor DarkGray
}
