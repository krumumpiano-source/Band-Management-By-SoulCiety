/**
 * Equipment Management Service
 * Band Management By SoulCiety
 * จัดการอุปกรณ์และเครื่องดนตรีของวง
 */

var EQUIPMENT_HEADERS = ['equipmentId','bandId','name','type','owner','serialNo','purchaseDate','price','status','notes','createdAt','updatedAt'];

function getAllEquipment(bandId) {
  try {
    var sheet = getOrCreateSheet(CONFIG.SHEETS.EQUIPMENT, EQUIPMENT_HEADERS);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    var headers = data[0];
    var items = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var item = {};
      for (var j = 0; j < headers.length; j++) item[headers[j]] = data[i][j];
      if (!bandId || item.bandId === bandId) items.push(item);
    }
    return { success: true, data: items };
  } catch (error) {
    Logger.log('getAllEquipment error: ' + error);
    return { success: false, message: error.toString() };
  }
}

function addEquipment(data) {
  try {
    if (!data.name || !data.name.trim()) return { success: false, message: 'กรุณากรอกชื่ออุปกรณ์' };
    var sheet = getOrCreateSheet(CONFIG.SHEETS.EQUIPMENT, EQUIPMENT_HEADERS);
    var id = 'EQ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    var now = new Date().toISOString();
    sheet.appendRow([
      id,
      data.bandId || '',
      data.name.trim(),
      data.type || '',
      data.owner || '',
      data.serialNo || '',
      data.purchaseDate || '',
      data.price || 0,
      data.status || 'normal',
      data.notes || '',
      now, now
    ]);
    return { success: true, data: { equipmentId: id, name: data.name.trim() } };
  } catch (error) {
    Logger.log('addEquipment error: ' + error);
    return { success: false, message: error.toString() };
  }
}

function updateEquipment(equipmentId, data) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.EQUIPMENT);
    var sheetData = sheet.getDataRange().getValues();
    var headers = sheetData[0];
    var rowIndex = -1;
    for (var i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === equipmentId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบอุปกรณ์' };
    var fields = ['name','type','owner','serialNo','purchaseDate','price','status','notes'];
    fields.forEach(function(f) {
      if (data[f] !== undefined) {
        sheet.getRange(rowIndex, headers.indexOf(f) + 1).setValue(data[f]);
      }
    });
    sheet.getRange(rowIndex, headers.indexOf('updatedAt') + 1).setValue(new Date().toISOString());
    return { success: true, message: 'อัปเดตอุปกรณ์เรียบร้อย' };
  } catch (error) {
    Logger.log('updateEquipment error: ' + error);
    return { success: false, message: error.toString() };
  }
}

function deleteEquipment(equipmentId) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.EQUIPMENT);
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === equipmentId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบอุปกรณ์' };
    sheet.deleteRow(rowIndex);
    return { success: true, message: 'ลบอุปกรณ์เรียบร้อย' };
  } catch (error) {
    Logger.log('deleteEquipment error: ' + error);
    return { success: false, message: error.toString() };
  }
}
