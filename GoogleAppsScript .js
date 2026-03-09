// ═══════════════════════════════════════════════════════════════
//  DSR FIELD PORTAL — Google Apps Script Backend
//  Paste this entire file into Google Sheets → Extensions → Apps Script
//  Then click Deploy → New Deployment → Web App
// ═══════════════════════════════════════════════════════════════

const SHEET_NAME_USERS    = 'Users';
const SHEET_NAME_REPORTS  = 'Reports';
const SHEET_NAME_MESSAGES = 'Messages';

// ── SETUP: Create sheets with headers if they don't exist ──────
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // USERS sheet
  let users = ss.getSheetByName(SHEET_NAME_USERS);
  if (!users) {
    users = ss.insertSheet(SHEET_NAME_USERS);
    users.getRange(1, 1, 1, 8).setValues([[
      'ID', 'Name', 'Username', 'Password', 'WhatsApp', 'Role', 'Approved', 'DeviceID'
    ]]);
    users.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#0f4c35').setFontColor('white');
  }

  // REPORTS sheet
  let reports = ss.getSheetByName(SHEET_NAME_REPORTS);
  if (!reports) {
    reports = ss.insertSheet(SHEET_NAME_REPORTS);
    reports.getRange(1, 1, 1, 12).setValues([[
      'ID', 'UserID', 'UserName', 'UserWA', 'Client', 'Message', 'Outcome', 'Latitude', 'Longitude', 'Address', 'Date', 'Time'
    ]]);
    reports.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#0f4c35').setFontColor('white');
  }

  // MESSAGES sheet
  let messages = ss.getSheetByName(SHEET_NAME_MESSAGES);
  if (!messages) {
    messages = ss.insertSheet(SHEET_NAME_MESSAGES);
    messages.getRange(1, 1, 1, 7).setValues([[
      'ID', 'ToID', 'ToName', 'FromName', 'Body', 'Timestamp', 'Read'
    ]]);
    messages.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#0f4c35').setFontColor('white');
  }

  return 'Setup complete!';
}

// ── MAIN ENTRY POINTS ──────────────────────────────────────────

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch(err) { return output({ error: 'Invalid JSON' }); }
  const action = body.action;
  let result;
  try {
    switch (action) {
      case 'register':        result = register(body); break;
      case 'addEmployee':     result = addEmployee(body); break;
      case 'approveEmployee': result = approveEmployee(body); break;
      case 'deleteEmployee':  result = deleteEmployee(body); break;
      case 'resetDevice':     result = resetDevice(body); break;
      case 'submitReport':    result = submitReport(body); break;
      case 'sendMessage':     result = sendMessage(body); break;
      case 'markRead':        result = markRead(body); break;
      default:                result = { error: 'Unknown action: ' + action };
    }
  } catch(err) {
    result = { error: err.toString() };
  }
  return output(result);
}

function output(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback || '';
  let result;
  try {
    switch (action) {
      case 'login':        result = login(e.parameter); break;
      case 'getStats':     result = getStats(); break;
      case 'getReports':   result = getReports(e.parameter); break;
      case 'getEmployees': result = getEmployees(); break;
      case 'getMessages':  result = getMessages(e.parameter); break;
      default:             result = { error: 'Unknown action: ' + action };
    }
  } catch(err) {
    result = { error: err.toString() };
  }
  return output(result, callback);
}

// ── AUTH ───────────────────────────────────────────────────────
function login(p) {
  const username = (p.username || '').toLowerCase().trim();
  const password = p.password || '';
  const deviceId = p.deviceId || '';

  const sheet = getSheet(SHEET_NAME_USERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // cols: ID, Name, Username, Password, WhatsApp, Role, Approved, DeviceID
    if ((row[2]||'').toLowerCase().trim() === username && row[3] === password) {
      if (row[6] !== true && row[6] !== 'TRUE') {
        return { ok: false, msg: 'Your account is pending admin approval.' };
      }
      // Device check
      const storedDevice = row[7] || '';
      if (storedDevice === '' || storedDevice === null) {
        // First login — register device
        sheet.getRange(i + 1, 8).setValue(deviceId);
      } else if (storedDevice !== deviceId) {
        return { ok: false, msg: 'Access denied — this is not your registered device. Contact admin.' };
      }
      return {
        ok: true,
        user: { id: row[0], name: row[1], username: row[2], wa: row[4], role: row[5] || 'employee' }
      };
    }
  }
  return { ok: false, msg: 'Wrong username or password.' };
}

function register(body) {
  const username = (body.username || '').toLowerCase().trim();
  const sheet = getSheet(SHEET_NAME_USERS);
  const data = sheet.getDataRange().getValues();

  // Check duplicate
  for (let i = 1; i < data.length; i++) {
    if ((data[i][2]||'').toLowerCase().trim() === username) {
      return { ok: false, msg: 'Username already taken. Choose another.' };
    }
  }

  const id = 'U' + Date.now();
  sheet.appendRow([id, body.name, username, body.password, body.wa || '', 'employee', false, '']);
  return { ok: true };
}

