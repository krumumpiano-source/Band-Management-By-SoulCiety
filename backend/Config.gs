/**
 * Band Management By SoulCiety — Configuration
 * ระบบจัดการบริหารวงดนตรี
 * Centralized configuration for the entire system
 */

var CONFIG = {
  // ============================================================
  // [A] Spreadsheet สำหรับข้อมูลปฏิบัติการ
  //     ID ของ Google Sheet ที่สร้างโดย runSetup()
  // ============================================================
  SPREADSHEET_ID: '1U5Z-BkWFysDytkJt-QcOjtW70ExBZY7kIXvC5XWJfVQ',

  // ============================================================
  // [B] คลังเพลงกลาง (Global Songs Library) — อ่านอย่างเดียว
  //     ใส่ ID ของ Google Sheet คลังเพลงกลางที่นี่
  // ============================================================
  GLOBAL_SONGS_SPREADSHEET_ID: '1XISC-0mQzL69mnL3i7f1ITAQ4x5Uv5KkcUJP3vkpzDY',

  // ชื่อ Sheet ในแต่ละ Spreadsheet (ต้องตรงกับชื่อใน Google Sheets)
  SHEETS: {
    // ใน [B] คลังเพลงกลาง
    GLOBAL_SONGS: 'เพลง',

    // ใน [A] Spreadsheet ปฏิบัติการ (สร้างอัตโนมัติถ้ายังไม่มี)
    USERS:              'USERS',
    BAND_MEMBERS:       'BAND_MEMBERS',
    BAND_SONGS:         'BAND_SONGS',
    ATTENDANCE_PAYROLL: 'ATTENDANCE_PAYROLL',
    BANDS:              'BANDS',
    VENUES:             'VENUES',
    HOURLY_RATES:       'HOURLY_RATES',
    SCHEDULE:           'SCHEDULE',
    EQUIPMENT:            'EQUIPMENT',
    CLIENTS:              'CLIENTS',
    QUOTATIONS:           'QUOTATIONS',
    MEMBER_CHECK_INS:     'MEMBER_CHECK_INS',  // บันทึกเข้างานของสมาชิกแต่ละคน
    LEAVE_REQUESTS:       'LEAVE_REQUESTS'      // คำขอลางานและคนแทน
  },

  // System Settings
  SYSTEM_NAME: 'Band Management By SoulCiety',
  SYSTEM_YEAR: '2569'
};

// ============================================================
// Spreadsheet Helpers
// ============================================================

/**
 * [A] Spreadsheet ปฏิบัติการ — ดึงจาก container-bound (getActiveSpreadsheet)
 */
function getOperationalSpreadsheet() {
  // ลองอ่าน ID จาก PropertiesService ก่อน (เผื่อถูก override)
  var id = '';
  try {
    id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID;
  } catch(e) {
    id = CONFIG.SPREADSHEET_ID;
  }
  if (!id) throw new Error('กรุณาตั้งค่า SPREADSHEET_ID ใน Config.gs');
  return SpreadsheetApp.openById(id);
}

/**
 * [B] Spreadsheet คลังเพลงกลาง — ดึงจาก GLOBAL_SONGS_SPREADSHEET_ID
 */
function getGlobalSongsSpreadsheet() {
  var id = CONFIG.GLOBAL_SONGS_SPREADSHEET_ID;
  if (!id) {
    throw new Error('กรุณาตั้งค่า GLOBAL_SONGS_SPREADSHEET_ID ใน Config.gs');
  }
  return SpreadsheetApp.openById(id);
}

/**
 * ดึง Sheet จาก Spreadsheet ปฏิบัติการ (สร้างถ้ายังไม่มี)
 */
function getOrCreateSheet(sheetName, headers) {
  var ss = getOperationalSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#2d3748');
      headerRange.setFontColor('#f6ad55');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * ดึง Sheet ที่มีอยู่แล้ว (ไม่สร้างใหม่)
 */
function getSheet(sheetName) {
  var ss = getOperationalSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('ไม่พบ Sheet ชื่อ "' + sheetName + '"');
  }
  return sheet;
}

/**
 * Hash password ด้วย SHA-256
 */
function hashPassword(password) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return rawHash.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

/**
 * Validate session token จาก CacheService
 */
function validateToken(token) {
  if (!token) return null;
  try {
    var cached = CacheService.getScriptCache().get('sess_' + token);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (e) {
    return null;
  }
}

/**
 * Logout — ลบ session จาก CacheService
 */
function logoutSession(token) {
  if (token) {
    try {
      CacheService.getScriptCache().remove('sess_' + token);
    } catch (e) {}
  }
  return { success: true };
}
