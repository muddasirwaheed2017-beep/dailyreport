// ═══════════════════════════════════════════════════════════════
// context.json — the memory handed to Claude on every call.
// Holds the current A / B / C / PO27 status plus open discrepancies, and a
// rolling one-line record of the last ~30 briefs so consecutive calls have
// continuity instead of waking up blind each time.
// ═══════════════════════════════════════════════════════════════
import { PATHS, CONTEXT_HISTORY_LIMIT } from './config.js';
import { readJson, writeJsonAtomic, isoOf } from './util.js';

// The grounding handed to Claude on every call. Everything here is optional —
// the briefs work without it — but each section changes what Claude can notice:
//
//   people             lets it say "Zoe" instead of "the supplier"
//   shipments          lets it connect a message to the shipment it affects
//   open_discrepancies lets it flag a known mismatch when a related doc arrives
//   payments           lets it warn about a due date nobody mentioned
//   recent_briefs      continuity across batches (maintained automatically)
const TEMPLATE = {
  company: {
    us: '',           // e.g. "Malik Sons / Cognitive Solutions, Lahore"
    supplier: '',     // e.g. "CNC / Zhejiang Changcheng"
    forwarder: '',    // e.g. "Qasim — Dynamic Logistics"
    route: ''         // e.g. "Ningbo -> Karachi"
  },
  // Who is who, so briefs use names rather than roles.
  people: {},         // { "Zoe": "supplier sales contact at CNC", ... }
  // Keyed however you refer to them in conversation (A, B, C, PO27, ...).
  shipments: {
    A: { status: 'unknown', notes: '' },
    B: { status: 'unknown', notes: '' },
    C: { status: 'unknown', notes: '' },
    PO27: { status: 'unknown', notes: '' }
  },
  // Anything unresolved that a new message might bear on.
  open_discrepancies: [], // [{ what, amount, raised, status }]
  // Due dates nobody may mention again until they are late.
  payments: [],           // [{ what, amount, due, to, status }]
  // Maintained by the app — do not hand-edit.
  recent_briefs: []
};

export function load(file = PATHS.context) {
  const data = readJson(file, null);
  if (!data) {
    writeJsonAtomic(file, TEMPLATE);
    return structuredClone(TEMPLATE);
  }
  const merged = structuredClone(TEMPLATE);
  for (const [k, v] of Object.entries(data)) {
    // Objects are merged so a partially-filled file keeps the template's keys;
    // arrays and scalars are taken wholesale.
    merged[k] = (v && typeof v === 'object' && !Array.isArray(v))
      ? { ...merged[k], ...v }
      : v;
  }
  merged.recent_briefs = Array.isArray(merged.recent_briefs) ? merged.recent_briefs : [];
  return merged;
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

/** How much real grounding exists — used by `doctor` and the digest warning. */
export function grounding(file = PATHS.context) {
  const c = load(file);
  const shipments = Object.entries(c.shipments || {});
  return {
    company: Object.values(c.company || {}).filter(Boolean).length,
    people: Object.keys(c.people || {}).length,
    shipmentsKnown: shipments.filter(([, v]) => v?.status && v.status !== 'unknown').length,
    shipmentsTotal: shipments.length,
    discrepancies: (c.open_discrepancies || []).length,
    payments: (c.payments || []).length,
    briefs: (c.recent_briefs || []).length
  };
}
