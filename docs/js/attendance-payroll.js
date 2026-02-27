/**
 * Attendance & Payroll v2
 * เบิกจ่าย (ผู้จัดการ) — สอดคล้องกับระบบลงเวลาและตารางงาน
 * Profile-based members + schedule slot rates + check-in pre-fill
 * Band Management By SoulCiety
 */

/* ── State ─────────────────────────────────────────── */
var apBandId      = null;
var apBandName    = '';
var apBandManager = '';
var apMembers     = [];
var apVenues      = [];
var apScheduleMap = {};
var apDateRange   = [];
var apRecordType  = 'daily';
var apVenueId     = '';
var apChecked     = {};
var _apInited     = false;
var apWeekStart   = 1;  // default Monday (0=Sun..6=Sat)
var apWeekEnd     = 0;  // default Sunday

/* ── Helpers ────────────────────────────────────────── */
function apEl(id) { return document.getElementById(id); }
function apEsc(t) {
  if (!t) return '';
  var d = document.createElement('div'); d.textContent = t; return d.innerHTML;
}
function apToast(msg, type) {
  var el = apEl('toast');
  if (!el) { alert(msg); return; }
  var m = el.querySelector('.toast-message'); if (m) m.textContent = msg;
  el.style.background = type === 'error' ? '#e53e3e' : type === 'success' ? '#38a169' : 'var(--premium-gold)';
  el.style.display = 'block'; el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); setTimeout(function() { el.style.display = 'none'; }, 300); }, 3000);
}
function apFmtDate(d) {
  var MS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return d.getDate() + ' ' + MS[d.getMonth()] + ' ' + (d.getFullYear() + 543);
}
function apFmtMonth(d) {
  var ML = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return ML[d.getMonth()] + ' ' + (d.getFullYear() + 543);
}
function apParseMin(t) {
  if (!t) return 0; var p = t.split(':').map(Number); return p[0]*60 + (p[1]||0);
}
function apCalcH(s, e) { var diff = e - s; if (diff < 0) diff += 1440; return diff / 60; }

/* ── Schedule slots ─────────────────────────────────── */
function apSlotsForDay(dow) {
  var day = apScheduleMap[dow] || apScheduleMap[String(dow)];
  if (Array.isArray(day)) {
    var arr = day;
    if (apVenueId) arr = arr.filter(function(s) { return s.venueId === apVenueId; });
    return arr.map(function(s) {
      return { start: s.startTime||'', end: s.endTime||'', members: s.members||[], venueId: s.venueId||'' };
    });
  }
  if (day && day.timeSlots && day.timeSlots.length) {
    return day.timeSlots.map(function(s) {
      return { start: s.startTime, end: s.endTime, members: s.members||[] };
    });
  }
  return [];
}

function apMemberRate(slot, mid) {
  var mr = (slot.members||[]).find(function(m) { return m.memberId === mid; });
  return mr ? { rate: mr.rate||0, type: mr.rateType||'shift', assigned: true } : { rate: 0, type: 'shift', assigned: false };
}

function apSlotPay(slot, mid) {
  var r = apMemberRate(slot, mid);
  if (r.rate <= 0) return 0;
  if (r.type === 'hourly') return apCalcH(apParseMin(slot.start), apParseMin(slot.end)) * r.rate;
  return r.rate;
}

function apDefaultRate(mid) {
  for (var d = 0; d < 7; d++) {
    var slots = apSlotsForDay(d);
    for (var i = 0; i < slots.length; i++) {
      var mr = apMemberRate(slots[i], mid);
      if (mr.rate > 0) return mr;
    }
  }
  return { rate: 0, type: 'shift' };
}

/* ═══ LOAD DATA ═════════════════════════════════════ */
function apLoadData() {
  apBandId = localStorage.getItem('bandId') || sessionStorage.getItem('bandId');
  apBandName = localStorage.getItem('bandName') || '';
  apBandManager = localStorage.getItem('bandManager') || localStorage.getItem('userName') || '';
  try {
    var s = JSON.parse(localStorage.getItem('bandSettings') || '{}');
    if (s.members && s.members.length) apMembers = s.members;
    if (s.venues) apVenues = s.venues;
    apScheduleMap = s.schedule || s.scheduleData || {};
    // Read payroll settings from manager's band-settings
    if (s.payroll) {
      if (s.payroll.period) apRecordType = s.payroll.period;
      if (s.payroll.weekStart !== undefined) apWeekStart = parseInt(s.payroll.weekStart, 10);
      if (s.payroll.weekEnd !== undefined) apWeekEnd = parseInt(s.payroll.weekEnd, 10);
    }
  } catch(e) {}
  apUpdateBandInfo();
  apRenderVenues();

  if (apBandId && typeof gasRun === 'function') {
    var ready = { p: false, s: false };
    function onReady() {
      if (!ready.p || !ready.s) return;
      apUpdateBandInfo();
      apRenderVenues();
      apHandleUrlParams();
    }
    gasRun('getBandProfiles', { bandId: apBandId }, function(r) {
      if (r && r.success && r.data && r.data.length) {
        apMembers = r.data.map(function(p) {
          return { id: p.id, name: p.nickname||p.first_name||p.user_name||p.email||'?', position: p.instrument||'', email: p.email||'', paymentMethod: p.payment_method||'', paymentAccount: p.payment_account||'' };
        });
        try { var ls = JSON.parse(localStorage.getItem('bandSettings')||'{}'); ls.members = apMembers; localStorage.setItem('bandSettings', JSON.stringify(ls)); } catch(e){}
      }
      ready.p = true; onReady();
    });
    gasRun('getBandSettings', { bandId: apBandId }, function(r) {
      if (r && r.success && r.data) {
        if (r.data.venues) apVenues = r.data.venues;
        apScheduleMap = r.data.schedule || r.data.scheduleData || {};
        // Sync payroll config from server
        if (r.data.payroll) {
          if (r.data.payroll.period) apRecordType = r.data.payroll.period;
          if (r.data.payroll.weekStart !== undefined) apWeekStart = parseInt(r.data.payroll.weekStart, 10);
          if (r.data.payroll.weekEnd !== undefined) apWeekEnd = parseInt(r.data.payroll.weekEnd, 10);
          // Update UI to reflect manager's settings
          var _rt = apEl('recordType'); if (_rt) _rt.value = apRecordType;
          apShowDateGroups();
          apApplyWeekRange();
        }
      }
      ready.s = true; onReady();
    });
  } else {
    apHandleUrlParams();
  }
}

