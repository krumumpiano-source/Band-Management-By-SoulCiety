// Supabase Edge Function — send-notifications
// Deno runtime. Called every 5 minutes by pg_cron.
// Sends Web Push for:
//   Type 1: upcoming external jobs (1-day notice)
//   Type 2: schedule start reminder (1 hour before)
//   Type 3: check-in reminder (5 minutes before)
// Respects band manager's notifications_enabled toggle in band_settings.

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC     = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE    = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT    = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@soulciety.app';

// ── Native Web Push (RFC 8291) + VAPID (RFC 8292) — no external deps ────────
function b64url(buf: Uint8Array | ArrayBuffer): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  bytes.forEach(b => s += String.fromCharCode(b));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function unb64url(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const b = atob(s);
  return Uint8Array.from(b, c => c.charCodeAt(0));
}
function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}
async function hmac256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}
// HKDF-Extract  = HMAC-SHA-256(salt, ikm)
// HKDF-Expand   = HMAC-SHA-256(prk, info || 0x01)  [L≤32]
const hkdfExtract = (salt: Uint8Array, ikm: Uint8Array) => hmac256(salt, ikm);
const hkdfExpand  = (prk: Uint8Array, info: Uint8Array, len: number) =>
  hmac256(prk, concat(info, new Uint8Array([1]))).then(t => t.slice(0, len));

/** VAPID JWT signed with ECDSA P-256 (RFC 8292) */
async function makeVapidAuth(endpoint: string): Promise<string> {
  const origin = new URL(endpoint).origin;
  const now    = Math.floor(Date.now() / 1000);
  const enc    = (o: object) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const hdr    = enc({ typ: 'JWT', alg: 'ES256' });
  const pld    = enc({ aud: origin, exp: now + 43200, sub: VAPID_SUBJECT });
  const msg    = `${hdr}.${pld}`;

  // Build JWK from raw VAPID keys (65-byte uncompressed public key)
  const pub = unb64url(VAPID_PUBLIC);
  const jwk = {
    kty: 'EC', crv: 'P-256',
    d: VAPID_PRIVATE,
    x: b64url(pub.slice(1, 33)),
    y: b64url(pub.slice(33, 65)),
  };
  const key = await crypto.subtle.importKey('jwk', jwk,
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig  = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(msg));
  return `vapid t=${msg}.${b64url(sig)},k=${VAPID_PUBLIC}`;
}

/** Encrypt payload per RFC 8291 (Content-Encoding: aes128gcm) */
async function encryptPayload(
  plaintext: string, p256dh: string, auth: string
): Promise<Uint8Array> {
  const salt    = crypto.getRandomValues(new Uint8Array(16));
  const rcvPub  = unb64url(p256dh);  // 65-byte uncompressed

  // Ephemeral sender EC key pair
  const sndKP  = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const sndPub = new Uint8Array(await crypto.subtle.exportKey('raw', sndKP.publicKey));  // 65 bytes

  // ECDH shared secret
  const rcvKey = await crypto.subtle.importKey('raw', rcvPub,
    { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'ECDH', public: rcvKey }, sndKP.privateKey, 256));

  // RFC 8291 key derivation
  const authSecret   = unb64url(auth);
  const prk1         = await hkdfExtract(authSecret, shared);
  const webpushInfo  = concat(new TextEncoder().encode('WebPush: info\0'), rcvPub, sndPub);
  const ikm          = await hkdfExpand(prk1, webpushInfo, 32);
  const prk2         = await hkdfExtract(salt, ikm);
  const cek          = await hkdfExpand(prk2, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce        = await hkdfExpand(prk2, new TextEncoder().encode('Content-Encoding: nonce\0'), 12);

  // AES-128-GCM encrypt  (append 0x02 = record delimiter, no padding)
  const plain  = concat(new TextEncoder().encode(plaintext), new Uint8Array([2]));
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ct     = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, plain));

  // aes128gcm content: salt(16) | rs(4 BE) | idlen(1) | keyid(65) | ciphertext
  const rs  = 4096;
  const out = new Uint8Array(16 + 4 + 1 + 65 + ct.length);
  let off   = 0;
  out.set(salt, off);                                          off += 16;
  new DataView(out.buffer).setUint32(off, rs, false);          off += 4;
  out[off++] = 65;
  out.set(sndPub, off);                                        off += 65;
  out.set(ct, off);
  return out;
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const APP_BASE = '/BandThai/';

