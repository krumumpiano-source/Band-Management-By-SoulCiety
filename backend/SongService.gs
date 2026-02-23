/**
 * Song Management Service
 * Band Management By SoulCiety
 */

function getAllSongs(source, bandId) {
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
