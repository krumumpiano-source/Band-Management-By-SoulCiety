/**
 * Leave & Substitute Service
 * Band Management By SoulCiety
 *
 * LEAVE_REQUESTS sheet columns:
 *   id | bandId | date | venue | slots (JSON) | memberEmail | memberName
 *   reason | status | substitute | substituteType | resolvedBy | createdAt | updatedAt
 *
 * status: 'pending' | 'approved' | 'rejected'
 * substituteType: 'member' | 'outsider'
 */

// ============================================================
// REQUEST LEAVE — สมาชิกขอลางาน
// ============================================================
function requestLeave(req) {
  try {
    var data = req.data || req;
    var session = req._session;
    if (!session) return { success: false, message: 'ไม่พบข้อมูลผู้ใช้' };
    if (!data.bandId) return { success: false, message: 'ไม่พบ bandId' };
    if (!data.date)   return { success: false, message: 'กรุณาเลือกวันที่' };
    if (!data.venue)  return { success: false, message: 'กรุณาเลือกสถานที่' };
    if (!data.slots || !data.slots.length) return { success: false, message: 'กรุณาเลือกช่วงเวลา' };

    var sheet = getOrCreateSheet(CONFIG.SHEETS.LEAVE_REQUESTS, [
      'id','bandId','date','venue','slots','memberEmail','memberName',
      'reason','status','substitute','substituteType','resolvedBy','createdAt','updatedAt'
    ]);

    var id = 'LV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
    var now = new Date().toISOString();

    sheet.appendRow([
      id,
      data.bandId,
      data.date,
      data.venue,
      JSON.stringify(data.slots || []),
      session.email || '',
      session.name  || '',
      data.reason   || '',
      'pending',        // status
      '',               // substitute
      '',               // substituteType
      '',               // resolvedBy
      now,              // createdAt
      now               // updatedAt
    ]);

    return { success: true, message: 'ส่งคำขอลาเรียบร้อยแล้ว', data: { id: id } };
  } catch (err) {
    Logger.log('requestLeave error: ' + err);
    return { success: false, message: err.toString() };
  }
}

// ============================================================
// GET MY LEAVE REQUESTS — ดูคำขอลาของตัวเอง
// ============================================================
function getMyLeaveRequests(req) {
  try {
    var session = req._session;
    if (!session) return { success: false, message: 'ไม่พบข้อมูลผู้ใช้' };
    var bandId = req.bandId || '';

    var sheet = getOrCreateSheet(CONFIG.SHEETS.LEAVE_REQUESTS, [
      'id','bandId','date','venue','slots','memberEmail','memberName',
      'reason','status','substitute','substituteType','resolvedBy','createdAt','updatedAt'
    ]);
    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return { success: true, data: [] };

    var headers = rows[0].map(function(h) { return String(h).trim(); });
    var idxMap = {};
    headers.forEach(function(h, i) { idxMap[h] = i; });

    var myEmail = (session.email || '').toLowerCase();
    var results = [];

    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      var rowBandId = String(row[idxMap['bandId']] || '');
      var rowEmail  = String(row[idxMap['memberEmail']] || '').toLowerCase();
      if (bandId && rowBandId !== bandId) continue;
      if (rowEmail !== myEmail) continue;

      var slots = [];
      try { slots = JSON.parse(row[idxMap['slots']] || '[]'); } catch(e) { slots = []; }

      results.push({
        id:           String(row[idxMap['id']] || ''),
        bandId:       rowBandId,
        date:         String(row[idxMap['date']] || ''),
        venue:        String(row[idxMap['venue']] || ''),
        slots:        slots,
        memberEmail:  rowEmail,
        memberName:   String(row[idxMap['memberName']] || ''),
        reason:       String(row[idxMap['reason']] || ''),
        status:       String(row[idxMap['status']] || 'pending'),
        substitute:   String(row[idxMap['substitute']] || ''),
        createdAt:    String(row[idxMap['createdAt']] || '')
      });
    }

    // เรียงล่าสุดก่อน
    results.sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); });
    return { success: true, data: results };
  } catch (err) {
    Logger.log('getMyLeaveRequests error: ' + err);
    return { success: false, message: err.toString() };
  }
}

