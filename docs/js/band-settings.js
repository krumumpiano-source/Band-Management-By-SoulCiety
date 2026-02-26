/* ══════════════════════════════════════════
   Band Settings — Horizontal Timetable
   v2: venues (names only) + schedule flat + payroll
══════════════════════════════════════════ */

/* ── State ─────────────────────────────────────────── */
var currentBandId      = null;
var currentBandManager = null;
var bandNameVal        = '';
var venues = [];   // [{id, name}]
var schedule = {}; // {dayOfWeek: [{id, venueId, startTime, endTime, members:[{memberId,rate,rateType}]}]}
var payroll  = { period: 'daily', weekStart: 1, weekEnd: 0 };
var bandMembersData = [];
var currentInviteCode   = null;
var currentInviteExpires = null;

var _editDay    = -1;
var _editSlotId = null;
var _detailDay  = -1;
var _detailSlotId = null;

/* ── Helpers ────────────────────────────────────────── */
function getEl(id) { return document.getElementById(id); }
function esc(text) {
  if (!text) return '';
  var d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}
function showToast(msg, type) {
  var toast = getEl('toast');
  if (!toast) { alert(msg); return; }
  var m = toast.querySelector('.toast-message');
  if (m) m.textContent = msg;
  toast.className = 'toast' + (type === 'error' ? ' toast-error' : type === 'success' ? ' toast-success' : '');
  toast.style.display = 'block';
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.style.display = 'none'; }, 300);
  }, 3000);
}
function timeToMin(t) {
  if (!t || typeof t !== 'string') return null;
  var p = t.split(':');
  if (p.length < 2) return null;
  var h = parseInt(p[0], 10), m = parseInt(p[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}
function minToTime(min) {
  var h = Math.floor(min / 60) % 24, m = min % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}
function autoFormatTime(inp) {
  inp.addEventListener('input', function() {
    var raw = this.value.replace(/[^0-9]/g, '');
    if (raw.length >= 3) raw = raw.substring(0, 2) + ':' + raw.substring(2, 4);
    this.value = raw;
  });
}

var DAY_NAMES  = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
var SLOT_COLORS = [
  {bg:'#f6ad55',text:'#7b341e'}, {bg:'#63b3ed',text:'#1a365d'},
  {bg:'#68d391',text:'#1c4532'}, {bg:'#fc8181',text:'#742a2a'},
  {bg:'#b794f4',text:'#44337a'}, {bg:'#f687b3',text:'#702459'},
  {bg:'#76e4f7',text:'#065666'}, {bg:'#faf089',text:'#744210'}
];
var POSITIONS = [
  'นักร้อง (Vocal)','นักร้องนำ (Lead Vocal)','นักร้องประสาน (Backing Vocal)',
  'กีตาร์นำ (Lead Guitar)','กีตาร์ริธึม (Rhythm Guitar)','เบส (Bass Guitar)',
  'กลองชุด (Drum Set)','เปอร์คัชชัน (Percussion)','กาออน (Cajon)',
  'คีย์บอร์ด (Keyboard)','เปียโน (Piano)','ออร์แกน (Organ)',
  'ซักโซโฟน (Saxophone)','ทรัมเป็ต (Trumpet)','ทรอมโบน (Trombone)','ฟลุต (Flute)',
  'ไวโอลิน (Violin)','เชลโล (Cello)','อุคูเลเล (Ukulele)',
  'DJ / โปรแกรมเมอร์','เสียง (Sound Engineer)','อื่นๆ'
];

function getVenueColor(venueId) {
  var idx = venues.findIndex(function(v) { return v.id === venueId; });
  return SLOT_COLORS[(idx < 0 ? 0 : idx) % SLOT_COLORS.length];
}
function getVenueName(venueId) {
  var v = venues.find(function(v) { return v.id === venueId; });
  return v ? v.name : '?';
}

/* ══════════════════════════════════════════
   PAYLOAD / AUTO-SAVE / SAVE
══════════════════════════════════════════ */
function _buildFullPayload() {
  var bName = (getEl('bandName') && getEl('bandName').value.trim()) || bandNameVal;
  var bMgr  = (getEl('bandManager') && getEl('bandManager').value.trim()) || currentBandManager;
  var validVenues  = venues.filter(function(v) { return v.name && v.name.trim(); });
  var validMembers = bandMembersData.filter(function(m) { return m.name && m.name.trim(); });
  // hourlyRates for backend compat
  var hourlyRates = [];
  Object.keys(schedule).forEach(function(day) {
    (schedule[day] || []).forEach(function(slot) {
      (slot.members || []).forEach(function(mr) {
        if (mr.memberId && mr.rate > 0) {
          hourlyRates.push({ dayOfWeek: parseInt(day), startTime: slot.startTime, endTime: slot.endTime, memberId: mr.memberId, hourlyRate: mr.rate, rateType: mr.rateType || 'shift', venueId: slot.venueId });
        }
      });
    });
  });
  return {
    bandId: currentBandId || ('BAND_' + Date.now()),
    bandName: bName, bandManager: bMgr,
    venues: validVenues, members: validMembers,
    schedule: schedule, payroll: payroll,
    hourlyRates: hourlyRates,
    inviteCode: currentInviteCode, inviteExpires: currentInviteExpires,
    updatedAt: new Date().toISOString()
  };
}


function autoSaveLocal() {
  try {
    var d = _buildFullPayload();
    localStorage.setItem('bandSettings', JSON.stringify(d));
    if (d.bandId)      localStorage.setItem('bandId',      d.bandId);
    if (d.bandName)    localStorage.setItem('bandName',    d.bandName);
    if (d.bandManager) localStorage.setItem('bandManager', d.bandManager);
  } catch(e) {}
}

function _doSave(data, btn, origText, successMsg) {
  function onSuccess() {
    currentBandId = data.bandId; bandNameVal = data.bandName; currentBandManager = data.bandManager;
    localStorage.setItem('bandSettings', JSON.stringify(data));
    localStorage.setItem('bandId', data.bandId);
    localStorage.setItem('bandName', data.bandName);
    localStorage.setItem('bandManager', data.bandManager);
    if (btn) { btn.disabled = false; btn.textContent = origText; }
    showToast(successMsg || 'บันทึกเรียบร้อย ✅', 'success');
  }
  function onFail(msg) {
    if (btn) { btn.disabled = false; btn.textContent = origText; }
    showToast(msg || 'ไม่สามารถบันทึกได้ ❌', 'error');
  }
  if (typeof gasRun === 'function') {
    gasRun('saveBandSettings', data, function(r) { if (r && r.success) onSuccess(); else onFail(r && r.message); });
  } else { onSuccess(); }
}

function saveBandInfo(btn) {
  if (!(getEl('bandName') && getEl('bandName').value.trim())) { showToast('กรุณากรอกชื่อวง', 'error'); return; }
  var orig = btn ? btn.textContent : ''; if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
  _doSave(_buildFullPayload(), btn, orig, 'บันทึกข้อมูลวงเรียบร้อย ✅');
}
function saveMembers(btn) {
  var orig = btn ? btn.textContent : ''; if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
  _doSave(_buildFullPayload(), btn, orig, 'บันทึกสมาชิกเรียบร้อย ✅');
}
function saveVenueNames(btn) {
  var orig = btn ? btn.textContent : ''; if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
  _doSave(_buildFullPayload(), btn, orig, 'บันทึกร้านเรียบร้อย ✅');
}
function savePayroll(btn) {
  var sel = getEl('payrollPeriod'); if (sel) payroll.period = sel.value;
  var ws = getEl('weekStart');      if (ws)  payroll.weekStart = parseInt(ws.value, 10);
  var we = getEl('weekEnd');        if (we)  payroll.weekEnd   = parseInt(we.value, 10);
  var orig = btn ? btn.textContent : ''; if (btn) { btn.disabled = true; btn.textContent = 'บันทึก...'; }
  _doSave(_buildFullPayload(), btn, orig, 'บันทึกการตั้งค่าค่าแรงเรียบร้อย ✅');
}
function saveBandSettings() {
  var btn = getEl('saveBtn'); var orig = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
  _doSave(_buildFullPayload(), btn, orig, 'บันทึกทั้งหมดเรียบร้อย ✅');
}

/* ══════════════════════════════════════════
   LOAD
══════════════════════════════════════════ */
function loadBandSettings() {
  currentBandId      = localStorage.getItem('bandId') || sessionStorage.getItem('bandId');
  bandNameVal        = localStorage.getItem('bandName') || '';
  currentBandManager = localStorage.getItem('bandManager') || localStorage.getItem('userName') || '';

  var stored = localStorage.getItem('bandSettings');
  if (stored) {
    try {
      var s = JSON.parse(stored);
      if (s.bandName)    bandNameVal        = s.bandName;
      if (s.bandManager) currentBandManager = s.bandManager;
      // Venues — new format: [{id,name}], old format: [{id,name,address,phone,schedule}]
      if (s.venues) {
        venues = s.venues.map(function(v) {
          return { id: v.id || v.venueId || ('venue_' + Math.random().toString(36).substr(2,6)), name: v.name || v.venueName || '' };
        });
      }
      // Schedule — new flat format
      if (s.schedule && typeof s.schedule === 'object' && !Array.isArray(s.schedule)) {
        // Check if it's new format (values are arrays of slot objects with id/venueId)
        var keys = Object.keys(s.schedule);
        var isNew = keys.length === 0 || (s.schedule[keys[0]] && Array.isArray(s.schedule[keys[0]]) && s.schedule[keys[0]][0] && s.schedule[keys[0]][0].venueId !== undefined);
        if (isNew) {
          schedule = s.schedule;
        } else {
          // Old format: schedule[day].timeSlots (from scheduleData / buildScheduleData)
          schedule = {};
          keys.forEach(function(day) {
            var dayData = s.schedule[day];
            var slots = dayData.timeSlots || [];
            if (slots.length) {
              schedule[day] = slots.map(function(slot) {
                return {
                  id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2,4),
                  venueId: slot.venueId || (venues[0] && venues[0].id) || '',
                  startTime: slot.startTime || '', endTime: slot.endTime || '',
                  members: (slot.members || []).map(function(mr) {
                    return { memberId: mr.memberId || '', rate: mr.hourlyRate || mr.rate || 0, rateType: mr.rateType || 'shift' };
                  })
                };
              });
            }
          });
        }
      } else if (s.venues) {
        // Very old format: schedule embedded in venues[].schedule[day].timeSlots
        schedule = {};
        s.venues.forEach(function(v) {
          var vid = v.id || v.venueId || '';
          Object.keys(v.schedule || {}).forEach(function(day) {
            if (!schedule[day]) schedule[day] = [];
            (v.schedule[day].timeSlots || []).forEach(function(slot) {
              schedule[day].push({
                id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2,4),
                venueId: vid, startTime: slot.startTime || '', endTime: slot.endTime || '',
                members: (slot.members || []).map(function(mr) {
                  return { memberId: mr.memberId || '', rate: mr.hourlyRate || mr.rate || 0, rateType: 'shift' };
                })
              });
            });
          });
        });
      }
      if (s.payroll) payroll = Object.assign({ period: 'daily', weekStart: 1, weekEnd: 0 }, s.payroll);
      if (s.members)  bandMembersData = s.members;
      if (s.inviteCode) { currentInviteCode = s.inviteCode; currentInviteExpires = s.inviteExpires || null; }
    } catch(e) {}
  }
  renderAll();

  // Silent server refresh
  if (currentBandId && typeof gasRun === 'function') {
    gasRun('getBandSettings', { bandId: currentBandId }, function(r) {
      if (r && r.success && r.data) {
        var d = r.data;
        if (d.bandName)    bandNameVal        = d.bandName;
        if (d.bandManager) currentBandManager = d.bandManager;
        if (d.venues)  venues = d.venues.map(function(v) { return { id: v.id || v.venueId || ('venue_' + Math.random().toString(36).substr(2,6)), name: v.name || v.venueName || '' }; });
        if (d.schedule && typeof d.schedule === 'object') schedule = d.schedule;
        if (d.payroll) payroll = Object.assign({ period: 'daily', weekStart: 1, weekEnd: 0 }, d.payroll);
        if (d.members) bandMembersData = d.members;
        if (d.inviteCode) { currentInviteCode = d.inviteCode; currentInviteExpires = d.inviteExpires || null; }
        renderAll();
      }
    });
  }
}

