// ═══════════════════════════════════════════════════════════════
//  PSX SLM + BANKING SECTOR ALERTS  →  WhatsApp
//  Sends a market update for SLM (Service Long March Tyres) and the
//  banking sector to your WhatsApp 3x/day (open / midday / close).
//
//  Runs on Google Apps Script time-driven triggers — lives on Google's
//  servers, free, no machine of yours needs to stay on.
//
//  SETUP (one time):
//    1. Open https://script.google.com  →  New project
//    2. Paste this whole file in, Save.
//    3. Project Settings (gear) → set Time zone to
//       "(GMT+05:00) Karachi, Tashkent" so the 9/12:30/15:30 trigger
//       hours line up with PSX (PKT).
//    4. Run setupAlertTriggers()  → grant permissions when prompted.
//    5. Run sendNow() once to confirm a WhatsApp arrives.
//  That's it. It will then fire automatically Mon–Fri.
// ═══════════════════════════════════════════════════════════════

var CONFIG = {
  // ── WhatsApp (Meta Cloud API) — same account as whatsapp-webhook-v1.js ──
  PHONE_NUMBER_ID: '1021427097723618',
  // NOTE: Meta tokens expire. Prefer a permanent System-User token and store
  // it in Script Properties (key: META_ACCESS_TOKEN) instead of hardcoding.
  // getToken() reads the property first, then falls back to this value.
  META_ACCESS_TOKEN: 'PASTE_PERMANENT_SYSTEM_USER_TOKEN_HERE',

  // Where alerts go (your number, international format, no +)
  RECIPIENT: '923244465966',

  // ── What to track ──
  STOCK_SYMBOL: 'SLM',                 // Service Long March Tyres
  BANK_SYMBOLS: ['HBL', 'UBL', 'MCB', 'MEBL', 'BAHL', 'ABL', 'NBP', 'BAFL', 'FABL'],
  INDEX_SYMBOLS: ['KSE100', 'KSE30'],  // headline indices for context

  // PSX data portal (works from Apps Script with browser headers below)
  PSX_BASE: 'https://dps.psx.com.pk',

  LOG_SHEET_NAME: 'PSX Alert Log'
};

// ─── ENTRY POINTS ────────────────────────────────────────────

// Called by the time triggers. Skips weekends (PSX closed Sat/Sun).
function runScheduledAlert() {
  var day = new Date().getDay(); // 0=Sun .. 6=Sat
  if (day === 0 || day === 6) {
    logEvent('SKIP', 'Weekend — market closed, no alert sent.');
    return;
  }
  sendNow();
}

