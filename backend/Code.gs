/**
 * Band Management By SoulCiety
 * Main Entry Point — doGet, doPost, doPostFromClient, onOpen
 */

// ============================================================
// WEB APP ENTRY — doGet
// ============================================================
function doGet(e) {
  var action = (e.parameter && e.parameter.action) || '';

  // JSON API endpoints (GET)
  if (action === 'getAllSongs') {
    return ContentService.createTextOutput(JSON.stringify(getAllSongs(e.parameter.source || 'global', e.parameter.bandId || '')))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Serve HTML pages
  var page = (e.parameter && e.parameter.page) || 'index';
  var allowedPages = [
    'index','register','forgot-password','email-verification',
    'dashboard','admin','band-info','band-settings',
    'songs','add-song','edit-song','setlist','song-insights',
    'leave',
    'schedule','attendance-payroll','band-fund','external-payout',
    'job-calculator','quotation','contract','statistics',
    'equipment','clients',
    'user-manual','terms'
  ];
  if (allowedPages.indexOf(page) === -1) page = 'index';

  try {
    return HtmlService.createTemplateFromFile(page)
      .evaluate()
      .setTitle('Band Management By SoulCiety')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:40px;text-align:center">' +
      '<h2>Band Management By SoulCiety</h2>' +
      '<p>Page not found: <code>' + page + '</code></p>' +
      '<a href="?page=index">← กลับหน้าหลัก</a>' +
      '</div>'
    );
  }
}