/* ══════════════════════════════════════════
   RENDER ALL
══════════════════════════════════════════ */
function renderAll() {
  updateBandInfo();
  renderMembers();
  renderVenueNames();
  renderScheduleGrid();
  renderInviteCode();
  renderPayrollSettings();
}
function updateBandInfo() {
  var e = getEl('bandName');    if (e) e.value = bandNameVal        || '';
  var m = getEl('bandManager'); if (m) m.value = currentBandManager || '';
}

/* ══════════════════════════════════════════
   INVITE CODE
══════════════════════════════════════════ */
function renderInviteCode() {
  var disp = getEl('inviteCodeDisplay'), exp = getEl('inviteExpires'), copyBtn = getEl('copyInviteBtn');
  if (!disp) return;
  if (currentInviteCode) {
    disp.textContent = currentInviteCode; disp.classList.remove('empty');
    if (copyBtn) copyBtn.style.display = 'inline-flex';
    if (exp && currentInviteExpires) {
      var d = new Date(currentInviteExpires);
      exp.textContent = 'หมดอายุ: ' + d.toLocaleDateString('th-TH') + ' ' + d.toLocaleTimeString('th-TH', {hour:'2-digit',minute:'2-digit'});
    } else if (exp) exp.textContent = '';
  } else {
    disp.textContent = 'ยังไม่มีรหัสเชิญ'; disp.classList.add('empty');
    if (copyBtn) copyBtn.style.display = 'none';
    if (exp) exp.textContent = '';
  }
}
function generateInviteCode() {
  var btn = getEl('genInviteBtn'); if (btn) { btn.disabled = true; btn.textContent = 'กำลังสร้าง...'; }
  function done(code, expires) {
    currentInviteCode = code; currentInviteExpires = expires; renderInviteCode();
    showToast('สร้างรหัสเชิญ: ' + code);
    if (btn) { btn.disabled = false; btn.textContent = '🎲 สร้างรหัสใหม่'; }
  }
  if (typeof gasRun === 'function' && currentBandId) {
    gasRun('generateInviteCode', { bandId: currentBandId }, function(r) {
      if (r && r.success) {
        var s = JSON.parse(localStorage.getItem('bandSettings') || '{}');
        s.inviteCode = r.data.code; s.inviteExpires = r.data.expiresAt;
        localStorage.setItem('bandSettings', JSON.stringify(s));
        done(r.data.code, r.data.expiresAt);
      } else { showToast((r && r.message) || 'เกิดข้อผิดพลาด'); if (btn) { btn.disabled = false; btn.textContent = '🎲 สร้างรหัสใหม่'; } }
    });
  } else {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', code = '';
    for (var i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    var exp = new Date(); exp.setDate(exp.getDate() + 7);
    var s = JSON.parse(localStorage.getItem('bandSettings') || '{}');
    s.inviteCode = code; s.inviteExpires = exp.toISOString();
    localStorage.setItem('bandSettings', JSON.stringify(s));
    done(code, exp.toISOString());
  }
}
function copyInviteCode() {
  if (!currentInviteCode) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(currentInviteCode).then(function() { showToast('คัดลอกรหัส ' + currentInviteCode + ' แล้ว'); });
  } else {
    var t = document.createElement('textarea'); t.value = currentInviteCode;
    document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
    showToast('คัดลอกรหัส ' + currentInviteCode + ' แล้ว');
  }
}

