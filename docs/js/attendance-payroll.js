/**
 * Attendance & Payroll Page JavaScript
 * ลงเวลาและเบิกเงินจากร้าน
 * Ported from old frontend — uses gasRun() instead of apiCall()
 */

var apCurrentBandId = null;
var apBandName = '';
var apBandManager = '';
var apBandMembers = [];
var apVenues = [];
var apScheduleDataMap = {};
var apAttendanceData = {}; // { memberId: { hourlyRate, byDate: { dateStr: [slotKey, ...] } } }
var apSubstitutes = [];
var apPriceAdjustments = [];
var apDateRange = [];
var apRecordType = 'weekly';
var apSelectedVenue = '';

function apGetEl(id) { return document.getElementById(id); }

function apEscHtml(text) {
  if (!text) return '';
  var d = document.createElement('div'); d.textContent = text; return d.innerHTML;
}

function apShowToast(message) {
  var toast = apGetEl('toast');
  if (toast) {
    var m = toast.querySelector('.toast-message');
    if (m) m.textContent = message;
    toast.style.display = 'block'; toast.classList.add('show');
    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.style.display = 'none'; }, 300);
    }, 3000);
  } else { alert(message); }
}

function apFormatDateThai(date) {
  return String(date.getDate()).padStart(2,'0') + '/' + String(date.getMonth()+1).padStart(2,'0') + '/' + date.getFullYear();
}

function apFormatMonthThai(date) {
  return String(date.getMonth()+1).padStart(2,'0') + '/' + date.getFullYear();
}

function apParseTime(timeStr) {
  if (!timeStr) return 0;
  var parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}

