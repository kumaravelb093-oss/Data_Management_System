/**
 * GURU ORTHO CLINIC - PHYSIOTRACK PROFESSIONAL EDITION
 * Comprehensive 22-Column Clinical Database REST API
 */

const CONFIG = {
  SHEET_ID: '1HBMI4_yxHCeF7zNvxuwuMbk4oB7tegsqDT9io-RBCcQ',
  SHEET_NAME: 'Clinical_Registry',
  UPLOAD_FOLDER_NAME: 'Clinic_Cloud_Media'
};

const HEADERS = [
  'Timestamp', 'Patient ID', 'Full Name', 'Age', 'Gender', 'Mobile', 'Alt Mobile', 
  'Village', 'Taluk', 'District', 'Full Address', 'Registration Date', 
  'Visit Type', 'Purpose of Visit', 'Clinical Diagnosis', 'Clinical Notes', 
  'Treatment Plan', 'Medicines', 'Next Review Date', 'Media URL', 
  'Appointment Status', 'Operator'
];

/**
 * 0. INITIALIZE SYSTEM
 * Resets/Setup the professional 22-column header.
 */
function initializeSystem() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    
    sheet.clear();
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
         .setBackground('#0F172A')
         .setFontColor('#FFFFFF')
         .setFontWeight('bold')
         .setHorizontalAlignment('center');
    
    // Auto-setup Drive Folder
    const folders = DriveApp.getFoldersByName(CONFIG.UPLOAD_FOLDER_NAME);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(CONFIG.UPLOAD_FOLDER_NAME);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return "PhysioTrack Schema Initialized! 22 Columns Ready.";
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
        const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        obj[key] = row[i];
      });
      return obj;
    });

    return jsonResponse(results.reverse()); // Newest entries top
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * 2. REST POST ENDPOINT
 * Handles Create & Update with 22-column mapping.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    // Media Logic
    let mediaUrl = data.existingMediaUrl || '';
    if (data.media && data.media.base64 && data.media.base64.startsWith('data:')) {
      mediaUrl = uploadFile(data.media.base64, data.media.name, data.media.type);
    }

    const timestamp = new Date();
    const isEdit = !!data.patient_id;
    const patientId = isEdit ? data.patient_id : ('G-' + Date.now().toString().slice(-6));

    const rowData = [
      timestamp,
      patientId,
      data.name,
      data.age,
      data.gender,
      data.mobile,
      data.alt_mobile || 'N/A',
      data.village || '',
      data.taluk || '',
      data.district || '',
      data.address || '',
      data.reg_date || timestamp.toLocaleDateString(),
      data.visit_type || 'New',
      data.purpose || '',
      data.diagnosis || '',
      data.notes || '',
      data.treatment || '',
      data.medicines || '',
      data.review_date || '',
      mediaUrl,
      data.status || 'Active',
      data.operator || 'Admin'
    ];

    if (isEdit) {
      const sheetData = sheet.getDataRange().getValues();
      let rowIdx = -1;
      for (let i = 1; i < sheetData.length; i++) {
        if (sheetData[i][1] === patientId) { rowIdx = i + 1; break; }
      }
      if (rowIdx !== -1) {
        sheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
        return jsonResponse({ success: true, message: 'Record Updated', patientId });
      }
    }
    
    sheet.appendRow(rowData);
    return jsonResponse({ success: true, message: 'Record Registered', patientId });

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
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
