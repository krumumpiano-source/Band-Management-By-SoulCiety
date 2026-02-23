/**
 * Band Member Management Service
 * Band Management By SoulCiety
 */

function getAllBandMembers() {
  try {
    var sheet = getOrCreateSheet(CONFIG.SHEETS.BAND_MEMBERS, [
      'memberId','bandId','name','position','phone','email','defaultHourlyRate','status','joinedAt','createdAt','updatedAt'
    ]);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    var headers = data[0];
    var members = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var member = {};
      for (var j = 0; j < headers.length; j++) member[headers[j]] = data[i][j];
      if (member.status !== 'inactive') members.push(member);
    }
    return { success: true, data: members };
  } catch (error) {
    Logger.log('getAllBandMembers error: ' + error);
    return { success: false, message: error.toString() };
  }
}

function addBandMember(memberData) {
  try {
    if (!memberData.name || !memberData.name.trim()) {
      return { success: false, message: 'กรุณากรอกชื่อสมาชิก' };
    }
    var sheet = getOrCreateSheet(CONFIG.SHEETS.BAND_MEMBERS, [
      'memberId','bandId','name','position','phone','email','defaultHourlyRate','status','joinedAt','createdAt','updatedAt'
    ]);
    var id = 'MEMBER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    var now = new Date().toISOString();
    sheet.appendRow([
      id,
      memberData.bandId || '',
      memberData.name.trim(),
      memberData.position || '',
      memberData.phone || '',
      memberData.email || '',
      memberData.defaultHourlyRate || 0,
      'active',
      memberData.joinedAt || now.slice(0, 10),
      now, now
    ]);
    return { success: true, data: { memberId: id, name: memberData.name.trim() } };
  } catch (error) {
    Logger.log('addBandMember error: ' + error);
    return { success: false, message: error.toString() };
  }
}

function updateBandMember(memberId, memberData) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.BAND_MEMBERS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === memberId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบสมาชิก' };
    var fields = ['name','position','phone','email','defaultHourlyRate','status'];
    fields.forEach(function(f) {
      if (memberData[f] !== undefined) {
        sheet.getRange(rowIndex, headers.indexOf(f) + 1).setValue(memberData[f]);
      }
    });
    sheet.getRange(rowIndex, headers.indexOf('updatedAt') + 1).setValue(new Date().toISOString());
    return { success: true, message: 'อัปเดตข้อมูลสมาชิกเรียบร้อย' };
  } catch (error) {
    Logger.log('updateBandMember error: ' + error);
    return { success: false, message: error.toString() };
  }
}

function deleteBandMember(memberId) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.BAND_MEMBERS);
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === memberId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบสมาชิก' };
    sheet.deleteRow(rowIndex);
    return { success: true, message: 'ลบสมาชิกเรียบร้อย' };
  } catch (error) {
    Logger.log('deleteBandMember error: ' + error);
    return { success: false, message: error.toString() };
  }
}
