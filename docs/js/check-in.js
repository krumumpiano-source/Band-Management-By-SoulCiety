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

  if (ciBandSettings.venues.length > 0) {
    callback();
    return;
  }

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
  if (dayData && dayData.timeSlots && dayData.timeSlots.length > 0) {
    return dayData.timeSlots.map(function(s) {
      return { key: s.startTime + '-' + s.endTime, startTime: s.startTime, endTime: s.endTime, label: s.startTime + ' – ' + s.endTime };
    });
  }
  // Default slots if none configured
  return [
    { key: '19:30-20:30', startTime: '19:30', endTime: '20:30', label: '19:30 – 20:30' },
    { key: '21:00-22:00', startTime: '21:00', endTime: '22:00', label: '21:00 – 22:00' },
    { key: '22:30-23:30', startTime: '22:30', endTime: '23:30', label: '22:30 – 23:30' }
  ];
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

  var submitBtn = ciGetEl('ciSubmitBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ กำลังบันทึก...'; }

  gasRun('memberCheckIn', {
    bandId: ciCurrentBandId,
    date: date,
    venue: venue,
    slots: checkedSlots,
    notes: notes
  }, function(r) {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '✅ บันทึกเวลาเข้างาน'; }
    if (r && r.success) {
      ciShowToast(r.message || 'ลงเวลาเรียบร้อยแล้ว', 'success');
      ciSetStatus('✅ ลงเวลาเรียบร้อยแล้ว — รอผู้จัดการยืนยัน', 'success');
      ciExistingCheckIn = { slots: checkedSlots, status: 'pending' };
    } else {
      ciShowToast((r && r.message) || 'เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    }
  });
}

/* ===== INIT ===== */
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

  // Submit button
  var submitBtn = ciGetEl('ciSubmitBtn');
  if (submitBtn) submitBtn.addEventListener('click', ciSubmit);

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
