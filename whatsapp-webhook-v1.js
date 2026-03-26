// ═══════════════════════════════════════════════════════════════
// PayGate WhatsApp Webhook v1
// Receives WhatsApp messages via Meta Business API → pushes to Firebase
// Deploy as Google Apps Script Web App
// ═══════════════════════════════════════════════════════════════

// ─── CONFIGURATION ───────────────────────────────────────────
var CONFIG = {
  // Meta / WhatsApp Business API
  PHONE_NUMBER_ID: '1021427097723618',
  WABA_ID: '2131608970940418',
  VERIFY_TOKEN: 'cnc_electric_verify_2024',
  META_ACCESS_TOKEN: 'EAALEpXHMbzIBRFDNZAhzM93r0VESF7UlMOCw7PYTZCxJckisXBuHmQx84jHN0ObCO1ZColVA2VZBPCHaJRyfCwpqnrJysOwZCo7hc0ZA7XJiZANdb4wBorfihUAEEiHNpwKbLy6l6qXKZCbaj32rXE1bsPBI94bZC4VDvtwAcjLG8dPbhEBL9sHT7SXDEeeUz1wZDZD',

  // Firebase Firestore REST API
  FIREBASE_PROJECT: 'paygate-cnc',
  FIRESTORE_COLLECTION: 'paygate_bank_feeds',

  // Google Cloud Vision API (for OCR on payment screenshots)
  USE_VISION_OCR: true,

  // Logging
  LOG_SHEET_NAME: 'WhatsApp Log',
  ADMIN_EMAIL: 'muddasirwaheed2017@gmail.com'
};

// ─── WEBHOOK ENTRY POINTS ────────────────────────────────────

