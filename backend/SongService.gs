/**
 * Song Management Service
 * Band Management By SoulCiety
 *
 * แหล่งข้อมูลเพลง: Google Spreadsheet คลังเพลงกลาง
 *   ID: CONFIG.GLOBAL_SONGS_SPREADSHEET_ID
 *   ชื่อ Sheet: CONFIG.SONG_SHEET_PREFIX + bandName (เช่น "ลิสเพลงSoulCiety")
 *
 * คอลัมน์ในแต่ละ Sheet:
 *   A: ชื่อเพลง  B: คีย์  C: คีย์ (ตัวโน้ต)  D: ความเร็ว  E: ปีของเพลง  F: ชาย  G: หญิง  H: คู่  I: อารมณ์เพลง
 */

// header row สำหรับ sheet ที่สร้างใหม่
var SONG_HEADERS = ['ชื่อเพลง','คีย์','คีย์ (ตัวโน้ต)','ความเร็ว','ปีของเพลง','ชาย','หญิง','คู่','อารมณ์เพลง'];

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

/**
 * คืน object { ss, sheet, resolvedBandName } จากคลังเพลงกลาง
 * fallback: ถ้าชื่อ sheet ไม่ตรงพอดี ให้ค้นหา sheet แรกที่ขึ้นต้นด้วย prefix
 * ถ้าไม่เจอเลย จะสร้างใหม่
 */
function getSongSheet(bandName) {
  var ss = SpreadsheetApp.openById(CONFIG.GLOBAL_SONGS_SPREADSHEET_ID);
  var prefix = CONFIG.SONG_SHEET_PREFIX; // 'ลิสเพลง'

  // 1. ลองชื่อตรงๆ ก่อน
  var sheetName = prefix + (bandName || '');
  var sheet = bandName ? ss.getSheetByName(sheetName) : null;

  // 2. fallback: หา sheet แรกที่ชื่อขึ้นต้นด้วย prefix
  if (!sheet) {
    var allSheets = ss.getSheets();
    for (var i = 0; i < allSheets.length; i++) {
      if (allSheets[i].getName().indexOf(prefix) === 0) {
        sheet = allSheets[i];
        // อัปเดต bandName ให้ตรงกับ sheet ที่เจอ
        bandName = allSheets[i].getName().replace(prefix, '');
        sheetName = allSheets[i].getName();
        Logger.log('getSongSheet: fallback to sheet "' + sheetName + '"');
        break;
      }
    }
  }

  // 3. ถ้ายังไม่เจอเลย สร้างใหม่
  if (!sheet) {
    if (!bandName) bandName = 'Default';
    sheetName = prefix + bandName;
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(SONG_HEADERS);
    var hRange = sheet.getRange(1, 1, 1, SONG_HEADERS.length);
    hRange.setFontWeight('bold');
    hRange.setBackground('#2d3748');
    hRange.setFontColor('#f6ad55');
    sheet.setFrozenRows(1);
    Logger.log('getSongSheet: created new sheet "' + sheetName + '"');
  }

  return { ss: ss, sheet: sheet, bandName: bandName };
}

/**
 * ค้นหาชื่อวงจาก bandId ใน BANDS sheet (ถ้าไม่เจอ คืนค่า bandId)
 */
function lookupBandName(bandId) {
  try {
    var sheet = getOperationalSpreadsheet().getSheetByName(CONFIG.SHEETS.BANDS);
    if (!sheet) return bandId;
    var data = sheet.getDataRange().getValues();
    var h = data[0];
    var idCol   = h.indexOf('bandId');
    var nameCol = h.indexOf('bandName');
    if (idCol < 0 || nameCol < 0) return bandId;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(bandId)) return data[i][nameCol] || bandId;
    }
  } catch(e) {}
  return bandId;
}

/**
 * แปลงแถวข้อมูลเป็น song object
 */
