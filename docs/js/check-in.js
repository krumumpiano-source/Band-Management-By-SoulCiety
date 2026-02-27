/**
 * Member Self Check-In Page JavaScript
 * สมาชิกลงเวลาทำงานของตนเอง
 * Band Management By SoulCiety
 */

var ciCurrentBandId = null;
var ciMemberName = '';
var ciUserRole = '';
var ciBandSettings = { scheduleData: {}, venues: [] };
var ciSelectedVenue = '';
var ciSelectedDate = '';
var ciExistingCheckIn = null;
var ciIsSubstitute = false;

function ciGetEl(id) { return document.getElementById(id); }

function ciEscHtml(text) {
  if (!text) return '';
  var d = document.createElement('div'); d.textContent = text; return d.innerHTML;
}

function ciShowToast(message, type) {
  var toast = ciGetEl('toast');
  if (!toast) { alert(message); return; }
  var m = toast.querySelector('.toast-message') || toast;
  m.textContent = message;
  toast.style.background = type === 'error' ? '#c53030' : (type === 'success' ? '#276749' : 'var(--premium-gold)');
  toast.style.display = 'block'; toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.style.display = 'none'; }, 300);
  }, 3500);
}

function ciSetStatus(msg, cls) {
  var el = ciGetEl('ciStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'ci-status ci-status--' + (cls || 'info');
  el.style.display = msg ? 'block' : 'none';
}

/* ===== LOAD SETTINGS ===== */
function ciLoadSettings(callback) {
  var stored = localStorage.getItem('bandSettings');
  if (stored) {
    try {
      var s = JSON.parse(stored);
      ciBandSettings = { scheduleData: s.scheduleData || s.schedule || {}, venues: s.venues || [] };
    } catch(e) {}
  }

  // Always try fetching from API for fresh data if possible
  if (ciCurrentBandId && typeof gasRun === 'function') {
    gasRun('getBandSettings', { bandId: ciCurrentBandId }, function(r) {
      if (r && r.success && r.data) {
        ciBandSettings = {
          scheduleData: r.data.scheduleData || r.data.schedule || {},
          venues: r.data.venues || []
        };
        try { localStorage.setItem('bandSettings', JSON.stringify(r.data)); } catch(e) {}
      }
      callback();
    });
  } else {
    callback();
  }
}

/* ===== RENDER VENUES ===== */
function ciRenderVenues() {
  var sel = ciGetEl('ciVenue');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- เลือกสถานที่ --</option>';
  var venues = ciBandSettings.venues || [];
  venues.forEach(function(v) {
    var name = v.name || v.venueName || String(v);
    var opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    if (name === ciSelectedVenue) opt.selected = true;
    sel.appendChild(opt);
  });
  if (!venues.length) {
    var opt = document.createElement('option');
    opt.value = 'ร้านหลัก'; opt.textContent = 'ร้านหลัก (ค่าเริ่มต้น)';
    sel.appendChild(opt);
  }
}

/* ===== GET TIME SLOTS FOR DATE ===== */
function ciGetSlotsForDate(dateStr) {
  var date = new Date(dateStr);
  var dow = date.getDay(); // 0=Sunday ... 6=Saturday
  var dayData = ciBandSettings.scheduleData[dow] || ciBandSettings.scheduleData[String(dow)];
  var slots = [];

  // New format: array of slot objects [{id, venueId, startTime, endTime, members}]
  if (Array.isArray(dayData) && dayData.length > 0) {
    slots = dayData;
  }
  // Old format: {timeSlots: [{startTime, endTime}]}
  else if (dayData && dayData.timeSlots && dayData.timeSlots.length > 0) {
    slots = dayData.timeSlots;
  }

  // Filter by selected venue if slots have venueId
  if (ciSelectedVenue && slots.length && slots[0] && slots[0].venueId !== undefined) {
    var venueId = ciGetVenueId(ciSelectedVenue);
    if (venueId) {
      var filtered = slots.filter(function(s) { return s.venueId === venueId; });
      if (filtered.length) slots = filtered;
    }
  }

  return slots.map(function(s) {
    var st = s.startTime || '', et = s.endTime || '';
    return { key: st + '-' + et, startTime: st, endTime: et, label: st + ' – ' + et };
  });
}

/* Lookup venue ID from venue name */
function ciGetVenueId(name) {
  var venues = ciBandSettings.venues || [];
  for (var i = 0; i < venues.length; i++) {
    var v = venues[i];
    var vName = v.name || v.venueName || String(v);
    if (vName === name) return v.id || v.venueId || '';
  }
  return '';
}

/* ===== RENDER SLOTS ===== */
function ciRenderSlots() {
  var container = ciGetEl('ciSlotsContainer');
  var noSlotsMsg = ciGetEl('ciNoSlots');
  if (!container) return;

  var date = ciGetEl('ciDate') ? ciGetEl('ciDate').value : ciSelectedDate;
  if (!date) { container.innerHTML = ''; if (noSlotsMsg) noSlotsMsg.style.display = 'block'; return; }
  ciSelectedDate = date;

  var slots = ciGetSlotsForDate(date);
  var existingSlots = (ciExistingCheckIn && ciExistingCheckIn.slots) ? ciExistingCheckIn.slots : [];

  if (noSlotsMsg) noSlotsMsg.style.display = 'none';

  var dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  var dow = new Date(date).getDay();
  var dayLabel = ciGetEl('ciDayLabel');
  if (dayLabel) dayLabel.textContent = dayNames[dow];

  container.innerHTML = slots.map(function(slot) {
    var checked = existingSlots.indexOf(slot.key) !== -1 ? ' checked' : '';
    return '<label class="ci-slot-label' + (checked ? ' checked' : '') + '">' +
      '<input type="checkbox" name="ciSlot" value="' + ciEscHtml(slot.key) + '"' + checked + '>' +
      '<span class="ci-slot-time">🕐 ' + ciEscHtml(slot.label) + '</span>' +
      '</label>';
  }).join('');

  // Visual toggle on check
  container.querySelectorAll('input[name="ciSlot"]').forEach(function(cb) {
    cb.addEventListener('change', function() {
      cb.closest('label').classList.toggle('checked', cb.checked);
    });
  });
}

/* ===== LOAD EXISTING CHECK-IN ===== */
function ciLoadExistingCheckIn() {
  var date = ciSelectedDate;
  var venue = ciSelectedVenue;
  if (!date) return;
  ciExistingCheckIn = null;
  ciSetStatus('', '');

  if (typeof gasRun !== 'function') { ciRenderSlots(); return; }
  gasRun('getMyCheckIn', { date: date, venue: venue, bandId: ciCurrentBandId }, function(r) {
    if (r && r.success && r.checkIn) {
      ciExistingCheckIn = r.checkIn;
      var statusEl = ciGetEl('ciStatus');
      ciSetStatus('✅ คุณลงเวลาวันนี้แล้ว (สถานะ: ' + (r.checkIn.status === 'confirmed' ? 'ได้รับการยืนยัน' : 'รอการยืนยันจากผู้จัดการ') + ')', 'success');
    }
    ciRenderSlots();
  });
}

/* ===== SUBMIT CHECK-IN ===== */
function ciSubmit() {
  var date = ciGetEl('ciDate') ? ciGetEl('ciDate').value : '';
  var venue = ciGetEl('ciVenue') ? ciGetEl('ciVenue').value : '';
  var notes = ciGetEl('ciNotes') ? ciGetEl('ciNotes').value : '';
  var checkedSlots = Array.from(document.querySelectorAll('input[name="ciSlot"]:checked')).map(function(cb) { return cb.value; });

  if (!date) { ciShowToast('กรุณาเลือกวันที่', 'error'); return; }
  if (!venue) { ciShowToast('กรุณาเลือกสถานที่', 'error'); return; }
  if (!checkedSlots.length) { ciShowToast('กรุณาเลือกช่วงเวลาที่ทำงานอย่างน้อย 1 ช่วง', 'error'); return; }

  // Substitute validation
  var subToggle = ciGetEl('ciSubToggle');
  var isSubstitute = subToggle && subToggle.checked;
  var subName = '';
  var subContact = '';
  if (isSubstitute) {
    subName = (ciGetEl('ciSubName') ? ciGetEl('ciSubName').value : '').trim();
    subContact = (ciGetEl('ciSubContact') ? ciGetEl('ciSubContact').value : '').trim();
    if (!subName) { ciShowToast('กรุณาระบุชื่อคนแทน', 'error'); return; }
  }

  var submitBtn = ciGetEl('ciSubmitBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ กำลังบันทึก...'; }

  var payload = {
    bandId: ciCurrentBandId,
    date: date,
    venue: venue,
    slots: checkedSlots,
    notes: notes
  };
  // Add substitute info
  if (isSubstitute && subName) {
    payload.isSubstitute = true;
    payload.substituteName = subName;
    payload.substituteContact = subContact;
    payload.notes = (notes ? notes + ' | ' : '') + 'คนแทน: ' + subName + (subContact ? ' (' + subContact + ')' : '');
  }

  gasRun('memberCheckIn', payload, function(r) {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '✅ บันทึกเวลาเข้างาน'; }
    if (r && r.success) {
      var msg = isSubstitute ? 'ลงเวลาแทน ' + subName + ' เรียบร้อยแล้ว' : (r.message || 'ลงเวลาเรียบร้อยแล้ว');
      ciShowToast(msg, 'success');
      ciSetStatus('✅ ' + msg + ' — รอผู้จัดการยืนยัน', 'success');
      ciExistingCheckIn = { slots: checkedSlots, status: 'pending' };
    } else {
      ciShowToast((r && r.message) || 'เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    }
  });
}

/* ===== INIT ===== */

/* ===== SIMPLE LEAVE (inline form) ===== */
function ciSubmitLeaveSimple() {
  var subName = (ciGetEl('ciLeaveSubNameSimple') ? ciGetEl('ciLeaveSubNameSimple').value : '').trim();
  if (!subName) { ciShowToast('กรุณากรอกชื่อคนมาทำงานแทน', 'error'); return; }

  var date = ciSelectedDate || '';
  var venue = ciSelectedVenue || '';
  var checkedSlots = Array.from(document.querySelectorAll('input[name="ciSlot"]:checked')).map(function(cb) { return cb.value; });

  var btn = ciGetEl('ciLeaveSubmitSimple');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ กำลังบันทึก...'; }

  var payload = {
    bandId: ciCurrentBandId,
    date: date,
    venue: venue,
    slots: checkedSlots,
    reason: 'ลางาน',
    substituteName: subName,
    substituteContact: ''
  };

  if (typeof gasRun === 'function') {
    gasRun('requestLeave', payload, function(r) {
      if (btn) { btn.disabled = false; btn.textContent = '✅ ยืนยันลา'; }
      if (r && r.success) {
        ciShowToast('บันทึกลาเรียบร้อย — คนแทน: ' + subName, 'success');
        var form = ciGetEl('ciLeaveForm');
        if (form) form.classList.remove('show');
        ciGetEl('ciLeaveSubNameSimple').value = '';
      } else {
        ciShowToast((r && r.message) || 'เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
      }
    });
  } else {
    if (btn) { btn.disabled = false; btn.textContent = '✅ ยืนยันลา'; }
    window.location.href = 'leave.html?date=' + encodeURIComponent(date) + '&sub=' + encodeURIComponent(subName);
  }
}

/* ===== INIT (continued) ===== */
document.addEventListener('DOMContentLoaded', function() {
  ciCurrentBandId = localStorage.getItem('bandId') || '';
  ciMemberName = localStorage.getItem('userName') || 'คุณ';
  ciUserRole = localStorage.getItem('userRole') || 'member';

  // Set today's date
  var today = new Date().toISOString().split('T')[0];
  ciSelectedDate = today;
  var dateInput = ciGetEl('ciDate');
  if (dateInput) { dateInput.value = today; }

  // Show member name
  var nameEl = ciGetEl('ciMemberName');
  if (nameEl) { nameEl.textContent = ciMemberName; }

  // Show role badge
  var roleBadge = ciGetEl('ciRoleBadge');
  if (roleBadge) {
    var roleLabels = { admin: 'แอดมิน · ผู้จัดการวง', manager: 'ผู้จัดการวง', member: 'สมาชิก' };
    roleBadge.textContent = roleLabels[ciUserRole] || ciUserRole;
    roleBadge.className = 'ci-role-badge ci-role-badge--' + ciUserRole;
  }

  // Load settings then render
  ciLoadSettings(function() {
    ciRenderVenues();
    ciLoadExistingCheckIn();
  });

  // Date change
  if (dateInput) {
    dateInput.addEventListener('change', function() {
      ciSelectedDate = this.value;
      ciExistingCheckIn = null;
      ciLoadExistingCheckIn();
    });
  }

  // Venue change
  var venueEl = ciGetEl('ciVenue');
  if (venueEl) {
    venueEl.addEventListener('change', function() {
      ciSelectedVenue = this.value;
      ciExistingCheckIn = null;
      ciLoadExistingCheckIn();
    });
  }

  // Substitute toggle
  var subToggle = ciGetEl('ciSubToggle');
  if (subToggle) {
    subToggle.addEventListener('change', function() {
      var fields = ciGetEl('ciSubFields');
      if (fields) {
        fields.classList.toggle('active', this.checked);
        if (!this.checked) {
          var sn = ciGetEl('ciSubName'); if (sn) sn.value = '';
          var sc = ciGetEl('ciSubContact'); if (sc) sc.value = '';
        }
      }
      ciIsSubstitute = this.checked;
      var btn = ciGetEl('ciSubmitBtn');
      if (btn) btn.textContent = this.checked ? '🔄 บันทึกเวลา (คนแทน)' : '✅ บันทึกเวลาเข้างาน';
    });
  }

  // Submit button
  var submitBtn = ciGetEl('ciSubmitBtn');
  if (submitBtn) submitBtn.addEventListener('click', ciSubmit);

  // ===== SIMPLE LEAVE BUTTON =====
  var leaveBtn = ciGetEl('ciLeaveBtn');
  var leaveForm = ciGetEl('ciLeaveForm');
  if (leaveBtn && leaveForm) {
    leaveBtn.addEventListener('click', function() {
      leaveForm.classList.toggle('show');
    });
    var leaveCancelBtn = ciGetEl('ciLeaveCancelSimple');
    if (leaveCancelBtn) leaveCancelBtn.addEventListener('click', function() {
      leaveForm.classList.remove('show');
      var inp = ciGetEl('ciLeaveSubNameSimple');
      if (inp) inp.value = '';
    });
    var leaveSubmitBtn = ciGetEl('ciLeaveSubmitSimple');
    if (leaveSubmitBtn) leaveSubmitBtn.addEventListener('click', ciSubmitLeaveSimple);
  }

  // Select all / None shortcuts
  var selAll = ciGetEl('ciSelectAll');
  if (selAll) selAll.addEventListener('click', function() {
    document.querySelectorAll('input[name="ciSlot"]').forEach(function(cb) {
      cb.checked = true; cb.closest('label').classList.add('checked');
    });
  });
  var selNone = ciGetEl('ciSelectNone');
  if (selNone) selNone.addEventListener('click', function() {
    document.querySelectorAll('input[name="ciSlot"]').forEach(function(cb) {
      cb.checked = false; cb.closest('label').classList.remove('checked');
    });
  });
});
