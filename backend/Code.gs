/**
 * GURU ORTHO DATA MANAGEMENT SYSTEM - BACKEND (v8.1)
 * High-performance backend with 4 Media Slots + Document Upload support.
 */

const CONFIG = {
  MASTER_SHEET_NAME: 'MainData',
  DRIVE_FOLDER_ID: '1S7E14h_JbI39K1Nf4-s39C75I9gS6u67', // Ensure this is correct
  MAX_FILE_SIZE: 50 * 1024 * 1024 // 50MB
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.MASTER_SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.MASTER_SHEET_NAME);
      sheet.appendRow([
        'Entry Date & Time', 'Patient Name', 'Age', 'Gender', 'Mobile Number', 
        'Address', 'Chief Complaint', 'Medical History', 'Occupation', 
        'Diagnosis', 'Treatment', 'Remarks', 'Entered By', 'Patient ID',
        'Media 1 URL', 'Media 2 URL', 'Media 3 URL', 'Media 4 URL', 'Document URL'
      ]);
      sheet.getRange(1, 1, 1, 19).setFontWeight('bold').setBackground('#f3f3f3');
    }

    let folder;
    try {
      folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    } catch (e) {
      // Create folder if ID is invalid or not found
      folder = DriveApp.createFolder('GuruOrtho_Media_Vault');
      // Update CONFIG dynamically for this session (log the new ID for user to see)
      console.log('New Folder Created ID:', folder.getId());
    }
    
    // Process Media Slots (1-4)
    const mediaUrls = [data.media_url_1, data.media_url_2, data.media_url_3, data.media_url_4];
    for (let i = 1; i <= 4; i++) {
      const mediaKey = `media${i}`;
      if (data[mediaKey] && data[mediaKey].base64) {
        mediaUrls[i-1] = uploadToDrive(data[mediaKey], folder);
      }
    }

    // Process Document Upload
    let docUrl = data.document_url || 'None';
    if (data.document_file && data.document_file.base64) {
      docUrl = uploadToDrive(data.document_file, folder);
    }

    const rowData = [
      data.entry_date_time || new Date().toLocaleString(),
      data.patientName,
      data.age,
      data.gender,
      data.mobileNumber,
      data.address || '',
      data.chief_complaint || '',
      data.medical_history || '',
      data.occupation || '',
      data.diagnosis || '',
      data.treatment || '',
      data.remarks || '',
      data.enteredBy || 'Staff',
      data.patient_id || 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      mediaUrls[0] || 'None',
      mediaUrls[1] || 'None',
      mediaUrls[2] || 'None',
      mediaUrls[3] || 'None',
      docUrl
    ];

    if (data.patient_id) {
      const pIdIndex = 14; // Column N (14th)
      const rows = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][pIdIndex - 1] === data.patient_id) {
          sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
          found = true;
          break;
        }
      }
      if (!found) sheet.appendRow(rowData);
    } else {
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: 'Record saved successfully',
      patient_id: data.patient_id || rowData[13]
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadToDrive(fileObj, folder) {
  try {
    const contentType = fileObj.type;
    const base64Data = fileObj.base64.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileObj.name || 'document');
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return 'Upload Failed: ' + err.toString();
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET_NAME);
    if (!sheet) return createJsonResponse([]);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        const key = header.toLowerCase().replace(/ /g, '_').replace(/&/g, 'and');
        obj[key] = row[i];
      });
      return obj;
    });
    
    return createJsonResponse(rows.reverse());
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
