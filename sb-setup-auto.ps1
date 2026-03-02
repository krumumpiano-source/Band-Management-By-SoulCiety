$PAT = "sbp_8f89f1ff1c856bc2bbd8159a6fa2943d0a9b7222"
$REF = "wsorngsyowgxikiepice"
$H   = @{ Authorization = "Bearer $PAT"; "Content-Type" = "application/json; charset=utf-8" }

function RunSQL($label, $sql) {
  $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes(([ordered]@{ query = $sql } | ConvertTo-Json -Depth 3))
  try {
    Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$REF/database/query" -Method POST -Headers $H -Body $bodyBytes | Out-Null
    Write-Host "  [OK] $label" -ForegroundColor Green
  } catch {
    $raw = ""; try { $stream = $_.Exception.Response.GetResponseStream(); $raw = (New-Object System.IO.StreamReader($stream)).ReadToEnd() } catch {}
    if ($raw -match "already exists" -or $_.Exception.Message -match "already exists") { Write-Host "  [SKIP] $label" -ForegroundColor Gray }
    else { Write-Host "  [WARN] $label : $raw" -ForegroundColor Yellow }
  }
}

Write-Host "`n[1/5] Extensions..." -ForegroundColor Cyan
foreach ($ext in @("uuid-ossp","pg_cron","pg_net")) {
  $b = [System.Text.Encoding]::UTF8.GetBytes((@{ name=$ext; schema="extensions" } | ConvertTo-Json))
  try { Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$REF/database/extensions" -Method POST -Headers $H -Body $b|Out-Null; Write-Host "  [OK] $ext" -ForegroundColor Green }
  catch { Write-Host "  [SKIP] $ext $($_.Exception.Message)" -ForegroundColor Gray }
}
Start-Sleep 3

Write-Host "`n[2/5] Tables..." -ForegroundColor Cyan
RunSQL "push_subscriptions" 'CREATE TABLE IF NOT EXISTS push_subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,band_id text NOT NULL,endpoint text NOT NULL,p256dh text NOT NULL,auth_key text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(user_id,endpoint)); ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY; DO $d$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename=''push_subscriptions'' AND policyname=''ps_sel'') THEN CREATE POLICY ps_sel ON push_subscriptions FOR SELECT USING (auth.uid()=user_id); END IF; IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename=''push_subscriptions'' AND policyname=''ps_ins'') THEN CREATE POLICY ps_ins ON push_subscriptions FOR INSERT WITH CHECK (auth.uid()=user_id); END IF; IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename=''push_subscriptions'' AND policyname=''ps_del'') THEN CREATE POLICY ps_del ON push_subscriptions FOR DELETE USING (auth.uid()=user_id); END IF; END $d$;'

RunSQL "notification_log" 'CREATE TABLE IF NOT EXISTS notification_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),band_id text NOT NULL,notification_type text NOT NULL,reference_key text NOT NULL,sent_at timestamptz NOT NULL DEFAULT now(),UNIQUE(band_id,notification_type,reference_key)); ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;'

Write-Host "`n[3/5] Edge Function..." -ForegroundColor Cyan
$funcSrc = Get-Content "supabase/functions/send-notifications/index.ts" -Raw -Encoding UTF8
$exists = $false
try { Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$REF/functions/send-notifications" -Headers $H|Out-Null; $exists=$true } catch {}
$fp = [ordered]@{ slug="send-notifications"; name="send-notifications"; body=$funcSrc; verify_jwt=$false }
$fpBytes = [System.Text.Encoding]::UTF8.GetBytes(($fp|ConvertTo-Json -Depth 3))
try {
  if ($exists) { Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$REF/functions/send-notifications" -Method PATCH -Headers $H -Body $fpBytes|Out-Null; Write-Host "  [OK] updated" -ForegroundColor Green }
  else { Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$REF/functions" -Method POST -Headers $H -Body $fpBytes|Out-Null; Write-Host "  [OK] created" -ForegroundColor Green }
} catch { $raw=""; try{$s=$_.Exception.Response.GetResponseStream();$raw=(New-Object System.IO.StreamReader($s)).ReadToEnd()}catch{}; Write-Host "  [WARN] $raw" -ForegroundColor Yellow }

Write-Host "`n[4/5] Secrets..." -ForegroundColor Cyan
$sec = @([ordered]@{name="VAPID_PRIVATE_KEY";value="JQcXeB_Am-Pyz3rGnopgA2qKtICNIQTEIoqXKyiHmr4"},[ordered]@{name="VAPID_PUBLIC_KEY";value="BLTV9C7RV2nVM9R-yQXtbfy_SfX7QmNSsA4XPZ_d3Q68ELssl0SioBz8RHjp1FxuAA_Zm2_ZcJ_tjEaRonDHEzA"},[ordered]@{name="VAPID_SUBJECT";value="mailto:admin@soulciety.app"})
$sBytes = [System.Text.Encoding]::UTF8.GetBytes(($sec|ConvertTo-Json -Depth 3))
try { Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$REF/secrets" -Method POST -Headers $H -Body $sBytes|Out-Null; Write-Host "  [OK] VAPID secrets" -ForegroundColor Green }
catch { Write-Host "  [WARN] $($_.Exception.Message)" -ForegroundColor Yellow }

Write-Host "`n[5/5] Cron job..." -ForegroundColor Cyan
$anonKey = "sb_publishable_k2zvxeE9SJEEJkw3SVolqg_pkgZQPnm"
$edgeCall = "SELECT net.http_post(url:='https://wsorngsyowgxikiepice.supabase.co/functions/v1/send-notifications',headers:=jsonb_build_object(''Content-Type'',''application/json'',''Authorization'',''Bearer " + $anonKey + "''),body:=''{}''::jsonb);"
$cronSql = "DO " + '$c$' + " BEGIN BEGIN PERFORM cron.unschedule('soulciety-send-notifications'); EXCEPTION WHEN OTHERS THEN NULL; END; PERFORM cron.schedule('soulciety-send-notifications','* * * * *','" + $edgeCall + "'); END " + '$c$' + ";"
RunSQL "cron job" $cronSql

Write-Host "`n=== DONE ===" -ForegroundColor Green
