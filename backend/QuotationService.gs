/**
 * Quotation Service
 * Band Management By SoulCiety
 * สร้างและจัดการใบเสนอราคา / ใบเสร็จ
 */

var QUOTATION_HEADERS = ['quotationId','bandId','clientId','clientName','date','eventDate','eventType','venue','items','subtotal','vat','vatAmount','total','status','notes','docUrl','createdAt','updatedAt'];

function getAllQuotations(bandId) {
  try {
    var sheet = getOrCreateSheet(CONFIG.SHEETS.QUOTATIONS, QUOTATION_HEADERS);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    var headers = data[0];
    var results = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var q = {};
      for (var j = 0; j < headers.length; j++) q[headers[j]] = data[i][j];
      if (!bandId || q.bandId === bandId) {
        try { q.items = JSON.parse(q.items || '[]'); } catch(e) { q.items = []; }
        results.push(q);
      }
    }
    results.sort(function(a,b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
    return { success: true, data: results };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function addQuotation(data) {
  try {
    if (!data.clientName) return { success: false, message: 'กรุณาระบุชื่อลูกค้า' };
    var sheet = getOrCreateSheet(CONFIG.SHEETS.QUOTATIONS, QUOTATION_HEADERS);
    var count = sheet.getLastRow();
    var qNumber = 'QT-' + new Date().getFullYear() + '-' + String(count).padStart(4, '0');
    var id = 'QT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    var vat = data.vat || 0;
    var subtotal = data.subtotal || 0;
    var vatAmount = subtotal * (vat / 100);
    var total = subtotal + vatAmount;
    var now = new Date().toISOString();
    sheet.appendRow([
      id,
      data.bandId || '',
      data.clientId || '',
      data.clientName,
      data.date || now.slice(0,10),
      data.eventDate || '',
      data.eventType || '',
      data.venue || '',
      JSON.stringify(data.items || []),
      subtotal, vat, vatAmount, total,
      data.status || 'draft',
      data.notes || '',
      '', now, now
    ]);
    return { success: true, data: { quotationId: id, quotationNumber: qNumber, total: total } };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function updateQuotation(quotationId, data) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.QUOTATIONS);
    var sheetData = sheet.getDataRange().getValues();
    var headers = sheetData[0];
    var rowIndex = -1;
    for (var i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === quotationId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบใบเสนอราคา' };
    var fields = ['clientName','clientId','date','eventDate','eventType','venue','subtotal','vat','vatAmount','total','status','notes','docUrl'];
    fields.forEach(function(f) {
      if (data[f] !== undefined) {
        sheet.getRange(rowIndex, headers.indexOf(f) + 1).setValue(data[f]);
      }
    });
    if (data.items !== undefined) {
      sheet.getRange(rowIndex, headers.indexOf('items') + 1).setValue(JSON.stringify(data.items));
    }
    sheet.getRange(rowIndex, headers.indexOf('updatedAt') + 1).setValue(new Date().toISOString());
    return { success: true };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function deleteQuotation(quotationId) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.QUOTATIONS);
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === quotationId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบใบเสนอราคา' };
    sheet.deleteRow(rowIndex);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * สร้าง PDF จากใบเสนอราคา บันทึกลง Google Drive
 */
function generateQuotationPdf(quotationId) {
  try {
    var sheet = getSheet(CONFIG.SHEETS.QUOTATIONS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === quotationId) { rowIndex = i; break; }
    }
    if (rowIndex === -1) return { success: false, message: 'ไม่พบใบเสนอราคา' };

    var q = {};
    for (var j = 0; j < headers.length; j++) q[headers[j]] = data[rowIndex][j];
    var items = [];
    try { items = JSON.parse(q.items || '[]'); } catch(e) {}

    // สร้าง Google Doc
    var docTitle = 'ใบเสนอราคา_' + (q.clientName || '') + '_' + (q.date || '');
    var doc = DocumentApp.create(docTitle);
    var body = doc.getBody();

    body.appendParagraph('Band Management By SoulCiety').setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph('ใบเสนอราคา / Quotation').setHeading(DocumentApp.ParagraphHeading.HEADING2).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph('');
    body.appendParagraph('ลูกค้า: ' + (q.clientName || '-'));
    body.appendParagraph('วันที่: ' + (q.date || '-'));
    body.appendParagraph('วันจัดงาน: ' + (q.eventDate || '-'));
    body.appendParagraph('ประเภทงาน: ' + (q.eventType || '-'));
    body.appendParagraph('สถานที่: ' + (q.venue || '-'));
    body.appendParagraph('');

    // Items table
    if (items.length > 0) {
      var table = body.appendTable();
      var headerRow = table.appendTableRow();
      ['รายการ','จำนวน','ราคา/หน่วย','รวม'].forEach(function(h) {
        headerRow.appendTableCell(h).setBackgroundColor('#2d3748');
      });
      items.forEach(function(item) {
        var row = table.appendTableRow();
        row.appendTableCell(item.description || '');
        row.appendTableCell(String(item.qty || 1));
        row.appendTableCell(String(item.unitPrice || 0));
        row.appendTableCell(String((item.qty || 1) * (item.unitPrice || 0)));
      });
    }

    body.appendParagraph('');
    body.appendParagraph('ราคาก่อน VAT: ' + (q.subtotal || 0) + ' บาท');
    body.appendParagraph('VAT ' + (q.vat || 0) + '%: ' + (q.vatAmount || 0) + ' บาท');
    body.appendParagraph('รวมทั้งสิ้น: ' + (q.total || 0) + ' บาท').setBold(true);
    body.appendParagraph('');
    body.appendParagraph('หมายเหตุ: ' + (q.notes || '-'));

    doc.saveAndClose();

    // Export เป็น PDF
    var docFile = DriveApp.getFileById(doc.getId());
    var pdfBlob = docFile.getAs('application/pdf');
    pdfBlob.setName(docTitle + '.pdf');

    // หาโฟลเดอร์ เอกสาร
    var folders = DriveApp.getFoldersByName('Band Management By SoulCiety');
    var parentFolder = folders.hasNext() ? folders.next() : DriveApp.getRootFolder();
    var docFolders = parentFolder.getFoldersByName('เอกสาร');
    var docFolder = docFolders.hasNext() ? docFolders.next() : parentFolder.createFolder('เอกสาร');

    var pdfFile = docFolder.createFile(pdfBlob);
    var pdfUrl = pdfFile.getUrl();

    // ลบ Doc ต้นแบบ (เก็บแค่ PDF)
    docFile.setTrashed(true);

    // อัปเดต docUrl ใน Sheet
    updateQuotation(quotationId, { docUrl: pdfUrl, status: 'sent' });

    return { success: true, url: pdfUrl };
  } catch (error) {
    Logger.log('generateQuotationPdf error: ' + error);
    return { success: false, message: error.toString() };
  }
}