function apCalcHours(startMin, endMin) {
  var diff = endMin - startMin;
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

/**
 * ดึงช่วงเวลาสำหรับวันนั้น จาก scheduleDataMap
 */
function apGetTimeSlotsForDay(dayOfWeek) {
  var day = apScheduleDataMap[dayOfWeek] || apScheduleDataMap[String(dayOfWeek)];
  if (day && day.timeSlots && day.timeSlots.length > 0) {
    return day.timeSlots.map(function(s) {
      return { startTime: s.startTime, endTime: s.endTime, members: s.members || [] };
    });
  }
  return [
    { startTime: '19:30', endTime: '20:30', members: [] },
    { startTime: '21:00', endTime: '22:00', members: [] },
    { startTime: '22:30', endTime: '23:30', members: [] }
  ];
}

/* ===== LOAD DATA ===== */
function apLoadBandData() {
  apCurrentBandId = localStorage.getItem('bandId') || sessionStorage.getItem('bandId');
  apBandName = localStorage.getItem('bandName') || '';
  apBandManager = localStorage.getItem('bandManager') || localStorage.getItem('userName') || '';

  var stored = localStorage.getItem('bandSettings');
  if (stored) {
    try {
      var settings = JSON.parse(stored);
      if (settings.members && settings.members.length > 0) apBandMembers = settings.members;
      if (settings.venues) apVenues = settings.venues;
      if (settings.scheduleData) apScheduleDataMap = settings.scheduleData;
      // Build hourlyRate for each member from scheduleData
      apBandMembers.forEach(function(m) {
        if (!apAttendanceData[m.id]) apAttendanceData[m.id] = { hourlyRate: 0, byDate: {} };
        // Find first hourlyRate from schedule
        Object.values(apScheduleDataMap).forEach(function(dayData) {
          (dayData.timeSlots || []).forEach(function(ts) {
            (ts.members || []).forEach(function(tm) {
              if (tm.memberId === m.id && tm.hourlyRate && !apAttendanceData[m.id].hourlyRate) {
                apAttendanceData[m.id].hourlyRate = tm.hourlyRate;
              }
            });
          });
        });
      });
    } catch(e) {}
  }

  if (apBandMembers.length === 0) {
    apBandMembers = [
      { id: 'demo_1', name: 'สมาชิก 1', position: '' },
      { id: 'demo_2', name: 'สมาชิก 2', position: '' }
    ];
  }

  apUpdateBandInfo();
  apLoadVenues();
  apApplyUrlParams();
}

function apApplyUrlParams() {
  var params = new URLSearchParams(window.location.search);
  var venueParam = params.get('venue');
  var dateParam = params.get('date');
  if (venueParam) {
    // Will be applied after venues load
    apSelectedVenue = venueParam;
  }
  if (dateParam) {
    var rt = apGetEl('recordType');
    if (rt) rt.value = 'daily';
    apRecordType = 'daily';
    apHandleRecordTypeChange();
    var wd = apGetEl('workDate');
    if (wd) wd.value = dateParam;
  }
  apUpdateDateRange();
  apRenderAttendanceTable();
  apRenderPayoutTable();
}

function apUpdateBandInfo() {
  var bnEl = apGetEl('bandName');
  var mgEl = apGetEl('bandManager');
  var cntEl = apGetEl('memberCount');
  var card = apGetEl('bandInfoCard');
  if (card) card.style.display = 'block';
  if (cntEl) cntEl.textContent = apBandMembers.length + ' คน';
  if (bnEl) bnEl.textContent = apBandName || 'วงของคุณ';
  if (mgEl) mgEl.textContent = apBandManager || 'ยังไม่ได้ตั้งค่า';
}

/* ===== VENUES ===== */
function apLoadVenues() {
  var sel = apGetEl('venue');
  if (!sel) { apRenderAttendanceTable(); apRenderPayoutTable(); return; }

  function populateVenues(venueList) {
    var filtered = (venueList || []).filter(function(v){ return v.name && v.name.trim(); });
    sel.innerHTML = '<option value="">เลือกร้าน</option>';
    filtered.forEach(function(v) {
      var opt = document.createElement('option');
      opt.value = v.id || v.name;
      opt.textContent = v.name;
      if (v.name === apSelectedVenue || v.id === apSelectedVenue) opt.selected = true;
      sel.appendChild(opt);
    });
    if (sel.options.length <= 1) sel.innerHTML = '<option value="">ยังไม่มีร้าน กรุณาเพิ่มร้านในหน้าตั้งค่า</option>';
    apRenderAttendanceTable();
    apRenderPayoutTable();
  }

  if (apVenues.length > 0) { populateVenues(apVenues); return; }

  if (apCurrentBandId && typeof gasRun === 'function') {
    gasRun('getBandSettings', { bandId: apCurrentBandId }, function(result) {
      if (result && result.success && result.data) {
        if (result.data.venues) apVenues = result.data.venues;
        if (result.data.members) apBandMembers = result.data.members;
        if (result.data.scheduleData) apScheduleDataMap = result.data.scheduleData;
      }
      populateVenues(apVenues);
    });
  } else {
    populateVenues(apVenues);
  }
}

/* ===== RECORD TYPE ===== */
function apHandleRecordTypeChange() {
  apRecordType = apGetEl('recordType')?.value || 'weekly';
  var dg = apGetEl('dailyDateGroup');
  var wg = apGetEl('weeklyDateGroup');
  var mg = apGetEl('monthlyDateGroup');
  if (dg) dg.style.display = 'none';
  if (wg) wg.style.display = 'none';
  if (mg) mg.style.display = 'none';
  if (apRecordType === 'daily' && dg) dg.style.display = 'block';
  else if (apRecordType === 'weekly' && wg) wg.style.display = 'block';
  else if (apRecordType === 'monthly' && mg) mg.style.display = 'block';
  apUpdateDateRange();
  apRenderAttendanceTable();
  apRenderPayoutTable();
}

function apUpdateDateRange() {
  var wd = apGetEl('workDate')?.value;
  var sd = apGetEl('startDate')?.value;
  var ed = apGetEl('endDate')?.value;
  var my = apGetEl('monthYear')?.value;
  apDateRange = [];

  if (apRecordType === 'daily' && wd) {
    apDateRange = [wd];
  } else if (apRecordType === 'weekly' && sd && ed) {
    var start = new Date(sd), end = new Date(ed);
    for (var d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
      apDateRange.push(new Date(d).toISOString().split('T')[0]);
    }
  } else if (apRecordType === 'monthly' && my) {
    var parts = my.split('-');
    var mStart = new Date(parseInt(parts[0]), parseInt(parts[1])-1, 1);
    var mEnd = new Date(parseInt(parts[0]), parseInt(parts[1]), 0);
    for (var d2 = new Date(mStart); d2 <= mEnd; d2.setDate(d2.getDate()+1)) {
      apDateRange.push(new Date(d2).toISOString().split('T')[0]);
    }
  }

  if (apDateRange.length === 0) {
    var today = new Date();
    var diff = today.getDate() - today.getDay();
    var sun = new Date(today); sun.setDate(diff);
    for (var i = 0; i < 7; i++) {
      var dd = new Date(sun); dd.setDate(sun.getDate() + i);
      apDateRange.push(dd.toISOString().split('T')[0]);
    }
  }
}

/* ===== CALCULATE ===== */
function apCalcTotal() {
  var total = 0;
  Object.keys(apAttendanceData).forEach(function(memberId) {
    var data = apAttendanceData[memberId];
    if (!data || !data.byDate) return;
    var rate = data.hourlyRate || 0;
    Object.keys(data.byDate).forEach(function(dateStr) {
      var slotKeys = data.byDate[dateStr] || [];
      var dayOfWeek = new Date(dateStr).getDay();
      var slotsForDay = apGetTimeSlotsForDay(dayOfWeek);
      slotKeys.forEach(function(slotKey) {
        var slot = slotsForDay.find(function(s){ return (s.startTime+'-'+s.endTime) === slotKey; });
        if (slot && rate > 0) {
          total += apCalcHours(apParseTime(slot.startTime), apParseTime(slot.endTime)) * rate;
        }
      });
    });
  });
  apSubstitutes.forEach(function(sub) {
    if (sub.hourlyRate > 0 && sub.slotKey) {
      var parts = sub.slotKey.split('-');
      if (parts.length === 2) {
        total += apCalcHours(apParseTime(parts[0]), apParseTime(parts[1])) * sub.hourlyRate;
      }
    }
  });
  apPriceAdjustments.forEach(function(adj) {
    if (adj.type === 'increase') total += adj.amount;
    else total -= adj.amount;
  });
  return Math.max(0, total);
}

/* ===== ATTENDANCE TABLE ===== */
function apRenderAttendanceTable() {
  var thead = apGetEl('attendanceTableHead');
  var tbody = apGetEl('attendanceTableBody');
  var title = apGetEl('attendanceTableTitle');
  if (!thead || !tbody) return;

  apUpdateDateRange();
  var dayNames = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

  if (title && apDateRange.length > 0) {
    var venueName = apGetEl('venue')?.selectedOptions[0]?.text || 'ร้าน';
    var start = new Date(apDateRange[0]);
    var end = new Date(apDateRange[apDateRange.length-1]);
    if (apRecordType === 'daily') title.textContent = '📋 ' + apBandName + ' ' + venueName + ' ' + apFormatDateThai(start);
    else if (apRecordType === 'weekly') title.textContent = '📋 ' + apBandName + ' ' + venueName + ' รายสัปดาห์ ' + apFormatDateThai(start) + ' - ' + apFormatDateThai(end);
    else title.textContent = '📋 ' + apBandName + ' ' + venueName + ' รายเดือน ' + apFormatMonthThai(start);
  }

  var header = '<tr>';
  header += '<th rowspan="2" class="day-header-cell">วัน</th>';
  header += '<th rowspan="2" class="date-cell">วันที่</th>';
  header += '<th rowspan="2" class="time-slot-cell">ช่วงเวลา</th>';
  apBandMembers.forEach(function(m) {
    var rate = (apAttendanceData[m.id] && apAttendanceData[m.id].hourlyRate) || 0;
    header += '<th class="member-column"><div>' + apEscHtml(m.name) + '</div>' +
      '<input type="number" class="member-rate-input" data-member-id="' + apEscHtml(m.id) + '" value="' + (rate||'') + '" min="0" placeholder="บาท/ชม." style="width:70px;margin-top:4px;"></th>';
  });
  header += '<th rowspan="2" class="input-cell">คนแทน</th>';
  header += '<th rowspan="2" class="total-cell" id="grandTotalBandWage">รวมวง</th>';
  header += '</tr>';
  thead.innerHTML = header;

  var body = '';
  apDateRange.forEach(function(dateStr) {
    var date = new Date(dateStr);
    var dow = date.getDay();
    var dayName = dayNames[dow];
    var dateF = apFormatDateThai(date);
    var slots = apGetTimeSlotsForDay(dow);

    slots.forEach(function(slot, si) {
      var slotKey = slot.startTime + '-' + slot.endTime;
      var isFirst = si === 0;
      body += '<tr data-date="' + dateStr + '" data-slot-key="' + apEscHtml(slotKey) + '">';
      if (isFirst) body += '<td rowspan="' + slots.length + '" class="day-header-cell">' + dayName + '</td>';
      if (isFirst) body += '<td rowspan="' + slots.length + '" class="date-cell">' + dateF + '</td>';
      body += '<td class="time-slot-cell">' + slot.startTime + ' - ' + slot.endTime + '</td>';
      apBandMembers.forEach(function(m) {
        if (!apAttendanceData[m.id]) apAttendanceData[m.id] = { hourlyRate: 0, byDate: {} };
        if (!apAttendanceData[m.id].byDate) apAttendanceData[m.id].byDate = {};
        var memberSlots = apAttendanceData[m.id].byDate[dateStr] || [];
        var checked = memberSlots.includes(slotKey);
        body += '<td class="member-checkbox-cell"><input type="checkbox" data-date="' + dateStr + '" data-slot-key="' + apEscHtml(slotKey) + '" data-member-id="' + apEscHtml(m.id) + '"' + (checked?' checked':'') + '></td>';
      });
      body += '<td class="input-cell"><input type="text" class="substitute-input" data-date="' + dateStr + '" data-slot-key="' + apEscHtml(slotKey) + '" placeholder="คนแทน"></td>';
      body += '<td class="total-cell amount-cell" data-date="' + dateStr + '" data-slot-key="' + apEscHtml(slotKey) + '">0.00</td>';
      body += '</tr>';
    });
  });
  body += '<tr class="total-row"><td colspan="3" class="total-cell">รวม</td>';
  apBandMembers.forEach(function() { body += '<td class="total-cell"></td>'; });
  body += '<td class="total-cell"></td><td class="total-cell grand-total-cell" id="grandTotal">0.00</td></tr>';
  tbody.innerHTML = body;
  apAttachAttendanceListeners();
  apCalcAttendanceTotals();
}

function apAttachAttendanceListeners() {
  document.querySelectorAll('#attendanceTableBody input[type="checkbox"]').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var mid = this.getAttribute('data-member-id');
      var dateStr = this.getAttribute('data-date');
      var slotKey = this.getAttribute('data-slot-key');
      if (!apAttendanceData[mid]) apAttendanceData[mid] = { hourlyRate: 0, byDate: {} };
      if (!apAttendanceData[mid].byDate[dateStr]) apAttendanceData[mid].byDate[dateStr] = [];
      if (this.checked) {
        if (!apAttendanceData[mid].byDate[dateStr].includes(slotKey)) apAttendanceData[mid].byDate[dateStr].push(slotKey);
      } else {
        apAttendanceData[mid].byDate[dateStr] = apAttendanceData[mid].byDate[dateStr].filter(function(s){ return s !== slotKey; });
      }
      apCalcAttendanceTotals();
    });
  });
  document.querySelectorAll('.member-rate-input').forEach(function(input) {
    input.addEventListener('input', function() {
      var mid = this.getAttribute('data-member-id');
      if (!apAttendanceData[mid]) apAttendanceData[mid] = { hourlyRate: 0, byDate: {} };
      apAttendanceData[mid].hourlyRate = parseFloat(this.value) || 0;
      apCalcAttendanceTotals();
    });
  });
}

