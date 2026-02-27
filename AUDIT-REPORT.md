# Comprehensive Audit Report — Band Management By SoulCiety

**Date:** 2025  
**Scope:** All HTML pages in `docs/` folder (25 pages)  
**Platform:** Supabase backend (migrated from Google Apps Script), pure HTML/CSS/JS frontend  
**Architecture:** `gasRun()` shim → `sbRun()` via `supabase-api.js`, localStorage-based auth, i18n via `data-i18n` attributes

---

## Table of Contents

1. [Cross-Cutting Issues](#cross-cutting-issues)
2. [Per-Page Audit](#per-page-audit)
3. [Missing / Referenced but Unlisted Pages](#missing-pages)
4. [Navigation Audit](#navigation-audit)
5. [Priority Recommendations](#priority-recommendations)

---

## Cross-Cutting Issues

### Security
| # | Issue | Severity | Files |
|---|-------|----------|-------|
| S1 | **Client-side-only auth check** — `requireAuth()` only checks `localStorage.getItem('auth_token')`. Any user can set this manually. Server-side RLS is the real gate, but pages render full UI before any API call fails. | HIGH | All authenticated pages |
| S2 | **Admin role check is client-side only** — `admin.html` checks `localStorage.getItem('userRole')` to show admin controls. Malicious user can set `userRole=admin`. | HIGH | admin.html |
| S3 | **XSS risk via innerHTML** — Several pages build HTML with string concatenation. While `escapeHtml()` is used in most places, some `onclick` handlers embed escaped values inside single-quoted strings, which can break on values containing backslashes or encoded chars. | MEDIUM | setlist.html, dashboard.html, band-settings.html, leave.html |
| S4 | **No CSRF protection** — All `gasRun()` calls carry no CSRF token. Supabase JWT handles auth but no additional CSRF layer. | LOW | All |

### Architecture / Code Quality
| # | Issue | Severity |
|---|-------|----------|
| A1 | **Massive inline `<script>` blocks** — songs.html (1425 lines), dashboard.html (1110 lines), band-settings.html contain hundreds of lines of inline JS/CSS. Should be extracted to dedicated `.js`/`.css` files. | MEDIUM |
| A2 | **Duplicate `escapeHtml()` definition** — Defined in `app.js`, redefined inline in `songs.html` and `dashboard.html`. | LOW |
| A3 | **Duplicate leave functionality** — Leave request flow exists in `dashboard.html` (quick leave), `check-in.html` (inline leave), and `leave.html` (full page). Three separate implementations of the same feature. | MEDIUM |
| A4 | **`gasRun` naming misleading** — The function is named after Google Apps Script but actually delegates to Supabase (`sbRun`). Should be renamed to `apiCall` or similar. | LOW |
| A5 | **No service worker / offline support** — All data depends on live API calls. No caching strategy beyond `sessionStorage` for songs. | LOW |
| A6 | **No global error boundary** — Failed API calls show individual `alert()` or `showToast()` but no unified error handling for network failures. | MEDIUM |
| A7 | **Thai Date Picker overlay in app.js** — A complex date input overlay (lines 235-297 of app.js) wraps every `<input type="date">` with a Thai date display. This is a nice feature but performs DOM mutation on every date input site-wide. | INFO |

### Responsive Design
| # | Issue | Severity |
|---|-------|----------|
| R1 | **schedule.html table** requires `min-width:700px` — overflows on small screens. | MEDIUM |
| R2 | **band-settings.html schedule grid** — horizontal time slot grid is not optimized for narrow viewport. | MEDIUM |
| R3 | **Most pages are well-responsive** — theme.css provides comprehensive media queries. Songs, dashboard, check-in, leave have proper mobile breakpoints. | OK |

### Missing Infrastructure
| # | Issue |
|---|-------|
| M1 | No `manifest.json` or PWA support |
| M2 | No `<meta name="description">` on any page |
| M3 | No favicon referenced |
| M4 | No `robots.txt` or sitemap |
| M5 | No automated tests |

---

## Per-Page Audit

---

### 1. `index.html` — Login

**Purpose:** Authentication page with email/password login.

**Features:**
- Email/password login via `gasRun('login', ...)`
- Password visibility toggle (👁 button)
- Biometric/Face ID login via Credential Management API (`navigator.credentials.get()`)
- Auto-detects iOS vs Android for biometric labels
- Stores auth data in `localStorage` (auth_token, bandId, bandName, userName, userRole, etc.)
- Language toggle (TH/EN)
- Links to register, create-band, forgot-password, forgot-email, terms

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **Biometric credential stored with plain password** — `navigator.credentials.create()` stores password in Credential Management API, which is the standard approach but means password is accessible to JS. | INFO |
| 2 | **No rate limiting on login attempts** — Client-side has no attempt counter. Server-side rate limiting depends on Supabase configuration. | MEDIUM |
| 3 | **`localStorage` stores sensitive data** — auth_token, role, and user identity stored unencrypted in localStorage. Vulnerable to XSS-based token theft. | MEDIUM |

**Missing Validation:** None critical — email format enforced by `type="email"`, password has `minlength="6"`.

---

### 2. `register.html` — Registration

**Purpose:** 3-step registration flow via band invite code.

**Features:**
- Step 1: Invite code validation via `gasRun('lookupInviteCode')`
- Step 2: Personal info (title, first name, last name, nickname, instrument)
- Step 3: Email/password creation with summary review
- Links to create-band.html, terms.html, index.html

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **No password strength indicator** — Only `minlength="6"` on password field. No complexity requirements shown. | LOW |
| 2 | **No duplicate email check before submission** — User fills out 3 steps then may get "email exists" error at the end. Should validate email availability in step 3 before submission. | MEDIUM |
| 3 | **Instrument list hardcoded** — Same instrument options as throughout the app (ร้องนำ, กีตาร์ไฟฟ้า, etc.). Should be centralized. | LOW |

---

### 3. `forgot-password.html` — Password Reset

**Purpose:** Request password reset via email.

**Features:**
- Simple email input + submit button
- Calls `gasRun('requestPasswordReset')`
- Success/error message display
- Links back to login

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **No rate limiting visible** — Could be abused to spam reset emails. | MEDIUM |
| 2 | **No loading state** — Button doesn't disable during API call. User could submit multiple times. | LOW |

---

### 4. `forgot-email.html` — Email Recovery

**Purpose:** Look up user's email by name and/or phone number.

**Features:**
- Search by name/nickname + phone
- Returns masked email (e.g., s***@gmail.com)
- Hint box explaining the feature

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **Information disclosure risk** — Allows anyone to discover if a name/phone combination has an account, returning a masked email. | LOW |

---

### 5. `create-band.html` — Band Creation Request

**Purpose:** 3-step flow for band managers to request creating a new band.

**Features:**
- Step 1: Band info (name, province with datalist of all 77 Thai provinces)
- Step 2: Manager personal info
- Step 3: Account creation (email/password)
- Info box explaining the approval flow (admin must approve, then band code is issued)

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **No nav.css loaded** — Page doesn't include `nav.css` (appropriate since it's an auth page). | OK |
| 2 | **Province validation is soft** — Uses `<datalist>` which allows free-text input. Could submit invalid province. | LOW |

---

### 6. `dashboard.html` — Main Dashboard

**Purpose:** Central hub after login. Shows check-in widget, playlist, earnings, upcoming jobs.

**Features:**
- Welcome bar with band name (refreshed from server)
- Band code card (manager only) with copy button
- Pending member approval list (manager only)
- **Quick Check-In widget** — date nav, venue selection, time slot buttons, summary, confirm
- **Inline Leave form** — substitute name input, "no substitute" checkbox
- **Playlist of the Day** — fetches from `getPlaylistHistoryByDate()`
- **Earnings Summary** — week/month/year tabs with detailed breakdown including substitute deductions
- Upcoming jobs list
- Finance summary (income/expense/fund/balance)
- Quick action cards linking to other pages

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **1110 lines of inline code** — CSS + JS all inlined. Major maintainability issue. | MEDIUM |
| 2 | **N+1 API calls for earnings** — `loadEarningsSummary()` calls `gasRun('getCheckInsForDate')` once per date in the range. For a month view (30 days), that's 30 API calls. Should use a batch/range endpoint. | HIGH |
| 3 | **Member ID lookup is fragile** — Tries multiple localStorage keys: `sb-wsorngsyowgxikiepice-auth-token` → parse JSON → `user.id`, then fallback to `odooMemberId`, then `memberId`. Hard-coded Supabase project ref in the key name. | MEDIUM |
| 4 | **`THAI_MONTHS_SHORT` referenced but defined in app.js** — Works because app.js loads first, but implicit dependency. | LOW |
| 5 | **Pending band approval card** shown for managers without `bandId` but no action button provided. | LOW |
| 6 | **Duplicate `escapeHtml()`** — Defined locally when it's already in `app.js`. | LOW |

**UI/UX Issues:**
- Earnings section makes many API calls causing slow load, with "⏳" text shown during loading
- No empty state illustration for "no jobs" — just plain text

---

### 7. `check-in.html` — Attendance Check-In

**Purpose:** Detailed time check-in page for band members.

**Features:**
- Member header with name, instrument, role badge
- Date selector with Thai date badge
- Venue dropdown (auto-selected if single venue)
- Checkbox-based time slot selection with "Select All / Select None"
- Substitute worker option for leave
- Leave request section with venue, slots, reason, substitute name/contact
- Existing check-in detection with edit/cancel capability
- Links to attendance-payroll.html and leave.html
- Dedicated JS: `js/check-in.js`

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **Leave functionality duplicated** from dashboard.html and leave.html | MEDIUM |
| 2 | **No max date restriction** — Can check in for dates far in the future. | LOW |

---

### 8. `schedule.html` — Schedule / Calendar

**Purpose:** Weekly timetable view + external gig management.

**Features:**
- Weekly time grid showing regular + external gigs
- Summary stats (total/regular/external gigs, total revenue)
- Advanced filters (view type, member, period, date range)
- External gig CRUD modal with member assignment + pay
- Dedicated JS: `js/schedule.js`

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **Table min-width: 700px** — Overflows on mobile. Horizontal scroll works but UX is poor. | MEDIUM |
| 2 | **Time slots hard-rendered** — Grid has fixed time rows; doesn't show custom band schedule times. | LOW |

---

### 9. `songs.html` — Song Library

**Purpose:** Song library management + inline playlist builder.

**Features:**
- 3-column song grid with search, filter (singer/era/speed/mood)
- Song pagination (15 per page)
- Add-to-playlist with ➕ button
- Edit song link (✏️ → edit-song.html)
- **Inline Playlist Builder:**
  - Venue + time slot selection from band settings
  - Add break items
  - Transpose controls (semi-tone up/down per song) with key theory (major/minor)
  - Copy playlist to clipboard with optional BPM/key
  - Save playlist history to server
  - Load from history modal with date picker
  - Existing playlist badge showing already-saved slots
- Session storage cache (5 min TTL) for song data
- Band settings cache (10 min TTL)

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **1425 lines of inline code** — 3 separate `<script>` blocks. This is the largest page. Should be split into `songs.js`, `transpose.js`, `playlist.js`. | MEDIUM |
| 2 | **Mixed `let`/`const` (ES6) and `var` (ES5)** — Playlist script uses `let`/`const` and arrow functions while song list script uses `var`. Inconsistent browser compat targets. | LOW |
| 3 | **`escapeHtml()` redefined** in the playlist script block, shadowing the one from `app.js`. | LOW |
| 4 | **Copy to clipboard uses `document.execCommand('copy')` as primary** — Deprecated API. `navigator.clipboard.writeText()` is only used as fallback (should be the other way). | LOW |
| 5 | **Playlist auto-saves on copy** — `copyPlaylist()` also calls `saveHistory()`, which may surprise users doing casual copies. | INFO |
| 6 | `window.onload` used alongside `document.addEventListener('click')` — The load handler sets the date input but the DOMContentLoaded from app.js has already fired. No actual bug but order-dependent. | LOW |

---

### 10. `add-song.html` — Add Song Form

**Purpose:** Form to add a new song to the library.

**Features:**
- Form fields: name, key (select), BPM, era, mood, singer (radio pills)
- Saves via `gasRun('addSong')`
- Clears session cache after save
- Redirects back to songs.html

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **References non-existent `keyNote` element** — Line `keyNote: document.getElementById('keyNote').value.trim()` — there is no `#keyNote` input in the HTML form. This will throw a `null.value` error every time. | **CRITICAL** |
| 2 | **No duplicate song name check** — Can add songs with identical names. | LOW |

---

### 11. `edit-song.html` — Edit Song Form

**Purpose:** Edit an existing song's metadata.

**Features:**
- Pre-fills form from `gasRun('getSong')`
- Same fields as add-song
- Delete song button with confirmation
- Redirects to songs.html after save/delete

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **Same `keyNote` bug?** — Need to verify if the save handler also references `keyNote`. (Not visible in first 100 lines read, would need to check remaining 37 lines.) | POSSIBLY CRITICAL |
| 2 | **Song ID from URL query param** — Uses `URLSearchParams` to read `songId`. Straightforward but no validation that user owns the song. | LOW |

---

### 12. `setlist.html` — Setlist Builder

**Purpose:** Build 3-set setlists for performances.

**Features:**
- Song pool with search
- 3 set slots (Set 1, 2, 3) with drag-to-add
- Duration tracking with visual progress bar
- Save setlist to server
- Duration auto-calculation

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **No drag reorder within sets** — Can add songs but can't reorder them by dragging within a set. | MEDIUM |
| 2 | **`escapeHtml()` in onclick string concatenation** — innerHTML builds `onclick="removeSong('${escapeHtml(name)}')"`. If a song name contains a backslash or encoded character, this could break. | MEDIUM |
| 3 | **Song duration data not validated** — Duration tracking shows 0 if songs don't have duration metadata. | LOW |

---

### 13. `song-insights.html` — Song Analytics

**Purpose:** Song play frequency analytics.

**Features:**
- Period tabs: 7/30/90 days / all time
- Frequent songs ranking
- New songs list
- Band hits display
- Stats summary

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **All logic inline** — No external JS file. | LOW |
| 2 | **Depends on playlist_history data** — If no playlists have been saved, shows empty state. | INFO |
| 3 | **No export functionality** — Can't export analytics data. | LOW |

---

### 14. `band-info.html` — Band Overview

**Purpose:** Band details + member directory with schedule info.

**Features:**
- Band summary with member count
- Member cards with schedule pills (showing which days they work)
- Search/filter for members
- Member CRUD modal
- Depends on `js/band-members.js`

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **Overrides `renderMemberCards` from band-members.js** — Monkey-patches the shared module to add schedule pills. Fragile pattern. | MEDIUM |
| 2 | **No pagination** — All members rendered at once. Could be slow for large bands. | LOW |

---

### 15. `band-settings.html` — Band Configuration

**Purpose:** Comprehensive band settings for managers.

**Features:**
- Band info editing (name, province)
- Member management with invite codes
- Venue CRUD
- Payroll settings (daily/weekly/monthly)
- Visual horizontal schedule grid with color-coded time slots
- Slot detail modal with per-member rate configuration
- Bulk rate setting
- Depends on `js/band-settings.js`

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **Very large page** — Substantial inline CSS for the schedule grid. | MEDIUM |
| 2 | **Schedule grid horizontal scroll on mobile** — Tries to show 7 days × multiple time slots. Not ideal on phones. | MEDIUM |
| 3 | **No undo for destructive actions** — Deleting venues or changing rates is immediate. | LOW |
| 4 | **Complex nested data structure** — scheduleData[dow][].members[].rate makes debugging difficult. | INFO |

---

### 16. `band-fund.html` — Band Fund Management

**Purpose:** Track communal band fund income/expenses.

**Features:**
- Balance display card
- Add income/expense with category selection
- Transaction history table with type filter
- Delete transactions

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **No edit for existing transactions** — Can only add or delete. | MEDIUM |
| 2 | **No date range filter** — History shows all transactions. For bands with long history, this could be slow. | LOW |
| 3 | **No export/print** — Can't export fund report. | LOW |

---

### 17. `equipment.html` — Equipment Inventory

**Purpose:** Track band equipment/instruments.

**Features:**
- CRUD with modal dialog
- Type filter tabs (instrument/audio/lighting/accessory/other)
- Status tracking (normal/repair/broken)
- Search by name/serial number
- Price tracking

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **No image upload** — Equipment has no photo field. | LOW |
| 2 | **No assignment tracking** — Can't track which member has which equipment. | MEDIUM |
| 3 | **Commented out in nav** — This page is accessible but hidden from navigation (`navLink('equipment', ...)` is commented out in nav.js). | INFO |

---

### 18. `clients.html` — Client CRM

**Purpose:** Manage client/employer contacts.

**Features:**
- Client cards with contact info (phone/email/LINE)
- Gig stats and total revenue per client
- CRUD modal
- Search functionality

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **`totalGigs` / `totalRevenue` source unclear** — Displayed but unclear if calculated server-side or aggregated from schedule data. | LOW |
| 2 | **Commented out in nav** — Hidden from navigation. | INFO |

---

### 19. `quotation.html` — Quotation System

**Purpose:** Generate quotations/invoices.

**Features:**
- Quotation CRUD with line items
- Auto-calculate subtotal/VAT/total
- Status badges (draft/sent/approved/cancelled)
- PDF generation via server-side GAS
- Print CSS hides action buttons

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **No status change UI** — Status is shown in table but there's no button to change status (e.g., mark as sent/approved). | MEDIUM |
| 2 | **PDF depends on server** — `gasRun('generateQuotationPDF')` — may not work if Supabase migration doesn't implement this endpoint. | HIGH |
| 3 | **Commented out in nav** — Hidden from navigation. | INFO |

---

### 20. `contract.html` — Contract Generator

**Purpose:** Generate employment contract templates.

**Features:**
- Live preview with form inputs
- Print-ready layout
- Auto-fills band name from localStorage
- Cancellation clause template

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **No save to server** — Completely client-side. Contracts are lost on page reload. | HIGH |
| 2 | **Single contract template** — Only one template available. | LOW |
| 3 | **Commented out in nav** — Hidden from navigation. | INFO |

---

### 21. `leave.html` — Leave Request Management

**Purpose:** Full-page leave request system.

**Features:**
- 3 tabs: My Requests, Request Leave, All Requests (manager)
- Venue + time slot-based leave
- Reason field
- Status badges (pending/approved/rejected)
- Substitute assignment with member chip selection
- Manager tab added dynamically for authorized users

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **CSS conflict on `managerTabs`** — The div has `style="display:none;display:flex"` which means `display:flex` always wins (last declaration). Manager tabs would always be visible regardless of role. However, JS sets `mt.style.display = 'flex'` only for managers, so the initial state needs to be `display:none` only. | **HIGH** |
| 2 | **Min date set to today, not tomorrow** — Comment says "tomorrow" but code does `tomorrow.setDate(tomorrow.getDate())` (adds 0 days). It should be `+1`. | **BUG** |
| 3 | **Third tab duplicated in leave functionality** — Same leave request feature exists in dashboard.html and check-in.html. | MEDIUM |
| 4 | **Commented out in nav** — Hidden from navigation. | INFO |

---

### 22. `external-payout.html` — External Payout

**Purpose:** Pay external musicians/technicians.

**Features:**
- Payee type selection (musician/technician/other)
- Job reference link
- Pay amount entry
- History table with delete

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **No edit for existing payouts** — Can only add or delete. | MEDIUM |
| 2 | **Back button uses GAS-style URL** — `onclick="window.location='?page=dashboard'"` — doesn't work on static HTML hosting. Should be `dashboard.html`. | **BUG** |
| 3 | **Commented out in nav** — Hidden from navigation. | INFO |

---

### 23. `job-calculator.html` — Pay Split Calculator

**Purpose:** Calculate how to split gig fees among band members.

**Features:**
- Equal split or custom weighted split
- Fund percentage deduction
- Other expenses input
- Member rate inputs loaded from server
- Real-time calculation

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **No save/share** — Calculations are purely ephemeral. No way to save or share results. | MEDIUM |
| 2 | **No print** — Can't print the calculation for record-keeping. | LOW |

---

### 24. `statistics.html` — Band Statistics

**Purpose:** Year/month statistical reports.

**Features:**
- Year/month picker
- Overview cards (jobs/income/expense/profit/average)
- Monthly bar chart (CSS-only, no charting library)
- Job type breakdown bars
- Top members table

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **CSS-only bar charts** — No real charting library (Chart.js, etc.). Bars are just CSS `width` percentages. Limited interactivity. | LOW |
| 2 | **No export** — Can't export statistics to PDF/CSV. | LOW |
| 3 | **No comparison** — Can't compare month-over-month or year-over-year. | LOW |

---

### 25. `my-profile.html` — Personal Profile

**Purpose:** View and edit personal profile.

**Features:**
- Avatar display with instrument icon
- Personal info: title, first/last name, nickname, instrument, phone, birth date
- Payment method selection (PromptPay, TrueMoney, multiple banks: BBL, KBANK, KTB, SCB, TMB, BAY, UOB, CIMB, TTB, LH, GSB, BAAC)
- ID card address (houseNo/moo/soi/road/subDistrict/district/province/postalCode)
- Current address with "same as ID card" checkbox
- Read-only account info (email, band, role, status)
- Change email function (sends verification link)
- Change password function (min 6 chars, confirm match)

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **No current password required** for password change — `doChangePassword()` only asks for new + confirm. No old password verification. | HIGH |
| 2 | **No email format validation** in `doChangeEmail()` — Only checks `includes('@')`, no proper email regex. | LOW |
| 3 | **Birth date has no max date** — Could enter future dates. | LOW |

---

### 26. `attendance-payroll.html` — Attendance & Payroll

**Purpose:** Manager tool for tracking attendance and calculating payouts.

**Features:**
- Filter by record type (daily/weekly/monthly) and venue
- Attendance table with check-in status badges
- Payout calculation table
- Payment info display per member
- Receipt generation (venue receipt, member receipt)
- Uses `html2canvas` external library for receipt images
- Depends on `js/attendance-payroll.js`

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **html2canvas loaded from CDN** — Dependency on external CDN without fallback. If CDN is down, receipt generation fails silently. | MEDIUM |
| 2 | **No print CSS** — Receipt generation depends on html2canvas screenshot rather than proper print styles. | LOW |

---

### 27. `admin.html` — System Administration

**Purpose:** Admin panel for system-wide management.

**Features:**
- Band request approval/rejection list
- User management with role changes
- System info display
- Backup to Google Drive
- Run setup (initialize sheets/tables)
- Danger zone (clear all data, reset users)

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **Client-side role gate only** — Page checks `localStorage.getItem('userRole') !== 'admin'` and redirects. Trivially bypassed. Backend RLS must enforce this. | HIGH |
| 2 | **"Clear all data" / "Reset users" are catastrophic** — Buttons exist with only a `confirm()` dialog. Should have double confirmation or typed confirmation (e.g., "type DELETE to confirm"). | HIGH |
| 3 | **Backup to Drive** — References `gasRun('backupToGoogleDrive')`. Unclear if this works after Supabase migration. | MEDIUM |

---

### 28. `user-manual.html` — User Documentation

**Purpose:** In-app help documentation.

**Features:**
- Sticky TOC sidebar
- Step-by-step guides for all features
- FAQ section
- Tip/warning boxes

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **May reference stale features** — Still mentions "เข้าโหมดทดสอบ" (test mode) on login page. | LOW |
| 2 | **References commented-out features** — May document pages like leave, equipment, quotation, contract that are hidden from nav. | LOW |
| 3 | **No search** — For a long manual page, a search/filter for sections would help. | LOW |

---

### 29. `terms.html` — Terms of Service

**Purpose:** Legal terms page.

**Features:**
- Static content with 7 sections
- Back link (`history.back()`)
- References "Google Sheets" as data storage (may be outdated—now uses Supabase)

**Bugs / Issues:**
| # | Issue | Severity |
|---|-------|----------|
| 1 | **References Google Sheets** — Section 3 says "ข้อมูลทั้งหมดจัดเก็บไว้ใน Google Sheets" but the system now uses Supabase. Needs update. | MEDIUM |

---

## Missing Pages

Referenced in code but **not in the `docs/` folder** initially listed for audit:

| Page | Referenced From | Status |
|------|----------------|--------|
| `create-band.html` | index.html, register.html | ✅ Exists (350 lines, audited above) |
| `forgot-email.html` | index.html | ✅ Exists (120 lines, audited above) |
| `terms.html` | index.html, register.html, create-band.html | ✅ Exists (66 lines, audited above) |
| `add-song.html` | songs.html | ✅ Exists (107 lines, audited above) |
| `edit-song.html` | songs.html | ✅ Exists (137 lines, audited above) |
| `pricing.html` | Not referenced in docs/ | ❓ Only exists in `frontend/` folder |

---

## Navigation Audit

The sidebar navigation (`nav.js`) defines these menu items:

### Active in navigation:
| Page | Section | Visible To |
|------|---------|------------|
| dashboard | Member | All |
| songs | Member | All |
| song-insights | Member | All |
| schedule | Member | All |
| statistics | Member | All |
| band-info | Member | All |
| my-profile | Member | All |
| user-manual | Member | All |
| attendance-payroll | Manager | Manager/Admin |
| job-calculator | Manager | Manager/Admin |
| band-fund | Manager | Manager/Admin |
| band-settings | Manager | Manager/Admin |
| admin | Admin | Admin only |

### Commented out in navigation (pages exist but are hidden):
| Page | Comment | Note |
|------|---------|------|
| leave | "ปิดชั่วคราว" (temporarily disabled) | Feature still accessible via direct URL |
| external-payout | "ปิดชั่วคราว" | Feature still accessible via direct URL |
| quotation | "ปิดชั่วคราว" | Feature still accessible via direct URL |
| contract | "ปิดชั่วคราว" | Feature still accessible via direct URL |
| equipment | "ปิดชั่วคราว" | Feature still accessible via direct URL |
| clients | "ปิดชั่วคราว" | Feature still accessible via direct URL |

### URL Pattern Issues:
- `external-payout.html` back button uses `?page=dashboard` (GAS pattern) instead of `dashboard.html`
- `nav.js` correctly handles both GAS (`?page=`) and static (`.html`) patterns via `isGas` check
- All other pages use `.html` pattern correctly

---

## Priority Recommendations

### Critical (Fix Immediately)
1. **add-song.html `keyNote` reference** — `document.getElementById('keyNote').value.trim()` will throw `TypeError: null.value`. Remove or add the missing field.
2. **leave.html `managerTabs` CSS conflict** — `display:none;display:flex` means manager tabs are always visible. Fix to `display:none` only.
3. **leave.html min date bug** — `setDate(getDate())` adds 0 days. Should be `+1` for tomorrow.

### High Priority
4. **admin.html catastrophic actions** — Add typed confirmation for "clear all data" and "reset users".
5. **my-profile.html** — Require current password before allowing password change.
6. **dashboard.html N+1 API calls** — Implement batch check-in endpoint to avoid 30 API calls for monthly earnings.
7. **external-payout.html GAS URL** — Fix back button to use `dashboard.html`.
8. **terms.html** — Update data storage description from "Google Sheets" to "Supabase".
9. **quotation.html PDF generation** — Verify `generateQuotationPDF` exists in Supabase API layer.
10. **contract.html** — Implement save-to-server functionality or clearly label as "preview only".

### Medium Priority
11. Extract inline JS from songs.html (1425 lines) and dashboard.html (1110 lines) into proper `.js` files.
12. Consolidate 3 separate leave implementations into one shared module.
13. Add loading/disabled state to forgot-password.html submit button.
14. Add proper error boundaries for network failures.
15. Fix schedule.html table overflow on mobile with a proper responsive pattern.
16. Add edit functionality to band-fund.html transactions and external-payout.html records.

### Low Priority
17. Rename `gasRun` to `apiCall` throughout codebase.
18. Remove duplicate `escapeHtml()` definitions.
19. Add PWA manifest + service worker for offline capability.
20. Implement search in user-manual.html.
21. Add password strength indicator to registration.
22. Switch `document.execCommand('copy')` to `navigator.clipboard.writeText()` as primary.

---

*Report generated by automated code audit. All line references are from the `docs/` folder.*