function apHandleUrlParams() {
  var prm = new URLSearchParams(window.location.search);
  if (prm.get('venue')) { apVenueId = prm.get('venue'); var sel = apEl('venue'); if (sel) sel.value = apVenueId; }
  if (prm.get('date')) {
    var rt = apEl('recordType'); if (rt) rt.value = 'daily';
    apRecordType = 'daily'; apShowDateGroups();
    var wd = apEl('workDate'); if (wd) wd.value = prm.get('date');
  }
  apUpdateDateRange();
  apLoadCheckIns(function() { apRenderAttendance(); apRenderPayout(); apRenderPaymentInfo(); });
}

function apUpdateBandInfo() {
  var card = apEl('bandInfoCard'); if (card) card.style.display = 'block';
  var n = apEl('bandNameDisplay');    if (n) n.textContent = apBandName || '-';
  var m = apEl('bandManagerDisplay'); if (m) m.textContent = apBandManager || '-';
  var c = apEl('memberCountDisplay'); if (c) c.textContent = apMembers.length + ' คน';
}

/* ═══ VENUES ════════════════════════════════════════ */
function apRenderVenues() {
  var sel = apEl('venue'); if (!sel) return;
  var list = (apVenues||[]).filter(function(v) { return v.name && v.name.trim(); });
  sel.innerHTML = '<option value="">— เลือกร้าน —</option>';
  list.forEach(function(v) {
    var o = document.createElement('option'); o.value = v.id||v.name; o.textContent = v.name;
    if (o.value === apVenueId) o.selected = true;
    sel.appendChild(o);
  });
}

/* ═══ DATE RANGE ════════════════════════════════════ */
function apShowDateGroups() {
  apRecordType = (apEl('recordType')||{}).value || 'daily';
  ['dailyDateGroup','weeklyDateGroup','weeklyDateGroup2','monthlyDateGroup'].forEach(function(id) {
    var el = apEl(id); if (el) el.style.display = 'none';
  });
  if (apRecordType === 'daily') { var d = apEl('dailyDateGroup'); if (d) d.style.display = 'block'; }
  else if (apRecordType === 'weekly') {
    ['weeklyDateGroup','weeklyDateGroup2'].forEach(function(id) { var el = apEl(id); if (el) el.style.display = 'block'; });
  }
  else if (apRecordType === 'monthly') { var m = apEl('monthlyDateGroup'); if (m) m.style.display = 'block'; }
}

function apUpdateDateRange() {
  apDateRange = [];
  if (apRecordType === 'daily') {
    var v = (apEl('workDate')||{}).value; if (v) apDateRange = [v];
  } else if (apRecordType === 'weekly') {
    var sv = (apEl('startDate')||{}).value, ev = (apEl('endDate')||{}).value;
    if (sv && ev) { for (var d = new Date(sv); d <= new Date(ev); d.setDate(d.getDate()+1)) apDateRange.push(new Date(d).toISOString().split('T')[0]); }
  } else if (apRecordType === 'monthly') {
    var mv = (apEl('monthYear')||{}).value;
    if (mv) { var p = mv.split('-'), ms = new Date(+p[0],+p[1]-1,1), me = new Date(+p[0],+p[1],0);
      for (var d2 = new Date(ms); d2 <= me; d2.setDate(d2.getDate()+1)) apDateRange.push(new Date(d2).toISOString().split('T')[0]);
    }
  }
  if (!apDateRange.length) apDateRange = [new Date().toISOString().split('T')[0]];
}

/* ═══ LOAD CHECK-INS ════════════════════════════════ */
var apCheckInStatus = {}; // apCheckInStatus[memberId][date] = 'pending'|'confirmed'
var apCheckInVenue  = {}; // apCheckInVenue[memberId][date] = venueName
var apCheckInTime   = {}; // apCheckInTime[memberId][date] = checkInAt timestamp
var apCheckInSub    = {}; // apCheckInSub[memberId][date] = {name, contact} or null
var apLeaveData     = []; // leave_requests for the date range