function doGet(e) {
  var mode = e.parameter['hub.mode'];
  var token = e.parameter['hub.verify_token'];
  var challenge = e.parameter['hub.challenge'];
  logEvent('VERIFY', 'mode=' + mode + ' token=' + token);
  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    logEvent('VERIFY', 'SUCCESS');
    return ContentService.createTextOutput(challenge);
  } else {
    logEvent('VERIFY', 'FAILED — token mismatch');
    return ContentService.createTextOutput('Forbidden').setMimeType(ContentService.MimeType.TEXT);
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    logEvent('WEBHOOK', 'Received POST: ' + JSON.stringify(body).substring(0, 500));
    if (body.entry && body.entry.length > 0) {
      body.entry.forEach(function(entry) {
        if (entry.changes && entry.changes.length > 0) {
          entry.changes.forEach(function(change) {
            if (change.value && change.value.messages) {
              change.value.messages.forEach(function(msg) {
                processWhatsAppMessage(msg, change.value);
              });
            }
          });
        }
      });
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    logEvent('ERROR', 'doPost failed: ' + err.message);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── MESSAGE PROCESSING ──────────────────────────────────────

function processWhatsAppMessage(msg, value) {
  var senderPhone = msg.from || 'unknown';
  var senderName = getSenderName(senderPhone, value);
  var timestamp = msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000) : new Date();
  var msgType = msg.type || 'unknown';
  logEvent('MESSAGE', 'From: ' + senderName + ' (' + senderPhone + ') Type: ' + msgType);
  var paymentData = null;

  if (msgType === 'text') {
    var text = msg.text.body || '';
    logEvent('TEXT', text);
    paymentData = parsePaymentFromText(text, senderName, timestamp);
  } else if (msgType === 'image') {
    var imageId = msg.image.id;
    var caption = msg.image.caption || '';
    logEvent('IMAGE', 'ID: ' + imageId + ' Caption: ' + caption);
    var ocrText = downloadAndOCR(imageId);
    if (ocrText) {
      paymentData = parsePaymentFromOCR(ocrText, caption, senderName, timestamp);
    } else if (caption) {
      paymentData = parsePaymentFromText(caption, senderName, timestamp);
    }
  } else if (msgType === 'document') {
    var docId = msg.document.id;
    var docCaption = msg.document.caption || msg.document.filename || '';
    logEvent('DOCUMENT', 'ID: ' + docId + ' Caption: ' + docCaption);
    var docOcrText = downloadAndOCR(docId);
    if (docOcrText) {
      paymentData = parsePaymentFromOCR(docOcrText, docCaption, senderName, timestamp);
    }
  } else {
    logEvent('SKIP', 'Unsupported message type: ' + msgType);
  }

  if (paymentData && paymentData.amount > 0) {
    pushToFirestore(paymentData);
    logEvent('PUSHED', 'Rs. ' + paymentData.amount + ' from ' + paymentData.payer + ' (' + paymentData.bank + ')');
  } else {
    logEvent('NO_PAYMENT', 'Could not extract payment from message');
  }
}

function getSenderName(phone, value) {
  if (value.contacts && value.contacts.length > 0) {
    for (var i = 0; i < value.contacts.length; i++) {
      if (value.contacts[i].wa_id === phone) {
        return value.contacts[i].profile.name || phone;
      }
    }
  }
  return phone;
}

// ─── PARSING LOGIC ───────────────────────────────────────────

function parsePaymentFromText(text, senderName, timestamp) {
  if (!text || text.length < 3) return null;
  var amount = extractAmount(text);
  if (!amount || amount <= 0) return null;
  var payer = extractPayer(text) || senderName || 'Unknown';
  var bank = extractBank(text);
  var txnDate = formatDate(timestamp);
  return {
    amount: amount, payer: payer, bank: bank, source: 'whatsapp',
    txn_date: txnDate, match_status: 'UNMATCHED',
    processed_at: new Date().toISOString(),
    raw_subject: 'WhatsApp from ' + senderName + ': ' + text.substring(0, 200),
    wa_sender: senderName
  };
}

function parsePaymentFromOCR(ocrText, caption, senderName, timestamp) {
  if (!ocrText || ocrText.length < 10) return null;
  logEvent('OCR_TEXT', ocrText.substring(0, 500));
  var amount = extractAmount(ocrText);
  if (!amount || amount <= 0) return null;
  var payer = extractPayerFromReceipt(ocrText) || extractPayer(caption) || senderName || 'Unknown';
  var bank = extractBank(ocrText);
  var tid = extractTransactionId(ocrText);
  var txnDate = extractDateFromText(ocrText) || formatDate(timestamp);
  return {
    amount: amount, payer: payer, bank: bank, source: 'whatsapp',
    tid: tid, txn_date: txnDate, match_status: 'UNMATCHED',
    processed_at: new Date().toISOString(),
    raw_subject: 'WhatsApp OCR from ' + senderName + ': ' + (caption || ocrText.substring(0, 100)),
    wa_sender: senderName
  };
}

function extractAmount(text) {
  if (!text) return 0;
  var patterns = [
    /(?:PKR|Rs\.?|Amount:?)\s*[:\s]*([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/i,
    /([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)\s*(?:PKR|Rs\.?)/i,
    /amount\s*[:\s]*(?:PKR|Rs\.?)?\s*([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/i,
    /(?:credited|received|transferred|paid)\s*[:\s]*(?:PKR|Rs\.?)?\s*([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/i,
    /\b([0-9]{1,3}(?:,?[0-9]{3})+(?:\.[0-9]{2})?)\b/,
    /\b([0-9]{4,10})\b/
  ];
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);
    if (match) {
      var num = parseFloat(match[1].replace(/,/g, ''));
      if (num >= 100 && num <= 100000000) return num;
    }
  }
  return 0;
}

function extractPayer(text) {
  if (!text) return null;
  var cleaned = text.replace(/\s*(CNC|CST|payment|advance|adv|receipt)\s*/gi, ' ').trim();
  cleaned = cleaned.replace(/(?:PKR|Rs\.?)\s*[0-9,\.]+/gi, '').trim();
  cleaned = cleaned.replace(/\b[0-9]{4,}\b/g, '').trim();
  if (cleaned.length >= 2 && /[a-zA-Z]/.test(cleaned)) {
    return cleaned.replace(/\s+/g, ' ').trim().toUpperCase();
  }
  return null;
}

function extractPayerFromReceipt(text) {
  var patterns = [
    /(?:transferred?\s+to|beneficiary|recipient|payee|credit(?:ed)?\s+to)\s*[:\s]*([A-Z][A-Z\s\.]{2,40})/i,
    /(?:from|sender|remitter|debit(?:ed)?\s+from)\s*[:\s]*([A-Z][A-Z\s\.]{2,40})/i,
    /(?:account\s+title|name)\s*[:\s]*([A-Z][A-Z\s\.]{2,40})/i,
  ];
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);
    if (match) {
      var name = match[1].trim().replace(/\s+/g, ' ').replace(/[^A-Z\s\.]/gi, '').trim();
      if (name.length >= 3) return name.toUpperCase();
    }
  }
  return null;
}

function extractBank(text) {
  if (!text) return 'Unknown';
  var t = text.toLowerCase();
  if (t.indexOf('bank al habib') >= 0 || t.indexOf('bahl') >= 0 || t.indexOf('al habib') >= 0 || t.indexOf('bank alhabib') >= 0 || /\bbah\b/.test(t)) return 'BAH';
  if (t.indexOf('meezan') >= 0 || t.indexOf('mezan') >= 0) return 'Meezan';
  if (t.indexOf('hbl') >= 0 || t.indexOf('habib bank limited') >= 0) return 'HBL';
  if (t.indexOf('ubl') >= 0 || t.indexOf('united bank') >= 0) return 'UBL';
  if (t.indexOf('mcb') >= 0 || t.indexOf('muslim commercial') >= 0) return 'MCB';
  if (t.indexOf('allied') >= 0 || t.indexOf('abl') >= 0) return 'ABL';
  if (t.indexOf('askari') >= 0) return 'Askari';
  if (t.indexOf('faysal') >= 0) return 'Faysal';
  if (t.indexOf('standard chartered') >= 0 || t.indexOf('scb') >= 0) return 'SCB';
  if (t.indexOf('jazzcash') >= 0 || t.indexOf('jazz cash') >= 0) return 'JazzCash';
  if (t.indexOf('easypaisa') >= 0 || t.indexOf('easy paisa') >= 0) return 'Easypaisa';
  if (t.indexOf('sadapay') >= 0 || t.indexOf('sada pay') >= 0) return 'SadaPay';
  if (t.indexOf('nayapay') >= 0 || t.indexOf('naya pay') >= 0) return 'NayaPay';
  return 'Unknown';
}

function extractTransactionId(text) {
  if (!text) return null;
  var patterns = [
    /(?:transaction\s*(?:id|#|no\.?)|ref(?:erence)?\s*(?:#|no\.?)?|trx\s*id)\s*[:\s]*([A-Z0-9]{8,30})/i,
    /\b(KA[0-9]{15,25})\b/,
    /\b(MB[0-9]{15,20})\b/,
    /\b([0-9]{10,20})\b/
  ];
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);
    if (match) return match[1];
  }
  return null;
}

function extractDateFromText(text) {
  if (!text) return null;
  var match = text.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (match) return match[1] + '/' + match[2] + '/' + match[3];
  match = text.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/i);
  if (match) {
    var months = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
    var m = months[match[2].toLowerCase().substring(0,3)];
    var d = match[1].length === 1 ? '0' + match[1] : match[1];
    return d + '/' + m + '/' + match[3];
  }
  match = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return match[3] + '/' + match[2] + '/' + match[1];
  return null;
}

function formatDate(date) {
  var d = date.getDate().toString().padStart(2, '0');
  var m = (date.getMonth() + 1).toString().padStart(2, '0');
  var y = date.getFullYear();
  return d + '/' + m + '/' + y;
}

// ─── IMAGE DOWNLOAD & OCR ────────────────────────────────────

function downloadAndOCR(mediaId) {
  try {
    var urlResponse = UrlFetchApp.fetch('https://graph.facebook.com/v19.0/' + mediaId, {
      headers: { 'Authorization': 'Bearer ' + CONFIG.META_ACCESS_TOKEN },
      muteHttpExceptions: true
    });
    if (urlResponse.getResponseCode() !== 200) {
      logEvent('OCR_ERROR', 'Failed to get media URL: ' + urlResponse.getContentText());
      return null;
    }
    var mediaUrl = JSON.parse(urlResponse.getContentText()).url;
    if (!mediaUrl) { logEvent('OCR_ERROR', 'No URL in media response'); return null; }

    var imageResponse = UrlFetchApp.fetch(mediaUrl, {
      headers: { 'Authorization': 'Bearer ' + CONFIG.META_ACCESS_TOKEN },
      muteHttpExceptions: true
    });
    if (imageResponse.getResponseCode() !== 200) {
      logEvent('OCR_ERROR', 'Failed to download media: ' + imageResponse.getResponseCode());
      return null;
    }
    var imageBytes = Utilities.base64Encode(imageResponse.getBlob().getBytes());
    return runCloudVisionOCR(imageBytes);
  } catch (err) {
    logEvent('OCR_ERROR', 'downloadAndOCR failed: ' + err.message);
    return null;
  }
}

function runCloudVisionOCR(base64Image) {
  try {
    var response = UrlFetchApp.fetch('https://vision.googleapis.com/v1/images:annotate', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ requests: [{ image: { content: base64Image }, features: [{ type: 'TEXT_DETECTION', maxResults: 1 }] }] }),
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
      logEvent('VISION_ERROR', 'API returned ' + response.getResponseCode());
      return runDriveOCR(base64Image);
    }
    var result = JSON.parse(response.getContentText());
    if (result.responses && result.responses[0] && result.responses[0].fullTextAnnotation) {
      return result.responses[0].fullTextAnnotation.text;
    }
    return runDriveOCR(base64Image);
  } catch (err) {
    logEvent('VISION_ERROR', 'OCR failed: ' + err.message);
    return runDriveOCR(base64Image);
  }
}

function runDriveOCR(base64Image) {
  try {
    var imageBlob = Utilities.newBlob(Utilities.base64Decode(base64Image), 'image/png', 'payment.png');
    var file = DriveApp.createFile(imageBlob);
    var resource = { title: 'OCR_temp_' + Date.now(), mimeType: 'application/vnd.google-apps.document' };
    var ocrFile = Drive.Files.copy(resource, file.getId(), { ocr: true, ocrLanguage: 'en' });
    var doc = DocumentApp.openById(ocrFile.id);
    var text = doc.getBody().getText();
    DriveApp.getFileById(ocrFile.id).setTrashed(true);
    file.setTrashed(true);
    logEvent('DRIVE_OCR', 'Extracted ' + text.length + ' chars');
    return text;
  } catch (err) {
    logEvent('DRIVE_OCR_ERROR', 'Drive OCR fallback failed: ' + err.message);
    return null;
  }
}

// ─── FIREBASE FIRESTORE ──────────────────────────────────────

function pushToFirestore(data) {
  try {
    var docId = generateDocId(data);
    if (isDocExists(docId)) {
      logEvent('DUPLICATE', 'Doc ' + docId + ' already exists');
      return false;
    }
    var url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.FIREBASE_PROJECT +
              '/databases/(default)/documents/' + CONFIG.FIRESTORE_COLLECTION + '?documentId=' + docId;
    var firestoreDoc = { fields: {} };
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        var val = data[key];
        if (typeof val === 'number') firestoreDoc.fields[key] = { doubleValue: val };
        else if (typeof val === 'string') firestoreDoc.fields[key] = { stringValue: val };
        else if (typeof val === 'boolean') firestoreDoc.fields[key] = { booleanValue: val };
      }
    }
    var response = UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify(firestoreDoc),
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    if (code === 200 || code === 201) { logEvent('FIRESTORE', 'Created doc ' + docId); return true; }
    else { logEvent('FIRESTORE_ERROR', 'Code ' + code + ': ' + response.getContentText().substring(0, 200)); return false; }
  } catch (err) {
    logEvent('FIRESTORE_ERROR', 'pushToFirestore failed: ' + err.message);
    return false;
  }
}

