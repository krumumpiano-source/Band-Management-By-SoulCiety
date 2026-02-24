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

var DAY_NAMES = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
var POSITIONS = ['นักร้อง','กีตาร์','เบส','กลอง','คีย์บอร์ด','เปียโน','แซกโซโฟน','ทรัมเป็ต','อื่นๆ'];

function getEl(id) { return document.getElementById(id); }
function esc(text) {
  if (!text) return '';
  var d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}
function showToast(msg) {
  var toast = getEl('toast');
  if (!toast) { alert(msg); return; }
  var m = toast.querySelector('.toast-message');
  if (m) m.textContent = msg;
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
   VENUES (with embedded schedule)
══════════════════════════════════════════ */
function renderVenues() {
  var list = getEl('venuesList');
  var noEl = getEl('noVenues');
  if (!list) return;
  if (venues.length === 0) {
    list.innerHTML = '';
    if (noEl) { noEl.style.display = 'block'; noEl.innerHTML = '<p class="empty-state-small">ยังไม่มีร้าน กดปุ่ม ➕ เพื่อเพิ่ม</p>'; }
    return;
  }
  if (noEl) noEl.style.display = 'none';
  list.innerHTML = venues.map(function(v, vi) {
    var activeDay = venueActiveDays[vi] !== undefined ? venueActiveDays[vi] : -1;
    var dayTabs = DAY_NAMES.map(function(dn, di) {
      var hasData = v.schedule && v.schedule[di] && v.schedule[di].timeSlots && v.schedule[di].timeSlots.length > 0;
      var cls = 'day-tab' + (di === activeDay ? ' active' : '') + (hasData ? ' has-data' : '');
      return '<button type="button" class="' + cls + '" data-vi="' + vi + '" data-day="' + di + '">' + dn + '</button>';
    }).join('');

    var dayPanels = DAY_NAMES.map(function(dn, di) {
      var isActive = di === activeDay;
      return '<div class="venue-day-panel' + (isActive ? ' active' : '') + '" data-vi="' + vi + '" data-day="' + di + '">' +
        renderTimeSlotsForVenueDay(v, vi, di) +
        '<button type="button" class="btn btn-secondary btn-sm add-ts-btn" data-vi="' + vi + '" data-day="' + di + '" style="margin-top:8px">➕ เพิ่มช่วงเวลา</button>' +
        '</div>';
    }).join('');

    return '<div class="venue-card" data-vi="' + vi + '">' +
      '<div class="venue-card-header">' +
        '<div class="venue-card-inputs">' +
          '<div class="form-group"><label>ชื่อร้าน</label>' +
          '<input type="text" class="vc-name" data-vi="' + vi + '" value="' + esc(v.name||'') + '" placeholder="ชื่อร้าน"></div>' +
          '<div class="form-group"><label>ที่อยู่</label>' +
          '<input type="text" class="vc-addr" data-vi="' + vi + '" value="' + esc(v.address||'') + '" placeholder="ที่อยู่"></div>' +
          '<div class="form-group"><label>เบอร์โทร</label>' +
          '<input type="tel" class="vc-phone" data-vi="' + vi + '" value="' + esc(v.phone||'') + '" placeholder="เบอร์โทร"></div>' +
        '</div>' +
        '<button type="button" class="venue-remove-btn" data-vi="' + vi + '">🗑️ ลบร้าน</button>' +
      '</div>' +
      '<div class="venue-schedule-body">' +
        '<div style="font-size:var(--text-xs);font-weight:700;color:var(--premium-gold);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">📅 เลือกวันที่เล่น:</div>' +
        '<div class="day-tabs">' + dayTabs + '</div>' +
        (activeDay >= 0 ? dayPanels : '<p class="empty-state-small">กดเลือกวันเพื่อตั้งเวลาและค่าแรง</p>') +
      '</div>' +
      '</div>';
  }).join('');

  // Attach listeners
  list.querySelectorAll('.vc-name').forEach(function(inp) {
    inp.addEventListener('input', function() { venues[+this.dataset.vi].name = this.value; });
  });
  list.querySelectorAll('.vc-addr').forEach(function(inp) {
    inp.addEventListener('input', function() { venues[+this.dataset.vi].address = this.value; });
  });
  list.querySelectorAll('.vc-phone').forEach(function(inp) {
    inp.addEventListener('input', function() { venues[+this.dataset.vi].phone = this.value; });
  });
  list.querySelectorAll('.venue-remove-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (confirm('ลบร้านนี้หรือไม่?')) { venues.splice(+this.dataset.vi, 1); delete venueActiveDays[+this.dataset.vi]; renderVenues(); }
    });
  });
  list.querySelectorAll('.day-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var vi = +this.dataset.vi;
      var day = +this.dataset.day;
      if (venueActiveDays[vi] === day) {
        // toggle off
        delete venueActiveDays[vi];
      } else {
        venueActiveDays[vi] = day;
      }
      renderVenues();
    });
  });
  list.querySelectorAll('.add-ts-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var vi = +this.dataset.vi; var day = +this.dataset.day;
      if (!venues[vi].schedule) venues[vi].schedule = {};
      if (!venues[vi].schedule[day]) venues[vi].schedule[day] = { timeSlots: [] };
      venues[vi].schedule[day].timeSlots.push({ startTime: '', endTime: '', members: [] });
      renderVenues();
    });
  });
  attachTimeSlotListeners();
}