function rowToSong(row, rowNum, bandName) {
  var male   = row[5] === true || String(row[5]).toUpperCase() === 'TRUE' || row[5] === 1;
  var female = row[6] === true || String(row[6]).toUpperCase() === 'TRUE' || row[6] === 1;
  var duet   = row[7] === true || String(row[7]).toUpperCase() === 'TRUE' || row[7] === 1;
  var singer = (duet || (male && female)) ? 'duet' : male ? 'male' : female ? 'female' : '';
  var bpmRaw = row[3];
  var bpm = (bpmRaw !== '' && !isNaN(bpmRaw)) ? parseInt(bpmRaw) : 0;
  return {
    songId:   'EXT_' + encodeURIComponent(bandName) + '_' + rowNum,
    id:       'EXT_' + encodeURIComponent(bandName) + '_' + rowNum,
    name:     (row[0] || '').toString().trim(),
    key:      (row[1] || '').toString().trim(),
    keyNote:  (row[2] || '').toString().trim(),
    bpm:      bpm,
    era:      (row[4] || '').toString().trim(),
    male:     male,
    female:   female,
    duet:     duet,
    singer:   singer,
    mood:     (row[8] || '').toString().trim(),
    source:   'global',
    bandName: bandName
  };
}

/**
 * parse songId → rowNum (sheet row number, 1-based)
 * รูปแบบ: EXT_{encodedBandName}_{rowNum}
 */
function parseRowNum(songId) {
  if (!songId) return -1;
  var parts = String(songId).split('_');
  var n = parseInt(parts[parts.length - 1]);
  return isNaN(n) ? -1 : n;
}

/**
 * parse songId → bandName
 * รูปแบบ: EXT_{encodedBandName}_{rowNum}
 */
function parseBandNameFromSongId(songId) {
  if (!songId) return '';
  var parts = String(songId).split('_');
  if (parts.length < 3) return '';
  // parts[0]='EXT', parts[last]=rowNum, middle parts = encoded band name
  var encoded = parts.slice(1, parts.length - 1).join('_');
  try { return decodeURIComponent(encoded); } catch(e) { return encoded; }
}

// ──────────────────────────────────────────────────────────────
// PUBLIC API
// ──────────────────────────────────────────────────────────────

/**
 * ดึงข้อมูลเพลงเดี่ยว
 * params: { songId: 'EXT_{encodedBandName}_{rowNum}' }
 */
function getSong(params) {
  try {
    var songId = (params && params.songId) ? String(params.songId) : '';
    if (!songId) return { success: false, message: 'ไม่มี songId' };
    var rowNum  = parseRowNum(songId);
    var bandName = parseBandNameFromSongId(songId);
    if (rowNum < 2) return { success: false, message: 'songId ไม่ถูกต้อง' };
    if (!bandName) return { success: false, message: 'ไม่พบชื่อวงใน songId' };
    var obj  = getSongSheet(bandName);
    var data = obj.sheet.getDataRange().getValues();
    if (rowNum > data.length) return { success: false, message: 'ไม่พบแถวเพลงใน sheet' };
    var row  = data[rowNum - 1];
    var song = rowToSong(row, rowNum, obj.bandName);
    return { success: true, data: song };
  } catch(e) {
    Logger.log('getSong error: ' + e);
    return { success: false, message: e.toString() };
  }
}

