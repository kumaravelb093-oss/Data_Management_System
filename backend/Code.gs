/**
 * GURU ORTHO CLINIC - PRODUCTION REST API v6.0
 * Features: Extended Patient Data, OP/IP Sectors, Performance Optimized
 */

const CONFIG = {
  SHEET_ID: '1HBMI4_yxHCeF7zNvxuwuMbk4oB7tegsqDT9io-RBCcQ',
  SHEET_NAME: 'Patients',
  UPLOAD_FOLDER_NAME: 'Clinic_Media'
};

/**
 * 0. INITIALIZE SYSTEM
 */
function initializeSystem() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    }
    
    const headers = [
      'Entry Date & Time', 'Patient ID', 'Patient Name', 'Age', 'Gender', 
      'Service Type (OP/IP)', 'Mobile Number', 'Address', 'Occupation',
      'Chief Complaint', 'Medical History', 'Diagnosis', 'Treatment', 
      'Remarks', 'Media URL 1', 'Media URL 2', 'Media URL 3', 'Media URL 4', 'Entered By'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#111827').setFontColor('#FFFFFF').setFontWeight('bold');
    
    const folders = DriveApp.getFoldersByName(CONFIG.UPLOAD_FOLDER_NAME);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(CONFIG.UPLOAD_FOLDER_NAME);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return "Setup Complete! 4 Media Slots Enabled.";
  } catch (e) {
    return "Error: " + e.toString();
  }
}

/**
 * 1. REST GET ENDPOINT
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return jsonResponse([]);

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return jsonResponse([]);

    const headers = data[0];
    const rows = data.slice(1);
    
    let results = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        // Normalize header keys for JS
        const key = header.toLowerCase()
          .replace(/\((.*?)\)/g, '') // remove (OP/IP)
          .trim()
          .replace(/[^a-z0-9]/g, '_');
        obj[key] = row[i];
      });
      return obj;
    });

    return jsonResponse(results.reverse());
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * 2. REST POST ENDPOINT
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      initializeSystem();
      sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    }

    // Handle 4 Media Slots
    const mediaUrls = [
      data.media_url_1 || '',
      data.media_url_2 || '',
      data.media_url_3 || '',
      data.media_url_4 || ''
    ];

    // Upload new media if provided
    for(let i = 0; i < 4; i++) {
      const mediaKey = `media${i+1}`;
      if (data[mediaKey] && data[mediaKey].base64 && data[mediaKey].base64.startsWith('data:')) {
        mediaUrls[i] = uploadFile(data[mediaKey].base64, data[mediaKey].name, data[mediaKey].type);
      }
    }

    const timestamp = new Date();
    const isEdit = !!data.patient_id;
    const patientId = isEdit ? data.patient_id : ('P-' + Date.now());

    const rowData = [
      isEdit ? (data.entry_date_time || timestamp) : timestamp,
      patientId,
      data.name,
      data.age,
      data.gender,
      data.service_type || 'OP',
      data.mobile,
      data.address || '',
      data.occupation || '',
      data.chief_complaint || '',
      data.medical_history || '',
      data.diagnosis || '',
      data.treatment || '',
      data.remarks || '',
      mediaUrls[0],
      mediaUrls[1],
      mediaUrls[2],
      mediaUrls[3],
      data.enteredBy || 'Vercel App'
    ];

    if (isEdit) {
      const sheetData = sheet.getDataRange().getValues();
      let rowToUpdate = -1;
      for (let i = 1; i < sheetData.length; i++) {
        if (String(sheetData[i][1]) === String(patientId)) {
          rowToUpdate = i + 1;
          break;
        }
      }

      if (rowToUpdate !== -1) {
        sheet.getRange(rowToUpdate, 1, 1, rowData.length).setValues([rowData]);
        return jsonResponse({ success: true, message: 'Updated Successfully', patientId: patientId });
      }
    } 
    
    sheet.appendRow(rowData);
    return jsonResponse({ success: true, message: 'Saved Successfully', patientId: patientId });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function uploadFile(base64Data, fileName, contentType) {
  const folders = DriveApp.getFoldersByName(CONFIG.UPLOAD_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(CONFIG.UPLOAD_FOLDER_NAME);
  const decodedData = Utilities.base64Decode(base64Data.split(',')[1]);
  const blob = Utilities.newBlob(decodedData, contentType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
