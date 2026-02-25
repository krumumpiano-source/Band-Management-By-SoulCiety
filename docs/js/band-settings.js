/* ══════════════════════════════════════════
   SAVE — per-section helpers
══════════════════════════════════════════ */
function _buildFullPayload() {
  var bName = (getEl('bandName') && getEl('bandName').value.trim()) || bandNameVal;
  var bMgr  = (getEl('bandManager') && getEl('bandManager').value.trim()) || currentBandManager;
  var validMembers = bandMembersData.filter(function(m) { return m.name && m.name.trim(); });
  var validVenues  = venues.filter(function(v) { return v.name && v.name.trim(); });
  var hourlyRates = [];
  validVenues.forEach(function(v) {
    Object.keys(v.schedule || {}).forEach(function(day) {
      (v.schedule[day].timeSlots || []).forEach(function(slot) {
        (slot.members || []).forEach(function(mr) {
          if (mr.memberId && mr.hourlyRate > 0) {
            hourlyRates.push({ dayOfWeek: parseInt(day), startTime: slot.startTime, endTime: slot.endTime, memberId: mr.memberId, hourlyRate: mr.hourlyRate, venueId: v.id });
          }
        });
      });
    });
  });
  return {
    bandId: currentBandId || ('BAND_' + Date.now()),
    bandName: bName,
    bandManager: bMgr,
    venues: validVenues,
    members: validMembers,
    hourlyRates: hourlyRates,
    scheduleData: buildScheduleData(),
    inviteCode: currentInviteCode,
    inviteExpires: currentInviteExpires,
    updatedAt: new Date().toISOString()
  };
}

function _doSave(data, btn, origText, successMsg) {
  function onSuccess() {
    currentBandId = data.bandId;
    bandNameVal = data.bandName;
    currentBandManager = data.bandManager;
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
    gasRun('saveBandSettings', data, function(r) {
      if (r && r.success) onSuccess(); else onFail(r && r.message);
    });
  } else {
    onSuccess();
  }
}

function saveBandInfo(btn) {
  var bName = getEl('bandName') && getEl('bandName').value.trim();
  if (!bName) { showToast('กรุณากรอกชื่อวง', 'error'); return; }
  var origText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
  _doSave(_buildFullPayload(), btn, origText, 'บันทึกข้อมูลวงเรียบร้อย ✅');
}

function saveMembers(btn) {
  var origText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
  _doSave(_buildFullPayload(), btn, origText, 'บันทึกสมาชิกเรียบร้อย ✅');
}

function saveVenues(btn) {
  var valid = venues.filter(function(v) { return v.name && v.name.trim(); });
  if (valid.length === 0) { showToast('กรุณาเพิ่มร้านอย่างน้อย 1 ร้านที่มีชื่อ', 'error'); return; }
  var origText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
  _doSave(_buildFullPayload(), btn, origText, 'บันทึกร้านและตารางงานเรียบร้อย ✅');
}

// Global save-all (header button)
function saveBandSettings() {
  var bName = (getEl('bandName') && getEl('bandName').value.trim()) || bandNameVal;
  if (!bName) { showToast('กรุณากรอกชื่อวง', 'error'); return; }
  var btn = getEl('saveBtn');
  var origText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
  _doSave(_buildFullPayload(), btn, origText, 'บันทึกทั้งหมดเรียบร้อย ✅');
}
/**
 * Band Settings — merged venue+schedule, invite code
 * Data structure: venues[].schedule[dayOfWeek].timeSlots[].members[]
 */

var currentBandId = null;
var currentBandManager = null;
var bandNameVal = '';
var venues = [];       // [{ id, name, address, phone, schedule: { '1': { timeSlots: [] } } }]
var bandMembersData = [];
var currentInviteCode = null;
var currentInviteExpires = null;
// Track which day tab is active per venue: venueActiveDays[venueIndex] = dayNum
var venueActiveDays = {};
var expandedVenues  = {}; // accordion open state: { vi: true }

