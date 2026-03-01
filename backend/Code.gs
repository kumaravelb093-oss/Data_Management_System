/**
 * BACKEND VERSION: 12.0 (Bulletproof)
 * OPTIMIZED FOR: Absolute Data Reliability & Photo Storage
 * FIXED: Uses absolute column positions for 100% data alignment.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Records') || ss.insertSheet('Records');
    
    // Ensure Headers exist (Fixed Layout)
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
    
    // Process Media Uploads (Photos)
    const mediaUrls = [
      uploadFile(data.media_1, folderId, data.media_url_1),
      uploadFile(data.media_2, folderId, data.media_url_2),
      uploadFile(data.media_3, folderId, data.media_url_3),
      uploadFile(data.media_4, folderId, data.media_url_4)
    ];

    // Process Document Upload (PDF/Image)
    const docUrl = uploadFile(data.document, folderId, data.document_url);

    // Row Data Mapping - CRITICAL: Order must match sheet exactly
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
        // Match by Patient ID (Column A)
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

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Record Synced' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadFile(fileObj, folderId, existingUrl) {
  if (!fileObj || !fileObj.base64) return existingUrl || 'None';
  try {
    const contentType = fileObj.type || 'application/octet-stream';
    const base64Data = fileObj.base64.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileObj.name);
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return 'Upload Error: ' + e.message;
  }
}

function getOrSetupFolder() {
  const folderName = 'Guru_Patient_Records';
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next().getId();
  const folder = DriveApp.createFolder(folderName);
  return folder.getId();
}

/**
 * BULLETPROOF GET: Uses fixed indices for 100% data-key match
 */
function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Records') || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    // Map absolute indices to keys
    const rows = data.slice(1).map(row => ({
      patient_id: row[0],
      entry_date_time: row[1],
      patient_name: row[2],
      age: row[3],
      gender: row[4],
      mobile_number: row[5],
      service_type: row[6],
      address: row[7],
      occupation: row[8],
      chief_complaint: row[9],
      medical_history: row[10],
      diagnosis: row[11],
      treatment: row[12],
      remarks: row[13],
      media_url_1: row[14],
      media_url_2: row[15],
      media_url_3: row[16],
      media_url_4: row[17],
      document_url: row[18]
    }));

    return ContentService.createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
