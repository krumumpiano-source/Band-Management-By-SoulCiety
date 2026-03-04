# แผนการทำงาน: ระบบโฆษณา AdSense Rewarded Interstitial

**วันที่วางแผน:** 4 มีนาคม 2569  
**เริ่มทำ:** 5 มีนาคม 2569  
**เป้าหมาย:** Free tier ดูโฆษณา 1 คลิปก่อนใช้งาน แลกเวลา 75 นาที

---

## งานเพิ่มเติม: เปลี่ยนชื่อแอปพลิเคชัน

### ปัญหา
ชื่อแอปปัจจุบันคือ **"Band Management By SoulCiety"** ซึ่งทำให้เข้าใจผิดว่าแอปเป็นของวง SoulCiety

### เป้าหมาย
- **SoulCiety** = ชื่อวงดนตรีที่สมัครใช้งานแอปนี้ไปแล้ว ไม่ใช่ชื่อแอป
- แอปต้องมีชื่อเป็นกลาง ไม่ผูกกับวงใดวงหนึ่ง

### ชื่อใหม่ที่แนะนำ
> **"BandFlow"** หรือ **"GigFlow"** หรือ **"BandSync"** — ให้เจ้าของตัดสินใจ

### ไฟล์/ส่วนที่ต้องแก้ไข
| จุด | รายละเอียด |
|---|---|
| `index.html` (root) | title, meta description |
| `docs/index.html` | title, meta, หน้า login header |
| `docs/manifest.json` | `name`, `short_name` |
| `docs/js/config.js` | ชื่อแอปใน config |
| `docs/sw.js` | cache name (ถ้ามีชื่อแอปอยู่) |
| ทุก `<title>` ในทุกหน้า HTML | แก้จาก "Band Management By SoulCiety" |
| `package.json` | `name` field |
| โฟลเดอร์ workspace | เปลี่ยนชื่อโฟลเดอร์ได้ทีหลัง (ไม่กระทบโค้ด) |
| `AUDIT-REPORT.md`, `PLAN-*.md` | แก้ mentions ชื่อแอปเก่า |

### หมายเหตุ
- ไม่ต้องแก้ข้อมูลในฐานข้อมูล — ชื่อวง "SoulCiety" ยังคงอยู่ใน `bands` table ตามปกติ
- ไม่ต้องแก้ URL หรือ Supabase project

---

## ภาพรวมระบบโฆษณา

```
Free user login
     ↓
requireAuth() ผ่าน (มี auth_token)
     ↓
checkAdGate() — เช็ค localStorage('ad_gate_ts')
     ↓                          ↓
หมดเวลา / ไม่มี          ยังไม่หมด (< 75 นาที)
     ↓                          ↓
redirect → ad-gate.html    แสดง countdown timer
     ↓                     ใช้งานได้ปกติ
ดูโฆษณาจบ
     ↓
บันทึก ad_gate_ts = timestamp ปัจจุบัน
     ↓
redirect → dashboard.html
```

**Lite/Pro:** ข้ามทุกขั้นตอนข้างต้น ไม่มีโฆษณา

---

## สิ่งที่ต้องทำก่อน (นอกโค้ด)

