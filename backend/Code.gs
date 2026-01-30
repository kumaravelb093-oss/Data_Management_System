/**
 * GURU ORTHO CLINIC - PRODUCTION REST API
 * Designed for Vercel (React) + Google Apps Script
 */

const CONFIG = {
  SHEET_ID: '1HBMI4_yxHCeF7zNvxuwuMbk4oB7tegsqDT9io-RBCcQ', // MUST REPLACE WITH YOUR SHEET ID
  SHEET_NAME: 'Patients',
  UPLOAD_FOLDER_ID: '' // Optional: Set specific folder ID, otherwise auto-creates 'Clinic_Media'
};

/**
 * 1. REST GET ENDPOINT
 * Returns records as JSON. Supports search: ?mobile=XXX or ?id=XXX
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return jsonResponse({ success: false, message: 'Sheet not found' });

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return jsonResponse([]);

    const headers = data[0];
    const rows = data.slice(1);
    
    let results = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        obj[key] = row[i];
      });
      return obj;
    });

    // Filtering
    if (e.parameter.mobile) {
      results = results.filter(r => String(r.mobile_number).includes(e.parameter.mobile));
    }
    if (e.parameter.id) {
      results = results.filter(r => r.patient_id === e.parameter.id);
    }

    return jsonResponse(results.reverse()); // Newest first
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * 2. REST POST ENDPOINT
 * Accepts JSON payload from Vercel
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    // Auto-create headers if missing
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      const headers = [
        'Entry Date & Time', 'Patient ID', 'Patient Name', 'Age', 'Gender', 'Mobile Number', 
        'Diagnosis', 'Treatment', 'Remarks', 'Media Type', 'Media File URL', 'Entered By'
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setBackground('#1A365D').setFontColor('#FFFFFF').setFontWeight('bold');
    }

    // Handle Media (Base64 Image or Video)
    let mediaUrl = '';
    if (data.media && data.media.base64) {
      mediaUrl = uploadFile(data.media.base64, data.media.name, data.media.type);
    }

    const patientId = 'P-' + Date.now();
    const timestamp = new Date();

    const rowData = [
      timestamp,
      patientId,
      data.name,
      data.age,
      data.gender,
      data.mobile,
      data.diagnosis,
      data.treatment,
      data.remarks,
      data.media ? data.media.type : 'None',
      mediaUrl,
      data.enteredBy || 'Vercel App'
    ];

    sheet.appendRow(rowData);

    return jsonResponse({ 
      success: true, 
      patientId: patientId, 
      mediaUrl: mediaUrl,
      message: 'Data saved successfully via REST API' 
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Helper: Upload Base64 to Drive
 */
function uploadFile(base64Data, fileName, contentType) {
  let folder;
  if (CONFIG.UPLOAD_FOLDER_ID) {
    folder = DriveApp.getFolderById(CONFIG.UPLOAD_FOLDER_ID);
  } else {
    const folders = DriveApp.getFoldersByName('Clinic_Media');
    folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Clinic_Media');
  }
  
  const contentTypeBase = base64Data.split(',')[0].split(':')[1].split(';')[0];
  const decodedData = Utilities.base64Decode(base64Data.split(',')[1]);
  const blob = Utilities.newBlob(decodedData, contentTypeBase, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return file.getUrl();
}

/**
 * Helper: CORS-safe JSON Response
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
