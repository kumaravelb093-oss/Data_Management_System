/**
 * Ortho Clinic Management Backend
 * Handles Google Sheets as DB and Google Drive for image storage.
 */

const CONFIG = {
  SHEET_ID: '1HBMI4_yxHCeF7zNvxuwuMbk4oB7tegsqDT9io-RBCcQ',
  SHEET_NAME: 'Patients',
  UPLOAD_FOLDER_ID: 'YOUR_FOLDER_ID_HERE'
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Ortho Clinic Management')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Save patient data and images
 */
function saveData(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
    
    // Set headers if new sheet
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Entry Date & Time', 'Patient ID', 'Patient Name', 'Age', 'Gender', 'Mobile Number', 
        'Village', 'Taluk', 'District', 'Visit Date', 'Visit Type', 'Doctor Name',
        'Diagnosis', 'Treatment / Procedure', 'Prescription Notes', 'Doctor Remarks',
        'Image Type', 'Image File Name', 'Image Drive Link', 'Data Entered By', 'Last Updated Time'
      ]);
    }

    let imageUrl = '';
    if (data.image && data.image.base64) {
      imageUrl = uploadToDrive(data.image.base64, data.image.name, data.image.type);
    }

    const timestamp = new Date();
    sheet.appendRow([
      timestamp,
      'P-' + Date.now(),
      data.name,
      data.age,
      data.gender,
      data.mobile,
      data.village,
      data.taluk,
      data.district,
      data.visitDate || timestamp,
      data.visitType,
      data.doctorName,
      data.diagnosis,
      data.treatment,
      data.prescription,
      data.remarks,
      data.imageType || (data.image ? 'Photo' : ''),
      data.image ? data.image.name : '',
      imageUrl,
      data.enteredBy || 'Doctor',
      timestamp
    ]);

    return { success: true, message: 'Data saved successfully!' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * Upload base64 image to Google Drive
 */
function uploadToDrive(base64Data, fileName, contentType) {
  const folder = DriveApp.getFolderById(CONFIG.UPLOAD_FOLDER_ID);
  const decoded = Utilities.base64Decode(base64Data.split(',')[1]);
  const blob = Utilities.newBlob(decoded, contentType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/**
 * Fetch latest records for dashboard
 */
function getRecords() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1).reverse(); // Latest first
    
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
    return [];
  }
}
