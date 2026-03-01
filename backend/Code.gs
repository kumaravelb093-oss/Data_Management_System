/**
 * BACKEND VERSION: 14.1 (Video & Multimedia Optimized)
 * OPTIMIZED FOR: Clincal Photo & Video Documentation
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Records') || ss.insertSheet('Records');
    
    // Ensure Headers exist
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Patient ID', 'Entry Date/Time', 'Patient Name', 'Age', 'Gender',
        'Mobile Number', 'Service Type', 'Address', 'Occupation',
        'Chief Complaint', 'Medical History', 'Diagnosis', 'Treatment', 'Remarks',
        'Media URL 1', 'Media URL 2', 'Media URL 3', 'Media URL 4', 'Document URL'
      ]);
      sheet.getRange(1, 1, 1, 19).setFontWeight('bold').setBackground('#f3f3f3');
    }

    const folderId = getOrSetupFolder();
    
    // Process Media Uploads
    const mediaUrls = [
      uploadFile(data.media_1, folderId, data.media_url_1),
      uploadFile(data.media_2, folderId, data.media_url_2),
      uploadFile(data.media_3, folderId, data.media_url_3),
      uploadFile(data.media_4, folderId, data.media_url_4)
    ];

    const docUrl = uploadFile(data.document, folderId, data.document_url);

    const rowData = [
      data.patient_id,
      data.entry_date_time,
      data.patient_name,
      data.age,
      data.gender,
      data.mobile_number,
      data.service_type,
      data.address,
      data.occupation,
      data.chief_complaint,
      data.medical_history,
      data.diagnosis,
      data.treatment,
      data.remarks,
      mediaUrls[0], mediaUrls[1], mediaUrls[2], mediaUrls[3],
      docUrl
    ];

    const values = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] == data.patient_id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Cloud Sync Complete' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('DoPost Error:', err);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadFile(fileObj, folderId, existingUrl) {
  if (!fileObj || !fileObj.base64) return existingUrl || 'None';
  try {
    let contentType = fileObj.type || 'application/octet-stream';
    const base64Data = fileObj.base64.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileObj.name || 'attachment');
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

function getOrSetupFolder() {
  const folderName = 'Guru_Patient_Records';
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next().getId();
  const folder = DriveApp.createFolder(folderName);
  return folder.getId();
}

function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Records') || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    const headers = data[0];
    const rows = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const key = String(h).trim().toLowerCase()
          .replace(/[\/\s()]+/g, '_')
          .replace(/^_+|_+$/g, '');
        obj[key] = row[i];
      });
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