function apLoadCheckIns(cb) {
  apChecked = {};
  apCheckInStatus = {};
  apCheckInVenue  = {};
  apCheckInTime   = {};
  apCheckInSub    = {};
  apLeaveData     = [];
  if (!apBandId || typeof gasRun !== 'function' || !apDateRange.length) { if (cb) cb(); return; }
  var dates = apDateRange.slice(), total = dates.length, done = 0, all = [];
  var leaveDone = false, ciDone = false;
  function tryFinish() {
    if (!ciDone || !leaveDone) return;
    // Process check-ins
    all.forEach(function(ci) {
      var slots = ci.slots || []; if (!slots.length) return;
      var mem = null;
      if (ci.memberId) mem = apMembers.find(function(m) { return m.id === ci.memberId; });
      if (!mem && ci.memberName) mem = apMembers.find(function(m) { return m.name === ci.memberName; });
      if (!mem) return;
      if (!apChecked[mem.id]) apChecked[mem.id] = {};
      if (!apChecked[mem.id][ci.date]) apChecked[mem.id][ci.date] = [];
      slots.forEach(function(s) { if (apChecked[mem.id][ci.date].indexOf(s) === -1) apChecked[mem.id][ci.date].push(s); });
      // Store check-in metadata
      if (!apCheckInStatus[mem.id]) apCheckInStatus[mem.id] = {};
      apCheckInStatus[mem.id][ci.date] = ci.status || 'pending';
      if (!apCheckInVenue[mem.id]) apCheckInVenue[mem.id] = {};
      apCheckInVenue[mem.id][ci.date] = ci.venue || '';
      if (!apCheckInTime[mem.id]) apCheckInTime[mem.id] = {};
      apCheckInTime[mem.id][ci.date] = ci.checkInAt || '';
      if (!apCheckInSub[mem.id]) apCheckInSub[mem.id] = {};
      apCheckInSub[mem.id][ci.date] = ci.substitute || null;
    });
    // Merge leave_requests into apCheckInSub AND apCheckInStatus
    apLeaveData.forEach(function(lv) {
      if (lv.status === 'rejected') return;
      var mem = null;
      if (lv.memberId) mem = apMembers.find(function(m) { return m.id === lv.memberId; });
      if (!mem && lv.memberName) mem = apMembers.find(function(m) { return m.name === lv.memberName; });
      if (!mem) return;
      // Always mark as leave status so all slots on this date show leave badge
      if (!apCheckInStatus[mem.id]) apCheckInStatus[mem.id] = {};
      if (!apCheckInStatus[mem.id][lv.date]) apCheckInStatus[mem.id][lv.date] = 'leave';
      // Set substitute info
      if (lv.substituteName) {
        if (!apCheckInSub[mem.id]) apCheckInSub[mem.id] = {};
        if (!apCheckInSub[mem.id][lv.date]) {
          apCheckInSub[mem.id][lv.date] = { name: lv.substituteName, contact: lv.substituteContact || '' };
        }
      }
    });
    if (cb) cb();
  }
  // Load check-ins
  dates.forEach(function(d) {
    gasRun('getCheckInsForDate', { bandId: apBandId, date: d }, function(r) {
      if (r && r.success && r.data) all = all.concat(r.data);
      if (++done >= total) { ciDone = true; tryFinish(); }
    });
  });
  // Load leave requests for the date range
  gasRun('getAllLeaveRequests', { bandId: apBandId }, function(r) {
    if (r && r.success && r.data) {
      var dSet = {}; dates.forEach(function(d) { dSet[d] = true; });
      apLeaveData = r.data.filter(function(lv) { return dSet[lv.date]; });
    }
    leaveDone = true; tryFinish();
  });
}

/* ═══ ATTENDANCE TABLE ══════════════════════════════ */
function apRenderAttendance() {
  var thead = apEl('attendanceTableHead'), tbody = apEl('attendanceTableBody'), title = apEl('attendanceTableTitle');
  if (!thead || !tbody) return;
  apUpdateDateRange();
  var DN = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  var RL = { shift:'บ/เบรค', hourly:'บ/ชม', fixed:'คงที่' };

  if (title && apDateRange.length) {
    var vn = ''; var vs = apEl('venue');
    if (vs && vs.selectedIndex > 0) vn = vs.options[vs.selectedIndex].text;
    var ds = new Date(apDateRange[0]), de = new Date(apDateRange[apDateRange.length-1]);
    title.textContent = '📋 ' + (apBandName||'วง') + (vn ? ' · '+vn : '') + ' — ' +
      (apRecordType==='daily' ? apFmtDate(ds) : apRecordType==='weekly' ? apFmtDate(ds)+' ถึง '+apFmtDate(de) : apFmtMonth(ds));
  }

  var hasSlots = apDateRange.some(function(d) { return apSlotsForDay(new Date(d).getDay()).length > 0; });
  if (!hasSlots || !apMembers.length) {
    thead.innerHTML = '';
    var msg = !apMembers.length ? 'ยังไม่มีสมาชิกในวง' :
      'ไม่มีช่วงงาน' + (apVenueId ? 'ในร้านที่เลือก' : '') + '<br><small>ตั้งค่าตารางงานสัปดาห์ในหน้า ⚙️ ตั้งค่าวง</small>';
    tbody.innerHTML = '<tr><td colspan="20" style="text-align:center;color:var(--premium-text-muted);padding:2rem">' + msg + '</td></tr>';
    return;
  }

  var h = '<tr><th>วัน</th><th>วันที่</th><th>ช่วงเวลา</th>';
  apMembers.forEach(function(m) {
    var dr = apDefaultRate(m.id);
    h += '<th style="min-width:75px;text-align:center"><div style="font-weight:700;font-size:13px">' + apEsc(m.name) + '</div>';
    if (m.position) h += '<div style="font-size:10px;color:var(--premium-text-muted)">' + apEsc(m.position) + '</div>';
    if (dr.rate > 0) h += '<div style="font-size:10px;color:var(--premium-gold);margin-top:2px">' + dr.rate.toLocaleString('th-TH') + ' ' + (RL[dr.type]||'') + '</div>';
    h += '</th>';
  });
  h += '<th style="text-align:right">รวม</th></tr>';
  thead.innerHTML = h;

  var b = '';
  apDateRange.forEach(function(dateStr) {
    var dt = new Date(dateStr), dow = dt.getDay();
    var slots = apSlotsForDay(dow);
    if (!slots.length) return;
    slots.forEach(function(slot, si) {
      var sk = slot.start + '-' + slot.end;
      b += '<tr>';
      if (si === 0) {
        b += '<td rowspan="' + slots.length + '" style="font-weight:600">' + DN[dow] + '</td>';
        b += '<td rowspan="' + slots.length + '">' + apFmtDate(dt) + '</td>';
      }
      b += '<td style="white-space:nowrap">' + slot.start + ' – ' + slot.end + '</td>';
      var rowAmt = 0;
      apMembers.forEach(function(m) {
        var ciSlots = (apChecked[m.id] && apChecked[m.id][dateStr]) || [];
        var checked = ciSlots.indexOf(sk) !== -1;
        // Only mark checked if the member actually checked in — NO auto-assign from schedule
        var ri = apMemberRate(slot, m.id);
        var hasCheckIn = apChecked[m.id] && apChecked[m.id][dateStr] && apChecked[m.id][dateStr].length > 0;
        var ciSt = (apCheckInStatus[m.id] && apCheckInStatus[m.id][dateStr]) || '';
        if (checked) rowAmt += apSlotPay(slot, m.id);
        var tdCls = 'text-align:center;position:relative';
        if (!hasCheckIn && ri.assigned) tdCls += ';background:rgba(255,193,7,0.08)';  // assigned but no check-in → faint warning
        b += '<td style="' + tdCls + '">';
        b += '<input type="checkbox" class="ap-cb" data-m="' + apEsc(m.id) +
          '" data-d="' + dateStr + '" data-s="' + apEsc(sk) + '"' + (checked ? ' checked' : '') + '>';
        // Status badge
        var subInfo = (apCheckInSub[m.id] && apCheckInSub[m.id][dateStr]) || null;
        if (ciSt === 'leave') {
          b += '<span class="ap-ci-badge" style="color:#e53e3e;font-size:9px;display:block" title="ลางาน">🚫 ลา</span>';
          if (subInfo && subInfo.name) {
            b += '<span class="ap-ci-badge" style="color:#805ad5;font-size:9px;display:block" title="คนแทน: ' + apEsc(subInfo.name) + '">🔄 ' + apEsc(subInfo.name) + '</span>';
          }
          b += '<span class="ap-ci-badge" style="color:#718096;font-size:8px;display:block">' + apEsc(m.name) + '</span>';
        } else if (checked && ciSt) {
          var badgeTip = ciSt==='confirmed'?'ยืนยันแล้ว':'รอยืนยัน';
          if (subInfo && subInfo.name) badgeTip += ' (แทน: ' + subInfo.name + ')';
          if (ciSt==='confirmed') {
            b += '<span class="ap-ci-badge ap-ci-' + apEsc(ciSt) + '" title="' + apEsc(badgeTip) + '">✅</span>';
          }
          if (subInfo && subInfo.name) b += '<span class="ap-ci-badge" style="color:#805ad5;font-size:9px" title="คนแทน: ' + apEsc(subInfo.name) + '">🔄 ' + apEsc(subInfo.name) + '</span>';
        } else if (!hasCheckIn && ri.assigned) {
          b += '<span class="ap-ci-badge ap-ci-absent" title="ยังไม่ลงเวลา">—</span>';
        }
        b += '</td>';
      });
      b += '<td style="text-align:right;font-weight:600;font-size:12px" class="ap-rt">' + (rowAmt > 0 ? rowAmt.toLocaleString('th-TH') : '-') + '</td>';
      b += '</tr>';
    });
  });

  b += '<tr class="total-row"><td colspan="3" style="text-align:right;font-weight:700">รวมทั้งหมด</td>';
  apMembers.forEach(function(m) {
    b += '<td class="ap-mt" data-m="' + apEsc(m.id) + '" style="text-align:center;font-weight:700">-</td>';
  });
  b += '<td class="ap-gt" style="text-align:right;font-weight:700;color:var(--premium-gold)">-</td></tr>';
  tbody.innerHTML = b;

  tbody.querySelectorAll('.ap-cb').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var mid = this.dataset.m, d = this.dataset.d, s = this.dataset.s;
      if (!apChecked[mid]) apChecked[mid] = {};
      if (!apChecked[mid][d]) apChecked[mid][d] = [];
      if (this.checked) { if (apChecked[mid][d].indexOf(s)===-1) apChecked[mid][d].push(s); }
      else apChecked[mid][d] = apChecked[mid][d].filter(function(x){return x!==s;});
      apCalcTotals();
      apRenderPayout();
    });
  });
  apCalcTotals();
}