function apCalcAttendanceTotals() {
  var total = apCalcTotal();
  var gt = apGetEl('grandTotal');
  if (gt) gt.textContent = total.toFixed(2);
  // Update payout table
  apCalcPayoutTotals();
}

/* ===== PAYOUT TABLE ===== */
function apRenderPayoutTable() {
  var thead = apGetEl('payoutTableHead');
  var tbody = apGetEl('payoutTableBody');
  if (!thead || !tbody) return;

  var dayNames = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  var header = '<tr><th>วัน</th><th>วันที่</th>';
  apBandMembers.forEach(function(m) { header += '<th>' + apEscHtml(m.name) + '</th>'; });
  header += '<th>รวมวง</th></tr>';
  thead.innerHTML = header;

  var body = '';
  apDateRange.forEach(function(dateStr, di) {
    var date = new Date(dateStr);
    var dayName = dayNames[date.getDay()];
    body += '<tr data-date="' + dateStr + '">';
    body += '<td>' + dayName + '</td><td>' + apFormatDateThai(date) + '</td>';
    apBandMembers.forEach(function(m) {
      body += '<td class="input-cell"><input type="number" class="payout-input" data-date="' + dateStr + '" data-member-id="' + apEscHtml(m.id) + '" min="0" step="0.01" value="0.00"></td>';
    });
    body += '<td class="total-cell daily-total-cell" data-date="' + dateStr + '">0.00</td>';
    body += '</tr>';
  });
  body += '<tr class="total-row"><td colspan="2">รวมรายคน</td>';
  apBandMembers.forEach(function(m) { body += '<td class="total-cell member-total-cell" data-member-id="' + apEscHtml(m.id) + '">0.00</td>'; });
  body += '<td class="total-cell grand-total-cell" id="grandTotalPayout">0.00</td></tr>';
  tbody.innerHTML = body;
  document.querySelectorAll('.payout-input').forEach(function(inp) {
    inp.addEventListener('input', apCalcPayoutTotals);
  });
  apCalcPayoutTotals();
}

