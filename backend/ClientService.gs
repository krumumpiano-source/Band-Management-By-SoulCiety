/**
 * Client Management Service
 * Band Management By SoulCiety
 * จัดการข้อมูลลูกค้าและผู้ว่าจ้าง
 */

var CLIENT_HEADERS = ['clientId','bandId','name','company','contactPerson','phone','email','lineId','address','notes','totalGigs','totalRevenue','createdAt','updatedAt'];

function getAllClients(bandId) {
  try {
    var sheet = getOrCreateSheet(CONFIG.SHEETS.CLIENTS, CLIENT_HEADERS);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    var headers = data[0];
    var clients = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var client = {};
      for (var j = 0; j < headers.length; j++) client[headers[j]] = data[i][j];
      if (!bandId || client.bandId === bandId) clients.push(client);
    }
    return { success: true, data: clients };
  } catch (error) {
    Logger.log('getAllClients error: ' + error);
    return { success: false, message: error.toString() };
  }
}

function addClient(data) {
  try {
    if (!data.name || !data.name.trim()) return { success: false, message: 'กรุณากรอกชื่อลูกค้า' };
    var sheet = getOrCreateSheet(CONFIG.SHEETS.CLIENTS, CLIENT_HEADERS);
    var id = 'CLIENT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    var now = new Date().toISOString();
    sheet.appendRow([
      id,
      data.bandId || '',
      data.name.trim(),
      data.company || '',
      data.contactPerson || '',
      data.phone || '',
      data.email || '',
      data.lineId || '',
      data.address || '',
      data.notes || '',
      0, 0,
      now, now
    ]);
    return { success: true, data: { clientId: id, name: data.name.trim() } };
  } catch (error) {
    Logger.log('addClient error: ' + error);
    return { success: false, message: error.toString() };
  }
}

function updateClient(clientId, data) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.CLIENTS);
    var sheetData = sheet.getDataRange().getValues();
    var headers = sheetData[0];
    var rowIndex = -1;
    for (var i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === clientId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบลูกค้า' };
    var fields = ['name','company','contactPerson','phone','email','lineId','address','notes','totalGigs','totalRevenue'];
    fields.forEach(function(f) {
      if (data[f] !== undefined) {
        sheet.getRange(rowIndex, headers.indexOf(f) + 1).setValue(data[f]);
      }
    });
    sheet.getRange(rowIndex, headers.indexOf('updatedAt') + 1).setValue(new Date().toISOString());
    return { success: true, message: 'อัปเดตข้อมูลลูกค้าเรียบร้อย' };
  } catch (error) {
    Logger.log('updateClient error: ' + error);
    return { success: false, message: error.toString() };
  }
}

function deleteClient(clientId) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.CLIENTS);
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === clientId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบลูกค้า' };
    sheet.deleteRow(rowIndex);
    return { success: true, message: 'ลบลูกค้าเรียบร้อย' };
  } catch (error) {
    Logger.log('deleteClient error: ' + error);
    return { success: false, message: error.toString() };
  }
}