function apCalcTotals() {
  var grand = 0, mTotals = {}, mHours = {};
  apMembers.forEach(function(m) { mTotals[m.id] = 0; mHours[m.id] = 0; });
  var rows = document.querySelectorAll('#attendanceTableBody tr:not(.total-row)');
  rows.forEach(function(tr) {
    var cbs = tr.querySelectorAll('.ap-cb');
    if (!cbs.length) return;
    var dateStr = cbs[0].dataset.d, sk = cbs[0].dataset.s;
    var dow = new Date(dateStr).getDay();
    var slots = apSlotsForDay(dow);
    var slot = slots.find(function(s) { return (s.start+'-'+s.end)===sk; });
    if (!slot) return;
    var slotHours = apCalcH(apParseMin(slot.start), apParseMin(slot.end));
    var rowAmt = 0;
    cbs.forEach(function(cb) {
      if (cb.checked) {
        var pay = apSlotPay(slot, cb.dataset.m);
        mTotals[cb.dataset.m] = (mTotals[cb.dataset.m]||0) + pay;
        mHours[cb.dataset.m] = (mHours[cb.dataset.m]||0) + slotHours;
        rowAmt += pay;
      }
    });
    grand += rowAmt;
    var rtCell = tr.querySelector('.ap-rt');
    if (rtCell) rtCell.textContent = rowAmt > 0 ? rowAmt.toLocaleString('th-TH') : '-';
  });
  apMembers.forEach(function(m) {
    var el = document.querySelector('.ap-mt[data-m="'+m.id+'"]');
    if (el) el.textContent = mHours[m.id] > 0 ? mHours[m.id] + ' ชม.' : '-';
  });
  var ge = document.querySelector('.ap-gt');
  if (ge) ge.textContent = grand > 0 ? grand.toLocaleString('th-TH') + ' ฿' : '-';
}