/* ══════════════════════════════════════════
   MEMBERS
══════════════════════════════════════════ */
function renderMembers() {
  var list = getEl('membersList'), noEl = getEl('noMembers'); if (!list) return;
  if (bandMembersData.length === 0) {
    list.innerHTML = '';
    if (noEl) { noEl.style.display = 'block'; noEl.innerHTML = '<p class="empty-state-small">ยังไม่มีสมาชิก กดปุ่ม ➕ เพื่อเพิ่ม</p>'; }
    return;
  }
  if (noEl) noEl.style.display = 'none';
  list.innerHTML = bandMembersData.map(function(m, i) {
    return '<div class="member-item" data-mi="' + i + '">' +
      '<div class="form-group"><label>ชื่อสมาชิก</label><input type="text" class="mi-name" data-mi="' + i + '" value="' + esc(m.name||'') + '" placeholder="ชื่อ"></div>' +
      '<div class="form-group"><label>ตำแหน่ง</label><select class="mi-pos" data-mi="' + i + '"><option value="">เลือกตำแหน่ง</option>' +
        POSITIONS.map(function(p) { return '<option' + (m.position === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') +
      '</select></div><button type="button" class="member-remove" data-mi="' + i + '">🗑️</button></div>';
  }).join('');
  list.querySelectorAll('.mi-name').forEach(function(e) { e.addEventListener('input', function() { bandMembersData[+this.dataset.mi].name = this.value; }); });
  list.querySelectorAll('.mi-pos').forEach(function(e) { e.addEventListener('change', function() { bandMembersData[+this.dataset.mi].position = this.value; }); });
  list.querySelectorAll('.member-remove').forEach(function(btn) {
    btn.addEventListener('click', function() { if (confirm('ลบสมาชิกคนนี้?')) { bandMembersData.splice(+this.dataset.mi, 1); renderMembers(); } });
  });
}
function addMember() {
  bandMembersData.push({ id: 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2,5), name: '', position: '' });
  renderMembers();
  setTimeout(function() { var l = document.querySelector('.mi-name[data-mi="' + (bandMembersData.length-1) + '"]'); if (l) l.focus(); }, 80);
}

/* ══════════════════════════════════════════
   VENUE NAMES (simplified list)
══════════════════════════════════════════ */
function renderVenueNames() {
  var list = getEl('venueNamesList'); if (!list) return;
  if (venues.length === 0) {
    list.innerHTML = '<p class="empty-state-small" style="margin:8px 0">ยังไม่มีร้าน กดปุ่ม ➕ เพื่อเพิ่ม</p>';
    return;
  }
  list.innerHTML = venues.map(function(v, vi) {
    return '<div class="vn-row" data-vi="' + vi + '">' +
      '<span class="vn-num">' + (vi + 1) + '</span>' +
      '<input type="text" class="vn-input" data-vi="' + vi + '" value="' + esc(v.name) + '" placeholder="ชื่อร้าน">' +
      '<button type="button" class="vn-del" data-vi="' + vi + '">🗑️</button>' +
      '</div>';
  }).join('');
  list.querySelectorAll('.vn-input').forEach(function(inp) {
    inp.addEventListener('input', function() { venues[+this.dataset.vi].name = this.value; autoSaveLocal(); renderScheduleGrid(); });
  });
  list.querySelectorAll('.vn-del').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (!confirm('ลบร้านนี้? ช่วงงานทั้งหมดของร้านนี้จะถูกลบด้วย')) return;
      var vid = venues[+this.dataset.vi].id;
      venues.splice(+this.dataset.vi, 1);
      Object.keys(schedule).forEach(function(day) {
        schedule[day] = (schedule[day] || []).filter(function(s) { return s.venueId !== vid; });
      });
      autoSaveLocal(); renderVenueNames(); renderScheduleGrid();
    });
  });
}
function addVenue() {
  venues.push({ id: 'venue_' + Date.now(), name: '' });
  renderVenueNames();
  setTimeout(function() {
    var inp = document.querySelector('.vn-input[data-vi="' + (venues.length - 1) + '"]');
    if (inp) inp.focus();
  }, 80);
}

