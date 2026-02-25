/**
 * Schedule Service
 * Band Management By SoulCiety
 */

function saveSchedule(data) {
  try {
    var bandId = data.bandId;
    var scheduleData = data.scheduleData || [];
    if (!bandId) return { success: false, message: 'ไม่พบ bandId' };

    var sheet = getOrCreateSheet(CONFIG.SHEETS.SCHEDULE, [
      'scheduleId','bandId','type','venueName','venueId','date','dayOfWeek',
      'timeSlots','description','status','totalPay','notes','createdAt','updatedAt'
    ]);

    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var bandIdCol = headers.indexOf('bandId');
    for (var i = allData.length - 1; i > 0; i--) {
      if (allData[i][bandIdCol] === bandId) sheet.deleteRow(i + 1);
    }

    scheduleData.forEach(function(gig) {
      var now = new Date().toISOString();
      sheet.appendRow([
        gig.scheduleId || ('SCH_' + Date.now() + '_' + Math.random().toString(36).substr(2,6)),
        bandId,
        gig.type || 'external',
        gig.venueName || gig.venue || '',
        gig.venueId || '',
        gig.date || '',
        gig.dayOfWeek || '',
        JSON.stringify(gig.timeSlots || []),
        gig.description || '',
        gig.status || 'confirmed',
        gig.totalPay || gig.price || 0,
        gig.notes || '',
        gig.createdAt || now,
        now
      ]);
    });
    return { success: true, message: 'บันทึกตารางงานเรียบร้อย' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * addJob — เพิ่มงานรายการเดียว (ใช้โดย schedule.html)
 * รับ field เดียวกับ form บน schedule.html:
 *   venue, client, date, type, startTime, endTime, payment, status, notes, bandId
 */
function addJob(data) {
  try {
    var bandId = data.bandId || (data._session && data._session.bandId) || '';
    if (!bandId) return { success: false, message: 'ไม่พบ bandId' };
    if (!data.date) return { success: false, message: 'กรุณาระบุวันที่' };
    var sheet = getOrCreateSheet(CONFIG.SHEETS.SCHEDULE, [
      'scheduleId','bandId','type','venueName','venueId','date','dayOfWeek',
      'timeSlots','description','status','totalPay','notes','createdAt','updatedAt'
    ]);
    var id = 'SCH_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    var now = new Date().toISOString();
    var timeSlots = [];
    if (data.startTime || data.endTime) {
      timeSlots = [{ startTime: data.startTime || '', endTime: data.endTime || '' }];
    }
    var dow = '';
    try { dow = new Date(data.date).getDay(); } catch(e) {}
    sheet.appendRow([
      id,
      bandId,
      data.type || 'external',
      data.venue || data.venueName || '',
      data.venueId || '',
      data.date,
      dow,
      JSON.stringify(timeSlots),
      data.client || data.description || '',
      data.status || 'confirmed',
      parseFloat(data.payment || data.totalPay || 0),
      data.notes || '',
      now, now
    ]);
    return { success: true, data: { scheduleId: id } };
  } catch (error) {
    Logger.log('addJob error: ' + error);
    return { success: false, message: error.toString() };
  }
}

/**
 * updateJob — แก้ไขงานรายการเดียวโดย scheduleId
 */
function updateJob(data) {
  try {
    var scheduleId = data.scheduleId || data.jobId;
    if (!scheduleId) return { success: false, message: 'ไม่พบ scheduleId' };
    var sheet = getSheet(CONFIG.SHEETS.SCHEDULE);
    var sheetData = sheet.getDataRange().getValues();
    var headers = sheetData[0];
    var rowIndex = -1;
    for (var i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === scheduleId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบงานในระบบ' };

    var now = new Date().toISOString();
    // คำนวณ timeSlots ใหม่
    var timeSlots;
    if (data.startTime !== undefined || data.endTime !== undefined) {
      timeSlots = [{ startTime: data.startTime || '', endTime: data.endTime || '' }];
    } else {
      // เก็บ timeSlots เดิม
      var tsCol = headers.indexOf('timeSlots');
      try { timeSlots = JSON.parse(sheetData[rowIndex - 1][tsCol] || '[]'); } catch(e) { timeSlots = []; }
    }
    var fieldsMap = {
      type:        data.type,
      venueName:   data.venue || data.venueName,
      date:        data.date,
      dayOfWeek:   data.date ? (function(){ try{return new Date(data.date).getDay();}catch(e){return '';} })() : undefined,
      timeSlots:   JSON.stringify(timeSlots),
      description: data.client !== undefined ? data.client : data.description,
      status:      data.status,
      totalPay:    (data.payment !== undefined || data.totalPay !== undefined) ? parseFloat(data.payment || data.totalPay || 0) : undefined,
      notes:       data.notes,
      updatedAt:   now
    };
    Object.keys(fieldsMap).forEach(function(f) {
      if (fieldsMap[f] === undefined) return;
      var col = headers.indexOf(f);
      if (col >= 0) sheet.getRange(rowIndex, col + 1).setValue(fieldsMap[f]);
    });
    return { success: true };
  } catch (error) {
    Logger.log('updateJob error: ' + error);
    return { success: false, message: error.toString() };
  }
}

/**
 * deleteJob — ลบงานรายการเดียวโดย scheduleId
 */
function deleteJob(data) {
  try {
    var scheduleId = data.scheduleId || data.jobId;
    if (!scheduleId) return { success: false, message: 'ไม่พบ scheduleId' };
    var sheet = getSheet(CONFIG.SHEETS.SCHEDULE);
    var sheetData = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === scheduleId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบงานในระบบ' };
    sheet.deleteRow(rowIndex);
    return { success: true };
  } catch (error) {
    Logger.log('deleteJob error: ' + error);
    return { success: false, message: error.toString() };
  }
}

/**
 * getSchedule
 * @param {string} bandId
 * @param {string|number} year  ปี ค.ศ. เช่น '2026' — ส่ง 'all' หรือ '' เพื่อดูทุกปี (default = ปีปัจจุบัน)
 */
function getSchedule(bandId, year) {
  try {
    if (!bandId) return { success: false, message: 'ไม่พบ bandId' };
    if (year === undefined || year === null) year = String(new Date().getFullYear());
    var filterYear = (year && year !== 'all') ? String(year) : '';

    var sheet = getOrCreateSheet(CONFIG.SHEETS.SCHEDULE, [
      'scheduleId','bandId','type','venueName','venueId','date','dayOfWeek',
      'timeSlots','description','status','totalPay','notes','createdAt','updatedAt'
    ]);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [], year: filterYear || 'all' };
    var headers = data[0];
    var bandIdIdx = headers.indexOf('bandId');
    var dateIdx   = headers.indexOf('date');
    var results = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][bandIdIdx] !== bandId) continue;
      if (filterYear && !String(data[i][dateIdx]).startsWith(filterYear)) continue;
      var gig = {};
      for (var j = 0; j < headers.length; j++) gig[headers[j]] = data[i][j];
      try { gig.timeSlots = JSON.parse(gig.timeSlots || '[]'); } catch(e) { gig.timeSlots = []; }
      results.push(gig);
    }
    return { success: true, data: results, year: filterYear || 'all' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
