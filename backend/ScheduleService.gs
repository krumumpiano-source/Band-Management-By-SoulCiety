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

function getSchedule(bandId) {
  try {
    if (!bandId) return { success: false, message: 'ไม่พบ bandId' };
    var sheet = getOrCreateSheet(CONFIG.SHEETS.SCHEDULE, [
      'scheduleId','bandId','type','venueName','venueId','date','dayOfWeek',
      'timeSlots','description','status','totalPay','notes','createdAt','updatedAt'
    ]);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    var headers = data[0];
    var results = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('bandId')] !== bandId) continue;
      var gig = {};
      for (var j = 0; j < headers.length; j++) gig[headers[j]] = data[i][j];
      try { gig.timeSlots = JSON.parse(gig.timeSlots || '[]'); } catch(e) { gig.timeSlots = []; }
      results.push(gig);
    }
    return { success: true, data: results };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