function apCalcPayoutTotals() {
  // Auto-fill payout from attendance
  apDateRange.forEach(function(dateStr) {
    var dayOfWeek = new Date(dateStr).getDay();
    var slots = apGetTimeSlotsForDay(dayOfWeek);
    apBandMembers.forEach(function(m) {
      var data = apAttendanceData[m.id];
      var rate = (data && data.hourlyRate) || 0;
      var amount = 0;
      if (data && data.byDate && data.byDate[dateStr]) {
        data.byDate[dateStr].forEach(function(slotKey) {
          var slot = slots.find(function(s){ return (s.startTime+'-'+s.endTime) === slotKey; });
          if (slot && rate > 0) amount += apCalcHours(apParseTime(slot.startTime), apParseTime(slot.endTime)) * rate;
        });
      }
      var inp = document.querySelector('.payout-input[data-date="' + dateStr + '"][data-member-id="' + m.id + '"]');
      if (inp && amount >= 0) inp.value = amount > 0 ? amount.toFixed(2) : '0.00';
    });
  });
  // Daily totals
  apDateRange.forEach(function(dateStr) {
    var daily = 0;
    document.querySelectorAll('.payout-input[data-date="' + dateStr + '"]').forEach(function(inp) { daily += parseFloat(inp.value) || 0; });
    var dc = document.querySelector('.daily-total-cell[data-date="' + dateStr + '"]');
    if (dc) dc.textContent = daily.toFixed(2);
  });
  // Member totals
  apBandMembers.forEach(function(m) {
    var mt = 0;
    document.querySelectorAll('.payout-input[data-member-id="' + m.id + '"]').forEach(function(inp) { mt += parseFloat(inp.value) || 0; });
    var mc = document.querySelector('.member-total-cell[data-member-id="' + m.id + '"]');
    if (mc) mc.textContent = mt.toFixed(2);
  });
  // Grand total
  var grand = 0;
  document.querySelectorAll('.daily-total-cell').forEach(function(c) { grand += parseFloat(c.textContent) || 0; });
  var gt = apGetEl('grandTotalPayout');
  if (gt) gt.textContent = grand.toFixed(2);
}