function isDocExists(docId) {
  try {
    var url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.FIREBASE_PROJECT +
              '/databases/(default)/documents/' + CONFIG.FIRESTORE_COLLECTION + '/' + docId;
    var response = UrlFetchApp.fetch(url, {
      method: 'get', headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    return response.getResponseCode() === 200;
  } catch (err) { return false; }
}

function generateDocId(data) {
  var raw = 'wa_' + (data.amount || 0) + '_' + (data.txn_date || '') + '_' +
            (data.payer || '').substring(0, 20).replace(/[^a-zA-Z0-9]/g, '') + '_' +
            (data.wa_sender || '').substring(0, 10).replace(/[^a-zA-Z0-9]/g, '');
  var hash = 0;
  for (var i = 0; i < raw.length; i++) { hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0; }
  return 'wa_' + Math.abs(hash).toString(36) + '_' + data.amount;
}

// ─── LOGGING ─────────────────────────────────────────────────

function logEvent(type, message) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      var files = DriveApp.getFilesByName('PayGate WhatsApp Log');
      if (files.hasNext()) ss = SpreadsheetApp.open(files.next());
      else ss = SpreadsheetApp.create('PayGate WhatsApp Log');
    }
    var sheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
    if (!sheet) { sheet = ss.insertSheet(CONFIG.LOG_SHEET_NAME); sheet.appendRow(['Timestamp', 'Type', 'Message']); }
    sheet.appendRow([new Date().toISOString(), type, message]);
    Logger.log('[' + type + '] ' + message);
  } catch (err) {
    Logger.log('[LOG_ERROR] ' + err.message + ' | [' + type + '] ' + message);
  }
}