var DAY_NAMES = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
var POSITIONS = [
  // เสียง
  'นักร้อง (Vocal)',
  'นักร้องนำ (Lead Vocal)',
  'นักร้องประสาน (Backing Vocal)',
  // กีตาร์
  'กีตาร์นำ (Lead Guitar)',
  'กีตาร์ริธึม (Rhythm Guitar)',
  'เบส (Bass Guitar)',
  // กลอง
  'กลองชุด (Drum Set)',
  'เปอร์คัชชัน (Percussion)',
  'กาออน (Cajon)',
  // คีย์บอร์ด / เปียโน
  'คีย์บอร์ด (Keyboard)',
  'เปียโน (Piano)',
  'ออร์แกน (Organ)',
  // สายลม
  'ซอกโซโฟน (Saxophone)',
  'ทรัมเป็ต (Trumpet)',
  'ทรอมโบน (Trombone)',
  'ฟลุต (Flute)',
  // เครื่องสาย
  'ไวโอลิน (Violin)',
  'เชลโล (Cello)',
  'อุคูเลเล (Ukulele)',
  // ดีเจ / โปรแกรม
  'DJ / โปรแกรมเมอร์ (Programmer)',
  'เสียง (Sound Engineer)',
  // อื่นๆ
  'อื่นๆ'
];

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

/* ══════════════════════════════════════════
   LOAD
══════════════════════════════════════════ */
function loadBandSettings() {
  currentBandId = localStorage.getItem('bandId') || sessionStorage.getItem('bandId');
  bandNameVal = localStorage.getItem('bandName') || '';
  currentBandManager = localStorage.getItem('bandManager') || localStorage.getItem('userName') || '';

  var stored = localStorage.getItem('bandSettings');
  if (stored) {
    try {
      var s = JSON.parse(stored);
      if (s.bandName) bandNameVal = s.bandName;
      venues = (s.venues || []).map(normalizeVenue);
      bandMembersData = s.members || [];
      if (s.inviteCode) { currentInviteCode = s.inviteCode; currentInviteExpires = s.inviteExpires || null; }
      // migrate old scheduleData into venues if venues have no schedule
      if (s.scheduleData && venues.length > 0 && !venues[0].schedule) {
        venues[0].schedule = s.scheduleData;
      }
    } catch(e) {}
  }

  if (currentBandId && typeof gasRun === 'function') {
    gasRun('getBandSettings', { bandId: currentBandId }, function(r) {
      if (r && r.success && r.data) {
        var d = r.data;
        if (d.bandName) bandNameVal = d.bandName;
        if (d.venues) venues = d.venues.map(normalizeVenue);
        if (d.members) bandMembersData = d.members;
        if (d.inviteCode) { currentInviteCode = d.inviteCode; currentInviteExpires = d.inviteExpires || null; }
        if (d.scheduleData && venues.length > 0 && !venues[0].schedule) {
          venues[0].schedule = d.scheduleData;
        }
      }
      renderAll();
    });
  } else {
    renderAll();
  }
}

function normalizeVenue(v) {
  if (!v.schedule) v.schedule = {};
  return v;
}

function renderAll() {
  updateBandInfo();
  renderMembers();
  renderVenues();
  renderInviteCode();
}

function updateBandInfo() {
  var el = getEl('bandName'); if (el) el.value = bandNameVal || '';
  var mg = getEl('bandManager'); if (mg) mg.value = currentBandManager || '';
}

/* ══════════════════════════════════════════
   INVITE CODE
══════════════════════════════════════════ */
function renderInviteCode() {
  var disp = getEl('inviteCodeDisplay');
  var exp  = getEl('inviteExpires');
  var copyBtn = getEl('copyInviteBtn');
  if (!disp) return;
  if (currentInviteCode) {
    disp.textContent = currentInviteCode;
    disp.classList.remove('empty');
    if (copyBtn) copyBtn.style.display = 'inline-flex';
    if (exp && currentInviteExpires) {
      var d = new Date(currentInviteExpires);
      exp.textContent = 'หมดอายุ: ' + d.toLocaleDateString('th-TH') + ' ' + d.toLocaleTimeString('th-TH', {hour:'2-digit',minute:'2-digit'});
    } else if (exp) exp.textContent = '';
  } else {
    disp.textContent = 'ยังไม่มีรหัสเชิญ';
    disp.classList.add('empty');
    if (copyBtn) copyBtn.style.display = 'none';
    if (exp) exp.textContent = '';
  }
}

