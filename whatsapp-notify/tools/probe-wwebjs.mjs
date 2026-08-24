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

client.on('qr', (qr) => {
  console.log(`\n[${at()}] SCAN THIS — WhatsApp > Settings > Linked Devices > Link a Device\n`);
  qrcode.generate(qr, { small: true });
});

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
