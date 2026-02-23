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
  try {
    var ss = getGlobalSongsSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.GLOBAL_SONGS);
    if (!sheet) return { success: false, message: 'ไม่พบ sheet เพลงกลาง' };
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    var songs = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] || !row[0].toString().trim()) continue;
      var male = row[5] === true || row[5] === 'TRUE' || row[5] === 1;
      var female = row[6] === true || row[6] === 'TRUE' || row[6] === 1;
      var singer = male && female ? 'duet' : male ? 'male' : female ? 'female' : '';
      songs.push({
        id: 'GLOBAL_' + i,
        name: (row[0] || '').toString().trim(),
        key: (row[1] || '').toString().trim(),
        keyNote: (row[2] || '').toString().trim(),
        bpm: row[3] ? (isNaN(row[3]) ? '' : parseInt(row[3])) : '',
        era: (row[4] || '').toString().trim(),
        male: male, female: female, singer: singer,
        mood: (row[7] || '').toString().trim(),
        source: 'global', bandId: ''
      });
    }
    return { success: true, data: songs };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function getAllBandSongs(bandId) {
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
    return { success: true, data: songs };
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
    return { success: true };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