// Build + send immediately (use this to test).
function sendNow() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { logEvent('LOCK', 'Another run in progress, skipping.'); return; }
  try {
    var message = buildMessage();
    var ok = sendWhatsApp(CONFIG.RECIPIENT, message);
    logEvent(ok ? 'SENT' : 'SEND_FAIL', message.substring(0, 120) + '…');
  } catch (err) {
    logEvent('ERROR', 'sendNow failed: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

// ─── MESSAGE BUILDER ─────────────────────────────────────────

function buildMessage() {
  var lines = [];
  var stamp = Utilities.formatDate(new Date(), 'Asia/Karachi', 'EEE dd MMM yyyy, HH:mm');
  lines.push('📊 *PSX Update* — ' + stamp + ' PKT');
  lines.push('');

  // SLM headline
  var slm = getQuote(CONFIG.STOCK_SYMBOL);
  lines.push('🛞 *SLM — Service Long March Tyres*');
  lines.push(formatQuoteLine(slm, true));
  if (slm && slm.volume) lines.push('   Vol: ' + formatVolume(slm.volume));
  lines.push('');

  // Indices for market context
  lines.push('📈 *Market*');
  CONFIG.INDEX_SYMBOLS.forEach(function (sym) {
    var q = getQuote(sym);
    lines.push('• ' + sym + ': ' + formatQuoteLine(q, false));
  });
  lines.push('');

  // Banking sector
  lines.push('🏦 *Banking Sector*');
  var up = 0, down = 0;
  CONFIG.BANK_SYMBOLS.forEach(function (sym) {
    var q = getQuote(sym);
    if (q && typeof q.changePct === 'number') { q.changePct >= 0 ? up++ : down++; }
    lines.push('• ' + pad(sym, 5) + ' ' + formatQuoteLine(q, false));
  });
  lines.push('');
  lines.push('Breadth: ' + up + ' ▲ / ' + down + ' ▼');
  lines.push('');
  lines.push('_Source: PSX Data Portal (dps.psx.com.pk)_');

  return lines.join('\n');
}

function formatQuoteLine(q, withRange) {
  if (!q || q.price == null) return '⚠️ data unavailable';
  var arrow = q.change > 0 ? '▲' : (q.change < 0 ? '▼' : '▬');
  var sign = q.change > 0 ? '+' : '';
  var s = 'Rs ' + fmt(q.price) + '  ' + arrow + ' ' + sign + fmt(q.change) +
          ' (' + sign + (q.changePct == null ? '?' : q.changePct.toFixed(2)) + '%)';
  if (withRange && q.low != null && q.high != null) {
    s += '\n   Day: ' + fmt(q.low) + '–' + fmt(q.high);
  }
  return s;
}

// ─── PSX DATA FETCH ──────────────────────────────────────────
// Strategy: pull intraday series (latest live price + day high/low/volume)
// and EOD series (previous close → change %). Both are JSON.

function getQuote(symbol) {
  try {
    var intraday = fetchJson(CONFIG.PSX_BASE + '/timeseries/int/' + symbol);
    var eod      = fetchJson(CONFIG.PSX_BASE + '/timeseries/eod/' + symbol);

    var price = null, volume = null, high = null, low = null, lastTs = null;
    if (intraday && intraday.data && intraday.data.length) {
      // rows: [epochSeconds, price, volume]
      var rows = intraday.data;
      var last = rows[0];                      // PSX returns newest-first
      // guard against either ordering:
      if (rows[rows.length - 1][0] > last[0]) last = rows[rows.length - 1];
      lastTs = last[0]; price = num(last[1]); volume = num(last[2]);
      for (var i = 0; i < rows.length; i++) {
        var p = num(rows[i][1]);
        if (high == null || p > high) high = p;
        if (low == null || p < low) low = p;
      }
    }

    var prevClose = null;
    if (eod && eod.data && eod.data.length) {
      // rows: [epochMillis, close]; newest-first. Use the most recent close
      // strictly before today as previous close.
      var todayStr = Utilities.formatDate(new Date(), 'Asia/Karachi', 'yyyyMMdd');
      var erows = eod.data;
      for (var j = 0; j < erows.length; j++) {
        var d = new Date(num(erows[j][0]));
        var ds = Utilities.formatDate(d, 'Asia/Karachi', 'yyyyMMdd');
        if (ds < todayStr) { prevClose = num(erows[j][1]); break; }
      }
      if (prevClose == null) prevClose = num(erows[0][1]);
      if (price == null) price = num(erows[0][1]); // market closed → use last close
    }

    if (price == null) return null;
    var change = (prevClose != null) ? round2(price - prevClose) : null;
    var changePct = (prevClose) ? round2(((price - prevClose) / prevClose) * 100) : null;

    return {
      symbol: symbol, price: round2(price), prevClose: prevClose,
      change: change, changePct: changePct,
      high: high != null ? round2(high) : null,
      low: low != null ? round2(low) : null,
      volume: volume, ts: lastTs
    };
  } catch (err) {
    logEvent('QUOTE_ERR', symbol + ': ' + err.message);
    return null;
  }
}

function fetchJson(url) {
  var res = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      // dps.psx.com.pk 403s default fetchers — present as a browser.
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                    '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': CONFIG.PSX_BASE + '/'
    }
  });
  var code = res.getResponseCode();
  if (code !== 200) { logEvent('HTTP', code + ' for ' + url); return null; }
  var txt = res.getContentText();
  try { return JSON.parse(txt); }
  catch (e) { logEvent('PARSE', 'Non-JSON from ' + url); return null; }
}

// ─── WHATSAPP SEND ───────────────────────────────────────────