function renderTimeSlotsForVenueDay(v, vi, day) {
  var schedule = v.schedule || {};
  var dayData = schedule[day] || { timeSlots: [] };
  var slots = dayData.timeSlots || [];
  if (slots.length === 0) return '<p class="empty-state-small">ยังไม่มีช่วงเวลา กด ➕ เพิ่มช่วงเวลา</p>';
  return slots.map(function(slot, si) {
    var label = (slot.startTime || '--:--') + ' - ' + (slot.endTime || '--:--');
    var membersHtml = (slot.members || []).map(function(mr, mi) {
      return '<div class="member-rate-row">' +
        '<select class="mr-select" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" data-mi="' + mi + '">' +
          '<option value="">เลือกสมาชิก</option>' +
          bandMembersData.map(function(m) {
            return '<option value="' + esc(m.id||'') + '"' + (mr.memberId === m.id ? ' selected' : '') + '>' + esc(m.name||'(ไม่มีชื่อ)') + (m.position?' ('+esc(m.position)+')':'') + '</option>';
          }).join('') +
        '</select>' +
        '<input type="number" class="mr-rate" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" data-mi="' + mi + '" value="' + (mr.hourlyRate||'') + '" placeholder="0" min="0">' +
        '<span class="rate-unit">บาท/ชม.</span>' +
        '<button type="button" class="member-rate-remove" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" data-mi="' + mi + '">🗑️</button>' +
        '</div>';
    }).join('');
    return '<div class="time-slot-item">' +
      '<div class="ts-header">' +
        '<span class="ts-time-label">⏰ ' + label + '</span>' +
        '<button type="button" class="btn-icon-small ts-remove" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '">🗑️ ลบช่วง</button>' +
      '</div>' +
      '<div class="ts-inputs">' +
        '<div class="form-group"><label>เวลาเริ่ม</label><input type="time" class="ts-start" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" value="' + (slot.startTime||'') + '"></div>' +
        '<div class="form-group"><label>เวลาสิ้นสุด</label><input type="time" class="ts-end" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" value="' + (slot.endTime||'') + '"></div>' +
      '</div>' +
      '<div class="ts-members"><label style="font-size:var(--text-xs);font-weight:700;color:var(--premium-text);margin-bottom:6px;display:block">สมาชิกและค่าแรง:</label>' +
        (membersHtml || '<p class="empty-state-small">ยังไม่มีสมาชิก</p>') +
        '<button type="button" class="btn btn-sm btn-primary add-mr-btn" data-vi="' + vi + '" data-day="' + day + '" data-si="' + si + '" style="margin-top:6px">➕ เพิ่มสมาชิก</button>' +
      '</div>' +
      '</div>';
  }).join('');
}