// Thai time = UTC+7
function thaiNow(): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 420);            // +7h in minutes
  return now;
}

function thaiDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Get band notification settings from band_settings */
interface BandNotifConfig {
  enabled: boolean;
  externalMins: number;    // minutes before external gig (default 1440 = 24h)
  firstSlotMins: number;   // minutes before first slot of day (default 60)
  nextSlotMins: number;    // minutes before subsequent slots (default 5)
}
const _bandConfigCache: Record<string, BandNotifConfig> = {};
async function getBandNotifConfig(bandId: string): Promise<BandNotifConfig> {
  if (_bandConfigCache[bandId]) return _bandConfigCache[bandId];
  const { data } = await sb.from('band_settings').select('settings').eq('band_id', bandId).maybeSingle();
  const s = data?.settings;
  const cfg: BandNotifConfig = {
    enabled: !!(s?.notifications_enabled),
    externalMins:  Number(s?.notif_external_mins) || 1440,
    firstSlotMins: Number(s?.notif_first_slot_mins) || 60,
    nextSlotMins:  Number(s?.notif_next_slot_mins)  || 5,
  };
  _bandConfigCache[bandId] = cfg;
  return cfg;
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth_key: string }, payload: object): Promise<boolean> {
  try {
    const body  = await encryptPayload(JSON.stringify(payload), sub.p256dh, sub.auth_key);
    const auth  = await makeVapidAuth(sub.endpoint);
    const res   = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type':     'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization':    auth,
        'TTL':              '3600',
        'Urgency':          'normal',
      },
      body,
    });
    if (res.status === 410 || res.status === 404) {
      await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      return false;
    }
    return res.status >= 200 && res.status < 300;
  } catch (e) {
    console.error('[push] failed:', sub.endpoint.slice(-20), (e as Error)?.message);
    return false;
  }
}

async function logNotification(bandId: string, type: string, key: string): Promise<boolean> {
  const { error } = await sb.from('notification_log').insert({ band_id: bandId, notification_type: type, reference_key: key });
  return !error;   // false = already logged (unique constraint violation)
}