/* ══════════════════════════════════════════
   PAYROLL SETTINGS
══════════════════════════════════════════ */
function renderPayrollSettings() {
  var sel = getEl('payrollPeriod');        if (sel) sel.value = payroll.period || 'daily';
  var ws  = getEl('payrollWeeklySettings');if (ws)  ws.style.display = payroll.period === 'weekly' ? '' : 'none';
  var wS  = getEl('weekStart');            if (wS)  wS.value = String(payroll.weekStart !== undefined ? payroll.weekStart : 1);
  var wE  = getEl('weekEnd');              if (wE)  wE.value = String(payroll.weekEnd   !== undefined ? payroll.weekEnd   : 0);
}

/* ══════════════════════════════════════════
   SCHEDULE GRID  (Horizontal)
   Rows = days, Columns = time axis →
══════════════════════════════════════════ */
var DAY_LABEL_W = 72;   // px width of the day-name column
var MIN_PX_PER_MIN = 1.5;
var MAX_PX_PER_MIN = 7;

function calcPxPerMin(totalMin) {
  var outer = getEl('schedGridWrap');
  var available = outer ? (outer.parentElement || outer).offsetWidth - DAY_LABEL_W - 2 : 600;
  if (available < 120) available = 120;
  var fit = available / totalMin;
  // clamp: don't shrink below min (allows scroll), don't stretch above max
  return Math.min(Math.max(fit, MIN_PX_PER_MIN), MAX_PX_PER_MIN);
}