// ============================================================
// INCLUDE HELPER — <?!= include('filename') ?>
// ============================================================
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================
// API ROUTER — doPost (เรียกจากภายนอก)
// ============================================================
// API ROUTER — doPost (เรียกจาก fetch ของ GitHub Pages)
// ============================================================
function doPost(e) {
  try {
    var requestData;
    try { requestData = JSON.parse(e.postData.contents); }
    catch(err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid JSON' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Token validation (เหมือน doPostFromClient)
    var publicActions = ['login','register','requestPasswordReset','verifyPasswordResetOtp','resetPassword'];
    if (publicActions.indexOf(requestData.action) === -1) {
      var session = validateToken(requestData._token || '');
      if (!session) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, authError: true, message: 'Session หมดอายุ กรุณาล็อกอินใหม่' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      requestData._session = session;
    }

    return ContentService.createTextOutput(JSON.stringify(routeAction(requestData)))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// API ROUTER — doPostFromClient (เรียกผ่าน google.script.run)
// ============================================================
function doPostFromClient(requestData) {
  try {
    if (!requestData || !requestData.action) return { success: false, message: 'Missing action' };
    var publicActions = ['login','register','requestPasswordReset','verifyPasswordResetOtp','resetPassword'];
    if (publicActions.indexOf(requestData.action) === -1) {
      var session = validateToken(requestData._token || '');
      if (!session) return { success: false, authError: true, message: 'Session หมดอายุ กรุณาล็อกอินใหม่' };
      requestData._session = session;
    }
    return routeAction(requestData);
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ============================================================
// ROUTE ACTION — switch-case routing
// ============================================================
function routeAction(req) {
  var action = req.action;
  switch (action) {

    // --- Auth ---
    case 'login':    return login(req.email, req.password);
    case 'register': return register(req.name || '', req.email, req.password, req.bandName || '', req.inviteCode || '');
    case 'logout':   return logoutSession(req._token || '');
    case 'requestPasswordReset':  return requestPasswordReset(req.email || '');
    case 'verifyPasswordResetOtp': return verifyPasswordResetOtp(req.email || '', req.otp || '');
    case 'resetPassword':          return resetPassword(req.email || '', req.otp || '', req.newPassword || '');

    case 'generateInviteCode': return generateInviteCode(req.bandId || '');

    // --- Settings ---
    case 'getAllSongs':   return getAllSongs(req.source || 'global', req.bandId || '');
    case 'addSong':      return addSong(req.data || req);
    case 'updateSong':   return updateSong(req.songId, req.data || req);
    case 'deleteSong':   return deleteSong(req.songId);

    // --- Band Members ---
    case 'getAllBandMembers':  return getAllBandMembers(req.bandId || (req._session && req._session.bandId) || '');
    case 'addBandMember':     return addBandMember(req.data || req);
    case 'updateBandMember':  return updateBandMember(req.memberId, req.data || req);
    case 'deleteBandMember':  return deleteBandMember(req.memberId);

    // --- Attendance & Payroll ---
    case 'addAttendancePayroll':    return addAttendancePayroll(req.data || req);
    case 'getAllAttendancePayroll':  return getAllAttendancePayroll(req.bandId || '', req.startDate || '', req.endDate || '', req.year, req.page, req.pageSize);
    case 'updateAttendancePayroll': return updateAttendancePayroll(req.recordId, req.data || req);
    case 'deleteAttendancePayroll': return deleteAttendancePayroll(req.recordId);
    // Member self check-in
    case 'memberCheckIn':     return memberCheckIn(req);
    case 'getMyCheckIn':      return getMyCheckIn(req);
    case 'getCheckInsForDate': return getCheckInsForDate(req);

    // --- Leave & Substitute ---
    case 'requestLeave':        return requestLeave(req);
    case 'getMyLeaveRequests':  return getMyLeaveRequests(req);
    case 'getAllLeaveRequests':  return getAllLeaveRequests(req);
    case 'assignSubstitute':    return assignSubstitute(req);
    case 'rejectLeave':         return rejectLeave(req);

    // --- Band Settings ---
    case 'saveBandSettings': return saveBandSettings(req);
    case 'getBandSettings':  return getBandSettings(req.bandId || '');

    // --- Schedule ---
    case 'saveSchedule': return saveSchedule(req);
    case 'getSchedule':  return getSchedule(req.bandId || (req._session && req._session.bandId) || '', req.year);
    // เพิ่ม/แก้/ลบงานทีละรายการ (ใช้โดย schedule.html และ attendance-payroll.html)
    case 'addJob':    return addJob(req);
    case 'updateJob': return updateJob(req);
    case 'deleteJob': return deleteJob(req);

    // --- Equipment ---
    case 'getAllEquipment':  return getAllEquipment(req.bandId || '');
    case 'addEquipment':    return addEquipment(req.data || req);
    case 'updateEquipment': return updateEquipment(req.equipmentId, req.data || req);
    case 'deleteEquipment': return deleteEquipment(req.equipmentId);

    // --- Clients ---
    case 'getAllClients':  return getAllClients(req.bandId || '');
    case 'addClient':     return addClient(req.data || req);
    case 'updateClient':  return updateClient(req.clientId, req.data || req);
    case 'deleteClient':  return deleteClient(req.clientId);

    // --- Quotations ---
    case 'getAllQuotations':       return getAllQuotations(req.bandId || '');
    case 'addQuotation':           return addQuotation(req.data || req);
    case 'updateQuotation':        return updateQuotation(req.quotationId, req.data || req);
    case 'deleteQuotation':        return deleteQuotation(req.quotationId);
    case 'generateQuotationPdf':   return generateQuotationPdf(req.quotationId);

    // --- Admin (ต้องเป็น admin เท่านั้น — ตรวจสอบ session.role ทุกคดี) ---
    case 'getAllUsers':
      if (!req._session || req._session.role !== 'admin') return { success: false, message: 'Access denied — admin only' };
      return adminGetAllUsers();
    case 'updateUserRole':
      if (!req._session || req._session.role !== 'admin') return { success: false, message: 'Access denied — admin only' };
      return adminUpdateUserRole(req.userId, req.role);
    case 'deleteUser':
      if (!req._session || req._session.role !== 'admin') return { success: false, message: 'Access denied — admin only' };
      return adminDeleteUser(req.userId);
    case 'getSystemInfo':
      if (!req._session || req._session.role !== 'admin') return { success: false, message: 'Access denied — admin only' };
      return adminGetSystemInfo();
    case 'createBackup':
      if (!req._session || req._session.role !== 'admin') return { success: false, message: 'Access denied — admin only' };
      return adminCreateBackup();
    case 'getSpreadsheetUrl':
      if (!req._session || req._session.role !== 'admin') return { success: false, message: 'Access denied — admin only' };
      return adminGetSpreadsheetUrl();
    case 'runSetupFromAdmin':
      if (!req._session || req._session.role !== 'admin') return { success: false, message: 'Access denied — admin only' };
      return adminRunSetup();
    case 'clearAllData':
      if (!req._session || req._session.role !== 'admin') return { success: false, message: '⚠️ Access denied — admin only' };
      return adminClearAllData();
    case 'resetUsers':
      if (!req._session || req._session.role !== 'admin') return { success: false, message: '⚠️ Access denied — admin only' };
      return adminResetUsers();

    default:
      return { success: false, message: 'Unknown action: ' + action };
  }
}

// ============================================================
// AUTH — Login / Register / Password Reset
// ============================================================
var SESSION_TTL = 28800; // 8 ชั่วโมง

function login(email, password) {
  try {
    if (!email || !password) return { success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' };
    var sheet = getOrCreateSheet(CONFIG.SHEETS.USERS, ['userId','email','passwordHash','userName','role','bandName','bandId','status','createdAt']);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, message: 'ยังไม่มีผู้ใช้ในระบบ กรุณา runSetup() ก่อน' };
    var h = data[0];
    var emailIdx = h.indexOf('email'), passIdx = h.indexOf('passwordHash'),
        nameIdx = h.indexOf('userName'), roleIdx = h.indexOf('role'),
        bandIdx = h.indexOf('bandName'), bandIdIdx = h.indexOf('bandId'), statIdx = h.indexOf('status');
    var inputHash = hashPassword(password);
    var emailLower = email.toLowerCase().trim();
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if ((row[emailIdx] || '').toString().toLowerCase().trim() !== emailLower) continue;
      if (row[statIdx] === 'inactive') return { success: false, message: 'บัญชีนี้ถูกระงับ' };
      if (row[passIdx] === inputHash) {
        var token = Utilities.getUuid();
        var sessionData = JSON.stringify({
          email: emailLower,
          userName: row[nameIdx] || email.split('@')[0],
          bandName: row[bandIdx] || 'วงดนตรี',
          bandId: row[bandIdIdx] || '',
          role: row[roleIdx] || 'member',
          createdAt: Date.now()
        });
        CacheService.getScriptCache().put('sess_' + token, sessionData, SESSION_TTL);
        return {
          success: true, token: token,
          userName: row[nameIdx] || email.split('@')[0],
          bandName: row[bandIdx] || 'วงดนตรี',
          bandId: row[bandIdIdx] || '',
          role: row[roleIdx] || 'member'
        };
      } else {
        return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
      }
    }
    return { success: false, message: 'ไม่พบบัญชีผู้ใช้นี้' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function register(name, email, password, bandName, inviteCode) {
  try {
    if (!email || !password) return { success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' };
    if (password.length < 8) return { success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' };
    var sheet = getOrCreateSheet(CONFIG.SHEETS.USERS, ['userId','email','passwordHash','userName','role','bandName','bandId','status','createdAt']);
    var data = sheet.getDataRange().getValues();
    var h = data[0];
    var emailIdx = h.indexOf('email');
    var emailLower = email.toLowerCase().trim();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][emailIdx] || '').toString().toLowerCase().trim() === emailLower) {
        return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' };
      }
    }
    var userId = Utilities.getUuid();
    var userName = (name || '').trim() || email.split('@')[0];
    var role = 'manager';
    var resolvedBandName = bandName || 'วงดนตรี';
    var bandId = 'BAND_' + Date.now();

    // ── Join via invite code ──────────────────────────
    if (inviteCode && inviteCode.trim()) {
      var joined = _redeemInviteCode(inviteCode.trim().toUpperCase(), userId, userName);
      if (joined.success) {
        bandId = joined.bandId;
        resolvedBandName = joined.bandName || resolvedBandName;
        role = 'member';
      } else {
        return { success: false, message: '❌ รหัสเชิญไม่ถูกต้องหรือหมดอายุแล้ว: ' + joined.message };
      }
    }
    // ─────────────────────────────────────────────────

    sheet.appendRow([userId, emailLower, hashPassword(password), userName, role, resolvedBandName, bandId, 'active', new Date().toISOString()]);
    return { success: true, message: 'สมัครสมาชิกสำเร็จ' + (role === 'member' ? ' — เข้าร่วมวง ' + resolvedBandName + ' แล้ว!' : '') };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * สร้างรหัสเชิญสมาชิก (อายุ 7 วัน)
 */
function generateInviteCode(bandId) {
  try {
    if (!bandId) return { success: false, message: 'ไม่พบ bandId' };
    // ตรวจสอบ band
    var bandSheet = getOperationalSpreadsheet().getSheetByName(CONFIG.SHEETS.BANDS);
    var resolvedBandName = bandId;
    if (bandSheet) {
      var bdata = bandSheet.getDataRange().getValues();
      for (var i = 1; i < bdata.length; i++) {
        if (bdata[i][0] === bandId) { resolvedBandName = bdata[i][1] || bandId; break; }
      }
    }
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var code = '';
    for (var k = 0; k < 6; k++) code += chars[Math.floor(Math.random() * chars.length)];
    var now = new Date();
    var expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    var sheet = getOrCreateSheet(CONFIG.SHEETS.INVITE_CODES, ['code','bandId','bandName','createdAt','expiresAt','status','usedBy']);
    sheet.appendRow([code, bandId, resolvedBandName, now.toISOString(), expires.toISOString(), 'active', '']);
    return { success: true, data: { code: code, bandId: bandId, bandName: resolvedBandName, expiresAt: expires.toISOString() } };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * ใช้รหัสเชิญ — return { success, bandId, bandName }
 */
function _redeemInviteCode(code, userId, userName) {
  try {
    var sheet = getOperationalSpreadsheet().getSheetByName(CONFIG.SHEETS.INVITE_CODES);
    if (!sheet) return { success: false, message: 'ไม่พบตารางรหัสเชิญ' };
    var data = sheet.getDataRange().getValues();
    var h = data[0];
    var ci = { code:h.indexOf('code'), bandId:h.indexOf('bandId'), bandName:h.indexOf('bandName'), expires:h.indexOf('expiresAt'), status:h.indexOf('status'), usedBy:h.indexOf('usedBy') };
    for (var i = 1; i < data.length; i++) {
      if ((data[i][ci.code]||'').toString().toUpperCase() !== code) continue;
      if (data[i][ci.status] !== 'active') return { success: false, message: 'รหัสนี้ถูกใช้ไปแล้ว' };
      var exp = new Date(data[i][ci.expires]);
      if (exp < new Date()) return { success: false, message: 'รหัสหมดอายุแล้ว' };
      // Mark as used
      var usedStr = (data[i][ci.usedBy] ? data[i][ci.usedBy] + ',' : '') + (userName || userId);
      sheet.getRange(i+1, ci.usedBy+1).setValue(usedStr);
      // Don't deactivate — allow multiple uses within 7 days
      return { success: true, bandId: data[i][ci.bandId], bandName: data[i][ci.bandName] };
    }
    return { success: false, message: 'ไม่พบรหัสนี้ในระบบ' };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

function requestPasswordReset(email) {
  // TODO: ยังไม่ได้เชื่อมต่อ Email service — ยิงคืน false เพื่อให้ UI แสดงข้อความที่ถูกต้อง
  return { success: false, message: 'ฟีเจอร์รีเซ็ตรหัสผ่านยังไม่เปิดให้บริการ กรุณาติดต่อ Admin ปรับรหัสผ่านแทน' };
}
function verifyPasswordResetOtp(email, otp) {
  return { success: false, message: 'ฟีเจอร์นี้ยังไม่เปิดให้บริการ' };
}
function resetPassword(email, otp, newPassword) {
  return { success: false, message: 'ฟีเจอร์นี้ยังไม่เปิดให้บริการ' };
}

// ============================================================
// CUSTOM MENU — ใน Google Sheets
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎵 SoulCiety')
    .addItem('🚀 เปิด Web App', 'openWebApp')
    .addSeparator()
    .addItem('⚙️ Setup ระบบ (ครั้งแรก)', 'runSetup')
    .addItem('📊 Dashboard ข้อมูล', 'showDashboardInfo')
    .addToUi();
}

function openWebApp() {
  var url = ScriptApp.getService().getUrl();
  if (!url) {
    SpreadsheetApp.getUi().alert('⚠️ กรุณา Deploy เป็น Web App ก่อน แล้วลองใหม่');
    return;
  }
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("' + url + '","_blank"); google.script.host.close();</script>'
  ).setWidth(1).setHeight(1);
  SpreadsheetApp.getUi().showModalDialog(html, 'เปิด Web App...');
}

function showDashboardInfo() {
  var ss = getOperationalSpreadsheet();
  var sheets = ss.getSheets().map(function(s) { return s.getName() + ' (' + (s.getLastRow() - 1) + ' records)'; });
  SpreadsheetApp.getUi().alert('Band Management By SoulCiety\n\n' + sheets.join('\n'));
}

// ============================================================
// ADMIN FUNCTIONS
// ============================================================
function adminGetAllUsers() {
  try {
    var sheet = getOperationalSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
    if (!sheet) return { success: false, message: 'USERS sheet not found' };
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: true, data: [] };
    var headers = data[0];
    var users = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var obj = {};
      headers.forEach(function(h, idx) { obj[h] = row[idx]; });
      delete obj.passwordHash; // never expose hash
      users.push(obj);
    }
    return { success: true, data: users };
  } catch(e) { Logger.log('adminGetAllUsers error: ' + e); return { success: false, message: e.message }; }
}

function adminUpdateUserRole(userId, role) {
  try {
    var sheet = getOperationalSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
    if (!sheet) return { success: false, message: 'USERS sheet not found' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf('userId');
    var roleCol = headers.indexOf('role');
    if (idCol < 0 || roleCol < 0) return { success: false, message: 'Column not found' };
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(userId)) {
        sheet.getRange(i + 1, roleCol + 1).setValue(role);
        return { success: true };
      }
    }
    return { success: false, message: 'User not found' };
  } catch(e) { Logger.log('adminUpdateUserRole error: ' + e); return { success: false, message: e.message }; }
}

function adminDeleteUser(userId) {
  try {
    var sheet = getOperationalSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
    if (!sheet) return { success: false, message: 'USERS sheet not found' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf('userId');
    if (idCol < 0) return { success: false, message: 'Column not found' };
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(userId)) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'User not found' };
  } catch(e) { Logger.log('adminDeleteUser error: ' + e); return { success: false, message: e.message }; }
}

function adminGetSystemInfo() {
  try {
    var ss = getOperationalSpreadsheet();
    var sheets = ss.getSheets();
    var sheetCount = sheets.length;
    var userSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    var jobSheet = ss.getSheetByName(CONFIG.SHEETS.SCHEDULE);
    var songSheet = ss.getSheetByName(CONFIG.SHEETS.BAND_SONGS);
    return { success: true, data: {
      sheetCount: sheetCount,
      userCount: userSheet ? Math.max(0, userSheet.getLastRow() - 1) : 0,
      jobCount: jobSheet ? Math.max(0, jobSheet.getLastRow() - 1) : 0,
      songCount: songSheet ? Math.max(0, songSheet.getLastRow() - 1) : 0,
      serverTime: Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss')
    }};
  } catch(e) { return { success: false, message: e.message }; }
}

function adminCreateBackup() {
  try {
    var ss = getOperationalSpreadsheet();
    var backup = {};
    ss.getSheets().forEach(function(s) {
      var data = s.getDataRange().getValues();
      backup[s.getName()] = data;
    });
    var json = JSON.stringify(backup, null, 2);
    var folder = DriveApp.getFoldersByName('Band Management By SoulCiety').hasNext()
      ? DriveApp.getFoldersByName('Band Management By SoulCiety').next()
      : DriveApp.getRootFolder();
    var filename = 'Backup_' + Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd_HHmm') + '.json';
    var file = folder.createFile(filename, json, 'application/json');
    return { success: true, url: file.getUrl() };
  } catch(e) { return { success: false, message: e.message }; }
}

function adminGetSpreadsheetUrl() {
  try {
    var url = getOperationalSpreadsheet().getUrl();
    return { success: true, url: url };
  } catch(e) { return { success: false, message: e.message }; }
}

function adminRunSetup() {
  try {
    runSetup();
    return { success: true };
  } catch(e) { return { success: false, message: e.message }; }
}

function adminClearAllData() {
  try {
    var ss = getOperationalSpreadsheet();
    var skipSheets = [CONFIG.SHEETS.USERS];
    ss.getSheets().forEach(function(s) {
      if (skipSheets.indexOf(s.getName()) < 0 && s.getLastRow() > 1) {
        s.deleteRows(2, s.getLastRow() - 1);
      }
    });
    return { success: true };
  } catch(e) { Logger.log('adminClearAllData error: ' + e); return { success: false, message: e.message }; }
}

function adminResetUsers() {
  try {
    var sheet = getOperationalSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
    if (sheet && sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
    return { success: true };
  } catch(e) { Logger.log('adminResetUsers error: ' + e); return { success: false, message: e.message }; }
}