// ── Notification Type 1: External job reminder (custom timing per band) ──────
// Each band can configure how far ahead to remind about external gigs.
// We fetch ALL external gigs with start_time for today or tomorrow,
// then check if any falls within the band's configured reminder window.
async function notifyExternalJobs(thai: Date) {
  const todayDate = thaiDateStr(thai);
  const tomorrow = new Date(thai);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = thaiDateStr(tomorrow);

  // Fetch external gigs for today and tomorrow (covers up to 48h ahead)
  const { data: jobs, error } = await sb
    .from('schedule')
    .select('id, band_id, date, venue_name, time_slots, notes, start_time')
    .eq('type', 'external')
    .in('date', [todayDate, tomorrowDate])
    .not('band_id', 'is', null);

  if (error || !jobs || jobs.length === 0) return;

  const nowHHMM = thai.toISOString().substring(11, 16);
  const nowTotalMin = timeToMinutes(nowHHMM) ?? 0;

  for (const job of jobs) {
    const cfg = await getBandNotifConfig(job.band_id);
    if (!cfg.enabled) continue;

    // Calculate minutes until the gig starts
    const gigStartMin = timeToMinutes(job.start_time || '00:00') ?? 0;
    let minutesUntilGig: number;

    if (job.date === todayDate) {
      minutesUntilGig = gigStartMin - nowTotalMin;
    } else {
      // Tomorrow: add 1440 minutes (24h)
      minutesUntilGig = (1440 - nowTotalMin) + gigStartMin;
    }

    // Check if we're within ±3 min of the configured reminder time
    const diff = minutesUntilGig - cfg.externalMins;
    if (diff < -3 || diff > 3) continue;

    const refKey = `external_${cfg.externalMins}m:${job.id}:${job.date}`;
    const logged = await logNotification(job.band_id, 'external_job', refKey);
    if (!logged) continue;

    const { data: subs } = await sb
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('band_id', job.band_id);

    if (!subs || subs.length === 0) continue;

    const slotLabel = Array.isArray(job.time_slots)
      ? job.time_slots.map((s: Record<string, string>) => s.name || s.label || '').filter(Boolean).join(', ')
      : '';
    const label = [job.venue_name, slotLabel].filter(Boolean).join(' · ') || 'งานนอก';

    // Build human-readable time label
    const hrs = Math.floor(cfg.externalMins / 60);
    const mins = cfg.externalMins % 60;
    let timeLabel = '';
    if (hrs > 0 && mins > 0) timeLabel = `${hrs} ชม. ${mins} นาที`;
    else if (hrs > 0) timeLabel = `${hrs} ชั่วโมง`;
    else timeLabel = `${mins} นาที`;

    const payload = {
      title: `🎤 งานนอกอีก ${timeLabel} — ${label}`,
      body:  job.notes ? job.notes.slice(0, 100) : 'อย่าลืมเตรียมตัว!',
      type:  'external_1day',
      url:   APP_BASE + 'schedule.html'
    };

    for (const sub of subs) {
      await sendPush(sub, payload);
    }
  }
}

// ── Notification Type 2+3: Schedule reminders with custom timing ─────────────
// Each band configures:
//   firstSlotMins — minutes before the FIRST slot of the day (e.g. 60)
//   nextSlotMins  — minutes before SUBSEQUENT slots (e.g. 5)
// We fetch ALL today's schedules, group by band, sort by start_time,
// then check if any slot falls within the reminder window for each band.
async function notifyScheduleReminders(thai: Date) {
  const todayDate = thaiDateStr(thai);
  const nowHHMM = thai.toISOString().substring(11, 16);

  // Fetch all today's schedule items
  const { data: allSlots, error } = await sb
    .from('schedule')
    .select('id, band_id, date, venue_name, time_slots, start_time')
    .eq('date', todayDate)
    .not('band_id', 'is', null)
    .not('start_time', 'is', null)
    .order('start_time', { ascending: true });

  if (error || !allSlots || allSlots.length === 0) return;

  // Group by band_id
  const byBand: Record<string, typeof allSlots> = {};
  for (const s of allSlots) {
    if (!byBand[s.band_id]) byBand[s.band_id] = [];
    byBand[s.band_id].push(s);
  }

  for (const [bandId, slots] of Object.entries(byBand)) {
    const cfg = await getBandNotifConfig(bandId);
    if (!cfg.enabled) continue;

    // Slots are already sorted by start_time (from query ORDER BY)
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const isFirstSlot = (i === 0);
      const reminderMins = isFirstSlot ? cfg.firstSlotMins : cfg.nextSlotMins;
      const label = isFirstSlot ? 'first' : 'next';

      // Calculate if NOW is within the reminder window for this slot
      // Window: (start_time - reminderMins - 3min) to (start_time - reminderMins + 3min)
      // The ±3 min tolerance accounts for the 5-min cron interval
      const slotMin = timeToMinutes(slot.start_time);
      if (slotMin === null) continue;

      const nowMin = timeToMinutes(nowHHMM);
      if (nowMin === null) continue;

      const targetMin = slotMin - reminderMins;
      const diff = nowMin - targetMin;  // positive = we're past the ideal notify time

      // Only send if we're within ±3 minutes of the target
      if (diff < -3 || diff > 3) continue;

      const refKey = `sched_${label}_${reminderMins}m:${slot.id}:${todayDate}`;
      const logged = await logNotification(bandId, 'schedule_reminder', refKey);
      if (!logged) continue;  // already sent

      const { data: subs } = await sb
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth_key')
        .eq('band_id', bandId);

      if (!subs || subs.length === 0) continue;

      const slotLabel = Array.isArray(slot.time_slots)
        ? slot.time_slots.map((s: Record<string, string>) => s.name || s.label || '').filter(Boolean).join(', ')
        : '';
      const venueName = [slot.venue_name, slotLabel].filter(Boolean).join(' · ') || 'งาน';

      // Craft message based on timing
      let title: string, body: string, type: string, url: string;
      if (reminderMins >= 60) {
        const hrs = Math.floor(reminderMins / 60);
        const mins = reminderMins % 60;
        const timeLabel = mins > 0 ? `${hrs} ชม. ${mins} นาที` : `${hrs} ชั่วโมง`;
        title = `⏰ อีก ${timeLabel}ถึงเวลางาน!`;
        body = venueName + ' · เวลา ' + (slot.start_time || '');
        type = 'regular_1hr';
        url = APP_BASE + 'schedule.html';
      } else {
        title = `📋 อีก ${reminderMins} นาทีถึงเวลางาน!`;
        body = venueName + ' · กดเช็คอินได้เลย';
        type = 'checkin_5min';
        url = APP_BASE + 'check-in.html';
      }

      const payload = { title, body, type, url };
      for (const sub of subs) {
        await sendPush(sub, payload);
      }
    }
  }
}

