/**
 * Song Management Service
 * Band Management By SoulCiety
 *
 * แหล่งข้อมูลเพลง: Google Spreadsheet คลังเพลงกลาง
 *   ID: CONFIG.GLOBAL_SONGS_SPREADSHEET_ID
 *   ชื่อ Sheet: CONFIG.SONG_SHEET_PREFIX + bandName (เช่น "ลิสเพลงSoulCiety")
 *
 * คอลัมน์ในแต่ละ Sheet:
 *   A: ชื่อเพลง  B: คีย์  C: คีย์ (ตัวโน้ต)  D: ความเร็ว  E: ปีของเพลง  F: ชาย  G: หญิง  H: อารมณ์เพลง
 */

// header row สำหรับ sheet ที่สร้างใหม่
var SONG_HEADERS = ['ชื่อเพลง','คีย์','คีย์ (ตัวโน้ต)','ความเร็ว','ปีของเพลง','ชาย','หญิง','อารมณ์เพลง'];

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

/**
 * คืน object { ss, sheet } จากคลังเพลงกลาง
 * ถ้าไม่มี sheet ของวงนี้ จะสร้างใหม่พร้อม header
 */
function getSongSheet(bandName) {
  if (!bandName) throw new Error('ต้องระบุชื่อวง (bandName)');
  var ss = SpreadsheetApp.openById(CONFIG.GLOBAL_SONGS_SPREADSHEET_ID);
  var sheetName = CONFIG.SONG_SHEET_PREFIX + bandName;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(SONG_HEADERS);
    var hRange = sheet.getRange(1, 1, 1, SONG_HEADERS.length);
    hRange.setFontWeight('bold');
    hRange.setBackground('#2d3748');
    hRange.setFontColor('#f6ad55');
    sheet.setFrozenRows(1);
  }
  return { ss: ss, sheet: sheet };
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
  var singer = (male && female) ? 'duet' : male ? 'male' : female ? 'female' : '';
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
    singer:   singer,
    mood:     (row[7] || '').toString().trim(),
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

