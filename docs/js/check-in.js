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

  // New format: array of slot objects [{id, venueId, startTime, endTime, members}]
  if (Array.isArray(dayData) && dayData.length > 0) {
    return dayData.map(function(s) {
      var st = s.startTime || '', et = s.endTime || '';
      return { key: st + '-' + et, startTime: st, endTime: et, label: st + ' – ' + et };
    });
  }
  // Old format: {timeSlots: [{startTime, endTime}]}
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

/* ===== LEAVE MODAL HELPERS ===== */
var ciLeaveSelectedSlots = [];

function ciRenderLeaveVenues() {
  var sel = ciGetEl('ciLeaveVenueModal');
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

function ciRenderLeaveSlots() {
  var container = ciGetEl('ciLeaveSlotsModal');
  if (!container) return;
  ciLeaveSelectedSlots = [];
  var date = ciGetEl('ciLeaveDateModal') ? ciGetEl('ciLeaveDateModal').value : '';
  if (!date) {
    container.innerHTML = '<p style="color:var(--premium-text-muted);font-size:13px">เลือกวันที่ก่อน</p>';
    return;
  }
  var slots = ciGetSlotsForDate(date);
  container.innerHTML = slots.map(function(slot) {
    return '<button type="button" class="slot-btn" data-slot="' + ciEscHtml(slot.key) + '" ' +
      'style="padding:8px 16px;border-radius:999px;border:2px solid #ccc;background:#fff;cursor:pointer;font-size:13px;font-family:inherit;transition:all .2s">' +
      '🕐 ' + ciEscHtml(slot.label) + '</button>';
  }).join('');
  container.querySelectorAll('.slot-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var slot = btn.dataset.slot;
      if (btn.style.background === 'rgb(229, 62, 62)') {
        btn.style.background = '#fff'; btn.style.color = 'inherit'; btn.style.borderColor = '#ccc';
        ciLeaveSelectedSlots = ciLeaveSelectedSlots.filter(function(s) { return s !== slot; });
      } else {
        btn.style.background = '#e53e3e'; btn.style.color = '#fff'; btn.style.borderColor = '#e53e3e';
        ciLeaveSelectedSlots.push(slot);
      }
    });
  });
}

function ciSubmitLeave() {
  var date = ciGetEl('ciLeaveDateModal') ? ciGetEl('ciLeaveDateModal').value : '';
  var venue = ciGetEl('ciLeaveVenueModal') ? ciGetEl('ciLeaveVenueModal').value : '';
  var subName = (ciGetEl('ciLeaveSubName') ? ciGetEl('ciLeaveSubName').value : '').trim();
  var subContact = (ciGetEl('ciLeaveSubContact') ? ciGetEl('ciLeaveSubContact').value : '').trim();
  var reason = (ciGetEl('ciLeaveReason') ? ciGetEl('ciLeaveReason').value : '').trim();

  if (!date) { ciShowToast('กรุณาเลือกวันที่ลา', 'error'); return; }
  if (!venue) { ciShowToast('กรุณาเลือกสถานที่', 'error'); return; }
  if (!ciLeaveSelectedSlots.length) { ciShowToast('กรุณาเลือกช่วงเวลาที่ลา', 'error'); return; }
  if (!subName) { ciShowToast('กรุณาระบุชื่อคนมาทำงานแทน', 'error'); return; }

  var btn = ciGetEl('ciLeaveSubmit');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ กำลังส่ง...'; }

  var payload = {
    bandId: ciCurrentBandId,
    date: date,
    venue: venue,
    slots: ciLeaveSelectedSlots,
    reason: reason,
    substituteName: subName,
    substituteContact: subContact
  };

  if (typeof gasRun === 'function') {
    gasRun('requestLeave', payload, function(r) {
      if (btn) { btn.disabled = false; btn.textContent = '🚫 ส่งคำขอลา'; }
      if (r && r.success) {
        ciShowToast('ส่งคำขอลาเรียบร้อยแล้ว — คนแทน: ' + subName, 'success');
        var modal = ciGetEl('ciLeaveModal');
        if (modal) modal.classList.remove('active');
        // Clear form
        if (ciGetEl('ciLeaveSubName')) ciGetEl('ciLeaveSubName').value = '';
        if (ciGetEl('ciLeaveSubContact')) ciGetEl('ciLeaveSubContact').value = '';
        if (ciGetEl('ciLeaveReason')) ciGetEl('ciLeaveReason').value = '';
        ciLeaveSelectedSlots = [];
      } else {
        ciShowToast((r && r.message) || 'เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
      }
    });
  } else {
    // Fallback: redirect to leave page with pre-filled params
    if (btn) { btn.disabled = false; btn.textContent = '🚫 ส่งคำขอลา'; }
    var params = '?date=' + encodeURIComponent(date) +
      '&venue=' + encodeURIComponent(venue) +
      '&slots=' + encodeURIComponent(ciLeaveSelectedSlots.join(',')) +
      '&sub=' + encodeURIComponent(subName) +
      '&subContact=' + encodeURIComponent(subContact) +
      '&reason=' + encodeURIComponent(reason);
    window.location.href = 'leave.html' + params;
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

  // ===== LEAVE BUTTON & MODAL =====
  var leaveBtn = ciGetEl('ciLeaveBtn');
  var leaveModal = ciGetEl('ciLeaveModal');
  if (leaveBtn && leaveModal) {
    leaveBtn.addEventListener('click', function() {
      // Pre-fill date & venue from check-in form
      var leaveDateInput = ciGetEl('ciLeaveDateModal');
      if (leaveDateInput) leaveDateInput.value = ciSelectedDate || today;
      ciRenderLeaveVenues();
      ciRenderLeaveSlots();
      leaveModal.classList.add('active');
    });
    // Close modal
    var cancelBtn = ciGetEl('ciLeaveCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', function() {
      leaveModal.classList.remove('active');
    });
    // Close on overlay click
    leaveModal.addEventListener('click', function(e) {
      if (e.target === leaveModal) leaveModal.classList.remove('active');
    });
    // Date change in modal -> update slots
    var leaveDateInput = ciGetEl('ciLeaveDateModal');
    if (leaveDateInput) leaveDateInput.addEventListener('change', ciRenderLeaveSlots);
    // Submit leave
    var leaveSubmitBtn = ciGetEl('ciLeaveSubmit');
    if (leaveSubmitBtn) leaveSubmitBtn.addEventListener('click', ciSubmitLeave);
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