function attachTimeSlotListeners() {
  var list = getEl('venuesList');
  if (!list) return;
  list.querySelectorAll('.ts-start').forEach(function(inp) {
    inp.addEventListener('change', function() {
      ensureSlot(+this.dataset.vi, +this.dataset.day, +this.dataset.si).startTime = this.value;
      renderVenues();
    });
  });
  list.querySelectorAll('.ts-end').forEach(function(inp) {
    inp.addEventListener('change', function() {
      ensureSlot(+this.dataset.vi, +this.dataset.day, +this.dataset.si).endTime = this.value;
      renderVenues();
    });
  });
  list.querySelectorAll('.ts-remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var vi=+this.dataset.vi, day=+this.dataset.day, si=+this.dataset.si;
      venues[vi].schedule[day].timeSlots.splice(si, 1);
      renderVenues();
    });
  });
  list.querySelectorAll('.add-mr-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var vi=+this.dataset.vi, day=+this.dataset.day, si=+this.dataset.si;
      if (bandMembersData.length === 0) { alert('กรุณาเพิ่มสมาชิกก่อน'); return; }
      ensureSlot(vi, day, si).members.push({ memberId: bandMembersData[0].id||'', hourlyRate: 0 });
      renderVenues();
    });
  });
  list.querySelectorAll('.mr-select').forEach(function(sel) {
    sel.addEventListener('change', function() {
      ensureSlot(+this.dataset.vi, +this.dataset.day, +this.dataset.si).members[+this.dataset.mi].memberId = this.value;
    });
  });
  list.querySelectorAll('.mr-rate').forEach(function(inp) {
    inp.addEventListener('input', function() {
      ensureSlot(+this.dataset.vi, +this.dataset.day, +this.dataset.si).members[+this.dataset.mi].hourlyRate = parseFloat(this.value)||0;
    });
  });
  list.querySelectorAll('.member-rate-remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var vi=+this.dataset.vi, day=+this.dataset.day, si=+this.dataset.si, mi=+this.dataset.mi;
      ensureSlot(vi, day, si).members.splice(mi, 1);
      renderVenues();
    });
  });
}

function ensureSlot(vi, day, si) {
  if (!venues[vi].schedule) venues[vi].schedule = {};
  if (!venues[vi].schedule[day]) venues[vi].schedule[day] = { timeSlots: [] };
  return venues[vi].schedule[day].timeSlots[si];
}

function addVenue() {
  venues.push({ id: 'venue_' + Date.now(), name: '', address: '', phone: '', schedule: {} });
  venueActiveDays[venues.length - 1] = -1;
  var noEl = getEl('noVenues'); if (noEl) noEl.style.display = 'none';
  renderVenues();
  setTimeout(function() {
    var last = document.querySelector('.vc-name[data-vi="' + (venues.length-1) + '"]');
    if (last) { last.focus(); last.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
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
   SAVE
══════════════════════════════════════════ */
function saveBandSettings() {
  var bName = (getEl('bandName') && getEl('bandName').value) || bandNameVal;
  var bMgr  = (getEl('bandManager') && getEl('bandManager').value) || currentBandManager;
  var validMembers = bandMembersData.filter(function(m) { return m.name && m.name.trim(); });
  var validVenues  = venues.filter(function(v) { return v.name && v.name.trim(); });

  if (!bName || !bName.trim()) { alert('กรุณากรอกชื่อวง'); return; }
  if (validVenues.length === 0) { alert('กรุณาเพิ่มร้านอย่างน้อย 1 ร้านที่มีชื่อ'); return; }

  var scheduleData = buildScheduleData();

  // Also build hourlyRates for backend compat
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

  var data = {
    bandId: currentBandId || ('BAND_' + Date.now()),
    bandName: bName.trim(),
    bandManager: bMgr,
    venues: validVenues,
    members: validMembers,
    hourlyRates: hourlyRates,
    scheduleData: scheduleData,
    inviteCode: currentInviteCode,
    inviteExpires: currentInviteExpires,
    updatedAt: new Date().toISOString()
  };

  var saveBtn = getEl('saveBtn');
  var orig = saveBtn ? saveBtn.textContent : '';
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'กำลังบันทึก...'; }

  function onSuccess() {
    currentBandId = data.bandId;
    localStorage.setItem('bandSettings', JSON.stringify(data));
    localStorage.setItem('bandId', data.bandId);
    localStorage.setItem('bandName', data.bandName);
    localStorage.setItem('bandManager', data.bandManager);
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = orig; }
    showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว ✅');
  }
  function onFail(msg) {
    alert(msg || 'ไม่สามารถบันทึกได้');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = orig; }
  }

  if (typeof gasRun === 'function') {
    gasRun('saveBandSettings', data, function(r) {
      if (r && r.success) onSuccess(); else onFail(r && r.message);
    });
  } else {
    onSuccess();
  }
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

function escapeHtml(text) {
  if (!text) return '';
  var d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function showToast(message) {
  var toast = getEl('toast');
  if (toast) {
    var msgEl = toast.querySelector('.toast-message');
    if (msgEl) msgEl.textContent = message;
    toast.style.display = 'block';
    toast.classList.add('show');
    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.style.display = 'none'; }, 300);
    }, 3000);
  } else {
    alert(message);
  }
}