function generateInviteCode() {
  var btn = getEl('genInviteBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'กำลังสร้าง...'; }
  function done(code, expires) {
    currentInviteCode = code;
    currentInviteExpires = expires;
    renderInviteCode();
    showToast('สร้างรหัสเชิญเรียบร้อย: ' + code);
    if (btn) { btn.disabled = false; btn.textContent = '🎲 สร้างรหัสใหม่'; }
  }
  if (typeof gasRun === 'function' && currentBandId) {
    gasRun('generateInviteCode', { bandId: currentBandId }, function(r) {
      if (r && r.success) {
        // Save to localStorage for display
        var stored = JSON.parse(localStorage.getItem('bandSettings') || '{}');
        stored.inviteCode = r.data.code;
        stored.inviteExpires = r.data.expiresAt;
        localStorage.setItem('bandSettings', JSON.stringify(stored));
        done(r.data.code, r.data.expiresAt);
      } else {
        showToast((r && r.message) || 'เกิดข้อผิดพลาด');
        if (btn) { btn.disabled = false; btn.textContent = '🎲 สร้างรหัสใหม่'; }
      }
    });
  } else {
    // Offline/demo: generate locally
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var code = '';
    for (var i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    var exp = new Date(); exp.setDate(exp.getDate() + 7);
    var stored = JSON.parse(localStorage.getItem('bandSettings') || '{}');
    stored.inviteCode = code; stored.inviteExpires = exp.toISOString();
    localStorage.setItem('bandSettings', JSON.stringify(stored));
    done(code, exp.toISOString());
  }
}

function copyInviteCode() {
  if (!currentInviteCode) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(currentInviteCode).then(function() { showToast('คัดลอกรหัส ' + currentInviteCode + ' แล้ว'); });
  } else {
    var t = document.createElement('textarea');
    t.value = currentInviteCode;
    document.body.appendChild(t); t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
    showToast('คัดลอกรหัส ' + currentInviteCode + ' แล้ว');
  }
}

/* ══════════════════════════════════════════
   MEMBERS
══════════════════════════════════════════ */
function renderMembers() {
  var list = getEl('membersList');
  var noEl = getEl('noMembers');
  if (!list) return;
  if (bandMembersData.length === 0) {
    list.innerHTML = '';
    if (noEl) { noEl.style.display = 'block'; noEl.innerHTML = '<p class="empty-state-small">ยังไม่มีสมาชิก กดปุ่ม ➕ เพื่อเพิ่ม</p>'; }
    return;
  }
  if (noEl) noEl.style.display = 'none';
  list.innerHTML = bandMembersData.map(function(m, i) {
    return '<div class="member-item" data-mi="' + i + '">' +
      '<div class="form-group"><label>ชื่อสมาชิก</label>' +
      '<input type="text" class="mi-name" data-mi="' + i + '" value="' + esc(m.name||'') + '" placeholder="ชื่อสมาชิก"></div>' +
      '<div class="form-group"><label>ตำแหน่ง</label>' +
      '<select class="mi-pos" data-mi="' + i + '">' +
        '<option value="">เลือกตำแหน่ง</option>' +
        POSITIONS.map(function(p){ return '<option' + (m.position===p?' selected':'') + '>' + p + '</option>'; }).join('') +
      '</select></div>' +
      '<button type="button" class="member-remove" data-mi="' + i + '">🗑️</button>' +
      '</div>';
  }).join('');
  list.querySelectorAll('.mi-name').forEach(function(inp) {
    inp.addEventListener('input', function() { bandMembersData[+this.dataset.mi].name = this.value; });
  });
  list.querySelectorAll('.mi-pos').forEach(function(sel) {
    sel.addEventListener('change', function() { bandMembersData[+this.dataset.mi].position = this.value; });
  });
  list.querySelectorAll('.member-remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (confirm('ลบสมาชิกคนนี้หรือไม่?')) { bandMembersData.splice(+this.dataset.mi, 1); renderMembers(); }
    });
  });
}

function addMember() {
  bandMembersData.push({ id: 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2,5), name: '', position: '' });
  renderMembers();
  setTimeout(function() {
    var last = document.querySelector('.mi-name[data-mi="' + (bandMembersData.length-1) + '"]');
    if (last) last.focus();
  }, 80);
}