function timeToMinutes(hhmm: string): number | null {
  if (!hhmm || hhmm.length < 5) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

// ── Notification Type 2+3 (from weekly template in band_settings) ────────────
// The weekly template stored in band_settings.settings.schedule is keyed by
// day-of-week (0=Sun … 6=Sat). Each day has an array of slots with startTime.
// This is what the user sets up via "ตั้งค่าวง" and uses for payroll.
// The schedule table may be empty, so we fall back to this template.
async function notifyWeeklyTemplateSlots(thai: Date) {
  const nowHHMM  = thai.toISOString().substring(11, 16);
  const todayDate = thaiDateStr(thai);
  // Derive day-of-week from the Thai-date string (avoids UTC vs local confusion)
  const todayDow  = new Date(todayDate + 'T12:00:00Z').getDay(); // 0=Sun … 6=Sat

  // Fetch all bands' settings (filter in code for simplicity)
  const { data: bands, error } = await sb
    .from('band_settings')
    .select('band_id, settings');

  if (error || !bands || bands.length === 0) return;

  for (const band of bands) {
    const s = band.settings || {};
    if (!s.notifications_enabled) continue;

    // weekly template: { "0": [...slots], "1": [...slots], ... }
    const schedTemplate = s.schedule || s.scheduleData || {};
    const todaySlots: Array<{ startTime?: string; endTime?: string; venueId?: string; id?: string }> =
      schedTemplate[todayDow] ?? schedTemplate[String(todayDow)] ?? [];

    if (!todaySlots.length) continue;

    const venues: Array<{ id: string; name: string }> = (s.venues || []).map(
      (v: Record<string, string>) => ({ id: v.id || v.venueId || '', name: v.name || v.venueName || '' })
    );

    const cfg = await getBandNotifConfig(band.band_id);
    if (!cfg.enabled) continue;

    // Sort slots by startTime ascending
    const sorted = [...todaySlots]
      .filter(sl => sl.startTime)
      .sort((a, b) => (a.startTime! > b.startTime! ? 1 : -1));

    for (let i = 0; i < sorted.length; i++) {
      const slot = sorted[i];
      const isFirst     = (i === 0);
      const reminderMins = isFirst ? cfg.firstSlotMins : cfg.nextSlotMins;

      const slotMin = timeToMinutes(slot.startTime!);
      const nowMin  = timeToMinutes(nowHHMM);
      if (slotMin === null || nowMin === null) continue;

      const targetMin = slotMin - reminderMins;
      const diff      = nowMin - targetMin;
      if (diff < -3 || diff > 3) continue;  // ±3 min window

      const slotId  = slot.id || `dow${todayDow}_${slot.startTime}`;
      const refKey  = `weekly_${isFirst ? 'first' : 'next'}_${reminderMins}m:${slotId}:${todayDate}`;
      const logged  = await logNotification(band.band_id, 'weekly_reminder', refKey);
      if (!logged) continue;  // already sent today

      const { data: subs } = await sb
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth_key')
        .eq('band_id', band.band_id);

      if (!subs || subs.length === 0) continue;

      const venue     = venues.find(v => v.id === slot.venueId);
      const venueName = venue ? venue.name : 'งาน';

      let title: string, body: string, type: string, url: string;
      if (reminderMins >= 60) {
        const hrs  = Math.floor(reminderMins / 60);
        const mins = reminderMins % 60;
        const tl   = mins > 0 ? `${hrs} ชม. ${mins} นาที` : `${hrs} ชั่วโมง`;
        title = `⏰ อีก ${tl}ถึงเวลางาน!`;
        body  = venueName + ' · เวลา ' + slot.startTime;
        type  = 'regular_1hr';
        url   = APP_BASE + 'schedule.html';
      } else {
        title = `📋 อีก ${reminderMins} นาทีถึงเวลางาน!`;
        body  = venueName + ' · กดเช็คอินได้เลย';
        type  = 'checkin_5min';
        url   = APP_BASE + 'check-in.html';
      }

      const payload = { title, body, type, url };
      for (const sub of subs) {
        await sendPush(sub, payload);
      }
    }
  }
}

// ── Admin: Test push to all band subscribers ────────────────────────────────
async function handleTestPush(bandId: string, jwt: string, title: string, body: string): Promise<{ sent: number; error?: string }> {
  if (!jwt) return { sent: 0, error: 'Unauthorized — ต้อง login ก่อน' };

  // Verify JWT using service role (getUser works with service role)
  const { data: { user }, error: ue } = await sb.auth.admin.getUserById(
    (() => { try { return JSON.parse(atob(jwt.split('.')[1])).sub ?? ''; } catch { return ''; } })()
  );
  if (ue || !user) return { sent: 0, error: 'Unauthorized' };

  const { data: profile } = await sb.from('profiles').select('role, band_id').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'manager'].includes(profile.role ?? '')) {
    return { sent: 0, error: 'เฉพาะแอดมิน/ผู้จัดการเท่านั้น' };
  }
  if (profile.band_id !== bandId) {
    return { sent: 0, error: 'ไม่ใช่วงของคุณ' };
  }

  // Fetch all subscriptions for band
  const { data: subs } = await sb.from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .eq('band_id', bandId);

  if (!subs || subs.length === 0) return { sent: 0 };

  const payload = {
    title: title || '🔔 การแจ้งเตือนทดสอบ',
    body:  body  || 'ระบบการแจ้งเตือนของวงทำงานปกติ ✅',
    type:  'test',
    url:   APP_BASE + 'dashboard.html'
  };

  let sent = 0;
  for (const sub of subs) {
    const ok = await sendPush(sub, payload);
    if (ok) sent++;
  }
  return { sent };
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  try {
    // If called via HTTP POST with action payload (admin panel)
    if (req.method === 'POST') {
      const authHeader = req.headers.get('Authorization') ?? '';
      const jwt = authHeader.replace('Bearer ', '');
      let body: Record<string, string> = {};
      try { body = await req.json(); } catch { /* ignore */ }

      if (body.action === 'test_push') {
        const result = await handleTestPush(
          body.band_id ?? '',
          jwt,
          body.title ?? '',
          body.body   ?? ''
        );
        return new Response(JSON.stringify({ ok: !result.error, ...result }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type'
        }
      });
    }

    // Default: pg_cron scheduled run
    const thai = thaiNow();
    console.log('[send-notifications] Thai time:', thai.toISOString());

    await Promise.all([
      notifyExternalJobs(thai),
      notifyScheduleReminders(thai),
      notifyWeeklyTemplateSlots(thai),
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[send-notifications] ERROR:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
