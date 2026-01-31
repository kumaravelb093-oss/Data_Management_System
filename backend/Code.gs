/**
 * GURU ORTHO CLINIC - PRODUCTION REST API
 * Features: Auto-Setup, Image-to-Sheet Sync, Record Update (No Duplicates)
 */

const CONFIG = {
  SHEET_ID: '1HBMI4_yxHCeF7zNvxuwuMbk4oB7tegsqDT9io-RBCcQ', // MUST REPLACE WITH YOUR SHEET ID
  SHEET_NAME: 'Patients',
  UPLOAD_FOLDER_NAME: 'Clinic_Media'
};

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

    return jsonResponse(results.reverse()); // Latest entries at the top
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * 2. REST POST ENDPOINT
 * Handles both "Save" (New) and "Update" (Edit)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    // Auto-create sheet & headers if missing
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      const headers = [
        'Entry Date & Time', 'Patient ID', 'Patient Name', 'Age', 'Gender', 'Mobile Number', 
        'Diagnosis', 'Treatment', 'Remarks', 'Media Type', 'Media File URL', 'Entered By'
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setBackground('#111827').setFontColor('#FFFFFF').setFontWeight('bold');
    }

    // Handle Media (Base64)
    let mediaUrl = data.existingMediaUrl || '';
    if (data.media && data.media.base64 && data.media.base64.startsWith('data:')) {
      mediaUrl = uploadFile(data.media.base64, data.media.name, data.media.type);
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
      data.mobile,
      data.diagnosis,
      data.treatment,
      data.remarks,
      data.media ? data.media.type : (mediaUrl ? 'File' : 'None'),
      mediaUrl,
      data.enteredBy || 'Vercel App'
    ];

    if (isEdit) {
      // UPDATE EXISTING ROW (NO DUPLICATES)
      const sheetData = sheet.getDataRange().getValues();
      let rowToUpdate = -1;
      for (let i = 1; i < sheetData.length; i++) {
        if (sheetData[i][1] === patientId) {
          rowToUpdate = i + 1;
          break;
        }
      }

      if (rowToUpdate !== -1) {
        sheet.getRange(rowToUpdate, 1, 1, rowData.length).setValues([rowData]);
        return jsonResponse({ success: true, message: 'Updated Successfully', patientId: patientId });
      } else {
        // Fallback: append if ID not found for some reason
        sheet.appendRow(rowData);
        return jsonResponse({ success: true, message: 'Saved as New (ID not found for update)', patientId: patientId });
      }
    } else {
      // SAVE NEW ROW
      sheet.appendRow(rowData);
      return jsonResponse({ success: true, message: 'Saved Successfully', patientId: patientId });
    }

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Upload Helper
 */
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