/* ═══ PAYOUT TABLE ══════════════════════════════════ */
function apRenderPayout() {
  var thead = apEl('payoutTableHead'), tbody = apEl('payoutTableBody');
  if (!thead || !tbody) return;
  if (!apMembers.length) { thead.innerHTML=''; tbody.innerHTML=''; return; }
  var DN = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
  var RL = { shift:'บ/เบรค', hourly:'บ/ชม', fixed:'คงที่' };

  // Header row with member names + rate info
  var h = '<tr><th>วัน</th><th>วันที่</th>';
  apMembers.forEach(function(m) {
    var dr = apDefaultRate(m.id);
    var rateTxt = dr.rate > 0 ? dr.rate.toLocaleString('th-TH') + ' ' + (RL[dr.type]||'') : '-';
    h += '<th style="text-align:right;font-size:12px">' + apEsc(m.name) + '<br><span style="font-weight:400;color:#888;font-size:10px">' + rateTxt + '</span></th>';
  });
  h += '<th style="text-align:right">รวม</th></tr>';
  thead.innerHTML = h;

  var mGrand = {}; apMembers.forEach(function(m) { mGrand[m.id] = 0; });
  var b = '', grand = 0;
  apDateRange.forEach(function(dateStr) {
    var dt = new Date(dateStr), dow = dt.getDay(), slots = apSlotsForDay(dow), dayTotal = 0;
    b += '<tr><td>' + DN[dow] + '</td><td>' + apFmtDate(dt) + '</td>';
    apMembers.forEach(function(m) {
      var amt = 0;
      slots.forEach(function(slot) {
        var sk = slot.start+'-'+slot.end;
        if (apChecked[m.id] && apChecked[m.id][dateStr] && apChecked[m.id][dateStr].indexOf(sk)!==-1) amt += apSlotPay(slot, m.id);
      });
      mGrand[m.id] += amt; dayTotal += amt;
      b += '<td style="text-align:right">' + (amt > 0 ? amt.toLocaleString('th-TH') : '-') + '</td>';
    });
    grand += dayTotal;
    b += '<td style="text-align:right;font-weight:600">' + (dayTotal>0?dayTotal.toLocaleString('th-TH'):'-') + '</td></tr>';
  });

  // Rate summary row
  b += '<tr style="background:#f7f7f5"><td colspan="2" style="text-align:right;font-size:12px;color:#888">อัตรา</td>';
  apMembers.forEach(function(m) {
    var dr = apDefaultRate(m.id);
    var rateTxt = dr.rate > 0 ? dr.rate.toLocaleString('th-TH') + ' ' + (RL[dr.type]||'') : '-';
    b += '<td style="text-align:right;font-size:11px;color:#888">' + rateTxt + '</td>';
  });
  b += '<td></td></tr>';

  // Total row
  b += '<tr class="total-row"><td colspan="2" style="text-align:right">รวมสุทธิ</td>';
  apMembers.forEach(function(m) {
    b += '<td style="text-align:right;font-weight:700">' + (mGrand[m.id]>0?mGrand[m.id].toLocaleString('th-TH'):'-') + '</td>';
  });
  b += '<td style="text-align:right;font-weight:700;color:var(--premium-gold)">' + (grand>0?grand.toLocaleString('th-TH')+' ฿':'-') + '</td></tr>';

  // Substitute remark rows per member
  var subInfo = apBuildSubSummary();
  if (subInfo.length) {
    b += '<tr><td colspan="' + (apMembers.length + 3) + '" style="padding:0;border:none"><div style="margin:12px 0 4px;border-top:2px solid #d6bcfa"></div></td></tr>';
    b += '<tr style="background:linear-gradient(135deg,#faf5ff,#f3e8ff)"><td colspan="' + (apMembers.length + 3) + '" style="padding:8px 10px;font-weight:700;font-size:13px;color:#805ad5">🔄 หมายเหตุ — คนแทน</td></tr>';
    subInfo.forEach(function(s) {
      var dateStrs = s.dates.map(function(d) { var dt = new Date(d); return DN[dt.getDay()] + ' ' + apFmtDate(dt); }).join(', ');
      b += '<tr style="background:#faf5ff">';
      b += '<td colspan="2" style="padding:6px 10px;font-size:12px;color:#553c9a">' + apEsc(s.memberName) + ' ลา ' + s.shifts + ' เบรค</td>';
      b += '<td colspan="' + (apMembers.length - 1) + '" style="padding:6px 10px;font-size:12px;color:#805ad5">🔄 คนแทน: <strong>' + apEsc(s.subName) + '</strong> (' + dateStrs + ')</td>';
      b += '<td colspan="2" style="padding:6px 10px;text-align:right;font-size:12px;font-weight:700;color:#e53e3e">จ่ายคนแทน ' + (s.amount > 0 ? s.amount.toLocaleString('th-TH') + ' ฿' : '-') + '</td>';
      b += '</tr>';
    });
  }

  tbody.innerHTML = b;
}

/* ═══ PAYMENT INFO ══════════════════════════════════ */
var _payMethodLabels = {
  'promptpay': '💚 พร้อมเพย์',
  'truemoney': '🧡 ทรูมันนี่',
  'bank_kbank': '🟢 ธ.กสิกรไทย',
  'bank_scb': '🟣 ธ.ไทยพาณิชย์',
  'bank_bbl': '🔵 ธ.กรุงเทพ',
  'bank_ktb': '🔵 ธ.กรุงไทย',
  'bank_bay': '🟡 ธ.กรุงศรี',
  'bank_ttb': '🟠 ธ.ทหารไทยธนชาต',
  'bank_gsb': '🏦 ธ.ออมสิน',
  'bank_other': '🏦 ธนาคารอื่นๆ'
};

function apRenderPaymentInfo() {
  var container = document.getElementById('paymentInfoList');
  if (!container) return;
  if (!apMembers.length) { container.innerHTML = ''; return; }

  var hasAny = apMembers.some(function(m) { return m.paymentMethod || m.paymentAccount; });
  if (!hasAny) {
    container.innerHTML = '<p style="color:var(--premium-text-muted);font-size:13px;text-align:center;padding:12px 0">สมาชิกยังไม่ได้กรอกช่องทางรับเงิน — แจ้งให้กรอกได้ที่หน้า "ข้อมูลส่วนตัว"</p>';
    return;
  }

  var html = '';
  apMembers.forEach(function(m) {
    var method  = m.paymentMethod  || '';
    var account = m.paymentAccount || '';
    if (!method && !account) return;
    var label = _payMethodLabels[method] || method || '—';
    html += '<div class="pay-info-row">'
      + '<span class="pay-info-name">' + apEsc(m.name) + '</span>'
      + '<span class="pay-info-method">' + apEsc(label) + '</span>'
      + '<span class="pay-info-account">' + apEsc(account || '—') + '</span>'
      + '</div>';
  });
  container.innerHTML = html;
}

