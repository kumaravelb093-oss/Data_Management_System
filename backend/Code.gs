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
      doctor_name: data.doctorName,
      diagnosis: data.diagnosis,
      treatment_procedure: data.treatment,
      prescription_notes: data.prescription,
      doctor_remarks: data.remarks,
      image_type: data.imageType || (data.image ? 'Photo' : ''),
      image_file_name: data.image ? data.image.name : '',
      image_drive_link: imageUrl,
      data_entered_by: data.enteredBy || 'Doctor',
      last_updated_time: timestamp
    };

    sheet.appendRow([
      record.entry_date_time,
      record.patient_id,
      record.patient_name,
      record.age,
      record.gender,
      record.mobile_number,
      record.village,
      record.taluk,
      record.district,
      record.visit_date,
      record.visit_type,
      record.doctor_name,
      record.diagnosis,
      record.treatment_procedure,
      record.prescription_notes,
      record.doctor_remarks,
      record.image_type,
      record.image_file_name,
      record.image_drive_link,
      record.data_entered_by,
      record.last_updated_time
    ]);

    return { 
      success: true, 
      message: 'Data saved successfully!', 
      record: record 
    };
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