// ============================================================
// GET ALL LEAVE REQUESTS — ผู้จัดการดูคำขอทั้งหมดในวง
// ============================================================
function getAllLeaveRequests(req) {
  try {
    var session = req._session;
    if (!session) return { success: false, message: 'ไม่พบข้อมูลผู้ใช้' };
    // Permission check
    var role = (session.role || '').toLowerCase();
    var isManager = role === 'manager' || role === 'admin';
    if (!isManager) return { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' };

    var bandId = req.bandId || '';
    var sheet = getOrCreateSheet(CONFIG.SHEETS.LEAVE_REQUESTS, [
      'id','bandId','date','venue','slots','memberEmail','memberName',
      'reason','status','substitute','substituteType','resolvedBy','createdAt','updatedAt'
    ]);
    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return { success: true, data: [] };

    var headers = rows[0].map(function(h) { return String(h).trim(); });
    var idxMap = {};
    headers.forEach(function(h, i) { idxMap[h] = i; });

    var results = [];
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      var rowBandId = String(row[idxMap['bandId']] || '');
      if (bandId && rowBandId !== bandId) continue;

      var slots = [];
      try { slots = JSON.parse(row[idxMap['slots']] || '[]'); } catch(e) { slots = []; }

      results.push({
        id:           String(row[idxMap['id']] || ''),
        bandId:       rowBandId,
        date:         String(row[idxMap['date']] || ''),
        venue:        String(row[idxMap['venue']] || ''),
        slots:        slots,
        memberEmail:  String(row[idxMap['memberEmail']] || ''),
        memberName:   String(row[idxMap['memberName']] || ''),
        reason:       String(row[idxMap['reason']] || ''),
        status:       String(row[idxMap['status']] || 'pending'),
        substitute:   String(row[idxMap['substitute']] || ''),
        resolvedBy:   String(row[idxMap['resolvedBy']] || ''),
        createdAt:    String(row[idxMap['createdAt']] || '')
      });
    }

    results.sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); });
    return { success: true, data: results };
  } catch (err) {
    Logger.log('getAllLeaveRequests error: ' + err);
    return { success: false, message: err.toString() };
  }
}

// ============================================================
// ASSIGN SUBSTITUTE — ผู้จัดการจัดคนแทน
// ============================================================
function assignSubstitute(req) {
  try {
    var session = req._session;
    if (!session) return { success: false, message: 'ไม่พบข้อมูลผู้ใช้' };
    var role = (session.role || '').toLowerCase();
    if (role !== 'manager' && role !== 'admin') return { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' };

    var leaveId    = req.leaveId || '';
    var substitute = req.substitute || '';
    if (!leaveId)    return { success: false, message: 'ไม่พบ leaveId' };
    if (!substitute) return { success: false, message: 'กรุณาระบุชื่อคนแทน' };

    var sheet = getOrCreateSheet(CONFIG.SHEETS.LEAVE_REQUESTS, [
      'id','bandId','date','venue','slots','memberEmail','memberName',
      'reason','status','substitute','substituteType','resolvedBy','createdAt','updatedAt'
    ]);
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0].map(function(h) { return String(h).trim(); });
    var idxMap = {};
    headers.forEach(function(h, i) { idxMap[h] = i; });

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][idxMap['id']]) === leaveId) {
        var rowNum = i + 1;
        sheet.getRange(rowNum, idxMap['status'] + 1).setValue('approved');
        sheet.getRange(rowNum, idxMap['substitute'] + 1).setValue(substitute);
        sheet.getRange(rowNum, idxMap['substituteType'] + 1).setValue('assigned');
        sheet.getRange(rowNum, idxMap['resolvedBy'] + 1).setValue(session.name || session.email || '');
        sheet.getRange(rowNum, idxMap['updatedAt'] + 1).setValue(new Date().toISOString());
        return { success: true, message: 'จัดคนแทนเรียบร้อยแล้ว' };
      }
    }
    return { success: false, message: 'ไม่พบคำขอลานี้' };
  } catch (err) {
    Logger.log('assignSubstitute error: ' + err);
    return { success: false, message: err.toString() };
  }
}

// ============================================================
// REJECT LEAVE — ผู้จัดการปฏิเสธคำขอลา
// ============================================================
function rejectLeave(req) {
  try {
    var session = req._session;
    if (!session) return { success: false, message: 'ไม่พบข้อมูลผู้ใช้' };
    var role = (session.role || '').toLowerCase();
    if (role !== 'manager' && role !== 'admin') return { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' };

    var leaveId = req.leaveId || '';
    if (!leaveId) return { success: false, message: 'ไม่พบ leaveId' };

    var sheet = getOrCreateSheet(CONFIG.SHEETS.LEAVE_REQUESTS, [
      'id','bandId','date','venue','slots','memberEmail','memberName',
      'reason','status','substitute','substituteType','resolvedBy','createdAt','updatedAt'
    ]);
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0].map(function(h) { return String(h).trim(); });
    var idxMap = {};
    headers.forEach(function(h, i) { idxMap[h] = i; });

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][idxMap['id']]) === leaveId) {
        var rowNum = i + 1;
        sheet.getRange(rowNum, idxMap['status'] + 1).setValue('rejected');
        sheet.getRange(rowNum, idxMap['resolvedBy'] + 1).setValue(session.name || session.email || '');
        sheet.getRange(rowNum, idxMap['updatedAt'] + 1).setValue(new Date().toISOString());
        return { success: true, message: 'ปฏิเสธคำขอลาแล้ว' };
      }
    }
    return { success: false, message: 'ไม่พบคำขอลานี้' };
  } catch (err) {
    Logger.log('rejectLeave error: ' + err);
    return { success: false, message: err.toString() };
  }
}
