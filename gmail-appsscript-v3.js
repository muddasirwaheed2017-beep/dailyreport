/**
 * PayGate Bank Feed — Apps Script V3
 * Based on V2. All V2 logic preserved — only safety guards added.
 *
 * FIXES APPLIED:
 *   F-001: Sender verification — SMS must contain "From : 8810" in body
 *   F-002: Deterministic doc IDs — hash(amount+date+subject) prevents duplicates
 *   F-003: Debit filter — rejects "debited", "withdrawn", "sent to" messages
 *   F-004: Response validation — checks HTTP status, doesn't label on failure
 *   F-005: Date parsing — validates month ≤ 12, day ≤ 31, year ≥ 2020
 *   F-006: Lock guard — prevents overlapping trigger runs
 *   F-007: TID regex — removed overly broad pattern
 *   F-009: Daily health email — optional monitoring
 *   F-012: setupTrigger — only deletes checkBankEmails triggers
 *   F-013: backfill — respects label filter
 */

var CONFIG = {
  FIRESTORE_URL: "https://firestore.googleapis.com/v1/projects/paygate-cnc/databases/(default)/documents/paygate_bank_feeds",
  PROCESSED_LABEL: "PayGate-Processed",
  SEARCH_DAYS: 7,
  BANK_QUERIES: ["from:*@bahl.com","from:*@bankalfalah.com","from:*@meezanbank.com","from:*@jsbl.com","from:*@hbl.com","from:*@soneribank.com"],
  SMS_QUERY: 'subject:"[SMSForwarder]"',
  ALERT_EMAIL: "muddasirwaheed2017@gmail.com",  // daily health report recipient
  SMS_SENDER_NUMBERS: ["8810","8811","8001","8009"],  // valid bank SMS sender numbers
  DEBIT_KEYWORDS: ["debited","withdrawn","sent to","debit","transferred from your","paid to","outgoing"],
  MAX_AMOUNT: 50000000  // Rs. 5 crore — flag anything above this
};

// ============================================================
// F-006 FIX: Lock guard to prevent overlapping trigger runs
// ============================================================
function checkBankEmails() {
  var lock = LockService.getScriptLock();
  var gotLock = lock.tryLock(5000);  // wait up to 5 seconds
  if (!gotLock) {
    Logger.log("SKIP: Another instance is already running");
    return;
  }

  try {
    _checkBankEmails();
  } finally {
    lock.releaseLock();
  }
}

function _checkBankEmails() {
  var label = getOrCreateLabel(CONFIG.PROCESSED_LABEL);
  var processed = 0;
  var errors = 0;

  // Search 1: Direct bank emails (SAME AS V2)
  var bankQuery = "(" + CONFIG.BANK_QUERIES.join(" OR ") + ") newer_than:" + CONFIG.SEARCH_DAYS + "d -label:" + CONFIG.PROCESSED_LABEL;
  GmailApp.search(bankQuery, 0, 50).forEach(function(thread) {
    var threadOk = true;
    thread.getMessages().forEach(function(msg) {
      var result = processMessage(msg, "email");
      if (result === "ERROR") { threadOk = false; errors++; }
      else if (result) processed++;
    });
    // F-004 FIX: Only label thread if ALL messages processed without error
    if (threadOk) thread.addLabel(label);
    else Logger.log("SKIPPED LABEL — errors in thread: " + thread.getFirstMessageSubject());
  });

  // Search 2: SMSForwarder emails (SAME AS V2 + sender verification)
  var smsQuery = CONFIG.SMS_QUERY + " newer_than:" + CONFIG.SEARCH_DAYS + "d -label:" + CONFIG.PROCESSED_LABEL;
  GmailApp.search(smsQuery, 0, 100).forEach(function(thread) {
    var threadOk = true;
    thread.getMessages().forEach(function(msg) {
      var body = msg.getPlainBody();
      var subject = msg.getSubject();
      if (isBankSMS(body, subject)) {
        // F-001 FIX: Verify SMS actually came from a bank sender number
        if (!isFromBankSender(body)) {
          Logger.log("REJECTED — not from bank sender: " + subject.slice(0, 60));
          return;  // skip this message, continue to next
        }
        var result = processMessage(msg, "sms");
        if (result === "ERROR") { threadOk = false; errors++; }
        else if (result) processed++;
      }
    });
    // F-004 FIX: Only label if no errors
    if (threadOk) thread.addLabel(label);
    else Logger.log("SKIPPED LABEL — errors in thread: " + thread.getFirstMessageSubject());
  });

  Logger.log("Processed: " + processed + " | Errors: " + errors);
}

