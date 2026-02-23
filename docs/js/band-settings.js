/**
 * Band Settings Page JavaScript
 * ตั้งค่าวง - จัดการร้าน สมาชิก และตารางงาน
 * Ported from old frontend — uses gasRun() instead of apiCall()
 */

// State
var currentBandId = null;
var currentBandManager = null;
var bandNameVal = '';
var venues = [];
var bandMembersData = [];
var scheduleDataMap = {}; // { dayOfWeek: { timeSlots: [{ startTime, endTime, members: [{ memberId, hourlyRate }] }] } }
var selectedDay = null;

function getEl(id) { return document.getElementById(id); }

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
