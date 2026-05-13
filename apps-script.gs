/**
 * Ef Calculator — Google Apps Script backend
 *
 * Handles:
 * - Saving submissions to Google Sheet
 * - Sending PDF report via WhatsApp (Twilio)
 * - Uploading PDF to Drive for shareable link
 *
 * SETUP:
 * 1. Create a new Google Sheet. Copy its ID from URL:
 *    https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
 * 2. Paste the ID below into SHEET_ID.
 * 3. In the Sheet: Extensions → Apps Script → paste this entire file.
 * 4. Project Settings (gear icon) → Script Properties → Add 3 properties:
 *      TWILIO_SID    = ACxxxxxxxxxxxxxxxxxxxxxxxx
 *      TWILIO_TOKEN  = your auth token (32 hex chars)
 *      TWILIO_FROM   = whatsapp:+14155238886   (Twilio sandbox) OR your verified WA Business number
 * 5. Deploy → New Deployment → Web App
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 6. Copy Web App URL → paste into index.html as APPS_SCRIPT_URL.
 *
 * Important: Twilio sandbox can ONLY send to numbers that joined via "join <keyword>".
 * Production: get a verified WhatsApp Business number through Twilio (1-2 weeks approval).
 */

const SHEET_ID = '1zhtpQbqS3uyuApMDDXGOcoXFV8KaRhNI0URGG08Z9cc';
const SHEET_NAME = 'Submissions';
const DRIVE_FOLDER_NAME = 'Ef Calculator Reports';

const HEADERS = [
  'Timestamp','Email','Name','WhatsApp','Age','Experience','Employment',
  'MonthlyIncome','MonthlyExpense','MonthlyInvestment','MonthlyProfit',
  'EMI','EmergencyFund','TargetIncome',
  'Score','Stage','PercentileBetterThan','CustomExpenses','PdfDriveLink','WhatsAppSent'
];

function getProp(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput('Ef Calculator endpoint OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'save';

    if (action === 'sendWhatsapp') {
      return sendWhatsappReport(data);
    }
    return saveToSheet(data);
  } catch (err) {
    return jsonResponse({ok: false, error: String(err)});
  }
}

function ensureSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
         .setFontWeight('bold')
         .setBackground('#1a1a1a')
         .setFontColor('#F97316');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveToSheet(data, extras) {
  const sheet = ensureSheet();
  extras = extras || {};
  sheet.appendRow([
    new Date(),
    data.email || '',
    data.name || '',
    data.whatsapp || '',
    data.age || '',
    data.experience || '',
    data.employment || '',
    data.monthlyIncome || 0,
    data.monthlyExpense || 0,
    data.monthlyInvest || 0,
    data.monthlyProfit || 0,
    data.emi || 0,
    data.emergencyFund || 0,
    data.targetIncome || 0,
    data.score || 0,
    data.stage || '',
    data.percentile || 0,
    JSON.stringify(data.customExpenses || []),
    extras.pdfLink || '',
    extras.waSent ? 'YES' : 'NO'
  ]);
  return jsonResponse({ok: true});
}

function uploadPdfToDrive(base64Data, filename) {
  let folder;
  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) folder = folders.next();
  else folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);

  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    'application/pdf',
    filename
  );
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/file/d/' + file.getId() + '/view';
}

function sendWhatsappReport(data) {
  const sid = getProp('TWILIO_SID');
  const token = getProp('TWILIO_TOKEN');
  const from = getProp('TWILIO_FROM');

  if (!sid || !token || !from) {
    return jsonResponse({ok: false, error: 'Twilio Script Properties missing (TWILIO_SID / TWILIO_TOKEN / TWILIO_FROM)'});
  }

  let pdfLink = '';
  if (data.pdfBase64) {
    try {
      const filename = data.pdfFilename || ('EfCalculator_' + (data.name||'Report').replace(/[^\w]/g,'_') + '_' + new Date().toISOString().slice(0,10) + '.pdf');
      pdfLink = uploadPdfToDrive(data.pdfBase64, filename);
    } catch(err) {
      // Log but continue — send text-only message
      console.error('Drive upload failed:', err);
    }
  }

  const userPhone = (data.whatsapp || '').replace(/[^\d]/g, '');
  if (!userPhone) {
    saveToSheet(data, {pdfLink: pdfLink, waSent: false});
    return jsonResponse({ok: false, error: 'No WhatsApp number'});
  }

  const to = 'whatsapp:+' + userPhone;
  const stageLabel = (data.stageLabel || data.stage || '').replace(/[^\x00-\x7F]/g,'').trim();
  const body =
    '*Ef Calculator — Your Financial Health Report*\n\n' +
    'Hi ' + (data.name || 'there') + '!\n\n' +
    '*Score:* ' + (data.score || 0) + '/100 — ' + stageLabel + '\n' +
    '*Monthly Profit:* Rs ' + Math.round(data.monthlyProfit||0).toLocaleString('en-IN') + '\n' +
    '*Monthly Income:* Rs ' + Math.round(data.monthlyIncome||0).toLocaleString('en-IN') + '\n' +
    'Better than ' + Number(data.percentile||0).toFixed(1) + '% of Indian freelancers.\n\n' +
    (pdfLink ? '*Your full PDF report:*\n' + pdfLink + '\n\n' : '') +
    'calculator.youreditorfriend.in';

  const url = 'https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json';
  const opts = {
    method: 'post',
    payload: { To: to, From: from, Body: body },
    headers: { 'Authorization': 'Basic ' + Utilities.base64Encode(sid + ':' + token) },
    muteHttpExceptions: true
  };

  let waSent = false;
  let twResp = '';
  try {
    const res = UrlFetchApp.fetch(url, opts);
    const code = res.getResponseCode();
    twResp = res.getContentText();
    waSent = (code >= 200 && code < 300);
    if (!waSent) console.error('Twilio error ' + code + ': ' + twResp);
  } catch(err) {
    console.error('Twilio fetch failed:', err);
    twResp = String(err);
  }

  saveToSheet(data, {pdfLink: pdfLink, waSent: waSent});
  return jsonResponse({ok: waSent, pdfLink: pdfLink, twilio: twResp.substring(0, 500)});
}