/* ══════════════════════════════════════════
   VENUES — hierarchical: ① ร้าน → ② วัน → ③ เวลา → ④ สมาชิก
══════════════════════════════════════════ */
function renderVenues() {
  var list = getEl('venuesList');
  var noEl = getEl('noVenues');
  if (!list) return;
  if (venues.length === 0) {
    list.innerHTML = '';
    if (noEl) { noEl.style.display = 'block'; noEl.innerHTML = '<p class="empty-state-small">ยังไม่มีร้าน กดปุ่ม ➕ เพื่อเพิ่มร้านแรก</p>'; }
    return;
  }
  if (noEl) noEl.style.display = 'none';
  list.innerHTML = venues.map(function(v, vi) {
    var isExpanded = !!expandedVenues[vi];
    var activeDay  = venueActiveDays[vi] !== undefined ? venueActiveDays[vi] : -1;
    // Compact summary for collapsed header
    var activeDayNums = Object.keys(v.schedule || {}).filter(function(d) {
      return (v.schedule[d].timeSlots || []).length > 0;
    }).map(Number).sort();
    var totalSlots = activeDayNums.reduce(function(s, d) { return s + (v.schedule[d].timeSlots || []).length; }, 0);
    var summaryParts = [];
    if (activeDayNums.length > 0) summaryParts.push(activeDayNums.map(function(d) { return DAY_NAMES[d]; }).join(', '));
    if (totalSlots > 0) summaryParts.push(totalSlots + ' ช่วงเวลา');
    var summary = summaryParts.length ? summaryParts.join(' • ') : 'ยังไม่ได้ตั้งตาราง';
    var bodyHtml = '';
    if (isExpanded) {
      // ① Venue info
      var infoHtml =
        '<div class="venue-step-section">' +
          '<div class="venue-step-label"><span class="step-num">\u2460</span> \u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e23\u0e49\u0e32\u0e19</div>' +
          '<div class="venue-info-inputs">' +
            '<div class="form-group"><label>\u0e0a\u0e37\u0e48\u0e2d\u0e23\u0e49\u0e32\u0e19 <span style="color:#e53e3e">*</span></label>' +
              '<input type="text" class="vc-name" data-vi="' + vi + '" value="' + esc(v.name||'') + '" placeholder="\u0e0a\u0e37\u0e48\u0e2d\u0e23\u0e49\u0e32\u0e19"></div>' +
            '<div class="form-group"><label>\u0e17\u0e35\u0e48\u0e2d\u0e22\u0e39\u0e48</label>' +
              '<input type="text" class="vc-addr" data-vi="' + vi + '" value="' + esc(v.address||'') + '" placeholder="\u0e17\u0e35\u0e48\u0e2d\u0e22\u0e39\u0e48"></div>' +
            '<div class="form-group"><label>\u0e40\u0e1a\u0e2d\u0e23\u0e4c\u0e42\u0e17\u0e23</label>' +
              '<input type="tel" class="vc-phone" data-vi="' + vi + '" value="' + esc(v.phone||'') + '" placeholder="\u0e40\u0e1a\u0e2d\u0e23\u0e4c\u0e42\u0e17\u0e23"></div>' +
          '</div>' +
        '</div>';
      // ② Day selection
      var dayTabsHtml = DAY_NAMES.map(function(dn, di) {
        var hasData = !!(v.schedule && v.schedule[di] && (v.schedule[di].timeSlots||[]).length > 0);
        var cls = 'day-tab' + (di === activeDay ? ' active' : '') + (hasData ? ' has-data' : '');
        return '<button type="button" class="' + cls + '" data-vi="' + vi + '" data-day="' + di + '">' + dn + '</button>';
      }).join('');
      var daySection =
        '<div class="venue-step-section">' +
          '<div class="venue-step-label"><span class="step-num">\u2461</span> \u0e40\u0e25\u0e37\u0e2d\u0e01\u0e27\u0e31\u0e19\u0e17\u0e33\u0e07\u0e32\u0e19</div>' +
          '<div class="day-tabs">' + dayTabsHtml + '</div>' +
        '</div>';
      // ③+④ time slots — only shown when a day is active
      var slotSection = '';
      if (activeDay >= 0) {
        slotSection =
          '<div class="venue-step-section venue-day-content">' +
            '<div class="venue-step-label"><span class="step-num">\u2462</span> \u0e0a\u0e48\u0e27\u0e07\u0e40\u0e27\u0e25\u0e32 \u2014 ' + DAY_NAMES[activeDay] + '</div>' +
            renderTimeSlotsForVenueDay(v, vi, activeDay) +
            '<button type="button" class="btn btn-secondary btn-sm add-ts-btn" data-vi="' + vi + '" data-day="' + activeDay + '" style="margin-top:8px">\u279e \u0e40\u0e1e\u0e34\u0e48\u0e21\u0e0a\u0e48\u0e27\u0e07\u0e40\u0e27\u0e25\u0e32</button>' +
          '</div>';
      }
      bodyHtml = '<div class="venue-accordion-body">' + infoHtml + daySection + slotSection +
        '<div style="display:flex;justify-content:flex-end;padding-top:var(--spacing-md);margin-top:var(--spacing-md);border-top:1px solid #e2e8f0">' +
        '<button type="button" class="btn btn-primary btn-sm save-venue-btn" data-vi="' + vi + '">💾 บันทึกร้านนี้</button>' +
        '</div>' +
        '</div>';
    }
    return '<div class="venue-accordion-item" data-vi="' + vi + '">' +
      '<div class="venue-accordion-header" data-vi="' + vi + '">' +
        '<div class="venue-expand-arrow">' + (isExpanded ? '\u25bc' : '\u25b6') + '</div>' +
        '<div class="venue-header-info">' +
          '<div class="venue-header-name">' + esc(v.name || '(\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e15\u0e31\u0e49\u0e07\u0e0a\u0e37\u0e48\u0e2d)') + '</div>' +
          '<div class="venue-header-summary">' + (v.address ? esc(v.address) + ' \u2022 ' : '') + summary + '</div>' +
        '</div>' +
        '<button type="button" class="venue-remove-btn" data-vi="' + vi + '">\ud83d\uddd1\ufe0f \u0e25\u0e1a</button>' +
      '</div>' +
      bodyHtml +
      '</div>';
  }).join('');
  // Header click → toggle accordion
  list.querySelectorAll('.venue-accordion-header').forEach(function(hdr) {
    hdr.addEventListener('click', function(e) {
      if (e.target.classList && e.target.classList.contains('venue-remove-btn')) return;
      if (e.target.closest && e.target.closest('.venue-remove-btn')) return;
      var vi = +this.dataset.vi;
      expandedVenues[vi] = !expandedVenues[vi];
      renderVenues();
    });
  });
  list.querySelectorAll('.venue-remove-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!confirm('\u0e25\u0e1a\u0e23\u0e49\u0e32\u0e19\u0e19\u0e35\u0e49\u0e2b\u0e23\u0e37\u0e2d\u0e44\u0e21\u0e48?')) return;
      var vi = +this.dataset.vi;
      venues.splice(vi, 1);
      delete venueActiveDays[vi]; delete expandedVenues[vi];
      renderVenues();
    });
  });
  list.querySelectorAll('.vc-name').forEach(function(inp) {
    inp.addEventListener('input', function() {
      venues[+this.dataset.vi].name = this.value;
      var hn = this.closest('.venue-accordion-item').querySelector('.venue-header-name');
      if (hn) hn.textContent = this.value || '(\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e15\u0e31\u0e49\u0e07\u0e0a\u0e37\u0e48\u0e2d)';
    });
  });
  list.querySelectorAll('.vc-addr').forEach(function(inp) {
    inp.addEventListener('input', function() { venues[+this.dataset.vi].address = this.value; });
  });
  list.querySelectorAll('.vc-phone').forEach(function(inp) {
    inp.addEventListener('input', function() { venues[+this.dataset.vi].phone = this.value; });
  });
  list.querySelectorAll('.day-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var vi = +this.dataset.vi, day = +this.dataset.day;
      venueActiveDays[vi] = (venueActiveDays[vi] === day) ? -1 : day;
      renderVenues();
    });
  });
  list.querySelectorAll('.add-ts-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var vi = +this.dataset.vi, day = +this.dataset.day;
      if (!venues[vi].schedule) venues[vi].schedule = {};
      if (!venues[vi].schedule[day]) venues[vi].schedule[day] = { timeSlots: [] };
      venues[vi].schedule[day].timeSlots.push({ startTime: '', endTime: '', members: [] });
      renderVenues();
    });
  });
  attachTimeSlotListeners();
  list.querySelectorAll('.save-venue-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.stopPropagation(); saveVenues(this); });
  });
}

