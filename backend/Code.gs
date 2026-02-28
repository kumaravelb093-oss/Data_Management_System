/**
 * GURU ORTHO DATA MANAGEMENT SYSTEM - BACKEND v9.0
 * Features: 4 Media Slots + Dedicated Document Upload
 * Fixed: Hardcoded headers ensure data-key alignment
 */

const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // Optional if using active
  SHEET_NAME: 'Sheet1',
  ROOT_FOLDER_NAME: 'GURU_ORTHO_RECORDS'
};

// CRITICAL: These headers MUST match the exact column order in doPost's rowData array
const HEADERS = [
  'patient_id',
  'entry_date_time',
  'patient_name',
  'age',
  'gender',
  'mobile_number',
  'service_type',
  'address',
  'occupation',
  'chief_complaint',
  'medical_history',
  'diagnosis',
  'treatment',
  'remarks',
  'media_url_1',
  'media_url_2',
  'media_url_3',
  'media_url_4',
  'document_url'
];

function ensureHeaders_(sheet) {
  const firstCell = sheet.getRange(1, 1).getValue();
  if (!firstCell || String(firstCell).trim() === '') {
    // Sheet has no headers — write them
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function doPost(e) {
  const res = ContentService.createTextOutput();
  res.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];
    
    // Ensure header row exists
    ensureHeaders_(sheet);
    
    // 1. Manage Drive Folders
    let rootFolder;
    const folders = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
    if (folders.hasNext()) {
      rootFolder = folders.next();
    } else {
      rootFolder = DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
    }
    
    // Create patient-specific folder
    const patientName = data.patient_name || data.name || 'Unknown';
    const patientFolderName = `${data.patient_id}_${patientName.replace(/\s+/g, '_')}`;
    let patientFolder;
    const pFolders = rootFolder.getFoldersByName(patientFolderName);
    if (pFolders.hasNext()) {
      patientFolder = pFolders.next();
    } else {
      patientFolder = rootFolder.createFolder(patientFolderName);
    }

    // 2. Process Media (4 Slots)
    const mediaUrls = [data.media_url_1 || 'None', data.media_url_2 || 'None', data.media_url_3 || 'None', data.media_url_4 || 'None'];
    
    for (let i = 1; i <= 4; i++) {
      const mediaKey = `media_${i}`;
      if (data[mediaKey] && data[mediaKey].base64) {
        const fileData = data[mediaKey];
        const contentType = fileData.type;
        const rawBase64 = fileData.base64;
        
        // Robust check for data URI format
        if (rawBase64 && rawBase64.indexOf(',') !== -1) {
          const base64Data = rawBase64.split(',')[1];
          try {
            const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileData.name);
            const file = patientFolder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            mediaUrls[i-1] = file.getUrl();
          } catch (e) {
            console.error('Decoding failed for media ' + i + ': ' + e.toString());
          }
        }
      }
    }

    // 3. Process Dedicated Document
    let docUrl = data.document_url || 'None';
    if (data.document && data.document.base64) {
      const docData = data.document;
      const rawBase64Doc = docData.base64;
      
      if (rawBase64Doc && rawBase64Doc.indexOf(',') !== -1) {
        const base64Doc = rawBase64Doc.split(',')[1];
        try {
          const docBlob = Utilities.newBlob(Utilities.base64Decode(base64Doc), docData.type, docData.name);
          const docFile = patientFolder.createFile(docBlob);
          docFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          docUrl = docFile.getUrl();
        } catch (e) {
          console.error('Decoding failed for document: ' + e.toString());
        }
      }
    }

    // 4. Update Sheet — columns MUST match HEADERS order exactly
    const rowData = [
      data.patient_id,
      data.entry_date_time || new Date().toISOString(),
      patientName,
      data.age,
      data.gender,
      data.mobile_number || data.mobile || '',
      data.service_type || data.sector || 'OP',
      data.address || '',
      data.occupation || '',
      data.chief_complaint || data.complaint || '',
      data.medical_history || data.history || '',
      data.diagnosis || '',
      data.treatment || '',
      data.remarks || '',
      mediaUrls[0],
      mediaUrls[1],
      mediaUrls[2],
      mediaUrls[3],
      docUrl
    ];

    // Check for existing record to update
    const sheetData = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] == data.patient_id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > -1) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return res.setContent(JSON.stringify({ status: 'success', patient_id: data.patient_id }));
  } catch (err) {
    return res.setContent(JSON.stringify({ status: 'error', message: err.toString() }));
  }
}

function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    // FIXED: Use hardcoded HEADERS instead of reading from sheet row 1
    // This ensures keys always match the column positions written by doPost
    const rows = data.slice(1).map(row => {
      const obj = {};
      HEADERS.forEach((header, i) => {
        obj[header] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });
    return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