function renderScheduleGrid() {
  var wrap = getEl('schedGridWrap'); if (!wrap) return;

  // Collect all slots with computed min offsets
  var allSlots = [];
  for (var di = 0; di < 7; di++) {
    (schedule[di] || []).forEach(function(slot) {
      var s = timeToMin(slot.startTime), e = timeToMin(slot.endTime);
      if (s === null || e === null) return;
      if (e <= s) e += 24 * 60; // overnight
      allSlots.push({ day: di, slot: slot, startMin: s, endMin: e });
    });
  }

  // Grid time range: fit exactly to actual data (±30 min padding), fallback 18-22
  var gStart, gEnd;
  if (allSlots.length > 0) {
    var minS = Math.min.apply(null, allSlots.map(function(a) { return a.startMin; }));
    var maxE = Math.max.apply(null, allSlots.map(function(a) { return a.endMin;   }));
    gStart = Math.floor((minS - 30) / 60) * 60;
    gEnd   = Math.ceil((maxE + 30) / 60) * 60;
    if (gStart < 0) gStart = 0;
  } else {
    gStart = 18 * 60; gEnd = 22 * 60; // default placeholder when no data
  }
  var totalMin = gEnd - gStart;
  var PX_PER_MIN = calcPxPerMin(totalMin);
  var trackW = Math.round(totalMin * PX_PER_MIN);

  // ── Header row (time ticks) ────────────────────────
  var ticksHtml = '<div class="sg-corner"></div>' +
    '<div class="sg-time-axis" style="width:' + trackW + 'px">';
  for (var t = gStart; t <= gEnd; t += 60) {
    var tx = Math.round((t - gStart) * PX_PER_MIN);
    ticksHtml += '<div class="sg-tick" style="left:' + tx + 'px">' + minToTime(t) + '</div>';
  }
  ticksHtml += '</div>';

  // ── Day rows ──────────────────────────────────────
  var rowsHtml = '';
  for (var dayIdx = 0; dayIdx < 7; dayIdx++) {
    var daySlots = allSlots.filter(function(a) { return a.day === dayIdx; });

    // Hour grid lines (full = hour, half = 30min)
    var linesHtml = '';
    for (var hh = gStart; hh <= gEnd; hh += 30) {
      var lx = Math.round((hh - gStart) * PX_PER_MIN);
      var cls = hh % 60 === 0 ? 'sg-hour-line' : 'sg-hour-line half';
      linesHtml += '<div class="' + cls + '" style="left:' + lx + 'px"></div>';
    }

    // Slot blocks — detect overlap within same day for stacking
    var slotsHtml = '';
    daySlots.forEach(function(a, ai) {
      // Find overlapping peers
      var peers = daySlots.filter(function(b, bi) {
        return bi !== ai && b.startMin < a.endMin && a.startMin < b.endMin;
      });
      var posInGroup = 0, groupSize = 1;
      if (peers.length > 0) {
        var group = daySlots.filter(function(b) {
          return b.startMin < a.endMin && a.startMin < b.endMin;
        }).sort(function(x, y) { return x.startMin - y.startMin; });
        posInGroup = group.indexOf(a);
        groupSize  = group.length;
      }

      var x = Math.round((a.startMin - gStart) * PX_PER_MIN);
      var w = Math.max(Math.round((a.endMin - a.startMin) * PX_PER_MIN), 26);
      var col     = getVenueColor(a.slot.venueId);
      var vname   = esc(getVenueName(a.slot.venueId));
      var timeStr = minToTime(a.startMin) + '–' + minToTime(a.endMin % (24 * 60));
      var mCount  = (a.slot.members || []).length;
      var leftPct = groupSize > 1 ? (posInGroup / groupSize * 100) : 0;
      var wPct    = groupSize > 1 ? (100 / groupSize) : 100;
      var stylePos = groupSize > 1
        ? 'left:calc(' + x + 'px + ' + leftPct + '%);width:calc(' + wPct + '% - 4px);'
        : 'left:' + x + 'px;width:' + w + 'px;';

      slotsHtml += '<div class="sg-slot" data-day="' + dayIdx + '" data-sid="' + esc(a.slot.id) + '" ' +
        'title="' + vname + ' ' + timeStr + (mCount ? ' | ' + mCount + ' คน' : '') + '" ' +
        'style="' + stylePos + 'background:' + col.bg + ';color:' + col.text + ';">' +
        '<div class="sg-slot-name">' + vname + '</div>' +
        (w >= 70 ? '<div class="sg-slot-time">' + timeStr + '</div>' : '') +
        (mCount > 0 && w >= 90 ? '<div class="sg-slot-members">👥 ' + mCount + ' คน</div>' : '') +
        '</div>';
    });

    rowsHtml += '<div class="sg-row">' +
      '<div class="sg-day-label">' + DAY_NAMES[dayIdx] + '</div>' +
      '<div class="sg-track" data-day="' + dayIdx + '" style="width:' + trackW + 'px">' +
        linesHtml + slotsHtml +
        (daySlots.length === 0 ? '<div class="sg-track-hint">+ คลิกเพิ่มช่วงงาน</div>' : '') +
      '</div>' +
      '</div>';
  }

  wrap.innerHTML =
    '<div class="sg-grid">' +
      '<div class="sg-header-row">' + ticksHtml + '</div>' +
      rowsHtml +
    '</div>';

  // ── Event: click track empty area → add slot modal ────
  wrap.querySelectorAll('.sg-track').forEach(function(track) {
    track.addEventListener('click', function(e) {
      // Ignore clicks on existing slots
      if (e.target.classList.contains('sg-slot') || e.target.closest('.sg-slot')) return;
      var day  = +this.dataset.day;
      var rect = this.getBoundingClientRect();
      var relX = e.clientX - rect.left;
      var pxpm = calcPxPerMin(gEnd - gStart);
      var approxMin = gStart + Math.round(relX / pxpm);
      approxMin = Math.floor(approxMin / 30) * 30; // snap 30 min
      var approxEnd = Math.min(approxMin + 180, gEnd); // default 3h
      approxMin = Math.max(approxMin, gStart);
      openSlotModal(day, null, minToTime(approxMin), minToTime(approxEnd));
    });
  });

  // ── Event: click slot → detail modal ──────────────────
  wrap.querySelectorAll('.sg-slot').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      openSlotDetailModal(+this.dataset.day, this.dataset.sid);
    });
  });

  // ── Legend ─────────────────────────────────────────────
  var legendEl = getEl('schedLegend');
  if (legendEl) {
    var namedV = venues.filter(function(v) { return v.name && v.name.trim(); });
    legendEl.innerHTML = namedV.map(function(v) {
      var col = getVenueColor(v.id);
      return '<div class="sg-legend-item"><div class="sg-legend-dot" style="background:' + col.bg + '"></div>' + esc(v.name) + '</div>';
    }).join('');
  }
}