/**
 * โหลดข้อมูลวง
 */
function loadBandSettings() {
  currentBandId = localStorage.getItem('bandId') || sessionStorage.getItem('bandId');
  bandNameVal = localStorage.getItem('bandName') || sessionStorage.getItem('bandName') || '';
  currentBandManager = localStorage.getItem('bandManager') || localStorage.getItem('userName') || '';

  // Try loading from localStorage first for speed
  var stored = localStorage.getItem('bandSettings');
  if (stored) {
    try {
      var settings = JSON.parse(stored);
      if (settings.bandName) bandNameVal = settings.bandName;
      venues = settings.venues || [];
      bandMembersData = settings.members || [];
      if (settings.scheduleData) {
        scheduleDataMap = settings.scheduleData;
      } else if (settings.hourlyRates) {
        convertRatesToSchedule(settings.hourlyRates);
      }
    } catch(e) { console.warn('localStorage parse error', e); }
  }

  // Then fetch from API for fresh data
  if (currentBandId && typeof gasRun === 'function') {
    gasRun('getBandSettings', { bandId: currentBandId }, function(result) {
      if (result && result.success && result.data) {
        var d = result.data;
        if (d.bandName) bandNameVal = d.bandName;
        if (d.venues) venues = d.venues;
        if (d.members) bandMembersData = d.members;
        if (d.scheduleData) {
          scheduleDataMap = d.scheduleData;
        } else if (d.hourlyRates) {
          convertRatesToSchedule(d.hourlyRates);
        }
      }
      updateBandInfo();
      renderMembers();
      renderVenues();
      renderDaySelection();
      if (selectedDay === null) selectDay(0);
      checkStepCompletion();
    });
  } else {
    updateBandInfo();
    renderMembers();
    renderVenues();
    renderDaySelection();
    if (selectedDay === null) selectDay(0);
    checkStepCompletion();
  }
}

function convertRatesToSchedule(hourlyRates) {
  scheduleDataMap = {};
  (hourlyRates || []).forEach(function(rate) {
    var key = rate.dayOfWeek !== undefined ? rate.dayOfWeek : 'default';
    if (!scheduleDataMap[key]) scheduleDataMap[key] = { timeSlots: [] };
    var ts = scheduleDataMap[key].timeSlots.find(function(t) {
      return t.startTime === rate.startTime && t.endTime === rate.endTime;
    });
    if (!ts) {
      ts = { startTime: rate.startTime, endTime: rate.endTime, members: [] };
      scheduleDataMap[key].timeSlots.push(ts);
    }
    ts.members.push({ memberId: rate.memberId, hourlyRate: rate.hourlyRate });
  });
}

function updateBandInfo() {
  var el = getEl('bandName');
  var mgr = getEl('bandManager');
  if (el) el.value = bandNameVal || '';
  if (mgr) mgr.value = currentBandManager || '';
}

function checkStepCompletion() {
  var saveBtn = getEl('saveBtn');
  if (saveBtn) saveBtn.style.display = 'inline-flex';
}