/* ═══ SUBSTITUTE SUMMARY ════════════════════════════ */
function apBuildSubSummary() {
  // Build substitute info: who took leave, who was the sub, how many shifts, how much money
  var subInfo = []; // {memberName, memberId, subName, shifts, amount, dates[]}
  var RL = { shift:'บ/เบรค', hourly:'บ/ชม', fixed:'คงที่' };
  apMembers.forEach(function(m) {
    // Check if this member has leave with a substitute
    var subDates = {};
    apDateRange.forEach(function(ds) {
      var sub = (apCheckInSub[m.id] && apCheckInSub[m.id][ds]) || null;
      if (!sub || !sub.name) return;
      var key = sub.name;
      if (!subDates[key]) subDates[key] = { subName: sub.name, contact: sub.contact || '', dates: [], slots: 0, amount: 0 };
      subDates[key].dates.push(ds);
      // Count slots the original member was assigned to on that day
      var dow = new Date(ds).getDay();
      var slots = apSlotsForDay(dow);
      slots.forEach(function(slot) {
        var ri = apMemberRate(slot, m.id);
        if (ri.assigned) {
          subDates[key].slots++;
          subDates[key].amount += apSlotPay(slot, m.id);
        }
      });
    });
    Object.keys(subDates).forEach(function(key) {
      subInfo.push({
        memberName: m.name, memberId: m.id,
        subName: subDates[key].subName,
        contact: subDates[key].contact,
        shifts: subDates[key].slots,
        amount: subDates[key].amount,
        dates: subDates[key].dates
      });
    });
  });
  return subInfo;
}

/* ═══ SAVE ══════════════════════════════════════════ */
function apDoSave() {
  var venue = (apEl('venue')||{}).value;
  if (!venue) { apToast('กรุณาเลือกร้าน', 'error'); return; }
  var breakdown = [];
  apMembers.forEach(function(m) {
    var totalAmt = 0, totalSlots = 0;
    apDateRange.forEach(function(ds) {
      apSlotsForDay(new Date(ds).getDay()).forEach(function(slot) {
        var sk = slot.start+'-'+slot.end;
        if (apChecked[m.id] && apChecked[m.id][ds] && apChecked[m.id][ds].indexOf(sk)!==-1) { totalAmt += apSlotPay(slot,m.id); totalSlots++; }
      });
    });
    if (totalSlots > 0) breakdown.push({ memberId: m.id, memberName: m.name, position: m.position, slots: totalSlots, amount: totalAmt });
  });
  if (!breakdown.length) { apToast('ไม่มีข้อมูลเข้างาน', 'error'); return; }

  var data = {
    recordType: apRecordType, date: apDateRange[0]||'', startDate: apDateRange[0]||'',
    endDate: apDateRange[apDateRange.length-1]||'', venue: venue, bandId: apBandId,
    breakdown: breakdown, totalAmount: breakdown.reduce(function(s,b){return s+b.amount;},0),
    createdAt: new Date().toISOString()
  };
  var btn = apEl('saveBtn'), orig = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '⏳ กำลังบันทึก...'; }
  function done(ok, msg) {
    if (btn) { btn.disabled = false; btn.textContent = orig; }
    if (ok) { apToast('บันทึกเรียบร้อย ✅', 'success');
      try { var recs = JSON.parse(localStorage.getItem('attendancePayroll')||'[]'); recs.push(data); localStorage.setItem('attendancePayroll', JSON.stringify(recs)); } catch(e){}
    } else apToast(msg||'บันทึกไม่สำเร็จ', 'error');
  }
  if (typeof gasRun === 'function' && apBandId) {
    gasRun('addAttendancePayroll', data, function(r) { done(r&&r.success, r&&r.message); });
  } else done(true);
}

/* ═══ RECEIPTS (save as image) ═══════════════════════ */
/* Helper: render an off-screen HTML block, capture it as PNG, trigger download */
function apSaveAsImage(htmlContent, fileName) {
  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;padding:32px;font-family:Sarabun,Kanit,sans-serif;min-width:700px;max-width:900px';
  wrap.innerHTML = htmlContent;
  document.body.appendChild(wrap);
  if (typeof html2canvas === 'undefined') { apToast('กรุณารอโหลด html2canvas', 'error'); document.body.removeChild(wrap); return; }
  html2canvas(wrap, { scale: 2, backgroundColor: '#ffffff', useCORS: true }).then(function(canvas) {
    document.body.removeChild(wrap);
    var link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
    apToast('บันทึกรูปภาพสำเร็จ', 'success');
  }).catch(function(err) {
    document.body.removeChild(wrap);
    apToast('เกิดข้อผิดพลาดในการบันทึก: ' + err, 'error');
  });
}

