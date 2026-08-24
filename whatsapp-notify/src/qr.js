// ═══════════════════════════════════════════════════════════════
// Showing the pairing QR.
//
// A terminal QR is dense enough that phone cameras routinely fail on it —
// font, line wrapping and contrast all work against it. So we also write an
// HTML page and open it once in the browser.
//
// The page reloads itself, which is the point: WhatsApp rotates the code every
// ~30s, and a stale code fails to scan with no feedback at all. A static image
// shows whatever it opened with and quietly goes dead; this always shows the
// current code, with a number and timestamp so freshness is visible.
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import qrcodeTerminal from 'qrcode-terminal';
import { PATHS } from './config.js';
import { line, warn } from './logger.js';

let opened = false;
let count = 0;

export function qrPagePath() {
  return path.join(PATHS.root, 'whatsapp-qr.html');
}

function openInBrowser(file) {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start'
    : 'xdg-open';
  execFile(cmd, [file], () => { /* best effort — the path is printed anyway */ });
}

export async function showQr(qr) {
  count += 1;

  line('');
  line('┌─────────────────────────────────────────────────┐');
  line('│  Scan with WhatsApp:                            │');
  line('│  Settings > Linked Devices > Link a Device      │');
  line('└─────────────────────────────────────────────────┘');
  qrcodeTerminal.generate(qr, { small: true });

  try {
    const { default: QRCode } = await import('qrcode');
    const dataUrl = await QRCode.toDataURL(qr, { width: 800, margin: 2, errorCorrectionLevel: 'M' });
    const file = qrPagePath();
    fs.writeFileSync(file, `<!doctype html>
<meta charset="utf-8">
<meta http-equiv="refresh" content="4">
<title>Scan to link WhatsApp</title>
<body style="margin:0;display:flex;flex-direction:column;align-items:center;
             justify-content:center;height:100vh;background:#fff;
             font:16px -apple-system,BlinkMacSystemFont,sans-serif;color:#111">
  <img src="${dataUrl}" width="420" height="420" alt="WhatsApp pairing QR">
  <p style="margin:18px 0 4px"><b>WhatsApp &rsaquo; Settings &rsaquo; Linked Devices &rsaquo; Link a Device</b></p>
  <p style="margin:0;color:#666">code #${count} &middot; refreshed ${new Date().toLocaleTimeString()}
     &middot; this page updates itself, leave it open</p>
</body>`, 'utf8');

    if (!opened) {
      opened = true;
      line('a scannable QR just opened in your browser — leave that tab open,');
      line('it refreshes itself so whatever it shows is always current');
      line(`  ${file}`);
      openInBrowser(file);
    } else {
      line(`browser tab updated to code #${count}`);
    }
  } catch (err) {
    warn(`could not write the QR page (scan the one above): ${err.message}`);
  }
}

/** Tidy up once pairing has succeeded — a stale QR page is just confusing. */
export function clearQrPage() {
  try { fs.unlinkSync(qrPagePath()); } catch { /* nothing to remove */ }
}