/* ===== MEMBERS ===== */
function renderMembers() {
  var list = getEl('membersList');
  var noEl = getEl('noMembers');
  if (!list) return;
  if (bandMembersData.length === 0) {
    list.innerHTML = '';
    if (noEl) { noEl.style.display = 'block'; noEl.innerHTML = '<p>ยังไม่มีสมาชิก กดปุ่ม ➕ เพื่อเพิ่ม</p>'; }
    return;
  }
  if (noEl) noEl.style.display = 'none';
  var positions = ['นักร้อง', 'กีตาร์', 'เบส', 'กลอง', 'คีย์บอร์ด', 'เปียโน', 'แซกโซโฟน', 'ทรัมเป็ต', 'อื่นๆ'];
  list.innerHTML = bandMembersData.map(function(member, i) {
    return '<div class="member-item" data-member-index="' + i + '">' +
      '<div class="form-group"><label>ชื่อสมาชิก</label>' +
      '<input type="text" class="member-name-input" data-member-index="' + i + '" value="' + escapeHtml(member.name || '') + '" placeholder="ชื่อสมาชิก" required></div>' +
      '<div class="form-group"><label>ตำแหน่ง</label>' +
      '<select class="member-position-select" data-member-index="' + i + '">' +
        '<option value="">เลือกตำแหน่ง</option>' +
        positions.map(function(p) { return '<option value="' + p + '"' + (member.position === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') +
      '</select></div>' +
      '<button type="button" class="member-remove" data-member-index="' + i + '" title="ลบ">🗑️</button>' +
      '</div>';
  }).join('');
  document.querySelectorAll('.member-name-input').forEach(function(input) {
    input.addEventListener('input', function() {
      var idx = parseInt(this.getAttribute('data-member-index'));
      if (bandMembersData[idx]) bandMembersData[idx].name = this.value;
      checkStepCompletion();
    });
  });
  document.querySelectorAll('.member-position-select').forEach(function(sel) {
    sel.addEventListener('change', function() {
      var idx = parseInt(this.getAttribute('data-member-index'));
      if (bandMembersData[idx]) bandMembersData[idx].position = this.value;
    });
  });
  document.querySelectorAll('.member-remove').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      if (confirm('ต้องการลบสมาชิกคนนี้หรือไม่?')) {
        removeMember(parseInt(this.getAttribute('data-member-index')));
      }
    });
  });
  checkStepCompletion();
}

function addMember() {
  var noEl = getEl('noMembers');
  bandMembersData.push({ id: 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2,5), name: '', position: '' });
  if (noEl) noEl.style.display = 'none';
  renderMembers();
  checkStepCompletion();
  setTimeout(function() {
    var last = document.querySelector('.member-name-input[data-member-index="' + (bandMembersData.length - 1) + '"]');
    if (last) last.focus();
  }, 100);
}

function removeMember(index) {
  if (index >= 0 && index < bandMembersData.length) {
    bandMembersData.splice(index, 1);
    renderMembers();
    checkStepCompletion();
  }
}

/* ===== VENUES ===== */
function renderVenues() {
  var list = getEl('venuesList');
  var noEl = getEl('noVenues');
  if (!list) return;
  if (venues.length === 0) {
    list.innerHTML = '';
    if (noEl) { noEl.style.display = 'block'; noEl.innerHTML = '<p>ยังไม่มีร้าน กดปุ่ม ➕ เพื่อเพิ่ม</p>'; }
    return;
  }
  if (noEl) noEl.style.display = 'none';
  list.innerHTML = venues.map(function(venue, i) {
    return '<div class="venue-item" data-venue-index="' + i + '">' +
      '<div class="form-group"><label>ชื่อร้าน</label>' +
      '<input type="text" class="venue-name-input" data-venue-index="' + i + '" value="' + escapeHtml(venue.name || '') + '" placeholder="ชื่อร้าน" required></div>' +
      '<div class="form-group"><label>ที่อยู่</label>' +
      '<input type="text" class="venue-address-input" data-venue-index="' + i + '" value="' + escapeHtml(venue.address || '') + '" placeholder="ที่อยู่"></div>' +
      '<div class="form-group"><label>เบอร์โทร</label>' +
      '<input type="tel" class="venue-phone-input" data-venue-index="' + i + '" value="' + escapeHtml(venue.phone || '') + '" placeholder="เบอร์โทร"></div>' +
      '<button type="button" class="venue-remove" data-venue-index="' + i + '" title="ลบ">🗑️</button>' +
      '</div>';
  }).join('');
  document.querySelectorAll('.venue-name-input').forEach(function(i) {
    i.addEventListener('input', function() { venues[parseInt(this.getAttribute('data-venue-index'))].name = this.value; checkStepCompletion(); });
  });
  document.querySelectorAll('.venue-address-input').forEach(function(i) {
    i.addEventListener('input', function() { venues[parseInt(this.getAttribute('data-venue-index'))].address = this.value; });
  });
  document.querySelectorAll('.venue-phone-input').forEach(function(i) {
    i.addEventListener('input', function() { venues[parseInt(this.getAttribute('data-venue-index'))].phone = this.value; });
  });
  document.querySelectorAll('.venue-remove').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      if (confirm('ต้องการลบร้านนี้หรือไม่?')) removeVenue(parseInt(this.getAttribute('data-venue-index')));
    });
  });
  checkStepCompletion();
}