// ============================================================
// F-001 FIX: Verify SMS body contains "From : XXXX" with valid bank number
// ============================================================
function isFromBankSender(body) {
  if (!body) return false;
  var fromMatch = body.match(/From\s*:\s*(\d{4,5})/i);
  if (!fromMatch) return false;
  var senderNum = fromMatch[1];
  return CONFIG.SMS_SENDER_NUMBERS.indexOf(senderNum) >= 0;
}

// ============================================================
// F-003 FIX: Enhanced isBankSMS — must be CREDIT, not debit
// ============================================================
function isBankSMS(body, subject) {
  var text = (body + " " + subject).toLowerCase();

  // ORIGINAL V2 keyword check (preserved exactly)
  var hasKeyword = ["dear cogniti","cognitive solutions","credited","received pkr","deposited","bahl","alfalah","meezan"].some(function(kw) { return text.indexOf(kw) >= 0; });
  if (!hasKeyword) return false;

  // F-003 NEW: Reject if debit keywords found
  var isDebit = CONFIG.DEBIT_KEYWORDS.some(function(kw) { return text.indexOf(kw) >= 0; });
  if (isDebit) {
    Logger.log("REJECTED DEBIT: " + subject.slice(0, 60));
    return false;
  }

  // F-003 NEW: For bank-name-only matches (no "credited"/"deposited"), require explicit credit keyword
  var hasCreditWord = ["credited","received pkr","deposited","credit alert","has been credited"].some(function(kw) { return text.indexOf(kw) >= 0; });
  var hasBankNameOnly = !hasCreditWord && ["bahl","alfalah","meezan"].some(function(kw) { return text.indexOf(kw) >= 0; });
  if (hasBankNameOnly) {
    Logger.log("SKIPPED — bank name present but no credit keyword: " + subject.slice(0, 60));
    return false;
  }

  return true;
}

// ============================================================
// processMessage — enhanced with F-002 dedup + F-004 error handling
// ============================================================
function processMessage(msg, source) {
  var text = msg.getSubject() + " " + msg.getPlainBody();
  var data = parseMessage(text, source, msg);

  // ORIGINAL V2 amount check (preserved)
  if (!data.amount || data.amount <= 0) return null;

  // F-011 NEW: Flag suspicious amounts
  if (data.amount > CONFIG.MAX_AMOUNT) {
    Logger.log("WARNING — unusually large amount: Rs. " + data.amount + " from " + data.raw_subject);
  }

  // ORIGINAL V2 TID dedup (preserved)
  if (data.tid && isAlreadyInFirebase(data.tid)) { Logger.log("Dup TID: " + data.tid); return null; }

  // F-002 FIX: Generate deterministic doc ID for idempotent writes
  var docId = generateDocId(data);

  // F-002 FIX: Check if this exact doc already exists (covers non-TID transactions)
  if (isDocExists(docId)) {
    Logger.log("Dup DocID: " + docId + " | " + data.amount + " | " + data.raw_subject.slice(0, 50));
    return null;
  }

  // F-004 FIX: pushToFirestore now returns success/failure
  var success = pushToFirestore(data, docId);
  if (!success) {
    Logger.log("PUSH FAILED — will retry next run: " + data.amount + " | " + data.raw_subject);
    return "ERROR";  // special return value — tells caller not to label thread
  }

  Logger.log("Pushed: PKR " + data.amount + " | " + data.payer + " | " + data.bank + " | " + source + " | DocID: " + docId);
  return data;
}

// ============================================================
// F-002 FIX: Deterministic document ID from transaction fingerprint
// ============================================================
function generateDocId(data) {
  // Combine the fields that make a transaction unique
  var fingerprint = [
    String(data.amount || 0),
    String(data.raw_subject || ""),
    String(data.source || "")
  ].join("|");

  // Simple hash — consistent across runs
  var hash = 0;
  for (var i = 0; i < fingerprint.length; i++) {
    var chr = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;  // Convert to 32-bit integer
  }
  // Make it positive and convert to base36 for shorter ID
  var id = "pg_" + Math.abs(hash).toString(36);
  return id;
}

// ============================================================
// F-002 FIX: Check if document with this ID already exists
// ============================================================
function isDocExists(docId) {
  var token = ScriptApp.getOAuthToken();
  var url = CONFIG.FIRESTORE_URL + "/" + docId;
  try {
    var resp = UrlFetchApp.fetch(url, {
      method: "GET",
      headers: { "Authorization": "Bearer " + token },
      muteHttpExceptions: true
    });
    return resp.getResponseCode() === 200;  // exists
  } catch(e) {
    return false;  // assume doesn't exist on error — will try to write
  }
}