function renderTimeSlotsForVenueDay(v, vi, day) {
  var slots = ((v.schedule || {})[day] || {}).timeSlots || [];
  if (slots.length === 0) return '<p class="empty-state-small">\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e0a\u0e48\u0e27\u0e07\u0e40\u0e27\u0e25\u0e32 \u0e01\u0e14 \u279e \u0e40\u0e1e\u0e34\u0e48\u0e21\u0e0a\u0e48\u0e27\u0e07\u0e40\u0e27\u0e25\u0e32\u0e14\u0e49\u0e32\u0e19\u0e25\u0e48\u0e32\u0e07</p>';
  return slots.map(function(slot, si) {
    var label = (slot.startTime || '--:--') + ' - ' + (slot.endTime || '--:--');
    var membersHtml = (slot.members || []).map(function(mr, mi) {
      return '<div class="member-rate-row">' +
        '<select class="mr-select" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" data-mi="' + mi + '">' +
          '<option value="">\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e2a\u0e21\u0e32\u0e0a\u0e34\u0e01</option>' +
          bandMembersData.map(function(m) {
            var mid = m.memberId||m.id||'';
            return '<option value="' + esc(mid) + '"' + (mr.memberId === mid ? ' selected' : '') + '>' + esc(m.name||'(\u0e44\u0e21\u0e48\u0e21\u0e35\u0e0a\u0e37\u0e48\u0e2d)') + (m.position ? ' ('+esc(m.position)+')' : '') + '</option>';
          }).join('') +
        '</select>' +
        '<input type="number" class="mr-rate" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" data-mi="' + mi + '" value="' + (mr.hourlyRate||'') + '" placeholder="0" min="0">' +
        '<span class="rate-unit">\u0e1a\u0e32\u0e17/\u0e0a\u0e21.</span>' +
        '<button type="button" class="member-rate-remove" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" data-mi="' + mi + '">\ud83d\uddd1\ufe0f</button>' +
      '</div>';
    }).join('');
    return '<div class="time-slot-item">' +
      '<div class="ts-header">' +
        '<span class="ts-time-label">\u23f0 ' + label + '</span>' +
        '<button type="button" class="btn-icon-small ts-remove" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '">\ud83d\uddd1\ufe0f \u0e25\u0e1a\u0e0a\u0e48\u0e27\u0e07</button>' +
      '</div>' +
      '<div class="ts-inputs">' +
        '<div class="form-group"><label>\u0e40\u0e27\u0e25\u0e32\u0e40\u0e23\u0e34\u0e48\u0e21 <small style="color:var(--premium-text-muted)">(HH:MM)</small></label><input type="text" inputmode="numeric" maxlength="5" placeholder="00:00" class="ts-start ts-time-text" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" value="' + (slot.startTime||'') + '"></div>' +
        '<div class="form-group"><label>\u0e40\u0e27\u0e25\u0e32\u0e2a\u0e34\u0e49\u0e19\u0e2a\u0e38\u0e14 <small style="color:var(--premium-text-muted)">(HH:MM)</small></label><input type="text" inputmode="numeric" maxlength="5" placeholder="00:00" class="ts-end ts-time-text" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" value="' + (slot.endTime||'') + '"></div>' +
      '</div>' +
      '<div class="ts-members">' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:var(--text-xs);font-weight:700;color:var(--premium-text);margin-bottom:6px"><span class="step-num" style="width:16px;height:16px;font-size:10px">\u2463</span> \u0e2a\u0e21\u0e32\u0e0a\u0e34\u0e01\u0e41\u0e25\u0e30\u0e04\u0e48\u0e32\u0e41\u0e23\u0e07</label>' +
        (membersHtml || '<p class="empty-state-small">\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e2a\u0e21\u0e32\u0e0a\u0e34\u0e01\u0e43\u0e19\u0e0a\u0e48\u0e27\u0e07\u0e19\u0e35\u0e49</p>') +
        '<button type="button" class="btn btn-sm btn-primary add-mr-btn" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" style="margin-top:6px">\u279e \u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2a\u0e21\u0e32\u0e0a\u0e34\u0e01</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function attachTimeSlotListeners() {
  var list = getEl('venuesList');
  if (!list) return;
  // Auto-format HH:MM as user types (24-hour)
  list.querySelectorAll('.ts-time-text').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var raw = this.value.replace(/[^0-9]/g, '');
      if (raw.length >= 3) raw = raw.substring(0,2) + ':' + raw.substring(2,4);
      this.value = raw;
    });
    inp.addEventListener('blur', function() {
      var v = this.value.trim();
      // Validate HH:MM format
      if (v && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(v)) {
        this.style.borderColor = '#e53e3e';
        showToast('\u0e23\u0e39\u0e1b\u0e41\u0e1a\u0e1a\u0e40\u0e27\u0e25\u0e32\u0e15\u0e49\u0e2d\u0e07\u0e40\u0e1b\u0e47\u0e19 HH:MM (00:00 \u0e16\u0e36\u0e07 23:59)', 'error');
        return;
      }
      this.style.borderColor = '';
      var slot = ensureSlot(+this.dataset.vi, +this.dataset.day, +this.dataset.si);
      if (this.classList.contains('ts-start')) slot.startTime = v;
      else slot.endTime = v;
      renderVenues();
    });
  });
  list.querySelectorAll('.ts-remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      venues[+this.dataset.vi].schedule[+this.dataset.day].timeSlots.splice(+this.dataset.si,1); renderVenues();
    });
  });
  list.querySelectorAll('.add-mr-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var vi=+this.dataset.vi,day=+this.dataset.day,si=+this.dataset.si;
      if (bandMembersData.length===0) { alert('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2a\u0e21\u0e32\u0e0a\u0e34\u0e01\u0e43\u0e19\u0e2a\u0e48\u0e27\u0e19 "\u0e2a\u0e21\u0e32\u0e0a\u0e34\u0e01\u0e27\u0e07" \u0e01\u0e48\u0e2d\u0e19'); return; }
      ensureSlot(vi,day,si).members.push({ memberId:'', hourlyRate:0 });
      renderVenues();
    });
  });
  list.querySelectorAll('.mr-select').forEach(function(sel) {
    sel.addEventListener('change', function() {
      ensureSlot(+this.dataset.vi,+this.dataset.day,+this.dataset.si).members[+this.dataset.mi].memberId=this.value;
    });
  });
  list.querySelectorAll('.mr-rate').forEach(function(inp) {
    inp.addEventListener('input', function() {
      ensureSlot(+this.dataset.vi,+this.dataset.day,+this.dataset.si).members[+this.dataset.mi].hourlyRate=parseFloat(this.value)||0;
    });
  });
  list.querySelectorAll('.member-rate-remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      ensureSlot(+this.dataset.vi,+this.dataset.day,+this.dataset.si).members.splice(+this.dataset.mi,1); renderVenues();
    });
  });
}