function addVenue() {
  var noEl = getEl('noVenues');
  venues.push({ id: 'venue_' + Date.now(), name: '', address: '', phone: '' });
  if (noEl) noEl.style.display = 'none';
  renderVenues();
  setTimeout(function() {
    var last = document.querySelector('.venue-name-input[data-venue-index="' + (venues.length - 1) + '"]');
    if (last) last.focus();
  }, 100);
}

function removeVenue(index) {
  if (index >= 0 && index < venues.length) {
    venues.splice(index, 1);
    renderVenues();
    checkStepCompletion();
  }
}

/* ===== SCHEDULE / DAY SELECTOR ===== */
function renderDaySelection() {
  var dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  var dayButtons = document.querySelectorAll('.day-btn');
  dayButtons.forEach(function(btn) {
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      selectDay(parseInt(this.getAttribute('data-day')));
    });
    var day = parseInt(newBtn.getAttribute('data-day'));
    if (scheduleDataMap[day] && scheduleDataMap[day].timeSlots && scheduleDataMap[day].timeSlots.length > 0) {
      newBtn.classList.add('has-data');
    }
  });
  if (selectedDay === null) selectDay(0);
  else selectDay(selectedDay);
}

function selectDay(day) {
  selectedDay = day;
  var dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  document.querySelectorAll('.day-btn').forEach(function(btn) {
    btn.classList.remove('active');
    if (parseInt(btn.getAttribute('data-day')) === day) btn.classList.add('active');
  });
  var sel = getEl('selectedDaySchedule');
  var title = getEl('selectedDayTitle');
  var addBtn = getEl('addTimeSlotBtn');
  if (sel) sel.style.display = 'block';
  if (title) title.textContent = '📅 วัน' + dayNames[day];
  if (addBtn) addBtn.style.display = 'inline-flex';
  renderTimeSlotsForDay(day);
}