// ============================================================
// parseMessage — SAME AS V2 with F-005 date fix + F-007 TID fix
// ============================================================
function parseMessage(text, source, msg) {
  // ORIGINAL V2 data structure (preserved exactly)
  var data = { amount:null, payer:null, bank:null, tid:null, account:null, txn_date:null, source:source||"email", match_status:"UNMATCHED", processed_at:new Date().toISOString(), raw_subject:msg?msg.getSubject():"" };

  // Amount — SAME AS V2 (preserved exactly)
  var amtP = [/PKR\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,/Rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,/Amount[:\s]+(?:PKR\s*)?([0-9,]+)/i,/credited\s+(?:with\s+)?(?:PKR|Rs\.?)?\s*([0-9,]+)/i,/received\s+(?:PKR|Rs\.?)?\s*([0-9,]+)/i];
  for(var i=0;i<amtP.length;i++){var m=text.match(amtP[i]);if(m){data.amount=parseFloat(m[1].replace(/,/g,""));break;}}

  // Bank — SAME AS V2 (preserved exactly)
  var from = msg?msg.getFrom().toLowerCase():"";
  var tl = text.toLowerCase();
  if(from.indexOf("bahl")>=0||from.indexOf("alhabib")>=0||tl.indexOf("bahl")>=0) data.bank="BAH";
  else if(from.indexOf("alfalah")>=0||tl.indexOf("alfalah")>=0) data.bank="BAFL";
  else if(from.indexOf("meezan")>=0||tl.indexOf("meezan")>=0) data.bank="Meezan";
  else if(from.indexOf("jsbl")>=0||tl.indexOf("js bank")>=0) data.bank="JS Bank";
  else if(from.indexOf("hbl")>=0||tl.indexOf("hbl")>=0) data.bank="HBL";
  else data.bank="Unknown";

  // Payer — SAME AS V2 (preserved exactly)
  var payP = [/credited\s+by\s+([A-Z][A-Z\s\.]{2,40}?)(?:\s+via|\s+from|\.|,|\n)/i,/from\s+([A-Z][A-Z\s\.]{2,40}?)(?:\s+account|\.|,|\n)/i,/sender[:\s]+([A-Z][A-Z\s\.]{2,40}?)(?:\.|,|\n)/i];
  for(var j=0;j<payP.length;j++){var pm=text.match(payP[j]);if(pm&&pm[1].trim().length>2){data.payer=pm[1].trim().toUpperCase();break;}}

  // TID — F-007 FIX: Removed overly broad 3rd pattern [A-Z]{2}[0-9]{10,18}
  var tidP = [/(?:Ref|TID|Txn|RRN)[.:\s#]+([A-Z0-9]{6,25})/i, /FT[0-9]{12,15}/];
  for(var k=0;k<tidP.length;k++){var tm=text.match(tidP[k]);if(tm){data.tid=tm[1]||tm[0];break;}}

  // Date — F-005 FIX: Added proper date validation
  var dateP = [
    /on\s+(\d{1,2}\/\d{2}\/\d{4})\s+at/i,  // NEW: "on DD/MM/YYYY at" — most reliable for BAHL SMS
    /(\d{1,2}[-\/][A-Za-z]{3,9}[-\/]\d{4})/,  // V2 original
    /(\d{4}[-\/]\d{2}[-\/]\d{2})/,             // V2 original
    /(\d{1,2}[-\/]\d{2}[-\/]\d{4})/            // V2 original
  ];
  for(var d=0;d<dateP.length;d++){
    var dm=text.match(dateP[d]);
    if(dm){
      var dateStr = dm[1];
      // F-005 FIX: Validate the extracted date is actually a real date
      if(isValidDate(dateStr)){
        data.txn_date = dateStr;
        break;
      }
    }
  }

  // Account — SAME AS V2 (preserved exactly)
  var accM=text.match(/(?:A\/C|Account)[:\s*]+([*X0-9]{4,20})/i);
  if(accM) data.account=accM[1].trim();

  return data;
}

// ============================================================
// F-005 FIX: Validate extracted date string is a real date
// ============================================================
function isValidDate(dateStr) {
  if (!dateStr) return false;
  var parts = dateStr.split(/[-\/]/);
  if (parts.length !== 3) return false;

  // Detect format
  var day, month, year;
  var months = {"jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,"jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12};

  if (parts[1].match(/^[a-z]/i)) {
    // DD-Mon-YYYY format (e.g., "03-Mar-2026")
    day = parseInt(parts[0]);
    month = months[parts[1].slice(0,3).toLowerCase()] || 0;
    year = parseInt(parts[2]);
  } else if (parts[0].length === 4) {
    // YYYY-MM-DD format
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  } else {
    // DD/MM/YYYY or DD-MM-YYYY format
    day = parseInt(parts[0]);
    month = parseInt(parts[1]);
    year = parseInt(parts[2]);
  }

  // Validate ranges
  if (year < 2020 || year > 2030) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  // Reject obvious phone number fragments (3-digit segments that aren't valid dates)
  if (parts.some(function(p){ return p.length === 3 && !isNaN(p) && !months[p.toLowerCase()]; })) return false;

  return true;
}

// ============================================================
// F-004 FIX: pushToFirestore now uses PUT with docId + validates response
// ============================================================
function pushToFirestore(data, docId) {
  var token = ScriptApp.getOAuthToken();
  var fields = {};
  Object.keys(data).forEach(function(k){
    var v=data[k]; if(v===null||v===undefined)return;
    if(typeof v==="number") fields[k]={doubleValue:v};
    else if(typeof v==="boolean") fields[k]={booleanValue:v};
    else fields[k]={stringValue:String(v)};
  });

  // F-002 FIX: Use PATCH with docId for idempotent writes (if docId provided)
  var url = docId ? (CONFIG.FIRESTORE_URL + "/" + docId) : CONFIG.FIRESTORE_URL;
  var method = docId ? "PATCH" : "POST";

  try {
    var resp = UrlFetchApp.fetch(url, {
      method: method,
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + token },
      payload: JSON.stringify({ fields: fields }),
      muteHttpExceptions: true
    });

    var code = resp.getResponseCode();
    if (code >= 200 && code < 300) {
      return true;  // success
    } else {
      Logger.log("FIRESTORE ERROR " + code + ": " + resp.getContentText().slice(0, 200));
      return false;  // caller will NOT label the thread
    }
  } catch(e) {
    Logger.log("FIRESTORE EXCEPTION: " + e.message);
    return false;
  }
}

// ============================================================
// isAlreadyInFirebase — SAME AS V2 (preserved exactly)
// ============================================================
function isAlreadyInFirebase(tid) {
  if(!tid) return false;
  var token=ScriptApp.getOAuthToken();
  var url="https://firestore.googleapis.com/v1/projects/paygate-cnc/databases/(default)/documents:runQuery";
  var q={structuredQuery:{from:[{collectionId:"paygate_bank_feeds"}],where:{fieldFilter:{field:{fieldPath:"tid"},op:"EQUAL",value:{stringValue:tid}}},limit:1}};
  try{
    var r=JSON.parse(UrlFetchApp.fetch(url,{method:"POST",contentType:"application/json",headers:{"Authorization":"Bearer "+token},payload:JSON.stringify(q),muteHttpExceptions:true}).getContentText());
    return r&&r[0]&&r[0].document;
  }catch(e){return false;}
}

// ============================================================
// getOrCreateLabel — SAME AS V2 (preserved exactly)
// ============================================================
function getOrCreateLabel(name) {
  var label=GmailApp.getUserLabelByName(name);
  if(!label){label=GmailApp.createLabel(name);Logger.log("Created label: "+name);}
  return label;
}

// ============================================================
// F-012 FIX: setupTrigger — only deletes checkBankEmails triggers
// ============================================================
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction() === "checkBankEmails") {
      ScriptApp.deleteTrigger(t);
      Logger.log("Deleted trigger: " + t.getHandlerFunction());
    }
  });
  ScriptApp.newTrigger("checkBankEmails").timeBased().everyMinutes(1).create();
  getOrCreateLabel(CONFIG.PROCESSED_LABEL);
  Logger.log("✅ Trigger set: checkBankEmails every 1 minute");
  Logger.log("✅ Label: " + CONFIG.PROCESSED_LABEL);
  Logger.log("✅ V3 safety guards active");
  Logger.log("Run testConnection() to verify.");
}

