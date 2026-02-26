# ─────────────────────────────────────────────────────────────────
# deploy-github.ps1  — Push ทุก่างไปยัง GitHub
# ─────────────────────────────────────────────────────────────────
param(
  [string]$msg = "migrate to Supabase"
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host ""
Write-Host "══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "══════════════════════════════════════" -ForegroundColor Cyan

git add .
git commit -m $msg
git push

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "✅ Push สำเร็จ!" -ForegroundColor Green
  Write-Host ""
  Write-Host "GitHub Pages จะอัปเดตใน 1-2 นาที" -ForegroundColor Yellow
} else {
  Write-Host ""
  Write-Host "❌ Push ล้มเหลว ดู error ด้านบน" -ForegroundColor Red
}