// ── EMPLOYEES ─────────────────────────────────────────────────
function addEmployee(body) {
  const username = (body.username || '').toLowerCase().trim();
  const sheet = getSheet(SHEET_NAME_USERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if ((data[i][2]||'').toLowerCase() === username) {
      return { ok: false, msg: 'Username already exists.' };
    }
  }
  const id = 'U' + Date.now();
  const approved = body.approved === true || body.approved === 'true';
  sheet.appendRow([id, body.name, username, body.password, body.wa || '', 'employee', approved, '']);
  return { ok: true };
}

function approveEmployee(body) {
  updateUserField(body.id, 7, true); // col 7 = Approved (1-indexed col G)
  return { ok: true };
}

function deleteEmployee(body) {
  const sheet = getSheet(SHEET_NAME_USERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === body.id) { sheet.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false, msg: 'Not found' };
}

function resetDevice(body) {
  updateUserField(body.id, 8, ''); // col 8 = DeviceID
  return { ok: true };
}

function getEmployees() {
  const sheet = getSheet(SHEET_NAME_USERS);
  const data = sheet.getDataRange().getValues();
  const employees = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[5] === 'employee') {
      employees.push({
        id: row[0], name: row[1], username: row[2],
        wa: row[4], approved: row[6], deviceId: row[7]
      });
    }
  }
  return { employees };
}

// ── REPORTS ───────────────────────────────────────────────────
function submitReport(body) {
  const sheet = getSheet(SHEET_NAME_REPORTS);
  const id = 'R' + Date.now();
  sheet.appendRow([
    id, body.userId, body.userName, body.userWa || '',
    body.client || '', body.message || '', body.outcome || '',
    body.lat || '', body.lng || '', body.address || '',
    body.date || '', body.time || ''
  ]);
  return { ok: true };
}

function getReports(p) {
  const sheet = getSheet(SHEET_NAME_REPORTS);
  const data = sheet.getDataRange().getValues();
  const limit = parseInt(p.limit || 50);
  const empId = p.empId || '';
  const date = p.date || '';

  let reports = [];
  // Reverse iterate so newest first
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (empId && row[1] !== empId) continue;
    if (date && row[10] !== date) continue;
    reports.push({
      id: row[0], userId: row[1], userName: row[2], userWa: row[3],
      client: row[4], message: row[5], outcome: row[6],
      lat: row[7], lng: row[8], address: row[9],
      date: row[10], time: row[11]
    });
    if (reports.length >= limit) break;
  }
  return { reports };
}

// ── STATS ─────────────────────────────────────────────────────
function getStats() {
  const users = getSheet(SHEET_NAME_USERS).getDataRange().getValues();
  const reports = getSheet(SHEET_NAME_REPORTS).getDataRange().getValues();

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = Utilities.formatDate(weekAgo, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  let totalStaff = 0, pending = 0, todayCount = 0, weekCount = 0;

  for (let i = 1; i < users.length; i++) {
    if (users[i][5] === 'employee') {
      totalStaff++;
      if (users[i][6] !== true && users[i][6] !== 'TRUE') pending++;
    }
  }
  for (let i = 1; i < reports.length; i++) {
    const d = reports[i][10] || '';
    if (d === today) todayCount++;
    if (d >= weekStr) weekCount++;
  }

  return { stats: { totalStaff, pending, today: todayCount, week: weekCount } };
}

// ── MESSAGES ─────────────────────────────────────────────────
function sendMessage(body) {
  const sheet = getSheet(SHEET_NAME_MESSAGES);
  const id = 'M' + Date.now();
  const ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  sheet.appendRow([id, body.toId, body.toName, body.fromName, body.body, ts, false]);
  return { ok: true };
}

function getMessages(p) {
  const sheet = getSheet(SHEET_NAME_MESSAGES);
  const data = sheet.getDataRange().getValues();
  let messages = [];

  if (p.type === 'sent') {
    // Admin: get all sent messages
    for (let i = data.length - 1; i >= 1; i--) {
      messages.push({ id: data[i][0], toName: data[i][2], body: data[i][4], ts: data[i][5] });
      if (messages.length >= 30) break;
    }
  } else if (p.userId) {
    // Employee: get messages for this user
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === p.userId) {
        messages.push({ id: data[i][0], body: data[i][4], ts: data[i][5], read: data[i][6] });
      }
    }
  }
  return { messages };
}

function markRead(body) {
  const sheet = getSheet(SHEET_NAME_MESSAGES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === body.userId && (data[i][6] !== true && data[i][6] !== 'TRUE')) {
      sheet.getRange(i + 1, 7).setValue(true);
    }
  }
  return { ok: true };
}

// ── HELPERS ───────────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) { setupSheets(); sheet = ss.getSheetByName(name); }
  return sheet;
}

function updateUserField(userId, colIndex, value) {
  const sheet = getSheet(SHEET_NAME_USERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      sheet.getRange(i + 1, colIndex).setValue(value);
      return;
    }
  }
}
