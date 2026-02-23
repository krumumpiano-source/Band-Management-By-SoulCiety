/**
 * Attendance & Payroll Service
 * Band Management By SoulCiety
 */

function addAttendancePayroll(data) {
  try {
    if (!data.date) return { success: false, message: 'กรุณาเลือกวันที่' };
    if (!data.venue) return { success: false, message: 'กรุณาเลือกร้าน' };
    if (!data.timeSlots || !data.timeSlots.length) return { success: false, message: 'กรุณาเพิ่มช่วงเวลาอย่างน้อย 1 ช่วง' };
    var sheet = getOrCreateSheet(CONFIG.SHEETS.ATTENDANCE_PAYROLL, [
      'id','date','venue','bandId','timeSlots','attendance','substitutes','priceAdjustments','totalAmount','createdAt','updatedAt'
    ]);
    var id = 'ATT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    var now = new Date().toISOString();
    sheet.appendRow([
      id, data.date, data.venue, data.bandId || '',
      JSON.stringify(data.timeSlots || []),
      JSON.stringify(data.attendance || {}),
      JSON.stringify(data.substitutes || []),
      JSON.stringify(data.priceAdjustments || []),
      data.totalAmount || 0, now, now
    ]);
    return { success: true, data: { id: id } };  // ไม่ cache ข้อมูล Attendance (เปลี่ยนบ่อย)
  } catch (error) {
    Logger.log('addAttendancePayroll error: ' + error);
    return { success: false, message: error.toString() };
  }
}

/**
 * getAllAttendancePayroll
 * @param {string} bandId
 * @param {string} startDate  ISO date string (กรองเพิ่มเติม, ถ้ามี)
 * @param {string} endDate    ISO date string
 * @param {string|number} year  ปี ค.ศ. เช่น '2026' — ถ้าไม่ส่งมาจะใช้ปีปัจจุบัน, ส่ง 'all' เพื่อดูทุกปี
 * @param {number} page       หน้าที่ต้องการ (เริ่มที่ 1)
 * @param {number} pageSize   จำนวน record ต่อหน้า (default 50)
 */
function getAllAttendancePayroll(bandId, startDate, endDate, year, page, pageSize) {
  page     = Math.max(1, parseInt(page) || 1);
  pageSize = Math.min(200, Math.max(1, parseInt(pageSize) || 50));
  // year default = ปีปัจจุบัน; ส่ง 'all' หรือ '' เพื่อดูทุกปี
  if (year === undefined || year === null) year = String(new Date().getFullYear());
  var filterYear = (year && year !== 'all') ? String(year) : '';

  try {
    var sheet = getOrCreateSheet(CONFIG.SHEETS.ATTENDANCE_PAYROLL, [
      'id','date','venue','bandId','timeSlots','attendance','substitutes','priceAdjustments','totalAmount','createdAt','updatedAt'
    ]);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [], total: 0, page: page, pageSize: pageSize, totalPages: 0 };
    var headers = data[0];
    var jsonFields = ['timeSlots','attendance','substitutes','priceAdjustments'];
    var allRecords = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        var h = headers[j], v = data[i][j];
        if (jsonFields.indexOf(h) !== -1) {
          try { record[h] = JSON.parse(v || (h === 'attendance' ? '{}' : '[]')); }
          catch(e) { record[h] = h === 'attendance' ? {} : []; }
        } else { record[h] = v; }
      }
      if (bandId && record.bandId !== bandId) continue;
      if (filterYear && !String(record.date).startsWith(filterYear)) continue;
      if (startDate && record.date < startDate) continue;
      if (endDate && record.date > endDate) continue;
      allRecords.push(record);
    }
    allRecords.sort(function(a, b) { return String(b.date).localeCompare(String(a.date)); });

    var total      = allRecords.length;
    var totalPages = Math.ceil(total / pageSize) || 1;
    var sliceStart = (page - 1) * pageSize;
    var pageData   = allRecords.slice(sliceStart, sliceStart + pageSize);

    return { success: true, data: pageData, total: total, page: page, pageSize: pageSize, totalPages: totalPages, year: filterYear || 'all' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function updateAttendancePayroll(recordId, data) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.ATTENDANCE_PAYROLL);
    var sheetData = sheet.getDataRange().getValues();
    var headers = sheetData[0];
    var rowIndex = -1;
    for (var i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === recordId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบบันทึก' };
    var jsonFields = ['timeSlots','attendance','substitutes','priceAdjustments'];
    var updatable = ['date','venue','bandId','timeSlots','attendance','substitutes','priceAdjustments','totalAmount'];
    updatable.forEach(function(f) {
      if (data[f] !== undefined) {
        var val = jsonFields.indexOf(f) !== -1 ? JSON.stringify(data[f]) : data[f];
        sheet.getRange(rowIndex, headers.indexOf(f) + 1).setValue(val);
      }
    });
    sheet.getRange(rowIndex, headers.indexOf('updatedAt') + 1).setValue(new Date().toISOString());
    return { success: true };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function deleteAttendancePayroll(recordId) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.ATTENDANCE_PAYROLL);
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === recordId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบบันทึก' };
    sheet.deleteRow(rowIndex);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ============================================================
// MEMBER SELF CHECK-IN
// สมาชิกลงเวลาตนเองผ่าน check-in.html
// ============================================================

/**
 * memberCheckIn — สมาชิกลงเวลาตนเอง
 * data: { bandId, date, venue, slots:['19:30-20:30',...], notes, memberId? }
 * session จาก _session: { email, userName }
 */