/* ══════════════════════════════════════════
   SLOT MODAL  (Add / Edit slot)
══════════════════════════════════════════ */
function openSlotModal(day, slotId, defaultStart, defaultEnd) {
  _editDay = day; _editSlotId = slotId;
  var modal = getEl('slotModal'); if (!modal) return;
  var namedV = venues.filter(function(v) { return v.name && v.name.trim(); });
  if (namedV.length === 0) { showToast('กรุณาเพิ่มร้านก่อน', 'error'); return; }

  var existingSlot = null;
  if (slotId) { (schedule[day] || []).forEach(function(s) { if (s.id === slotId) existingSlot = s; }); }

  // Populate venue select
  var venSel = getEl('smVenue');
  if (venSel) {
    venSel.innerHTML = '<option value="">— เลือกร้าน —</option>' +
      namedV.map(function(v) {
        return '<option value="' + esc(v.id) + '"' + (existingSlot && existingSlot.venueId === v.id ? ' selected' : '') + '>' + esc(v.name) + '</option>';
      }).join('');
  }
  var dl = getEl('smDayLabel'); if (dl) dl.textContent = DAY_NAMES[day];
  var ss = getEl('smStart'); if (ss) { ss.value = existingSlot ? existingSlot.startTime : (defaultStart || '18:00'); autoFormatTime(ss); }
  var se = getEl('smEnd');   if (se) { se.value = existingSlot ? existingSlot.endTime   : (defaultEnd   || '21:00'); autoFormatTime(se); }

  var delBtn = getEl('smDeleteBtn'); if (delBtn) delBtn.style.display = slotId ? '' : 'none';
  modal.style.display = 'flex';
}
function closeSlotModal() { var m = getEl('slotModal'); if (m) m.style.display = 'none'; }
function confirmSlotModal() {
  var venSel = getEl('smVenue'), ss = getEl('smStart'), se = getEl('smEnd');
  var venueId = venSel ? venSel.value : '';
  var start   = ss ? ss.value.trim() : '', end = se ? se.value.trim() : '';
  if (!venueId) { showToast('กรุณาเลือกร้าน', 'error'); return; }
  if (!/^\d{1,2}:\d{2}$/.test(start) || !/^\d{1,2}:\d{2}$/.test(end)) { showToast('กรุณากรอกเวลาให้ถูกต้อง (HH:MM)', 'error'); return; }
  // Pad HH
  if (start.length === 4) start = '0' + start;
  if (end.length === 4)   end   = '0' + end;
  if (!schedule[_editDay]) schedule[_editDay] = [];
  if (_editSlotId) {
    schedule[_editDay].forEach(function(s) { if (s.id === _editSlotId) { s.venueId = venueId; s.startTime = start; s.endTime = end; } });
  } else {
    schedule[_editDay].push({ id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2,4), venueId: venueId, startTime: start, endTime: end, members: [] });
  }
  autoSaveLocal(); closeSlotModal(); renderScheduleGrid();
  showToast('บันทึกช่วงงานเรียบร้อย ✅', 'success');
}
function deleteSlotFromModal() {
  if (!confirm('ลบช่วงงานนี้?')) return;
  if (_editSlotId !== null && _editDay >= 0) {
    schedule[_editDay] = (schedule[_editDay] || []).filter(function(s) { return s.id !== _editSlotId; });
  }
  autoSaveLocal(); closeSlotModal(); renderScheduleGrid();
}