function apPrintVenueReceipt() {
  var vs = apEl('venue'), vn = (vs && vs.selectedIndex>0) ? vs.options[vs.selectedIndex].text : '';
  if (!vn) { apToast('กรุณาเลือกร้าน', 'error'); return; }
  var dt = apDateRange.length ? apFmtDate(new Date(apDateRange[0])) + (apDateRange.length>1 ? ' – ' + apFmtDate(new Date(apDateRange[apDateRange.length-1])) : '') : '';
  var DN = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
  var RL = { shift:'บ/เบรค', hourly:'บ/ชม', fixed:'คงที่' };

  // ── Styles ──
  var S = {
    border:    'border:1px solid #d6d3cb',
    headBg:    'background:#f7f5ef',
    headFont:  'font-size:11px;font-weight:700;color:#4a4a4a',
    cellPad:   'padding:7px 8px',
    cellFont:  'font-size:12px;color:#333',
    check:     'color:#2d8a4e;font-size:15px',
    subName:   'font-size:9px;color:#7c3aed;font-weight:600;display:block;margin-top:1px',
    rowAlt:    'background:#fdfcf9',
    totalBg:   'background:#f3f1ea'
  };

  // ── Build table body ──
  var total = 0;
  var mGrand = {}, mBreaks = {};
  apMembers.forEach(function(m) { mGrand[m.id] = 0; mBreaks[m.id] = 0; });

  var tableRows = '', rowIdx = 0;
  apDateRange.forEach(function(ds) {
    var dtObj = new Date(ds), dow = dtObj.getDay(), slots = apSlotsForDay(dow);
    slots.forEach(function(slot) {
      var sk = slot.start + '-' + slot.end;
      var dayTotal = 0, cells = '';
      apMembers.forEach(function(m) {
        var checked = apChecked[m.id] && apChecked[m.id][ds] && apChecked[m.id][ds].indexOf(sk) !== -1;
        // Substitute info — always check, regardless of check-in status
        var subInfo = (apCheckInSub[m.id] && apCheckInSub[m.id][ds]) || null;
        var hasSub = subInfo && subInfo.name;
        var slotCovered = checked || hasSub; // slot worked by member OR substitute
        var amt = slotCovered ? apSlotPay(slot, m.id) : 0;
        mGrand[m.id] += amt; dayTotal += amt;
        if (slotCovered) mBreaks[m.id]++;
        // Cell content: ✅ when covered + substitute name underneath
        var cellContent = '';
        if (slotCovered) {
          cellContent = '<span style="' + S.check + '">✅</span>';
          if (hasSub) {
            cellContent += '<span style="' + S.subName + '">' + apEsc(subInfo.name) + '</span>';
          }
        }
        var cellBg = hasSub ? 'background:#f5f3ff;' : (slotCovered ? 'background:#f0faf4;' : '');
        cells += '<td style="text-align:center;' + S.cellPad + ';' + S.border + ';' + S.cellFont + ';' + cellBg + '">' + cellContent + '</td>';
      });
      total += dayTotal;
      var altBg = rowIdx % 2 === 1 ? S.rowAlt + ';' : '';
      tableRows += '<tr style="' + altBg + '">' +
        '<td style="text-align:center;' + S.cellPad + ';' + S.border + ';' + S.cellFont + '">' + DN[dow] + '</td>' +
        '<td style="' + S.cellPad + ';' + S.border + ';' + S.cellFont + ';white-space:nowrap">' + apFmtDate(dtObj) + '</td>' +
        '<td style="' + S.cellPad + ';' + S.border + ';' + S.cellFont + ';white-space:nowrap">' + apEsc(slot.start + ' – ' + slot.end) + '</td>' +
        cells +
        '<td style="text-align:right;' + S.cellPad + ';' + S.border + ';' + S.cellFont + ';font-weight:600">' + (dayTotal > 0 ? dayTotal.toLocaleString('th-TH') : '-') + '</td></tr>';
      rowIdx++;
    });
  });

  // ── Member column headers ──
  var memberHeaders = '';
  apMembers.forEach(function(m) {
    var dr = apDefaultRate(m.id);
    var rateTxt = dr.rate > 0 ? dr.rate.toLocaleString('th-TH') + ' ' + (RL[dr.type] || '') : '';
    memberHeaders += '<th style="text-align:center;' + S.cellPad + ';' + S.border + ';' + S.headBg + ';' + S.headFont + '">' +
      '<strong>' + apEsc(m.name) + '</strong>' +
      (m.position ? '<br><span style="font-weight:400;color:#999;font-size:9px">' + apEsc(m.position) + '</span>' : '') +
      (rateTxt ? '<br><span style="font-weight:400;color:#b08000;font-size:9px">' + rateTxt + '</span>' : '') + '</th>';
  });

  // ── Total row: break counts per member, grand total in red ──
  var totalRow = '<tr style="' + S.totalBg + '">' +
    '<td colspan="3" style="text-align:right;padding:10px 8px;' + S.border + ';font-weight:700;font-size:13px;color:#4a4a4a">รวมทั้งหมด</td>';
  apMembers.forEach(function(m) {
    totalRow += '<td style="text-align:center;padding:10px 8px;' + S.border + ';font-weight:700;font-size:13px;color:#4a4a4a">' + (mBreaks[m.id] > 0 ? mBreaks[m.id] : '-') + '</td>';
  });
  totalRow += '<td style="text-align:right;padding:10px 8px;' + S.border + ';font-weight:700;font-size:16px;color:#dc2626">' + total.toLocaleString('th-TH', {minimumFractionDigits: 2}) + ' ฿</td></tr>';

  // ── Assemble HTML ──
  var html =
    '<div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #e2e0d8">' +
      '<h2 style="margin:0 0 2px;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:.3px">' + apEsc(apBandName) + ' — ' + apEsc(vn) + '</h2>' +
      '<p style="margin:0;font-size:13px;color:#888">' + dt + '</p>' +
    '</div>' +
    '<table style="width:100%;border-collapse:collapse">' +
    '<thead><tr>' +
      '<th style="' + S.cellPad + ';' + S.border + ';' + S.headBg + ';' + S.headFont + '">วัน</th>' +
      '<th style="' + S.cellPad + ';' + S.border + ';' + S.headBg + ';' + S.headFont + '">วันที่</th>' +
      '<th style="' + S.cellPad + ';' + S.border + ';' + S.headBg + ';' + S.headFont + '">ช่วงเวลา</th>' +
      memberHeaders +
      '<th style="text-align:right;' + S.cellPad + ';' + S.border + ';' + S.headBg + ';' + S.headFont + '">รวม</th>' +
    '</tr></thead>' +
    '<tbody>' + tableRows + totalRow + '</tbody></table>';

  var safeVn = vn.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
  apSaveAsImage(html, 'เบิกร้าน_' + safeVn + '_' + (apDateRange[0]||'') + '.png');
}