// ─── SETUP & TESTING ─────────────────────────────────────────

function testMetaConnection() {
  try {
    var response = UrlFetchApp.fetch('https://graph.facebook.com/v19.0/' + CONFIG.PHONE_NUMBER_ID, {
      headers: { 'Authorization': 'Bearer ' + CONFIG.META_ACCESS_TOKEN }, muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    if (code === 200) {
      var data = JSON.parse(response.getContentText());
      Logger.log('SUCCESS! Phone: ' + (data.display_phone_number || 'N/A') + ' Quality: ' + (data.quality_rating || 'N/A'));
      return true;
    } else { Logger.log('FAILED! Code: ' + code + ' ' + response.getContentText()); return false; }
  } catch (err) { Logger.log('ERROR: ' + err.message); return false; }
}

function testFirestoreConnection() {
  var testData = { amount: 1, payer: 'WHATSAPP_TEST', bank: 'TEST', source: 'whatsapp-test',
    txn_date: formatDate(new Date()), match_status: 'UNMATCHED', processed_at: new Date().toISOString(),
    raw_subject: 'Test from WhatsApp webhook', wa_sender: 'test' };
  var result = pushToFirestore(testData);
  Logger.log(result ? 'SUCCESS — test doc created' : 'FAILED — could not create doc');
  return result;
}

function sendTestMessage(toPhone) {
  toPhone = toPhone || '923244465966';
  try {
    var response = UrlFetchApp.fetch('https://graph.facebook.com/v19.0/' + CONFIG.PHONE_NUMBER_ID + '/messages', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ messaging_product: 'whatsapp', to: toPhone, type: 'text',
        text: { body: 'PayGate WhatsApp webhook is connected! Payments sent to this number will be automatically tracked.' } }),
      headers: { 'Authorization': 'Bearer ' + CONFIG.META_ACCESS_TOKEN }, muteHttpExceptions: true
    });
    Logger.log(response.getResponseCode() === 200 ? 'SUCCESS — message sent!' : 'FAILED — ' + response.getContentText());
    return response.getResponseCode() === 200;
  } catch (err) { Logger.log('ERROR: ' + err.message); return false; }
}

function showSetupInfo() {
  var url = ScriptApp.getService().getUrl();
  Logger.log('═══════════════════════════════════════');
  Logger.log('PayGate WhatsApp Webhook Setup');
  Logger.log('Web App URL: ' + (url || 'Deploy first!'));
  Logger.log('');
  Logger.log('1. Deploy > New Deployment > Web App');
  Logger.log('   Execute as: Me | Access: Anyone');
  Logger.log('2. Go to developers.facebook.com/apps');
  Logger.log('   WhatsApp > Configuration > Callback URL');
  Logger.log('   Paste your Web App URL');
  Logger.log('   Verify Token: ' + CONFIG.VERIFY_TOKEN);
  Logger.log('   Subscribe to: messages');
  Logger.log('3. Run testMetaConnection()');
  Logger.log('4. Run testFirestoreConnection()');
  Logger.log('═══════════════════════════════════════');
}
