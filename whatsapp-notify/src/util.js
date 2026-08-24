// Small shared helpers: atomic JSON files, message ordering, timestamps.
import fs from 'node:fs';
import path from 'node:path';

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    // A truncated file must not wipe the cursor silently — keep a copy.
    if (err instanceof SyntaxError) {
      const bak = `${file}.corrupt-${Date.now()}`;
      try { fs.copyFileSync(file, bak); } catch { /* best effort */ }
      throw new Error(`${file} is not valid JSON (copied to ${bak}): ${err.message}`);
    }
    throw err;
  }
}

// Write via a temp file + rename so a crash mid-write cannot leave a
// half-written checkpoint behind.
export function writeJsonAtomic(file, data) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
}

// Deterministic total order over messages: timestamp first, id as tiebreak.
// Used both for sorting the store and for "strictly after the cursor".
export function compareMessages(a, b) {
  const at = Number(a.ts) || 0;
  const bt = Number(b.ts) || 0;
  if (at !== bt) return at < bt ? -1 : 1;
  const ai = String(a.id ?? '');
  const bi = String(b.id ?? '');
  if (ai === bi) return 0;
  return ai < bi ? -1 : 1;
}

export function isAfter(message, cursor) {
  if (!cursor || cursor.ts == null) return true;
  return compareMessages(message, cursor) > 0;
}

// Accepts epoch ms, epoch seconds, or anything Date.parse understands.
export function toMs(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return value < 1e12 ? Math.round(value * 1000) : Math.round(value);
  if (/^\d+$/.test(String(value))) return toMs(Number(value));
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

export function isoOf(ms) {
  return ms == null ? null : new Date(ms).toISOString();
}
