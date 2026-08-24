// ═══════════════════════════════════════════════════════════════
// CAPTURE — store/<groupJID>.jsonl
// Every incoming message is appended here immediately and unfiltered,
// before any analysis runs. Nothing is ever dropped, so a batch can
// always be replayed. Baileys' offline history sync writes to the same
// files, which is why appends are de-duplicated by message id.
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config.js';
import { ensureDir, compareMessages, isAfter } from './util.js';

// Only strip characters that would break out of the store directory or the
// filename itself — the JID is otherwise kept verbatim so store files stay
// recognisable (e.g. store/923001234567-1600000000@g.us.jsonl).
export function storeFileFor(jid, dir = PATHS.store) {
  const safe = String(jid).replace(/[/\\\0]/g, '_');
  return path.join(dir, `${safe}.jsonl`);
}

// In-memory id sets, one per store file, so history-sync replays and
// duplicate upserts do not grow the file forever.
const seenIds = new Map();

function idSetFor(file) {
  let set = seenIds.get(file);
  if (set) return set;
  set = new Set();
  for (const record of readRaw(file)) {
    if (record.id) set.add(record.id);
  }
  seenIds.set(file, set);
  return set;
}

function readRaw(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const out = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {
      // A partially-flushed final line is skipped rather than fatal — the
      // next append rewrites past it and the message is re-synced by WhatsApp.
    }
  }
  return out;
}

/**
 * Append one message. Returns true if it was written, false if it was a
 * duplicate we had already captured.
 *
 * The write is synchronous on purpose: capture must be durable before the
 * caller goes on to buffer or analyse anything.
 */
export function appendMessage(jid, message, dir = PATHS.store) {
  const file = storeFileFor(jid, dir);
  const ids = idSetFor(file);
  if (message.id && ids.has(message.id)) return false;

  const record = {
    id: message.id ?? null,
    ts: message.ts ?? null,
    sender: message.sender ?? null,
    text: message.text ?? '',
    hasMedia: Boolean(message.hasMedia),
    mediaName: message.mediaName ?? null
  };

  ensureDir(path.dirname(file));
  fs.appendFileSync(file, `${JSON.stringify(record)}\n`, 'utf8');
  if (record.id) ids.add(record.id);
  return true;
}

/** Append many (used by the offline history sync). Returns the count written. */
export function appendMessages(jid, messages, dir = PATHS.store) {
  let written = 0;
  for (const message of messages) {
    if (appendMessage(jid, message, dir)) written += 1;
  }
  return written;
}

/** Every captured message for a group, in (ts, id) order. */
export function readMessages(jid, dir = PATHS.store) {
  return readRaw(storeFileFor(jid, dir)).sort(compareMessages);
}

/**
 * The messages an analysis run is allowed to see: strictly after the
 * group's last_analyzed cursor. Never returns the cursor message itself.
 */
export function readSince(jid, cursor, dir = PATHS.store) {
  return readMessages(jid, dir).filter((m) => isAfter(m, cursor));
}

/** Group JIDs that have a store file. */
export function listStoredGroups(dir = PATHS.store) {
  try {
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => f.slice(0, -'.jsonl'.length));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

/** Test hook — drops the cached id sets. */
export function resetStoreCache() {
  seenIds.clear();
}