/* ===== SAVE ===== */
function apValidateForm() {
  var errs = [];
  var rt = apRecordType;
  var wd = apGetEl('workDate')?.value;
  var sd = apGetEl('startDate')?.value;
  var ed = apGetEl('endDate')?.value;
  var my = apGetEl('monthYear')?.value;
  var venue = apGetEl('venue')?.value;

  if (rt === 'daily' && !wd) errs.push('กรุณาเลือกวันที่ทำงาน');
  if (rt === 'weekly' && (!sd || !ed)) errs.push('กรุณาเลือกวันที่เริ่ม-สิ้นสุด');
  if (rt === 'monthly' && !my) errs.push('กรุณาเลือกเดือนและปี');
  if (!venue) errs.push('กรุณาเลือกร้าน');

  var hasAttendance = Object.values(apAttendanceData).some(function(d) {
    return d && d.byDate && Object.values(d.byDate).some(function(arr) { return arr && arr.length > 0; });
  });
  if (!hasAttendance) errs.push('กรุณาเลือกสมาชิกที่มาทำงานอย่างน้อย 1 คน');

  if (errs.length > 0) { alert(errs.join('\n')); return false; }
  return true;
}

function apSaveAttendancePayroll() {
  if (!apValidateForm()) return;

  var data = {
    recordType: apRecordType,
    dateRange: apDateRange,
    startDate: apDateRange[0] || '',
    endDate: apDateRange[apDateRange.length-1] || '',
    venue: apGetEl('venue')?.value || '',
    bandId: apCurrentBandId,
    attendance: apAttendanceData,
    substitutes: apSubstitutes,
    priceAdjustments: apPriceAdjustments,
    totalAmount: apCalcTotal(),
    createdAt: new Date().toISOString()
  };

  var saveBtn = apGetEl('saveBtn');
  var origText = saveBtn ? saveBtn.textContent : '';
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'กำลังบันทึก...'; }

  function onDone(ok, msg) {
    if (ok) {
      apShowToast('บันทึกข้อมูลเรียบร้อยแล้ว');
      // Also save to localStorage for offline
      var records = JSON.parse(localStorage.getItem('attendancePayroll') || '[]');
      records.push(Object.assign({ id: 'REC_' + Date.now() }, data));
      localStorage.setItem('attendancePayroll', JSON.stringify(records));
    } else {
      alert(msg || 'ไม่สามารถบันทึกได้');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = origText; }
    }
  }

  if (typeof gasRun === 'function' && apCurrentBandId) {
    gasRun('addAttendancePayroll', data, function(result) {
      onDone(result && result.success, result && result.message);
    });
  } else {
    onDone(true);
  }
}

