/**
 * ============================================================
 * Band Management By SoulCiety — First-Time Setup
 * ============================================================
 * วิธีใช้:
 *   1. เปิด Apps Script Editor
 *   2. เลือกฟังก์ชัน runSetup แล้วกด ▶ Run
 *   3. อนุญาต Permission ที่ขอ
 *   4. เมื่อเสร็จ ระบบจะเปิดเอกสาร System Info
 *      ให้คัดลอก ID ต่างๆ ไปใส่ใน Config.gs
 * ============================================================
 */

var SETUP_CONFIG = {
  FOLDER_NAME:       'Band Management By SoulCiety',
  SPREADSHEET_NAME:  'BandManagement_Database',
  INFO_DOC_NAME:     'BandManagement_SystemInfo',
  GLOBAL_SONGS_ID:   '1XISC-0mQzL69mnL3i7f1ITAQ4x5Uv5KkcUJP3vkpzDY',
  TARGET_FOLDER_ID:  '1chknCPBwHetWY6-Dj_LSLig4q_9I1ujy'  // Google Drive folder ที่ต้องการ
};

// ============================================================
// Schema ของแต่ละ Sheet
// ============================================================
var SHEET_SCHEMAS = [
  {
    name: 'USERS',
    color: '#1a73e8',
    description: 'บัญชีผู้ใช้และบทบาท',
    columns: ['userId','email','passwordHash','userName','role','bandName','bandId','status','createdAt']
  },
  {
    name: 'BANDS',
    color: '#0f9d58',
    description: 'ข้อมูลวงดนตรี',
    columns: ['bandId','bandName','managerId','managerEmail','description','status','createdAt','updatedAt']
  },
  {
    name: 'BAND_MEMBERS',
    color: '#f4b400',
    description: 'สมาชิกวง ตำแหน่ง และข้อมูลติดต่อ',
    columns: ['memberId','bandId','name','position','phone','email','defaultHourlyRate','status','joinedAt','createdAt','updatedAt']
  },
  {
    name: 'VENUES',
    color: '#e91e63',
    description: 'ข้อมูลร้านและสถานที่แสดงดนตรี',
    columns: ['venueId','bandId','venueName','address','phone','contactPerson','defaultPay','notes','status','createdAt','updatedAt']
  },
  {
    name: 'SCHEDULE',
    color: '#9c27b0',
    description: 'ตารางงาน ทั้งงานประจำและงานนอก',
    columns: ['scheduleId','bandId','type','venueName','venueId','date','dayOfWeek','timeSlots','description','status','totalPay','notes','createdAt','updatedAt']
  },
  {
    name: 'ATTENDANCE_PAYROLL',
    color: '#ff5722',
    description: 'บันทึกลงเวลาและเบิกเงิน',
    columns: ['recordId','bandId','date','venueName','venueId','timeSlots','attendance','substitutes','priceAdjustments','totalAmount','paymentStatus','paidAt','createdAt','updatedAt']
  },
  {
    name: 'BAND_SONGS',
    color: '#607d8b',
    description: 'คลังเพลงของวง',
    columns: ['songId','bandId','name','artist','key','bpm','singer','mood','era','tags','notes','source','createdAt','updatedAt']
  },
  {
    name: 'HOURLY_RATES',
    color: '#795548',
    description: 'ค่าแรงพิเศษแยกตามสมาชิกและสถานที่',
    columns: ['rateId','bandId','memberId','venueId','startTime','endTime','hourlyRate','effectiveFrom','effectiveTo','createdAt','updatedAt']
  },
  {
    name: 'EQUIPMENT',
    color: '#00bcd4',
    description: 'อุปกรณ์และเครื่องดนตรีของวง',
    columns: ['equipmentId','bandId','name','type','owner','serialNo','purchaseDate','price','status','notes','createdAt','updatedAt']
  },
  {
    name: 'CLIENTS',
    color: '#4caf50',
    description: 'ข้อมูลลูกค้าและผู้ว่าจ้าง',
    columns: ['clientId','bandId','name','company','contactPerson','phone','email','lineId','address','notes','totalGigs','totalRevenue','createdAt','updatedAt']
  },
  {
    name: 'QUOTATIONS',
    color: '#ff9800',
    description: 'ใบเสนอราคาและใบเสร็จ',
    columns: ['quotationId','bandId','clientId','clientName','date','eventDate','eventType','venue','items','subtotal','vat','vatAmount','total','status','notes','docUrl','createdAt','updatedAt']
  }
];

