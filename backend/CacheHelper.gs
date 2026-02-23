/**
 * Cache Helper — CacheService wrapper
 * Band Management By SoulCiety
 *
 * ใช้ CacheService.getScriptCache() (shared ทุก user, max 6 ชั่วโมง, max 100KB/entry)
 * เหมาะกับ read-heavy data เช่น เพลงกลาง, สมาชิกวง ฯลฯ
 */

var CACHE_TTL = {
  GLOBAL_SONGS: 300,  // 5 นาที — คลังเพลงกลางเปลี่ยนนานๆ ครั้ง
  BAND_DATA:     60,  // 60 วิ   — ข้อมูลวง/สมาชิก
  SHORT:         30,  // 30 วิ   — ข้อมูลที่เปลี่ยนบ่อย
};

// ============================================================
// GET — ดึงข้อมูลจาก Cache (คืน null ถ้าหมดอายุหรือไม่มี)
// ============================================================
function cacheGet(key) {
  try {
    var val = CacheService.getScriptCache().get(key);
    if (!val) return null;
    return JSON.parse(val);
  } catch(e) {
    return null;
  }
}

// ============================================================
// SET — บันทึกข้อมูลลง Cache (ข้ามถ้า data ใหญ่เกิน 100KB)
// ============================================================
function cacheSet(key, data, ttl) {
  try {
    var str = JSON.stringify(data);
    if (str.length < 100000) {
      CacheService.getScriptCache().put(key, str, ttl || CACHE_TTL.BAND_DATA);
    }
  } catch(e) {
    // ถ้า cache ไม่สำเร็จ ไม่ใช่ error ร้ายแรง ให้ continue
    Logger.log('[Cache] cacheSet failed: ' + e.message);
  }
}

// ============================================================
// DELETE — ลบ Cache key เดี่ยว (ใช้ตอน write/update/delete)
// ============================================================
function cacheDelete(key) {
  try {
    CacheService.getScriptCache().remove(key);
  } catch(e) {}
}

// ============================================================
// DELETE MULTIPLE — ลบหลาย key พร้อมกัน (max 30 keys ต่อครั้ง)
// ============================================================
function cacheDeleteMany(keys) {
  try {
    if (!keys || !keys.length) return;
    CacheService.getScriptCache().removeAll(keys);
  } catch(e) {}
}

// ============================================================
// INVALIDATE BAND — ลบ cache ทั้งหมดที่เกี่ยวกับ bandId หนึ่งๆ
// ใช้หลัง add/update/delete ข้อมูลวง
// ============================================================
function cacheInvalidateBand(prefix, bandId) {
  var keys = [];
  var currentYear = new Date().getFullYear();
  // ลบ page 1-20 สำหรับ 3 ปี (ปัจจุบัน ±1) และ pageSize 20, 50, 100
  [currentYear - 1, currentYear, currentYear + 1, ''].forEach(function(y) {
    [20, 50, 100].forEach(function(ps) {
      for (var p = 1; p <= 20; p++) {
        keys.push(prefix + '_' + bandId + '_' + y + '_' + p + '_' + ps);
      }
    });
  });
  // ลบ key แบบไม่มี page (fetch ทั้งหมด)
  keys.push(prefix + '_' + bandId);
  keys.push('band_songs_' + bandId);
  keys.push('band_members_' + bandId);
  keys.push('equipment_' + bandId);
  keys.push('clients_' + bandId);
  keys.push('quotations_' + bandId);

  // CacheService.removeAll รับได้สูงสุด 30 key ต่อ call → แบ่ง batch
  var batchSize = 30;
  for (var i = 0; i < keys.length; i += batchSize) {
    cacheDeleteMany(keys.slice(i, i + batchSize));
  }
}
