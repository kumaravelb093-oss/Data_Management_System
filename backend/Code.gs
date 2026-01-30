/**
 * GURU ORTHO CLINIC - ADVANCED DATA MANAGEMENT SYSTEM
 * Backend: Google Apps Script
 */

const CONFIG = {
  SHEET_ID: '1HBMI4_yxHCeF7zNvxuwuMbk4oB7tegsqDT9io-RBCcQ', // Replace with your actual Sheet ID
  SHEET_NAME: 'Patients',
  IMAGES_FOLDER_NAME: 'Guru_Clinic_Clinical_Images'
};

/**
 * Helper to get the Spreadsheet reliably
 */
function getSS() {
  if (CONFIG.SHEET_ID && CONFIG.SHEET_ID !== 'YOUR_SHEET_ID_HERE') {
    try {
      return SpreadsheetApp.openById(CONFIG.SHEET_ID);
    } catch (e) {
      Logger.log('Error opening sheet by ID: ' + e.toString());
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * 1. INITIALIZE SYSTEM
 * Run this function ONCE in the Apps Script editor (Debug) to setup everything.
 */
function initializeSystem() {
  const ss = getSS();
  if (!ss) throw new Error('Could not identify Spreadsheet. Please set SHEET_ID in CONFIG.');
  
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  // A. Setup Sheet Headers
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  
  const headers = [
    'Entry Date & Time', 'Patient ID', 'Patient Name', 'Age', 'Gender', 'Mobile Number', 
    'Village', 'Taluk', 'District', 'Visit Date', 'Visit Type', 'Doctor Name',
    'Diagnosis', 'Treatment / Procedure', 'Prescription Notes', 'Doctor Remarks',
    'Image Type', 'Image File Name', 'Image Drive Link', 'Data Entered By', 'Last Updated Time'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1A2B3C').setFontColor('#FFFFFF').setFontWeight('bold');
  
  // B. Setup Drive Folder
  let folder;
  const folders = DriveApp.getFoldersByName(CONFIG.IMAGES_FOLDER_NAME);
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(CONFIG.IMAGES_FOLDER_NAME);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }
  
  Logger.log('System Initialized!');
  Logger.log('Folder ID: ' + folder.getId());
  Logger.log('Sheet URL: ' + ss.getUrl());
  
  return { 
    folderId: folder.getId(), 
    sheetUrl: ss.getUrl(),
    message: "System Setup Complete. Columns and Folder are ready!" 
  };
}

/**
 * 2. WEB APP ENTRY
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Guru Ortho Portal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 3. SAVE PATIENT DATA
 */
function saveData(data) {
  try {
    const ss = getSS();
    if (!ss) return { success: false, message: 'Could not identify Spreadsheet.' };
    
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      initializeSystem();
    }

    // Handle Image Upload
    let imageUrl = '';
    if (data.image && data.image.base64) {
      imageUrl = uploadToDrive(data.image.base64, data.image.name, data.image.type);
    }

    const timestamp = new Date();
    const patientId = 'P-' + Date.now();
    
    const record = {
      entry_date_time: timestamp,
      patient_id: patientId,
      patient_name: data.name,
      age: data.age,
      gender: data.gender,
      mobile_number: data.mobile,
      village: data.village,
      taluk: data.taluk,
      district: data.district,
      visit_date: data.visitDate || timestamp,
      visit_type: data.visitType,
      doctor_name: data.doctorName || 'Dr. Guru',
      diagnosis: data.diagnosis,
      treatment_procedure: data.treatment,
      prescription_notes: data.prescription,
      doctor_remarks: data.remarks,
      image_type: data.image ? 'Clinical Photo' : 'No Image',
      image_file_name: data.image ? data.image.name : '',
      image_drive_link: imageUrl,
      data_entered_by: data.enteredBy || 'Staff',
      last_updated_time: timestamp
    };

    // Append to sheet
    sheet.appendRow([
      record.entry_date_time, record.patient_id, record.patient_name, record.age, record.gender, record.mobile_number,
      record.village, record.taluk, record.district, record.visit_date, record.visit_type, record.doctor_name,
      record.diagnosis, record.treatment_procedure, record.prescription_notes, record.doctor_remarks,
      record.image_type, record.image_file_name, record.image_drive_link, record.data_entered_by, record.last_updated_time
    ]);

    return { 
      success: true, 
      message: 'Assessment Locked Successfully!', 
      record: record 
    };
  } catch (e) {
    return { success: false, message: 'Backend Error: ' + e.toString() };
  }
}

/**
 * 4. UPLOAD LOGIC
 */
function uploadToDrive(base64Data, fileName, contentType) {
  try {
    let folder;
    const folders = DriveApp.getFoldersByName(CONFIG.IMAGES_FOLDER_NAME);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(CONFIG.IMAGES_FOLDER_NAME);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    const decoded = Utilities.base64Decode(base64Data.split(',')[1]);
    const blob = Utilities.newBlob(decoded, contentType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    Logger.log('Drive Error: ' + e.toString());
    return '';
  }
}

/**
 * 5. FETCH RECORDS
 */
function getRecords() {
  try {
    const ss = getSS();
    if (!ss) return [];
    
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headers = data[0];
    const rows = data.slice(1).reverse(); // Newest first
    
    return rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        const key = header.toLowerCase()
          .replace(/ & /g, '_')
          .replace(/ \/ /g, '_')
          .replace(/ /g, '_');
        obj[key] = row[i];
      });
      return obj;
    });
  } catch (e) {
    Logger.log('Fetch Error: ' + e.toString());
    return [];
  }
}
