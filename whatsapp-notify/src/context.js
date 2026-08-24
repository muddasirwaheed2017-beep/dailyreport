// ═══════════════════════════════════════════════════════════════
// context.json — the memory handed to Claude on every call.
// Holds the current A / B / C / PO27 status plus open discrepancies, and a
// rolling one-line record of the last ~30 briefs so consecutive calls have
// continuity instead of waking up blind each time.
// ═══════════════════════════════════════════════════════════════
import { PATHS, CONTEXT_HISTORY_LIMIT } from './config.js';
import { readJson, writeJsonAtomic, isoOf } from './util.js';

const TEMPLATE = {
  shipments: {
    A: { status: 'unknown', notes: '' },
    B: { status: 'unknown', notes: '' },
    C: { status: 'unknown', notes: '' },
    PO27: { status: 'unknown', notes: '' }
  },
  open_discrepancies: [],
  recent_briefs: []
};

export function load(file = PATHS.context) {
  const data = readJson(file, null);
  if (!data) {
    writeJsonAtomic(file, TEMPLATE);
    return structuredClone(TEMPLATE);
  }
  return {
    ...structuredClone(TEMPLATE),
    ...data,
    recent_briefs: Array.isArray(data.recent_briefs) ? data.recent_briefs : []
  };
}

/** What actually goes into the API call — history capped, newest last. */
export function forPrompt(file = PATHS.context) {
  const { recent_briefs, ...rest } = load(file);
  return { ...rest, recent_briefs: recent_briefs.slice(-CONTEXT_HISTORY_LIMIT) };
}

/**
 * Append a one-line record of a brief. Called for pushes and for skips
 * alike — knowing a batch was judged noise is itself useful memory.
 */
export function recordBrief({ group, summary, pushed, at = Date.now() }, file = PATHS.context) {
  const data = load(file);
  data.recent_briefs.push({
    at: isoOf(at),
    group,
    pushed: Boolean(pushed),
    line: String(summary || '').replace(/\s+/g, ' ').trim().slice(0, 240)
  });
  if (data.recent_briefs.length > CONTEXT_HISTORY_LIMIT) {
    data.recent_briefs = data.recent_briefs.slice(-CONTEXT_HISTORY_LIMIT);
  }
  writeJsonAtomic(file, data);
  return data.recent_briefs.length;
}
