// ═══════════════════════════════════════════════════════════════
// Smart notify — configuration
// Every path is resolved relative to the module root so the listener
// behaves the same whatever directory it is started from.
// ═══════════════════════════════════════════════════════════════
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');

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
// `kind` drives the checkpoint seed rule only:
//   shipping → seeded from SEEDS below
//   invoice  → seeded to the deployment timestamp (start fresh)
// `match` entries are compared case-insensitively against the group subject.
export const WATCHED_GROUPS = [
  { name: 'CNC Shipments',      kind: 'shipping', match: ['cnc shipments'] },
  { name: 'CNC Import matters', kind: 'shipping', match: ['cnc import matters'] },
  { name: 'CNC Invoices',       kind: 'invoice',  match: ['cnc invoices', 'cnc invoice'] },
  { name: 'CNC Payments',       kind: 'invoice',  match: ['cnc payments', 'cnc payment'] }
];

// Any group subject matching one of these is treated as an invoice/payment
// group even if it is not listed above — keeps new payment groups covered.
export const INVOICE_GROUP_PATTERNS = [/invoice/i, /payment/i, /paygate/i];

// ─── Checkpoint seeds (first deploy only) ────────────────────
// The brief the user gave us dates these to the day, not the minute. We seed
// to the END of that day in Asia/Karachi so a same-day message that was
// already read is never replayed. Override per group with WA_SEED_<SLUG>.
export const SEED_TZ_OFFSET = process.env.WA_TZ_OFFSET || '+05:00';

export const SEEDS = {
  'CNC Import matters': {
    date: '2026-08-23',
    text: "I'll share first thing tomorrow",
    sender: 'Shahid'
  },
  'CNC Shipments': {
    date: '2026-08-21',
    text: 'OLD SHIPMENT TRACKING',
    sender: 'Ahmed',
    hasMedia: true,
    mediaName: 'image'
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
// telegram | pushover | both | none
export const PUSH_PROVIDER = (process.env.WA_PUSH_PROVIDER || 'telegram').toLowerCase();

export const TELEGRAM = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || ''
};

export const PUSHOVER = {
  token: process.env.PUSHOVER_TOKEN || '',
  user: process.env.PUSHOVER_USER || ''
};

export const CONTEXT_HISTORY_LIMIT = Number(process.env.WA_CONTEXT_LIMIT || 30);