function sendWhatsApp(toPhone, body) {
  // NOTE on the WhatsApp 24-hour rule:
  // Free-form text only delivers if YOU messaged the business number in the
  // last 24h. Since these alerts are scheduled, that window often lapses
  // (e.g. overnight). For guaranteed delivery, approve a Utility template in
  // Meta Business Manager and switch to sendWhatsAppTemplate() below.
  try {
    var res = UrlFetchApp.fetch(
      'https://graph.facebook.com/v19.0/' + CONFIG.PHONE_NUMBER_ID + '/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'Authorization': 'Bearer ' + getToken() },
      payload: JSON.stringify({
        messaging_product: 'whatsapp', to: toPhone, type: 'text',
        text: { preview_url: false, body: body }
      })
    });
    var code = res.getResponseCode();
    if (code === 200) return true;
    logEvent('WA_ERR', code + ': ' + res.getContentText().substring(0, 300));
    return false;
  } catch (err) {
    logEvent('WA_ERR', err.message);
    return false;
  }
}

// Template variant for guaranteed (out-of-session) delivery.
// Create an approved template named TEMPLATE_NAME with ONE body parameter
// {{1}} (the full update text), language en_US. Then call this from sendNow().
function sendWhatsAppTemplate(toPhone, bodyText) {
  var TEMPLATE_NAME = 'psx_update';
  var res = UrlFetchApp.fetch(
    'https://graph.facebook.com/v19.0/' + CONFIG.PHONE_NUMBER_ID + '/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'Authorization': 'Bearer ' + getToken() },
    payload: JSON.stringify({
      messaging_product: 'whatsapp', to: toPhone, type: 'template',
      template: {
        name: TEMPLATE_NAME, language: { code: 'en_US' },
        components: [{ type: 'body', parameters: [{ type: 'text', text: bodyText }] }]
      }
    })
  });
  var ok = res.getResponseCode() === 200;
  if (!ok) logEvent('WA_TPL_ERR', res.getResponseCode() + ': ' + res.getContentText().substring(0, 300));
  return ok;
}

function getToken() {
  var p = PropertiesService.getScriptProperties().getProperty('META_ACCESS_TOKEN');
  return p || CONFIG.META_ACCESS_TOKEN;
}

// ─── TRIGGERS ────────────────────────────────────────────────
// 3x per weekday. Hours are in the PROJECT time zone — set it to
// Asia/Karachi (see setup notes) so these map to PSX session times.
function setupAlertTriggers() {
  // Clear our own triggers first (don't touch unrelated ones).
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runScheduledAlert') ScriptApp.deleteTrigger(t);
  });

  var hours = [9, 12, 15]; // ~open, midday, ~close (PKT). 15:00 catches the ~15:30 close.
  hours.forEach(function (h) {
    ScriptApp.newTrigger('runScheduledAlert')
      .timeBased().everyDays(1).atHour(h).nearMinute(30).create();
  });
  logEvent('SETUP', 'Created ' + hours.length + ' daily triggers at hours ' + hours.join(', ') + ' (project TZ).');
  Logger.log('Triggers created. Project time zone must be Asia/Karachi for PSX timing.');
}

// ─── HELPERS / LOGGING ───────────────────────────────────────
function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
function round2(n) { return n == null ? null : Math.round(n * 100) / 100; }
function fmt(n) { return n == null ? '?' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
function formatVolume(v) {
  if (v == null) return '?';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return String(v);
}

function logEvent(type, message) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) ss = SpreadsheetApp.create('PSX Alerts');
    var sheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
    if (!sheet) { sheet = ss.insertSheet(CONFIG.LOG_SHEET_NAME); sheet.appendRow(['Timestamp', 'Type', 'Message']); }
    sheet.appendRow([new Date().toISOString(), type, message]);
  } catch (e) { /* logging is best-effort */ }
  Logger.log('[' + type + '] ' + message);
}

// ─── CONNECTION TEST ─────────────────────────────────────────
function testDataFetch() {
  var q = getQuote(CONFIG.STOCK_SYMBOL);
  Logger.log('SLM quote: ' + JSON.stringify(q));
  Logger.log('--- Full message preview ---\n' + buildMessage());
}
