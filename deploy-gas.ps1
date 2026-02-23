#!/usr/bin/env pwsh
# deploy-gas.ps1
# Push backend to GAS + redeploy Web App
# Usage: .\deploy-gas.ps1 [-message "optional description"]

param(
  [string]$message = "auto-redeploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$ROOT = "D:\AI CURSER\Band Management By SoulCiety"
$DEPLOYMENT_ID = "AKfycbxbJ15GWQIl9loFneJeooAhTPM5iYW460k04s2n1BGtN6RuKjnQUFWd3NNrqYmX64UI"

Set-Location $ROOT

Write-Host "`n🚀 [1/2] Pushing to Google Apps Script..." -ForegroundColor Cyan
$pushResult = clasp push --force 2>&1
Write-Host $pushResult
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Push failed!" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Push complete" -ForegroundColor Green

Write-Host "`n🔄 [2/2] Redeploying Web App ($message)..." -ForegroundColor Cyan
$deployResult = clasp deploy --deploymentId $DEPLOYMENT_ID --description $message 2>&1
Write-Host $deployResult
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Deploy failed!" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Redeploy complete!" -ForegroundColor Green
Write-Host "`n🌐 Web App URL (unchanged):"
Write-Host "   https://script.google.com/macros/s/$DEPLOYMENT_ID/exec" -ForegroundColor Yellow