/* ===== RECEIPT PRINT ===== */
function apGenerateVenueReceipt() {
  if (!apValidateForm()) return;
  var venueName = apGetEl('venue')?.selectedOptions[0]?.text || 'ร้าน';
  var totalAmount = apCalcTotal();
  var dateRangeText = apDateRange.length > 0 ? apFormatDateThai(new Date(apDateRange[0])) + (apDateRange.length > 1 ? ' - ' + apFormatDateThai(new Date(apDateRange[apDateRange.length-1])) : '') : '';

  var html = '<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>ใบเบิกร้าน</title>' +
    '<style>body{font-family:sans-serif;padding:40px}h1,h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:20px}' +
    'th,td{border:1px solid #000;padding:10px;text-align:center}.total{font-size:1.5em;font-weight:bold;margin-top:20px;text-align:right}</style></head>' +
    '<body><h1>ใบเบิกเงิน</h1><h2>' + apEscHtml(venueName) + '</h2>' +
    '<p><b>วงดนตรี:</b> ' + apEscHtml(apBandName) + ' &nbsp; <b>ผู้จัดการ:</b> ' + apEscHtml(apBandManager) + '</p>' +
    '<p><b>วันที่:</b> ' + dateRangeText + '</p>' +
    '<div class="total">ยอดรวม: ' + totalAmount.toLocaleString('th-TH', {minimumFractionDigits:2}) + ' บาท</div>' +
    '<script>setTimeout(function(){window.print()},500);<\/script></body></html>';
  var w = window.open('', '_blank');
  w.document.write(html); w.document.close();
}

