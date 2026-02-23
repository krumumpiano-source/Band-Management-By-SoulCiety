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