// ──────────────────────────────────────────────────────────────
// PUBLIC API
// ──────────────────────────────────────────────────────────────

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
  var cacheKey = 'songs_' + bandName;
  var cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    var obj   = getSongSheet(bandName);
    var data  = obj.sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    var songs = [];
    for (var i = 1; i < data.length; i++) {
      var name = (data[i][0] || '').toString().trim();
      if (!name) continue;
      songs.push(rowToSong(data[i], i + 1, bandName)); // row i+1 (sheet row, header=row1)
    }
    var result = { success: true, data: songs };
    cacheSet(cacheKey, result, CACHE_TTL.GLOBAL_SONGS || 300);
    return result;
  } catch(e) {
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
    var male   = songData.singer === 'male'   || songData.singer === 'duet' || songData.male   === true;
    var female = songData.singer === 'female' || songData.singer === 'duet' || songData.female === true;

    sheet.appendRow([
      name,
      songData.key     || '',
      songData.keyNote || '',
      songData.bpm     || '',
      songData.era     || '',
      male,
      female,
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
    if (songData.singer !== undefined || songData.male !== undefined || songData.female !== undefined) {
      var male   = songData.singer === 'male'   || songData.singer === 'duet' ||
                   (songData.male   !== undefined ? songData.male   : (data[rowNum-1][5] === true));
      var female = songData.singer === 'female' || songData.singer === 'duet' ||
                   (songData.female !== undefined ? songData.female : (data[rowNum-1][6] === true));
      sheet.getRange(rowNum, 6).setValue(male);
      sheet.getRange(rowNum, 7).setValue(female);
    }
    if (songData.mood !== undefined) sheet.getRange(rowNum, 8).setValue(songData.mood);

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

  try {
    if (!source || source === 'global') return getAllGlobalSongs();
    if (source === 'band' && bandId) return getAllBandSongs(bandId);
    return { success: true, data: [] };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function getAllGlobalSongs() {
  // Cache เพลงกลาง 5 นาที (เปลี่ยนนานๆ ครั้ง)
  var cacheKey = 'global_songs';
  var cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    var ss = getGlobalSongsSpreadsheet();
    // ลอง sheet ชื่อที่กำหนดก่อน ถ้าไม่เจอให้ใช้ sheet แรก
    var sheet = ss.getSheetByName(CONFIG.SHEETS.GLOBAL_SONGS) || ss.getSheets()[0];
    if (!sheet) return { success: false, message: 'ไม่พบ sheet เพลงกลาง' };
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    // หาแถว header (แถวแรกที่มีข้อมูล ชื่อเพลง/คีย์ ฯลฯ)
    var startRow = 1; // ข้ามแถว header
    var songs = [];
    for (var i = startRow; i < data.length; i++) {
      var row = data[i];
      var name = (row[0] || '').toString().trim();
      if (!name) continue;
      // col F, G เป็น checkbox — อาจเป็น TRUE/FALSE หรือ true/false หรือ 1/0
      var male   = row[5] === true || String(row[5]).toUpperCase() === 'TRUE' || row[5] === 1;
      var female = row[6] === true || String(row[6]).toUpperCase() === 'TRUE' || row[6] === 1;
      var singer = (male && female) ? 'duet' : male ? 'male' : female ? 'female' : '';
      var bpmRaw = row[3];
      var bpm = (bpmRaw !== '' && !isNaN(bpmRaw)) ? parseInt(bpmRaw) : 0;
      songs.push({
        id:      'GLOBAL_' + i,
        name:    name,
        key:     (row[1] || '').toString().trim(),   // คีย์ (2b, 3#, C ...)
        keyNote: (row[2] || '').toString().trim(),   // คีย์ตัวโน้ต (Bb, D, G ...)
        bpm:     bpm,
        era:     (row[4] || '').toString().trim(),   // ปีของเพลง
        male:    male,
        female:  female,
        singer:  singer,
        mood:    (row[7] || '').toString().trim(),   // อารมณ์เพลง
        source:  'global',
        bandId:  ''
      });
    }
    var result = { success: true, data: songs };
    cacheSet(cacheKey, result, CACHE_TTL.GLOBAL_SONGS);
    return result;
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function getAllBandSongs(bandId) {
  // Cache เพลงวง 60 วิ
  var cacheKey = 'band_songs_' + bandId;
  var cached = cacheGet(cacheKey);
  if (cached) return cached;
  try {
    var sheet = getOrCreateSheet(CONFIG.SHEETS.BAND_SONGS, [
      'songId','bandId','name','artist','key','bpm','singer','mood','era','tags','notes','source','createdAt','updatedAt'
    ]);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    var headers = data[0];
    var songs = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var song = {};
      for (var j = 0; j < headers.length; j++) song[headers[j]] = data[i][j];
      if (song.bandId === bandId) songs.push(song);
    }
    var result = { success: true, data: songs };
    cacheSet(cacheKey, result, CACHE_TTL.BAND_DATA);
    return result;
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function addSong(songData) {
  try {
    if (!songData.name || !songData.name.trim()) return { success: false, message: 'กรุณากรอกชื่อเพลง' };
    if (songData.source === 'global') return { success: false, message: 'ไม่สามารถเพิ่มเพลงเข้าคลังกลางได้' };
    var sheet = getOrCreateSheet(CONFIG.SHEETS.BAND_SONGS, [
      'songId','bandId','name','artist','key','bpm','singer','mood','era','tags','notes','source','createdAt','updatedAt'
    ]);
    var id = 'SONG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    var now = new Date().toISOString();
    sheet.appendRow([
      id, songData.bandId || '', songData.name.trim(), songData.artist || '',
      songData.key || '', songData.bpm || '', songData.singer || '',
      songData.mood || '', songData.era || '',
      JSON.stringify(songData.tags || []), songData.notes || '',
      'band', now, now
    ]);
    cacheDelete('band_songs_' + (songData.bandId || ''));
    return { success: true, data: { songId: id } };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function updateSong(songId, songData) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.BAND_SONGS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === songId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบเพลง' };
    var fields = ['name','artist','key','bpm','singer','mood','era','notes'];
    fields.forEach(function(f) {
      if (songData[f] !== undefined) {
        sheet.getRange(rowIndex, headers.indexOf(f) + 1).setValue(songData[f]);
      }
    });
    // tags เป็น JSON array — ต้อง stringify ก่อนบันทึก
    if (songData.tags !== undefined) {
      var tagsCol = headers.indexOf('tags');
      if (tagsCol >= 0) sheet.getRange(rowIndex, tagsCol + 1).setValue(JSON.stringify(songData.tags || []));
    }
    sheet.getRange(rowIndex, headers.indexOf('updatedAt') + 1).setValue(new Date().toISOString());
    // Invalidate cache (ไม่รู้ bandId แน่ๆ → ลบ global songs ด้วยเผื่อ)
    cacheDelete('global_songs');
    cacheDelete('band_songs_' + (songData.bandId || ''));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function deleteSong(songId) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.BAND_SONGS);
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === songId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบเพลง' };
    sheet.deleteRow(rowIndex);
    cacheDelete('global_songs');
    return { success: true };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