function ensureSlot(vi, day, si) {
  if (!venues[vi].schedule) venues[vi].schedule = {};
  if (!venues[vi].schedule[day]) venues[vi].schedule[day] = { timeSlots: [] };
  return venues[vi].schedule[day].timeSlots[si];
}

function addVenue() {
  var vi = venues.length;
  venues.push({ id: 'venue_' + Date.now(), name: '', address: '', phone: '', schedule: {} });
  expandedVenues[vi] = true; // auto-expand new venue
  venueActiveDays[vi] = -1;
  var noEl = getEl('noVenues'); if (noEl) noEl.style.display = 'none';
  renderVenues();
  setTimeout(function() {
    var inp = document.querySelector('.vc-name[data-vi="' + vi + '"]');
    if (inp) { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }, 80);
}

/* ══════════════════════════════════════════
   BUILD scheduleData (backward compat)
   Merge all venues' schedules by day
══════════════════════════════════════════ */
function buildScheduleData() {
  var merged = {};
  venues.forEach(function(v) {
    if (!v.schedule) return;
    Object.keys(v.schedule).forEach(function(day) {
      if (!merged[day]) merged[day] = { timeSlots: [] };
      (v.schedule[day].timeSlots || []).forEach(function(slot) {
        merged[day].timeSlots.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          venueId: v.id,
          venueName: v.name,
          members: slot.members || []
        });
      });
    });
  });
  return merged;
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  var el = getEl('addMemberBtn'); if (el) el.addEventListener('click', function(e) { e.preventDefault(); addMember(); });
  var ev = getEl('addVenueBtn');  if (ev) ev.addEventListener('click', function(e) { e.preventDefault(); addVenue(); });
  var es = getEl('saveBtn');      if (es) es.addEventListener('click', function(e) { e.preventDefault(); saveBandSettings(); });
  loadBandSettings();
});