function memberCheckIn(data) {
  try {
    var session = data._session || {};
    var memberEmail = session.email || data.memberEmail || '';
    var memberName = session.userName || data.memberName || '';
    var bandId = data.bandId || session.bandId || '';
    var date = data.date || '';
    var venue = data.venue || '';
    var slots = data.slots || [];

    if (!date) return { success: false, message: 'กรุณาระบุวันที่' };
    if (!venue) return { success: false, message: 'กรุณาระบุสถานที่' };
    if (!slots.length) return { success: false, message: 'กรุณาเลือกช่วงเวลาที่ทำงานอย่างน้อย 1 ช่วง' };
    if (!memberEmail) return { success: false, message: 'ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่' };

    var sheet = getOrCreateSheet(CONFIG.SHEETS.MEMBER_CHECK_INS, [
      'id', 'bandId', 'date', 'venue', 'memberEmail', 'memberName', 'memberId', 'slots', 'status', 'notes', 'createdAt', 'updatedAt'
    ]);

    // ถ้าวันนี้เคย check-in แล้ว → อัปเดตแทน
    var sheetData = sheet.getDataRange().getValues();
    var headers = sheetData[0];
    var emailIdx = headers.indexOf('memberEmail');
    var dateIdx = headers.indexOf('date');
    var venueIdx = headers.indexOf('venue');
    var existingRow = -1;
    for (var i = 1; i < sheetData.length; i++) {
      if (String(sheetData[i][emailIdx]).toLowerCase() === memberEmail.toLowerCase() &&
          String(sheetData[i][dateIdx]) === date &&
          String(sheetData[i][venueIdx]) === venue) {
        existingRow = i + 1; break;
      }
    }

    var now = new Date().toISOString();
    if (existingRow > 0) {
      // Update existing
      sheet.getRange(existingRow, headers.indexOf('slots') + 1).setValue(JSON.stringify(slots));
      sheet.getRange(existingRow, headers.indexOf('notes') + 1).setValue(data.notes || '');
      sheet.getRange(existingRow, headers.indexOf('status') + 1).setValue('pending');
      sheet.getRange(existingRow, headers.indexOf('updatedAt') + 1).setValue(now);
      return { success: true, updated: true, message: 'อัปเดตการลงเวลาเรียบร้อยแล้ว' };
    } else {
      // Insert new
      var id = 'CHK_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      sheet.appendRow([
        id, bandId, date, venue, memberEmail, memberName,
        data.memberId || '', JSON.stringify(slots), 'pending', data.notes || '', now, now
      ]);
      return { success: true, updated: false, message: 'ลงเวลาเรียบร้อยแล้ว' };
    }
  } catch (error) {
    Logger.log('memberCheckIn error: ' + error);
    return { success: false, message: error.toString() };
  }
}

/**
 * getMyCheckIn — ดูสถานะการลงเวลาของตนเอง (สำหรับวันที่ระบุ)
 * req: { date, venue?, bandId }
 * Returns: { success, checkIn: { ... } | null }
 */
function getMyCheckIn(req) {
  try {
    var session = req._session || {};
    var memberEmail = session.email || '';
    var date = req.date || new Date().toISOString().slice(0, 10);
    var venue = req.venue || '';

    var sheet = getOrCreateSheet(CONFIG.SHEETS.MEMBER_CHECK_INS, [
      'id', 'bandId', 'date', 'venue', 'memberEmail', 'memberName', 'memberId', 'slots', 'status', 'notes', 'createdAt', 'updatedAt'
    ]);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, checkIn: null };
    var headers = data[0];
    var emailIdx = headers.indexOf('memberEmail');
    var dateIdx = headers.indexOf('date');
    var venueIdx = headers.indexOf('venue');

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (String(row[emailIdx]).toLowerCase() !== memberEmail.toLowerCase()) continue;
      if (String(row[dateIdx]) !== date) continue;
      if (venue && String(row[venueIdx]) !== venue) continue;
      var record = {};
      headers.forEach(function(h, j) { record[h] = row[j]; });
      try { record.slots = JSON.parse(record.slots || '[]'); } catch(e) { record.slots = []; }
      return { success: true, checkIn: record };
    }
    return { success: true, checkIn: null };
  } catch (error) {
    Logger.log('getMyCheckIn error: ' + error);
    return { success: false, message: error.toString() };
  }
}

/**
 * getCheckInsForDate — ผู้จัดการดูการลงเวลาของสมาชิกทุกคน (สำหรับวันที่/ร้านที่ระบุ)
 * req: { bandId, date, venue? }
 */
function getCheckInsForDate(req) {
  try {
    var bandId = req.bandId || (req._session && req._session.bandId) || '';
    var date = req.date || '';
    var venue = req.venue || '';

    var sheet = getOrCreateSheet(CONFIG.SHEETS.MEMBER_CHECK_INS, [
      'id', 'bandId', 'date', 'venue', 'memberEmail', 'memberName', 'memberId', 'slots', 'status', 'notes', 'createdAt', 'updatedAt'
    ]);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    var headers = data[0];
    var results = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;
      var record = {};
      headers.forEach(function(h, j) { record[h] = row[j]; });
      if (bandId && record.bandId !== bandId) continue;
      if (date && record.date !== date) continue;
      if (venue && record.venue !== venue) continue;
      try { record.slots = JSON.parse(record.slots || '[]'); } catch(e) { record.slots = []; }
      results.push(record);
    }
    return { success: true, data: results };
  } catch (error) {
    Logger.log('getCheckInsForDate error: ' + error);
    return { success: false, message: error.toString() };
  }
}
