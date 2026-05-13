/**
 * Ef Calculator — Google Apps Script backend
 *
 * SETUP:
 * 1. Create a new Google Sheet (or use existing). Copy its ID from the URL:
 *    https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
 * 2. Paste the ID below into SHEET_ID.
 * 3. In the Sheet: Extensions → Apps Script → paste this entire file.
 * 4. Deploy → New Deployment → Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Authorize when prompted. Copy the Web App URL.
 * 6. Paste that URL into index.html as APPS_SCRIPT_URL.
 */

const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Submissions';

const HEADERS = [
  'Timestamp','Email','Name','WhatsApp','Age','Experience','Employment',
  'MonthlyIncome','MonthlyExpense','MonthlyInvestment','MonthlyProfit',
  'EMI','EmergencyFund','TargetIncome',
  'Score','Stage','PercentileBetterThan','CustomExpenses'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
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
      JSON.stringify(data.customExpenses || [])
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, error: String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput('Ef Calculator endpoint OK')
    .setMimeType(ContentService.MimeType.TEXT);
}