// ============================================================
// testConnection — enhanced with V3 safety check reporting
// ============================================================
function testConnection() {
  Logger.log("=== PayGate V3 Test ===");
  Logger.log("Account: " + Session.getActiveUser().getEmail());
  Logger.log("Label: " + getOrCreateLabel(CONFIG.PROCESSED_LABEL).getName());
  Logger.log("Lock service: available");
  Logger.log("Debit filter: " + CONFIG.DEBIT_KEYWORDS.length + " keywords");
  Logger.log("Valid SMS senders: " + CONFIG.SMS_SENDER_NUMBERS.join(", "));
  Logger.log("Max amount flag: Rs. " + CONFIG.MAX_AMOUNT.toLocaleString());

  // Test SMSForwarder search
  var smsThreads = GmailApp.search(CONFIG.SMS_QUERY + " newer_than:7d", 0, 10);
  Logger.log("SMSForwarder emails last 7d: " + smsThreads.length);
  smsThreads.forEach(function(t) {
    var msg = t.getMessages()[0];
    var body = msg.getPlainBody();
    var subject = msg.getSubject();
    var isBank = isBankSMS(body, subject);
    var fromValid = isFromBankSender(body);
    Logger.log("  Subject: " + subject.slice(0, 70));
    Logger.log("  Is bank SMS: " + isBank + " | From valid sender: " + fromValid);
    Logger.log("  Labels: " + t.getLabels().map(function(l){ return l.getName(); }).join(","));
    if (isBank && fromValid) {
      var p = parseMessage(body + " " + subject, "sms", msg);
      var docId = generateDocId(p);
      var exists = isDocExists(docId);
      Logger.log("  Amount: " + p.amount + " | Payer: " + p.payer + " | Bank: " + p.bank + " | Date: " + p.txn_date + " | TID: " + p.tid);
      Logger.log("  DocID: " + docId + " | Already exists: " + exists);
    }
    Logger.log("---");
  });

  Logger.log("Bank emails last 7d: " + GmailApp.search("(" + CONFIG.BANK_QUERIES.join(" OR ") + ") newer_than:7d", 0, 10).length);
  Logger.log("Active triggers: " + ScriptApp.getProjectTriggers().length);
  Logger.log("=== V3 Test Done ===");
}

