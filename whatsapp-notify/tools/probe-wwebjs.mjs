// ═══════════════════════════════════════════════════════════════
// Probe: can whatsapp-web.js pair a new device on this machine?
//
// Baileys speaks WhatsApp's protocol directly and is currently being refused
// at device registration. whatsapp-web.js instead drives the real WhatsApp Web
// in a headless Chromium — the same client that pairs fine from a browser.
// This script ONLY tests pairing. It reads nothing and sends nothing.
//
//   npm install whatsapp-web.js
//   node tools/probe-wwebjs.mjs
//
// Success looks like: a QR in the terminal, then "PAIRED SUCCESSFULLY".
// It writes its session to .wwebjs_auth/ so a later run reconnects silently.
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import qrcode from 'qrcode-terminal';

let pkg;
try {
  pkg = await import('whatsapp-web.js');
} catch {
  console.error('whatsapp-web.js is not installed. Run:\n\n  npm install whatsapp-web.js\n');
  process.exit(1);
}

const { Client, LocalAuth } = pkg.default ?? pkg;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

const t0 = Date.now();
const at = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

// A terminal QR is dense and often will not scan — font, wrapping and contrast
// all break it. Write an HTML page instead and open it in the browser.
//
// The page reloads itself every 4s, which matters: WhatsApp rotates the code
// roughly every 30s, and a stale code silently fails to scan. A plain PNG in
// Preview shows whichever image it opened with, so it goes stale without any
// visible sign. This always shows the current code.
let qrOpened = false;
let qrCount = 0;

async function showQr(qr) {
  qrCount += 1;
  console.log(`\n[${at()}] QR #${qrCount} — WhatsApp > Settings > Linked Devices > Link a Device\n`);
  qrcode.generate(qr, { small: true });

  try {
    const { default: QRCode } = await import('qrcode');
    const dataUrl = await QRCode.toDataURL(qr, { width: 800, margin: 2, errorCorrectionLevel: 'M' });
    const file = path.resolve('whatsapp-qr.html');
    fs.writeFileSync(file, `<!doctype html>
<meta charset="utf-8">
<meta http-equiv="refresh" content="4">
<title>Scan to link WhatsApp</title>
<body style="margin:0;display:flex;flex-direction:column;align-items:center;
             justify-content:center;height:100vh;background:#fff;
             font:16px -apple-system,sans-serif;color:#111">
  <img src="${dataUrl}" width="420" height="420" alt="WhatsApp QR">
  <p style="margin:18px 0 4px"><b>WhatsApp &rsaquo; Settings &rsaquo; Linked Devices &rsaquo; Link a Device</b></p>
  <p style="margin:0;color:#666">code #${qrCount}, refreshed ${new Date().toLocaleTimeString()} — this page updates itself, just leave it open</p>
</body>`);

    if (!qrOpened) {
      qrOpened = true;
      console.log(`\nA scannable QR just opened in your browser. Leave that tab open —`);
      console.log(`it refreshes itself, so you can always scan whatever it is showing.`);
      console.log(`  ${file}`);
      execFile('open', [file], () => {});
    } else {
      console.log(`(browser tab updated to code #${qrCount})`);
    }
  } catch (err) {
    console.log(`(could not write the QR page: ${err.message})`);
  }
}

client.on('qr', (qr) => { showQr(qr).catch(() => {}); });

client.on('authenticated', () => console.log(`[${at()}] authenticated`));
client.on('auth_failure', (m) => console.error(`[${at()}] AUTH FAILED: ${m}`));
client.on('loading_screen', (p, m) => console.log(`[${at()}] loading ${p}% ${m || ''}`));
client.on('disconnected', (r) => console.error(`[${at()}] disconnected: ${r}`));

client.on('ready', async () => {
  console.log(`\n[${at()}] ===== PAIRED SUCCESSFULLY =====\n`);
  try {
    const chats = await client.getChats();
    const groups = chats.filter((c) => c.isGroup);
    console.log(`groups on this account: ${groups.length}\n`);
    for (const g of groups) console.log(`  ${g.name}`);
    console.log('\nCopy the two shipping group names above exactly as shown.');
  } catch (err) {
    console.error(`could not list groups: ${err.message}`);
  }
  console.log('\nProbe done — press Ctrl-C to exit.');
});

console.log('starting headless Chromium (first run downloads it, ~1-2 min)...');
client.initialize().catch((err) => {
  console.error(`\ninitialize failed: ${err.message}`);
  process.exit(1);
});