function apPrintMemberReceipt() {
  var dt = apDateRange.length ? apFmtDate(new Date(apDateRange[0])) + (apDateRange.length>1 ? ' – '+apFmtDate(new Date(apDateRange[apDateRange.length-1])) : '') : '';
  var RL = { shift:'บ/เบรค', hourly:'บ/ชม', fixed:'คงที่' };
  var rows = '', grand = 0;
  apMembers.forEach(function(m) {
    var dr = apDefaultRate(m.id), totalSlots = 0, totalAmt = 0;
    apDateRange.forEach(function(ds) {
      apSlotsForDay(new Date(ds).getDay()).forEach(function(slot) {
        var sk = slot.start+'-'+slot.end;
        if (apChecked[m.id]&&apChecked[m.id][ds]&&apChecked[m.id][ds].indexOf(sk)!==-1) { totalSlots++; totalAmt += apSlotPay(slot,m.id); }
      });
    });
    grand += totalAmt;
    var rateTxt = dr.rate > 0 ? dr.rate.toLocaleString('th-TH') + ' ' + (RL[dr.type]||'') : '-';
    // Build substitute deduction info for this member
    var mSubInfo = [];
    apDateRange.forEach(function(ds) {
      var sub = (apCheckInSub[m.id] && apCheckInSub[m.id][ds]) || null;
      if (sub && sub.name) {
        var existing = mSubInfo.find(function(x){ return x.name === sub.name; });
        if (!existing) { existing = { name: sub.name, shifts: 0, amount: 0 }; mSubInfo.push(existing); }
        var dow = new Date(ds).getDay();
        var daySlots = apSlotsForDay(dow);
        daySlots.forEach(function(slot) {
          var ri = apMemberRate(slot, m.id);
          if (ri.assigned) { existing.shifts++; existing.amount += apSlotPay(slot, m.id); }
        });
      }
    });
    var subNote = '';
    mSubInfo.forEach(function(si) {
      subNote += '<br><span style="font-size:11px;color:#805ad5">🔄 ลา ' + si.shifts + ' เบรค → จ่าย ' + apEsc(si.name) + ' = <strong style="color:#e53e3e">' + si.amount.toLocaleString('th-TH') + ' ฿</strong></span>';
    });
    rows += '<tr>' +
      '<td style="padding:8px;border:1px solid #ddd;font-size:13px">' + apEsc(m.name) + subNote + '</td>' +
      '<td style="padding:8px;border:1px solid #ddd;font-size:13px">' + apEsc(m.position||'-') + '</td>' +
      '<td style="text-align:center;padding:8px;border:1px solid #ddd;font-size:13px">' + totalSlots + '</td>' +
      '<td style="text-align:right;padding:8px;border:1px solid #ddd;font-size:13px">' + rateTxt + '</td>' +
      '<td style="text-align:right;padding:8px;border:1px solid #ddd;font-size:13px;font-weight:bold">' + (totalAmt > 0 ? totalAmt.toLocaleString('th-TH', {minimumFractionDigits: 2}) : '-') + '</td></tr>';
  });

  var html = '<div style="text-align:center;margin-bottom:16px">' +
    '<h2 style="margin:0;font-size:18px;color:#333">🧾 แจ้งจ่ายรายคน</h2>' +
    '<p style="margin:4px 0;font-size:13px;color:#666">วง: ' + apEsc(apBandName) + ' | ผู้จัดการ: ' + apEsc(apBandManager) + ' | ' + dt + '</p></div>' +
    '<table style="width:100%;border-collapse:collapse">' +
    '<thead><tr>' +
    '<th style="padding:8px;border:1px solid #ddd;font-size:12px;background:#f5f5f5;text-align:left">ชื่อ</th>' +
    '<th style="padding:8px;border:1px solid #ddd;font-size:12px;background:#f5f5f5;text-align:left">ตำแหน่ง</th>' +
    '<th style="padding:8px;border:1px solid #ddd;font-size:12px;background:#f5f5f5;text-align:center">เบรค</th>' +
    '<th style="padding:8px;border:1px solid #ddd;font-size:12px;background:#f5f5f5;text-align:right">อัตรา</th>' +
    '<th style="padding:8px;border:1px solid #ddd;font-size:12px;background:#f5f5f5;text-align:right">จำนวนเงิน</th>' +
    '</tr></thead><tbody>' + rows +
    '<tr style="background:#f9f7f0"><td colspan="4" style="text-align:right;padding:10px 8px;border:1px solid #ddd;font-weight:700;font-size:14px">รวมทั้งหมด</td>' +
    '<td style="text-align:right;padding:10px 8px;border:1px solid #ddd;font-weight:700;font-size:16px;color:#b08000">' + grand.toLocaleString('th-TH', {minimumFractionDigits: 2}) + ' ฿</td></tr>' +
    '</tbody></table>';

  apSaveAsImage(html, 'แจ้งจ่ายรายคน_' + (apDateRange[0]||'') + '.png');
}

/* ═══ INIT ══════════════════════════════════════════ */
// Calculate weekly date range from apWeekStart/apWeekEnd
function apApplyWeekRange() {
  var sd = apEl('startDate'), ed = apEl('endDate');
  if (!sd || !ed) return;
  var today = new Date();
  var dow = today.getDay();
  // Find the most recent weekStart day
  var diff = (dow - apWeekStart + 7) % 7;
  var start = new Date(today); start.setDate(today.getDate() - diff);
  // Find the weekEnd day from start
  var span = (apWeekEnd - apWeekStart + 7) % 7; if (span === 0) span = 6;
  var end = new Date(start); end.setDate(start.getDate() + span);
  sd.value = start.toISOString().split('T')[0];
  ed.value = end.toISOString().split('T')[0];
}

function apInitPage() {
  if (_apInited) return;
  _apInited = true;
  var today = new Date(), todayStr = today.toISOString().split('T')[0];
  var wd = apEl('workDate'); if (wd) wd.value = todayStr;
  // Pre-select record type from manager's payroll settings
  var rt = apEl('recordType'); if (rt) rt.value = apRecordType;
  var sd = apEl('startDate'), ed = apEl('endDate');
  if (sd && ed) {
    apApplyWeekRange();
  }
  var my = apEl('monthYear');
  if (my) my.value = today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0');
  apShowDateGroups();
  rt = apEl('recordType'); if (rt) rt.addEventListener('change', apShowDateGroups);
  var vs = apEl('venue'); if (vs) vs.addEventListener('change', function() { apVenueId = this.value; });
  var lb = apEl('apLoadBtn'); if (lb) lb.addEventListener('click', function() {
    apVenueId = (apEl('venue')||{}).value||'';
    apUpdateDateRange();
    apLoadCheckIns(function() { apRenderAttendance(); apRenderPayout(); apRenderPaymentInfo(); });
  });
  var sb = apEl('saveBtn'); if (sb) sb.addEventListener('click', apDoSave);
  var vr = apEl('generateVenueReceiptBtn'); if (vr) vr.addEventListener('click', apPrintVenueReceipt);
  var mr = apEl('generateMemberReceiptBtn'); if (mr) mr.addEventListener('click', apPrintMemberReceipt);
  apLoadData();
}