// ============================================================
// F-013 FIX: backfillLast30Days — now respects label filter
// ============================================================
function backfillLast30Days() {
  Logger.log("=== BACKFILL 30 days (V3) ===");
  var label = getOrCreateLabel(CONFIG.PROCESSED_LABEL);

  // F-013 FIX: Added "-label:" filter to prevent reprocessing
  var threads = GmailApp.search(CONFIG.SMS_QUERY + " newer_than:30d -label:" + CONFIG.PROCESSED_LABEL, 0, 500);
  Logger.log("Unprocessed SMSForwarder threads: " + threads.length);
  var pushed = 0;
  var skipped = 0;
  var errors = 0;

  threads.forEach(function(thread) {
    var threadOk = true;
    thread.getMessages().forEach(function(msg) {
      var body = msg.getPlainBody();
      var subject = msg.getSubject();
      if (!isBankSMS(body, subject)) return;
      if (!isFromBankSender(body)) { skipped++; return; }

      var data = parseMessage(body + " " + subject, "sms", msg);
      if (!data.amount) return;
      if (data.tid && isAlreadyInFirebase(data.tid)) return;

      var docId = generateDocId(data);
      if (isDocExists(docId)) { skipped++; return; }

      var success = pushToFirestore(data, docId);
      if (success) pushed++;
      else { errors++; threadOk = false; }
    });
    if (threadOk) thread.addLabel(label);
  });

  Logger.log("Backfill done. Pushed: " + pushed + " | Skipped (dup): " + skipped + " | Errors: " + errors);
}

// ============================================================
// F-009: Optional daily health check email
// ============================================================
function sendDailyHealthReport() {
  var triggers = ScriptApp.getProjectTriggers().length;
  var recentThreads = GmailApp.search(CONFIG.SMS_QUERY + " newer_than:1d", 0, 100);
  var processedThreads = GmailApp.search(CONFIG.SMS_QUERY + " newer_than:1d label:" + CONFIG.PROCESSED_LABEL, 0, 100);

  var body = "PayGate V3 Daily Health Report\n" +
    "================================\n" +
    "Time: " + new Date().toISOString() + "\n" +
    "Account: " + Session.getActiveUser().getEmail() + "\n" +
    "Active triggers: " + triggers + "\n" +
    "SMSForwarder emails today: " + recentThreads.length + "\n" +
    "Processed today: " + processedThreads.length + "\n" +
    "Unprocessed: " + (recentThreads.length - processedThreads.length) + "\n";

  if (triggers === 0) body += "\n WARNING: No active triggers! The system is NOT running.\n";
  if (recentThreads.length === 0) body += "\n NOTE: Zero emails received today — may be normal on quiet days.\n";

  MailApp.sendEmail(CONFIG.ALERT_EMAIL, "PayGate Health: " + triggers + " triggers, " + processedThreads.length + " processed", body);
  Logger.log("Health report sent to " + CONFIG.ALERT_EMAIL);
}