function getAllSongs(source, bandId, bandName) {
  try {
    var name = bandName || (bandId ? lookupBandName(bandId) : '');
    if (!name) return { success: false, message: 'ไม่ทราบชื่อวง' };
    return getAllSongsForBand(name);
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function getAllSongsForBand(bandName) {
  var cacheKey = 'songs_' + (bandName || 'default');
  var cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    var obj      = getSongSheet(bandName);   // obj.bandName may differ from arg if fallback
    var resolved = obj.bandName;
    var data     = obj.sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    var songs = [];
    for (var i = 1; i < data.length; i++) {
      var name = (data[i][0] || '').toString().trim();
      if (!name) continue;
      songs.push(rowToSong(data[i], i + 1, resolved));
    }
    var result = { success: true, data: songs };
    cacheSet(cacheKey, result, CACHE_TTL.GLOBAL_SONGS || 300);
    return result;
  } catch(e) {
    Logger.log('getAllSongsForBand error: ' + e);
    return { success: false, message: e.toString() };
  }
}

function addSong(songData) {
  try {
    var name = (songData.name || '').trim();
    if (!name) return { success: false, message: 'กรุณากรอกชื่อเพลง' };
    var bandName = songData.bandName || (songData.bandId ? lookupBandName(songData.bandId) : '');
    if (!bandName) return { success: false, message: 'ไม่ทราบชื่อวง' };

    var obj   = getSongSheet(bandName);
    var sheet = obj.sheet;
    var male   = songData.singer === 'male'   || songData.male   === true;
    var female = songData.singer === 'female' || songData.female === true;
    var duet   = songData.singer === 'duet'   || songData.duet   === true;
    // ถ้า singer='duet' ให้เช็ค male+female+duet ทั้งหมด
    if (duet) { male = true; female = true; }

    sheet.appendRow([
      name,
      songData.key     || '',
      songData.keyNote || '',
      songData.bpm     || '',
      songData.era     || '',
      male,
      female,
      duet,
      songData.mood    || ''
    ]);

    var newRowNum = sheet.getLastRow(); // row number of the just-appended row
    var newId = 'EXT_' + encodeURIComponent(bandName) + '_' + newRowNum;

    cacheDelete('songs_' + bandName);
    return { success: true, data: { songId: newId, id: newId } };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function updateSong(songId, songData) {
  try {
    var bandName = songData.bandName || (songData.bandId ? lookupBandName(songData.bandId) : '');
    if (!bandName) return { success: false, message: 'ไม่ทราบชื่อวง' };

    var obj   = getSongSheet(bandName);
    var sheet = obj.sheet;
    var rowNum = parseRowNum(songId);
    if (rowNum < 2) return { success: false, message: 'songId ไม่ถูกต้อง' };

    var data = sheet.getDataRange().getValues();
    // ตรวจสอบว่า row นั้นยังมีข้อมูลอยู่
    if (rowNum > data.length) return { success: false, message: 'ไม่พบเพลง' };

    // ถ้าส่งชื่อใหม่มา ค้นหาจากชื่อเดิมก่อน
    if (songData.name !== undefined) sheet.getRange(rowNum, 1).setValue(songData.name.trim());
    if (songData.key      !== undefined) sheet.getRange(rowNum, 2).setValue(songData.key);
    if (songData.keyNote  !== undefined) sheet.getRange(rowNum, 3).setValue(songData.keyNote);
    if (songData.bpm      !== undefined) sheet.getRange(rowNum, 4).setValue(songData.bpm);
    if (songData.era      !== undefined) sheet.getRange(rowNum, 5).setValue(songData.era);
    if (songData.singer !== undefined || songData.male !== undefined || songData.female !== undefined || songData.duet !== undefined) {
      var newMale   = songData.singer === 'male'   || songData.male   === true ||
                      (songData.singer !== 'female' && songData.singer !== 'duet' && songData.male === undefined && data[rowNum-1][5] === true);
      var newFemale = songData.singer === 'female' || songData.female === true ||
                      (songData.singer !== 'male' && songData.singer !== 'duet' && songData.female === undefined && data[rowNum-1][6] === true);
      var newDuet   = songData.singer === 'duet'   || songData.duet   === true ||
                      (songData.duet === undefined && data[rowNum-1][7] === true);
      if (newDuet) { newMale = true; newFemale = true; }
      sheet.getRange(rowNum, 6).setValue(newMale);
      sheet.getRange(rowNum, 7).setValue(newFemale);
      sheet.getRange(rowNum, 8).setValue(newDuet);
    }
    if (songData.mood !== undefined) sheet.getRange(rowNum, 9).setValue(songData.mood);

    cacheDelete('songs_' + bandName);
    return { success: true };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function deleteSong(songId, bandName) {
  try {
    if (!bandName) {
      // พยายาม decode จาก songId เช่น EXT_SoulCiety_5
      var parts = String(songId).split('_');
      if (parts.length >= 3) bandName = decodeURIComponent(parts.slice(1, -1).join('_'));
    }
    if (!bandName) return { success: false, message: 'ไม่ทราบชื่อวง' };

    var obj   = getSongSheet(bandName);
    var sheet = obj.sheet;
    var rowNum = parseRowNum(songId);
    if (rowNum < 2) return { success: false, message: 'songId ไม่ถูกต้อง' };
    if (rowNum > sheet.getLastRow()) return { success: false, message: 'ไม่พบเพลง' };

    sheet.deleteRow(rowNum);
    cacheDelete('songs_' + bandName);
    return { success: true };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}