/* ══════════════════════════════════════════
   SLOT DETAIL MODAL  (Members + Rates)
══════════════════════════════════════════ */
function openSlotDetailModal(day, slotId) {
  _detailDay = day; _detailSlotId = slotId;
  var slot = null; (schedule[day] || []).forEach(function(s) { if (s.id === slotId) slot = s; });
  if (!slot) return;
  var modal = getEl('slotDetailModal'); if (!modal) return;
  var t = getEl('sdTitle');
  if (t) t.textContent = getVenueName(slot.venueId) + ' — ' + DAY_NAMES[day] + '  ' + (slot.startTime || '') + '–' + (slot.endTime || '');
  renderSlotMembers(slot);
  modal.style.display = 'flex';
}
function closeSlotDetailModal() { var m = getEl('slotDetailModal'); if (m) m.style.display = 'none'; }

function getEditingSlot() {
  if (_detailDay < 0 || !_detailSlotId) return null;
  var found = null; (schedule[_detailDay] || []).forEach(function(s) { if (s.id === _detailSlotId) found = s; });
  return found;
}

function renderSlotMembers(slot) {
  var list = getEl('sdMemberList'); if (!list) return;
  if (!slot) slot = getEditingSlot(); if (!slot) return;
  if (!slot.members) slot.members = [];

  var validBM = bandMembersData.filter(function(m) { return m.name && m.name.trim(); });
  if (slot.members.length === 0) {
    list.innerHTML = '<p class="empty-state-small">ยังไม่มีสมาชิกในช่วงนี้ กด ➕ เพื่อเพิ่ม</p>';
    return;
  }

  list.innerHTML = slot.members.map(function(mr, mi) {
    var selOpts = validBM.map(function(m) {
      var mid = m.memberId || m.id || '';
      return '<option value="' + esc(mid) + '"' + (mr.memberId === mid ? ' selected' : '') + '>' + esc(m.name) + (m.position ? ' (' + m.position + ')' : '') + '</option>';
    }).join('');
    return '<div class="sd-member-row" data-mi="' + mi + '">' +
      '<select class="sd-m-sel" data-mi="' + mi + '"><option value="">เลือกสมาชิก</option>' + selOpts + '</select>' +
      '<input type="number" class="sd-m-rate" data-mi="' + mi + '" value="' + (mr.rate || '') + '" placeholder="ค่าแรง" min="0">' +
      '<select class="sd-m-rtype" data-mi="' + mi + '">' +
        '<option value="shift"'   + (mr.rateType === 'shift'   || !mr.rateType ? ' selected' : '') + '>บาท/เบรค</option>' +
        '<option value="hourly"'  + (mr.rateType === 'hourly'  ? ' selected' : '') + '>บาท/ชม</option>' +
        '<option value="fixed"'   + (mr.rateType === 'fixed'   ? ' selected' : '') + '>คงที่</option>' +
      '</select>' +
      '<button type="button" class="sd-m-del" data-mi="' + mi + '">🗑️</button>' +
      '</div>';
  }).join('');

  list.querySelectorAll('.sd-m-sel').forEach(function(sel) {
    sel.addEventListener('change', function() { var s = getEditingSlot(); if (s && s.members[+this.dataset.mi]) s.members[+this.dataset.mi].memberId = this.value; autoSaveLocal(); });
  });
  list.querySelectorAll('.sd-m-rate').forEach(function(inp) {
    inp.addEventListener('input', function() { var s = getEditingSlot(); if (s && s.members[+this.dataset.mi]) s.members[+this.dataset.mi].rate = parseFloat(this.value) || 0; autoSaveLocal(); });
  });
  list.querySelectorAll('.sd-m-rtype').forEach(function(sel) {
    sel.addEventListener('change', function() { var s = getEditingSlot(); if (s && s.members[+this.dataset.mi]) s.members[+this.dataset.mi].rateType = this.value; autoSaveLocal(); });
  });
  list.querySelectorAll('.sd-m-del').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var s = getEditingSlot(); if (!s) return;
      s.members.splice(+this.dataset.mi, 1);
      autoSaveLocal(); renderSlotMembers(s); renderScheduleGrid();
    });
  });
}