function renderTimeSlotsForDay(day) {
  var container = getEl('timeSlotsContainer');
  if (!container) return;
  if (!scheduleDataMap[day]) scheduleDataMap[day] = { timeSlots: [] };
  var addBtn = getEl('addTimeSlotBtn');
  if (addBtn) addBtn.style.display = 'inline-flex';
  var timeSlots = scheduleDataMap[day].timeSlots || [];
  if (timeSlots.length === 0) {
    container.innerHTML = '<p class="empty-state-small">ยังไม่มีช่วงเวลา กดปุ่ม "➕ เพิ่มช่วงเวลา" เพื่อเพิ่ม</p>';
    return;
  }
  container.innerHTML = timeSlots.map(function(slot, si) {
    var membersHtml = (slot.members || []).map(function(mr, mi) {
      return '<div class="member-rate-item">' +
        '<select class="member-select" data-day="' + day + '" data-slot-index="' + si + '" data-member-index="' + mi + '">' +
          '<option value="">เลือกสมาชิก</option>' +
          bandMembersData.map(function(m) {
            return '<option value="' + m.id + '"' + (mr.memberId === m.id ? ' selected' : '') + '>' + escapeHtml(m.name || '') + (m.position ? ' (' + escapeHtml(m.position) + ')' : '') + '</option>';
          }).join('') +
        '</select>' +
        '<input type="number" class="rate-input" data-day="' + day + '" data-slot-index="' + si + '" data-member-index="' + mi + '" value="' + (mr.hourlyRate || '') + '" placeholder="บาท/ชม." min="0">' +
        '<button type="button" class="member-rate-remove" data-day="' + day + '" data-slot-index="' + si + '" data-member-index="' + mi + '">🗑️</button>' +
        '</div>';
    }).join('');
    return '<div class="time-slot-item" data-day="' + day + '" data-slot-index="' + si + '">' +
      '<div class="time-slot-header">' +
        '<div class="time-slot-time">' + (slot.startTime || '--:--') + ' - ' + (slot.endTime || '--:--') + '</div>' +
        '<button type="button" class="btn-icon-small time-slot-remove" data-day="' + day + '" data-slot-index="' + si + '">🗑️ ลบช่วงเวลา</button>' +
      '</div>' +
      '<div class="form-group"><label>เวลาเริ่ม</label><input type="time" class="time-slot-start" data-day="' + day + '" data-slot-index="' + si + '" value="' + (slot.startTime || '') + '"></div>' +
      '<div class="form-group"><label>เวลาสิ้นสุด</label><input type="time" class="time-slot-end" data-day="' + day + '" data-slot-index="' + si + '" value="' + (slot.endTime || '') + '"></div>' +
      '<div class="time-slot-members"><label>สมาชิกและค่าแรง:</label>' +
        (membersHtml || '<p class="empty-state-small">ยังไม่มีสมาชิก กดปุ่มด้านล่าง</p>') +
        '<button type="button" class="btn btn-sm btn-primary add-member-to-slot" data-day="' + day + '" data-slot-index="' + si + '" style="margin-top:8px;">➕ เพิ่มสมาชิก</button>' +
      '</div>' +
      '</div>';
  }).join('');
  attachTimeSlotListeners(day);
}

function attachTimeSlotListeners(day) {
  document.querySelectorAll('.time-slot-start[data-day="' + day + '"]').forEach(function(input) {
    input.addEventListener('change', function() {
      var si = parseInt(this.getAttribute('data-slot-index'));
      scheduleDataMap[day].timeSlots[si].startTime = this.value;
      renderTimeSlotsForDay(day);
    });
  });
  document.querySelectorAll('.time-slot-end[data-day="' + day + '"]').forEach(function(input) {
    input.addEventListener('change', function() {
      var si = parseInt(this.getAttribute('data-slot-index'));
      scheduleDataMap[day].timeSlots[si].endTime = this.value;
      renderTimeSlotsForDay(day);
    });
  });
  document.querySelectorAll('.time-slot-remove[data-day="' + day + '"]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      var si = parseInt(this.getAttribute('data-slot-index'));
      scheduleDataMap[day].timeSlots.splice(si, 1);
      renderTimeSlotsForDay(day);
    });
  });
  document.querySelectorAll('.add-member-to-slot[data-day="' + day + '"]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      var si = parseInt(this.getAttribute('data-slot-index'));
      if (bandMembersData.length === 0) { alert('กรุณาเพิ่มสมาชิกก่อน'); return; }
      if (!scheduleDataMap[day].timeSlots[si].members) scheduleDataMap[day].timeSlots[si].members = [];
      scheduleDataMap[day].timeSlots[si].members.push({ memberId: bandMembersData[0].id || '', hourlyRate: 0 });
      renderTimeSlotsForDay(day);
    });
  });
  document.querySelectorAll('.member-select[data-day="' + day + '"]').forEach(function(sel) {
    sel.addEventListener('change', function() {
      var si = parseInt(this.getAttribute('data-slot-index'));
      var mi = parseInt(this.getAttribute('data-member-index'));
      scheduleDataMap[day].timeSlots[si].members[mi].memberId = this.value;
    });
  });
  document.querySelectorAll('.rate-input[data-day="' + day + '"]').forEach(function(input) {
    input.addEventListener('input', function() {
      var si = parseInt(this.getAttribute('data-slot-index'));
      var mi = parseInt(this.getAttribute('data-member-index'));
      scheduleDataMap[day].timeSlots[si].members[mi].hourlyRate = parseFloat(this.value) || 0;
    });
  });
  document.querySelectorAll('.member-rate-remove[data-day="' + day + '"]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      var si = parseInt(this.getAttribute('data-slot-index'));
      var mi = parseInt(this.getAttribute('data-member-index'));
      scheduleDataMap[day].timeSlots[si].members.splice(mi, 1);
      renderTimeSlotsForDay(day);
    });
  });
}