// ============================================================
// MAIN
// ============================================================
function runSetup() {
  Logger.log('=== Band Management By SoulCiety — Setup Start ===');

  // ย้าย script นี้เข้า Drive folder ที่กำหนด
  try {
    var targetDriveFolder = DriveApp.getFolderById(SETUP_CONFIG.TARGET_FOLDER_ID);
    var scriptFile = DriveApp.getFileById(ScriptApp.getScriptId());
    scriptFile.moveTo(targetDriveFolder);
    Logger.log('Script moved to folder: ' + targetDriveFolder.getName());
  } catch(e) {
    Logger.log('Note: Could not move script file — ' + e.message);
  }

  // สร้าง Spreadsheet ตรงใน TARGET_FOLDER_ID เลย (ไม่สร้าง subfolder)
  var targetFolder = DriveApp.getFolderById(SETUP_CONFIG.TARGET_FOLDER_ID);
  Logger.log('Target Folder: ' + targetFolder.getName() + ' | ID: ' + targetFolder.getId());

  var ss = getOrCreateSpreadsheetInFolder(targetFolder, SETUP_CONFIG.SPREADSHEET_NAME);
  Logger.log('Spreadsheet: ' + ss.getName() + ' | ID: ' + ss.getId());

  var createdSheets = [];
  var existingSheets = [];
  SHEET_SCHEMAS.forEach(function(schema) {
    var result = setupSheet(ss, schema);
    if (result.created) createdSheets.push(schema.name);
    else existingSheets.push(schema.name);
  });
  removeDefaultSheet(ss);

  Logger.log('Created: ' + createdSheets.join(', '));
  Logger.log('Existing: ' + existingSheets.join(', '));

  var msg =
    '✅ Setup เสร็จสมบูรณ์!\n\n' +
    '📁 Folder: ' + targetFolder.getName() + '\n' +
    '📊 Spreadsheet ID: ' + ss.getId() + '\n' +
    '📝 สร้าง Sheet ใหม่: ' + (createdSheets.length > 0 ? createdSheets.join(', ') : 'ไม่มี (มีอยู่แล้ว)') + '\n\n' +
    'คัดลอก Spreadsheet ID ด้านบนไปใส่ใน ProjectProperties หรือผูก Script นี้กับ Spreadsheet นั้น';

  Logger.log(msg);
  try {
    SpreadsheetApp.getUi().alert('Band Management By SoulCiety', msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch(e) {
    Logger.log('UI not available — setup complete, see logs above.');
  }
}

// ============================================================
// HELPERS
// ============================================================
function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function getOrCreateFolderInParent(folderName, parentFolderId) {
  try {
    var parentFolder = DriveApp.getFolderById(parentFolderId);
    var folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) return folders.next();
    return parentFolder.createFolder(folderName);
  } catch(e) {
    Logger.log('Cannot access parent folder, creating at root: ' + e.message);
    return getOrCreateFolder(folderName);
  }
}

function getOrCreateSpreadsheetInFolder(folder, ssName) {
  var files = folder.getFilesByName(ssName);
  if (files.hasNext()) return SpreadsheetApp.open(files.next());
  var ss = SpreadsheetApp.create(ssName);
  var file = DriveApp.getFileById(ss.getId());
  file.moveTo(folder); // ย้ายเข้า folder เป้าหมายโดยตรง (แทน addFile/removeFile เก่า)
  return ss;
}

function setupSheet(ss, schema) {
  var sheet = ss.getSheetByName(schema.name);
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet(schema.name);
    created = true;
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(schema.columns);
  }
  var headerRange = sheet.getRange(1, 1, 1, schema.columns.length);
  headerRange.setFontWeight('bold');
  headerRange.setFontColor('#ffffff');
  headerRange.setBackground(schema.color);
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  for (var i = 1; i <= schema.columns.length; i++) {
    sheet.setColumnWidth(i, 140);
  }
  sheet.setTabColor(schema.color);
  return { created: created, sheet: sheet };
}

function removeDefaultSheet(ss) {
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }
}

// ============================================================
// ยกระดับผู้ใช้เป็น Admin
// วิธีใช้: แก้ EMAIL_TO_PROMOTE แล้วกด ▶ Run
// ============================================================
function promoteToAdmin() {
  var EMAIL_TO_PROMOTE = 'ใส่อีเมลของคุณที่นี่'; // <-- แก้ตรงนี้

  if (EMAIL_TO_PROMOTE === 'ใส่อีเมลของคุณที่นี่' || !EMAIL_TO_PROMOTE.includes('@')) {
    Logger.log('❌ กรุณาแก้ EMAIL_TO_PROMOTE ให้เป็นอีเมลจริงก่อน');
    SpreadsheetApp.getUi && SpreadsheetApp.getUi().alert('❌ กรุณาแก้ EMAIL_TO_PROMOTE ให้เป็นอีเมลจริงก่อน');
    return;
  }

  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!sheet) { Logger.log('❌ ไม่พบ Sheet USERS'); return; }

  var data = sheet.getDataRange().getValues();
  var header = data[0];
  var emailIdx = header.indexOf('email');
  var roleIdx  = header.indexOf('role');

  var emailLower = EMAIL_TO_PROMOTE.toLowerCase().trim();
  for (var i = 1; i < data.length; i++) {
    if ((data[i][emailIdx] || '').toString().toLowerCase().trim() === emailLower) {
      sheet.getRange(i + 1, roleIdx + 1).setValue('admin');
      Logger.log('✅ เปลี่ยน role ของ ' + EMAIL_TO_PROMOTE + ' เป็น admin เรียบร้อยแล้ว');
      try { SpreadsheetApp.getUi().alert('✅ เปลี่ยนเป็น Admin เรียบร้อย! กรุณา Login ใหม่'); } catch(e) {}
      return;
    }
  }
  Logger.log('❌ ไม่พบอีเมล: ' + EMAIL_TO_PROMOTE + ' (สมัครสมาชิกก่อนแล้วค่อยรัน function นี้)');
}
