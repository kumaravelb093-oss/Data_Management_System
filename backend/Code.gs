/**
 * GURU ORTHO DATA MANAGEMENT SYSTEM - BACKEND v8.0
 * Features: 4 Media Slots + Dedicated Document Upload
 */

const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // Optional if using active
  SHEET_NAME: 'Sheet1',
  ROOT_FOLDER_NAME: 'GURU_ORTHO_RECORDS'
};

function doPost(e) {
  const res = ContentService.createTextOutput();
  res.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];
    
    // 1. Manage Drive Folders
    let rootFolder;
    const folders = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
    if (folders.hasNext()) {
      rootFolder = folders.next();
    } else {
      rootFolder = DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
    }
    
    // Create patient-specific folder
    const patientFolderName = `${data.patient_id}_${data.patient_name.replace(/\s+/g, '_')}`;
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
        const base64Data = fileData.base64.split(',')[1];
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileData.name);
        const file = patientFolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        mediaUrls[i-1] = file.getUrl();
      }
    }

    // 3. Process Dedicated Document
    let docUrl = data.document_url || 'None';
    if (data.document && data.document.base64) {
      const docData = data.document;
      const base64Doc = docData.base64.split(',')[1];
      const docBlob = Utilities.newBlob(Utilities.base64Decode(base64Doc), docData.type, docData.name);
      const docFile = patientFolder.createFile(docBlob);
      docFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      docUrl = docFile.getUrl();
    }

    // 4. Update Sheet
    const rowData = [
      data.patient_id,
      data.entry_date_time || new Date().toISOString(),
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
    const headers = data[0];
    const rows = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header.toLowerCase().replace(/\s+/g, '_')] = row[i];
      });
      return obj;
    });
    return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
