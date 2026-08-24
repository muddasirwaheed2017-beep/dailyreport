// ═══════════════════════════════════════════════════════════════
// Smart notify — configuration
// Every path is resolved relative to the module root so the listener
// behaves the same whatever directory it is started from.
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');

// Load <module root>/.env before any setting below is read. A real environment
// variable always wins over the file, so `FOO=x npm start` still overrides it.
function loadDotEnv(file) {
  // process.loadEnvFile only exists on Node >= 20.12 / 21.7. On anything older
  // it is undefined, and without this fallback the .env would be silently
  // ignored — the listener would start with no credentials and no explanation.
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(file);
    return;
  }
  const text = fs.readFileSync(file, 'utf8');
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).replace(/^export\s+/, '').trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

try {
  loadDotEnv(path.join(ROOT, '.env'));
} catch (err) {
  // ENOENT just means "no .env" — fine, everything can come from the
  // environment. Anything else (a malformed file) is worth surfacing.
  if (err?.code !== 'ENOENT') {
    process.emitWarning(`could not load .env: ${err.message}`);
  }
}

export const PATHS = {
  root: ROOT,
  store: process.env.WA_STORE_DIR || path.join(ROOT, 'store'),
  auth: process.env.WA_AUTH_DIR || path.join(ROOT, 'auth'),
  checkpoint: process.env.WA_CHECKPOINT || path.join(ROOT, 'checkpoint.json'),
  context: process.env.WA_CONTEXT || path.join(ROOT, 'context.json'),
  groups: process.env.WA_GROUPS || path.join(ROOT, 'groups.json'),
  logs: process.env.WA_LOG_DIR || path.join(ROOT, 'logs')
};

// ─── Watched groups ──────────────────────────────────────────
// SCOPE: the two shipping groups ONLY. The invoice / payment side is
// deliberately NOT watched here — it stays on the existing Meta-API route in
// ../whatsapp-webhook-v1.js, which this module must not duplicate or disturb.
// `match` entries are compared case-insensitively against the group subject.
export const WATCHED_GROUPS = [
  { name: 'CNC Shipments',      kind: 'shipping', match: ['cnc shipments'] },
  { name: 'CNC Import matters', kind: 'shipping', match: ['cnc import matters'] }
];

// Deliberately empty: there is no invoice/payment catch-all. A group is
// watched only if it matches WATCHED_GROUPS above. Do not repopulate this
// without also confirming it will not double-handle invoice traffic.
export const INVOICE_GROUP_PATTERNS = [];

// ─── Checkpoint seeds (first deploy only) ────────────────────
// Exact instants, not dates. Override per group with WA_SEED_<SLUG>.
//
// CNC Import matters is seeded to the START of 23 Aug on purpose: it
// guarantees nothing after Shahid's "first thing tomorrow" line is skipped.
// Re-analysing that short exchange once is the accepted cost.
export const SEEDS = {
  'CNC Shipments': {
    at: '2026-08-21T23:59:59+05:00',
    text: 'OLD SHIPMENT TRACKING',
    sender: 'Ahmed',
    hasMedia: true,
    mediaName: 'image'
  },
  'CNC Import matters': {
    at: '2026-08-23T00:00:00+05:00',
    text: "I'll share first thing tomorrow",
    sender: 'Shahid'
  }
};

// ─── Buffering ───────────────────────────────────────────────
export const FLUSH_QUIET_MS = Number(process.env.WA_FLUSH_QUIET_MS || 90_000);
export const FLUSH_MAX_MESSAGES = Number(process.env.WA_FLUSH_MAX || 10);

// ─── Relevance gate ──────────────────────────────────────────
export const KEYWORDS = [
  'ETD', 'ETA', 'vessel', 'container', 'B/L', 'invoice', 'PI', 'PL', 'FTA',
  'price', 'rate', 'payment', 'NTN', 'roll', 'delay', 'typhoon', 'KICT',
  'SAPT', 'demurrage'
];

// One-word acknowledgements that carry no freight signal on their own.
export const FILLER_WORDS = [
  'ok', 'okay', 'okey', 'k', 'kk', 'yes', 'yeah', 'yep', 'no', 'nope',
  'ji', 'jee', 'acha', 'accha', 'theek', 'thik', 'sahi', 'shukriya',
  'thanks', 'thanx', 'thx', 'ty', 'noted', 'done', 'sure', 'welcome',
  'good', 'great', 'nice', 'fine', 'received', 'ack', 'roger', 'cool',
  'hi', 'hello', 'salam', 'asalam', 'assalamualaikum', 'walaikumsalam',
  'morning', 'gm', 'gn', 'bye', 'inshallah', 'insha', 'mashallah'
];

// ─── Models ──────────────────────────────────────────────────
export const MODELS = {
  brief: process.env.WA_MODEL_BRIEF || 'claude-sonnet-4-6',
  triage: process.env.WA_MODEL_TRIAGE || 'claude-haiku-4-5'
};

// ─── The freight co-pilot brief spec ─────────────────────────
export const SYSTEM_PROMPT = `You are a freight co-pilot for a Pakistani importer (Malik Sons / Cognitive Solutions) buying electrical & auto parts from China (supplier CNC / Zhejiang Changcheng) via forwarder Qasim, shipping Ningbo->Karachi. Given the CONTEXT and the latest WhatsApp messages, output a phone-notification brief with exactly:
📦 SUMMARY: <one sentence: what just happened>
✅ DO: <the concrete action, or 'nothing needed'>
⚠️ CAUTION: <any discrepancy or risk; omit this line if none>
Under 55 words total. Plain English. If messages are just chit-chat, reply only: 'skip'.`;

export const TRIAGE_PROMPT = `You triage WhatsApp traffic for a freight importer. Decide whether the messages below contain anything worth a phone notification (shipment status, dates, documents, money, problems, decisions, requests directed at us).
Reply with exactly one word: PUSH or SKIP.`;

// ─── Push transport ──────────────────────────────────────────
// Comma-separated list of transports: email, telegram, pushover, none.
// Email (Gmail SMTP) is the live channel.
export const PUSH_PROVIDER = (process.env.WA_PUSH_PROVIDER || 'email').toLowerCase();

export const PUSH_TRANSPORTS = PUSH_PROVIDER
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Gmail SMTP. GMAIL_APP_PASSWORD must be a 16-character Google App Password
// (Google account > Security > 2-Step Verification > App passwords) — a normal
// account password is rejected by smtp.gmail.com.
export const EMAIL = {
  host: process.env.GMAIL_SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.GMAIL_SMTP_PORT || 465),
  secure: true,
  user: process.env.GMAIL_USER || '',
  appPassword: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
  to: process.env.NOTIFY_EMAIL_TO || ''
};

export const TELEGRAM = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || ''
};

export const PUSHOVER = {
  token: process.env.PUSHOVER_TOKEN || '',
  user: process.env.PUSHOVER_USER || ''
};

export const CONTEXT_HISTORY_LIMIT = Number(process.env.WA_CONTEXT_LIMIT || 30);