function addTimeSlot() {
  if (selectedDay === null) { alert('กรุณาเลือกวันก่อน'); return; }
  if (!scheduleDataMap[selectedDay]) scheduleDataMap[selectedDay] = { timeSlots: [] };
  scheduleDataMap[selectedDay].timeSlots.push({ startTime: '', endTime: '', members: [] });
  renderTimeSlotsForDay(selectedDay);
  setTimeout(function() {
    var lastIdx = scheduleDataMap[selectedDay].timeSlots.length - 1;
    var input = document.querySelector('.time-slot-start[data-day="' + selectedDay + '"][data-slot-index="' + lastIdx + '"]');
    if (input) input.focus();
  }, 100);
}

/* ===== SAVE ===== */
function saveBandSettings() {
  var validMembers = bandMembersData.filter(function(m) { return m.name && m.name.trim(); });
  var validVenues = venues.filter(function(v) { return v.name && v.name.trim(); });
  if (validMembers.length === 0) { alert('กรุณาเพิ่มสมาชิกอย่างน้อย 1 คนที่มีชื่อ'); return; }
  if (validVenues.length === 0) { alert('กรุณาเพิ่มร้านอย่างน้อย 1 ร้านที่มีชื่อ'); return; }

  // Read current input values
  var bName = getEl('bandName')?.value || bandNameVal;
  var bManager = getEl('bandManager')?.value || currentBandManager;

  var hourlyRates = [];
  Object.keys(scheduleDataMap).forEach(function(day) {
    var dayData = scheduleDataMap[day];
    if (dayData.timeSlots) {
      dayData.timeSlots.forEach(function(slot) {
        (slot.members || []).forEach(function(mr) {
          if (mr.memberId && mr.hourlyRate > 0) {
            hourlyRates.push({ dayOfWeek: parseInt(day), startTime: slot.startTime, endTime: slot.endTime, memberId: mr.memberId, hourlyRate: mr.hourlyRate });
          }
        });
      });
    }
  });

  var data = {
    bandId: currentBandId || ('BAND_' + Date.now()),
    bandName: bName,
    bandManager: bManager,
    venues: validVenues,
    members: validMembers,
    hourlyRates: hourlyRates,
    scheduleData: scheduleDataMap,
    updatedAt: new Date().toISOString()
  };

  var saveBtn = getEl('saveBtn');
  var origText = saveBtn ? saveBtn.textContent : '';
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'กำลังบันทึก...'; }

  function onSuccess() {
    localStorage.setItem('bandSettings', JSON.stringify(data));
    localStorage.setItem('bandId', data.bandId);
    localStorage.setItem('bandName', data.bandName);
    localStorage.setItem('bandManager', data.bandManager);
    showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = origText; }
  }
  function onFail(msg) {
    alert(msg || 'ไม่สามารถบันทึกได้');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = origText; }
  }

  if (typeof gasRun === 'function') {
    gasRun('saveBandSettings', data, function(result) {
      if (result && result.success) onSuccess();
      else onFail(result && result.message);
    });
  } else {
    onSuccess();
  }
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', function() {
  var addMemberBtn = getEl('addMemberBtn');
  if (addMemberBtn) addMemberBtn.addEventListener('click', function(e) { e.preventDefault(); addMember(); });
  var addVenueBtn = getEl('addVenueBtn');
  if (addVenueBtn) addVenueBtn.addEventListener('click', function(e) { e.preventDefault(); addVenue(); });
  var addTimeSlotBtn = getEl('addTimeSlotBtn');
  if (addTimeSlotBtn) addTimeSlotBtn.addEventListener('click', function(e) { e.preventDefault(); addTimeSlot(); });
  var saveBtn = getEl('saveBtn');
  if (saveBtn) saveBtn.addEventListener('click', function(e) { e.preventDefault(); saveBandSettings(); });
  loadBandSettings();
});