function addMemberToSlot() {
  var slot = getEditingSlot(); if (!slot) return;
  if (!slot.members) slot.members = [];
  slot.members.push({ memberId: '', rate: 0, rateType: 'shift' });
  autoSaveLocal(); renderSlotMembers(slot);
}
function applyBulkRate() {
  var rateInp = getEl('bulkRate'), typesel = getEl('bulkType');
  var rate = parseFloat(rateInp ? rateInp.value : '') || 0;
  var rtype = typesel ? typesel.value : 'shift';
  var slot = getEditingSlot(); if (!slot) return;
  (slot.members || []).forEach(function(m) { m.rate = rate; m.rateType = rtype; });
  autoSaveLocal(); renderSlotMembers(slot);
  showToast('ตั้งค่าแรงทุกคนเป็น ' + rate + ' (' + rtype + ') แล้ว', 'success');
}
function saveSlotDetail() {
  autoSaveLocal(); showToast('บันทึกสมาชิกเรียบร้อย ✅', 'success');
  closeSlotDetailModal(); renderScheduleGrid();
}
function editThisSlot() {
  closeSlotDetailModal(); openSlotModal(_detailDay, _detailSlotId, null, null);
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  var em = getEl('addMemberBtn');   if (em) em.addEventListener('click', function(e) { e.preventDefault(); addMember(); });
  var ev = getEl('addVenueNameBtn');if (ev) ev.addEventListener('click', function(e) { e.preventDefault(); addVenue(); });
  var es = getEl('saveBtn');        if (es) es.addEventListener('click', function(e) { e.preventDefault(); saveBandSettings(); });
  var pp = getEl('payrollPeriod');  if (pp) pp.addEventListener('change', function() { payroll.period = this.value; renderPayrollSettings(); });
  loadBandSettings();
});

// Re-render grid on resize so px/min recalculates for new window width
var _resizeTimer = null;
window.addEventListener('resize', function() {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(renderScheduleGrid, 150);
});