function apGenerateMemberReceipt() {
  if (!apValidateForm()) return;
  var dateRangeText = apDateRange.length > 0 ? apFormatDateThai(new Date(apDateRange[0])) + (apDateRange.length > 1 ? ' - ' + apFormatDateThai(new Date(apDateRange[apDateRange.length-1])) : '') : '';
  var rows = '';
  apBandMembers.forEach(function(m) {
    var data = apAttendanceData[m.id];
    if (!data || !data.byDate) return;
    var rate = data.hourlyRate || 0;
    var totalHours = 0, totalAmt = 0;
    Object.keys(data.byDate).forEach(function(dateStr) {
      var dow = new Date(dateStr).getDay();
      var slots = apGetTimeSlotsForDay(dow);
      (data.byDate[dateStr] || []).forEach(function(slotKey) {
        var slot = slots.find(function(s){ return (s.startTime+'-'+s.endTime) === slotKey; });
        if (slot) {
          var h = apCalcHours(apParseTime(slot.startTime), apParseTime(slot.endTime));
          totalHours += h; totalAmt += h * rate;
        }
      });
    });
    if (totalHours > 0) rows += '<tr><td>' + apEscHtml(m.name) + '</td><td>' + apEscHtml(m.position||'-') + '</td><td>' + totalHours.toFixed(2) + '</td><td>' + rate.toLocaleString('th-TH') + '</td><td>' + totalAmt.toLocaleString('th-TH',{minimumFractionDigits:2}) + '</td></tr>';
  });
  var html = '<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>ใบเบิกจ่ายรายคน</title>' +
    '<style>body{font-family:sans-serif;padding:40px}h1,h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:20px}' +
    'th,td{border:1px solid #000;padding:10px;text-align:center}</style></head>' +
    '<body><h1>ใบเบิกจ่ายรายคน</h1><h2>' + apEscHtml(apBandName) + '</h2>' +
    '<p><b>ผู้จัดการ:</b> ' + apEscHtml(apBandManager) + ' &nbsp; <b>วันที่:</b> ' + dateRangeText + '</p>' +
    '<table><thead><tr><th>ชื่อสมาชิก</th><th>ตำแหน่ง</th><th>ชั่วโมง</th><th>บาท/ชม.</th><th>จำนวนเงิน</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<script>setTimeout(function(){window.print()},500);<\/script></body></html>';
  var w = window.open('', '_blank');
  w.document.write(html); w.document.close();
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', function() {
  var today = new Date();
  var todayStr = today.toISOString().split('T')[0];

  var rtSel = apGetEl('recordType');
  if (rtSel) { rtSel.addEventListener('change', apHandleRecordTypeChange); apHandleRecordTypeChange(); }

  var wd = apGetEl('workDate');
  if (wd) { wd.value = todayStr; wd.addEventListener('change', function(){ apUpdateDateRange(); apRenderAttendanceTable(); apRenderPayoutTable(); }); }

  var sd = apGetEl('startDate'), ed = apGetEl('endDate');
  if (sd && ed) {
    var dow = today.getDay();
    var sun = new Date(today); sun.setDate(today.getDate() - dow);
    var sat = new Date(sun); sat.setDate(sun.getDate() + 6);
    sd.value = sun.toISOString().split('T')[0];
    ed.value = sat.toISOString().split('T')[0];
    sd.addEventListener('change', function(){ apUpdateDateRange(); apRenderAttendanceTable(); apRenderPayoutTable(); });
    ed.addEventListener('change', function(){ apUpdateDateRange(); apRenderAttendanceTable(); apRenderPayoutTable(); });
  }

  var my = apGetEl('monthYear');
  if (my) {
    my.value = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0');
    my.addEventListener('change', function(){ apUpdateDateRange(); apRenderAttendanceTable(); apRenderPayoutTable(); });
  }

  var venueSel = apGetEl('venue');
  if (venueSel) venueSel.addEventListener('change', function(){ apSelectedVenue = this.value; apRenderAttendanceTable(); });

  var saveBtn = apGetEl('saveBtn');
  if (saveBtn) saveBtn.addEventListener('click', apSaveAttendancePayroll);

  var genVenueBtn = apGetEl('generateVenueReceiptBtn');
  if (genVenueBtn) genVenueBtn.addEventListener('click', apGenerateVenueReceipt);

  var genMemberBtn = apGetEl('generateMemberReceiptBtn');
  if (genMemberBtn) genMemberBtn.addEventListener('click', apGenerateMemberReceipt);

  apLoadBandData();
});