1. สมัคร **Google AdSense** ที่ [adsense.google.com](https://adsense.google.com)
   - ใช้ domain ที่ host แอปอยู่
   - รอ approve ~2–4 สัปดาห์
2. เมื่อ approve แล้ว สร้าง Ad Unit ประเภท **"Rewarded"**
3. ได้ค่า `data-ad-client` (publisher ID) และ `data-ad-slot` (slot ID)
4. นำค่าทั้งสองไปใส่ใน `docs/js/config.js`

> **ระหว่างรอ AdSense approve:** ใช้ placeholder (YouTube embed หรือ countdown เปล่าๆ) แทน เพื่อให้ระบบ timer ทำงานได้ก่อน — ผู้ใช้จะเห็น UI และนับถอยหลัง 30 วินาที ก่อนกดเข้าใช้งาน

---

## ไฟล์ที่ต้องสร้าง/แก้ไข

### 1. `docs/js/config.js` — เพิ่ม config

```javascript
// Ad Gate
window.APP_CONFIG.ADSENSE_CLIENT  = 'ca-pub-XXXXXXXXXX'; // ใส่หลัง AdSense approve
window.APP_CONFIG.ADSENSE_SLOT    = 'XXXXXXXXXX';         // ใส่หลัง AdSense approve
window.APP_CONFIG.AD_SESSION_MIN  = 75;                   // นาที
window.APP_CONFIG.AD_GATE_ENABLED = true;                 // toggle ปิด/เปิดระบบโฆษณา
window.APP_CONFIG.AD_PLACEHOLDER  = true;                 // true = placeholder ระหว่างรอ AdSense
```

---

### 2. `docs/ad-gate.html` — หน้าโฆษณา (สร้างใหม่)

**โครงสร้าง:**
- Standalone page ไม่มี nav sidebar
- โหลด `js/app.js` เพื่อใช้ `requireAuth()` และ `getAdTimeRemaining()`
- ใช้ theme เดิม (dark mode, Google Font Kanit)

**UI:**
```
[โลโก้แอป]

"ดูโฆษณาสั้นๆ เพื่อใช้งานได้ 1 ชั่วโมง 15 นาที"
"โปรดลดเสียงอุปกรณ์ก่อนชมโฆษณา"

[กล่องวิดีโอโฆษณา]

[ปุ่ม ▶ "เริ่มดูโฆษณา"] ← กดแล้วถึงเล่น (ถูก policy Google)

countdown: "กรุณารอ XX วินาที..." ระหว่างดู

[ปุ่ม "เข้าใช้งานได้เลย"] ← enable หลังดูจบเท่านั้น
```

**Logic:**
```javascript
// 1. requireAuth() — ถ้าไม่ได้ login → redirect index.html
// 2. เช็ค band_plan จาก localStorage
//    ถ้าไม่ใช่ 'free' → redirect dashboard.html (ไม่ควรมาหน้านี้)
//    ถ้า session ยังไม่หมด → redirect dashboard.html
// 3. โหลด AdSense Rewarded script
//    ปุ่ม "เริ่มดูโฆษณา" → makeRewardedVisible()
//    rewardedSlotGranted event → onAdGranted()
//    rewardedSlotClosed → onAdClosed() (ถ้าปิดก่อนจบ)
// 4. onAdGranted():
//    localStorage.setItem('ad_gate_ts', Date.now())
//    setTimeout 1000 → window.location.replace('dashboard.html')
// 5. Placeholder mode (AD_PLACEHOLDER = true):
//    แสดง countdown 30 วินาที → enable ปุ่ม → กด → บันทึก timestamp → redirect
```

---

### 3. `docs/js/app.js` — เพิ่มฟังก์ชัน Ad Gate

เพิ่มต่อจาก `requireAuth()` (บรรทัดประมาณ 44):

```javascript
// ── Ad Gate ─────────────────────────────────────────────
function checkAdGate() {
  var plan = localStorage.getItem('band_plan') || 'free';
  if (plan !== 'free') return; // Lite/Pro ข้ามได้เลย
  var ts = parseInt(localStorage.getItem('ad_gate_ts') || '0');
  var limit = 75 * 60 * 1000; // 75 นาที
  if (!ts || (Date.now() - ts) >= limit) {
    window.location.replace('ad-gate.html');
  }
}
global.checkAdGate = checkAdGate;

function getAdTimeRemaining() {
  var plan = localStorage.getItem('band_plan') || 'free';
  if (plan !== 'free') return -1; // -1 = ไม่ใช่ free ไม่ต้องแสดง
  var ts = parseInt(localStorage.getItem('ad_gate_ts') || '0');
  if (!ts) return 0;
  var limit = 75 * 60 * 1000;
  return Math.max(0, limit - (Date.now() - ts));
}
global.getAdTimeRemaining = getAdTimeRemaining;
```

---

### 4. `docs/js/nav.js` — เพิ่ม Countdown Timer

เพิ่มใน `renderMainNav()` ต่อจากการ inject nav HTML:

```javascript
// Countdown Timer สำหรับ Free tier
function startAdCountdown() {
  var remaining = getAdTimeRemaining();
  if (remaining < 0) return; // ไม่ใช่ free

  // สร้าง element countdown
  var el = document.createElement('div');
  el.id = 'ad-countdown';
  document.body.appendChild(el);

  var interval = setInterval(function () {
    var rem = getAdTimeRemaining();
    if (rem <= 0) {
      clearInterval(interval);
      showAdExpiredModal();
      return;
    }
    var h = Math.floor(rem / 3600000);
    var m = Math.floor((rem % 3600000) / 60000);
    var s = Math.floor((rem % 60000) / 1000);
    el.textContent = '⏱ ' + (h ? h + ':' : '') +
      String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }, 1000);
}

function showAdExpiredModal() {
  // Overlay modal: "หมดเวลา กดดูโฆษณาเพื่อใช้งานต่อ"
  // ปุ่ม → window.location.replace('ad-gate.html')
  // ไม่มีปุ่มปิด — บังคับดูโฆษณา
}
```

---

### 5. `docs/css/theme.css` — เพิ่ม CSS

```css
/* Countdown Timer */
#ad-countdown {
  position: fixed;
  top: 12px;
  right: 16px;
  z-index: 400;
  font-size: 0.78rem;
  color: var(--text-secondary);
  background: var(--bg-card);
  padding: 3px 10px;
  border-radius: 20px;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}
@media (max-width: 1023px) {
  #ad-countdown { top: 64px; right: 12px; }
}

/* Ad Expired Modal */
.ad-expired-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.92);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ad-expired-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  max-width: 320px;
  width: 90%;
}

/* Ad Gate Page */
.ad-gate-wrap {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  gap: 1.5rem;
  background: var(--bg-primary);
}
.ad-gate-video-box {
  width: 100%;
  max-width: 480px;
  aspect-ratio: 9/16;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}
```

---

### 6. `docs/js/supabase-api.js` — `saveSession()` เพิ่ม `band_plan`

ใน function `saveSession()` เพิ่ม:

```javascript
localStorage.setItem('band_plan', profile.band_plan || 'free');
```

และเมื่อ `clearSession()` เพิ่ม:

```javascript
localStorage.removeItem('band_plan');
localStorage.removeItem('ad_gate_ts');
```

---

### 7. ทุกหน้า Protected — เพิ่ม `checkAdGate()`

เพิ่ม `checkAdGate();` ใต้ `requireAuth();` ใน `DOMContentLoaded` ของทุกหน้า:

| ไฟล์ | หมายเหตุ |
|---|---|
| `docs/dashboard.html` | |
| `docs/schedule.html` | |
| `docs/check-in.html` | |
| `docs/attendance-payroll.html` | |
| `docs/band-settings.html` | |
| `docs/songs.html` | |
| `docs/add-song.html` | |
| `docs/edit-song.html` | |
| `docs/setlist.html` | |
| `docs/live.html` | |
| `docs/my-profile.html` | |
| `docs/clients.html` | |
| `docs/quotation.html` | |
| `docs/contract.html` | |
| `docs/job-history.html` | |
| `docs/job-calculator.html` | |
| `docs/song-insights.html` | |
| `docs/statistics.html` | |
| `docs/equipment.html` | |
| `docs/band-info.html` | |
| `docs/band-fund.html` | |
| `docs/external-payout.html` | |

---

## ลำดับการ Implement

| ลำดับ | งาน | ไฟล์ |
|---|---|---|
| 1 | เพิ่ม config keys | `docs/js/config.js` |
| 2 | เพิ่ม `band_plan` + ล้าง `ad_gate_ts` ใน session | `docs/js/supabase-api.js` |
| 3 | เพิ่ม `checkAdGate()` + `getAdTimeRemaining()` | `docs/js/app.js` |
| 4 | สร้างหน้า ad gate + placeholder countdown | `docs/ad-gate.html` |
| 5 | เพิ่ม countdown timer + expired modal | `docs/js/nav.js` |
| 6 | เพิ่ม CSS | `docs/css/theme.css` |
| 7 | เพิ่ม `checkAdGate()` ในทุกหน้า (22 ไฟล์) | ทุก protected HTML |
| 8 | ทดสอบ flow ทั้งหมด | — |
| 9 | เปลี่ยน placeholder → AdSense จริง (หลัง approve) | `docs/ad-gate.html` + config |
| 10 | เปลี่ยนชื่อแอป (ลบ SoulCiety ออกจากชื่อโปรแกรม) | หลายไฟล์ (ดูรายการด้านบน) |

---

## การทดสอบ

```
✅ Free user login → redirect ad-gate.html ทันที
✅ กดดูโฆษณา (placeholder) → นับถอย 30 วิ → ปุ่มเปิด → กด → dashboard
✅ countdown timer แสดงมุมขวาบนทุกหน้า (เฉพาะ Free)
✅ นับถอยหลัง 75 นาที → popup expired → redirect ad-gate อีกครั้ง
✅ Lite/Pro user login → ข้าม ad-gate ตรงสู่ dashboard ไม่มี timer
✅ logout → ad_gate_ts + band_plan ถูกล้าง
✅ mobile layout ไม่บัง element อื่น
✅ ปิด browser แล้วเปิดใหม่ → countdown ต่อจากเดิม (ใช้ timestamp)
✅ เปิดหลายแท็บ → ทุกแท็บ redirect พร้อมกันเมื่อหมดเวลา
```

---

## หมายเหตุสำคัญ

- `band_plan` ต้องถูก set ตอน login ใน `saveSession()` — ระหว่างนี้ default เป็น `'free'`
- ระบบ Subscription DB (`migrate-subscriptions.sql`) ทำในภายหลัง — ตอนนี้ทุกคนเป็น free ก่อน
- AdSense Rewarded **ต้องให้ user กดก่อน** ถึงจะเล่นได้ (ถูก policy Google) — ห้ามเล่นอัตโนมัติ
- `ad_gate_ts` ต้องถูกล้างเมื่อ logout เพื่อป้องกัน session ข้ามบัญชี
- หน้า `ad-gate.html` ต้องไม่เรียก `checkAdGate()` เอง (จะวนลูปไม่หยุด)
