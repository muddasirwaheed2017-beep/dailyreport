// ═══════════════════════════════════════════════════════════════
// groups.json — the JID <-> human name map.
// The checkpoint seeds and the `catchup` command are both expressed in
// group NAMES, but the store and checkpoint are keyed by JID, so we learn
// the mapping as groups are seen and persist it.
// ═══════════════════════════════════════════════════════════════
import { PATHS, WATCHED_GROUPS, INVOICE_GROUP_PATTERNS } from './config.js';
import { readJson, writeJsonAtomic } from './util.js';

function load(file = PATHS.groups) {
  return readJson(file, {});
}

/** Which watched-group entry (if any) a subject belongs to. */
export function classify(subject) {
  const name = String(subject || '').trim();
  const lower = name.toLowerCase();
  for (const group of WATCHED_GROUPS) {
    if (group.match.some((m) => lower === m || lower.includes(m))) return group;
  }
  if (INVOICE_GROUP_PATTERNS.some((re) => re.test(name))) {
    return { name, kind: 'invoice', match: [lower] };
  }
  return null;
}

export function isWatched(subject) {
  return classify(subject) !== null;
}

const LAST_SEEN_WRITE_MS = 5 * 60 * 1000;

/** Record a group we have seen. Returns its registry entry, or null if unwatched. */
export function remember(jid, subject, file = PATHS.groups) {
  const group = classify(subject);
  if (!group) return null;
  const registry = load(file);
  const now = new Date().toISOString();
  const existing = registry[jid];
  const clean = String(subject || '').trim();

  // groups.json is on the hot path — only rewrite it when something actually
  // changed, or every few minutes to keep lastSeen roughly current.
  const unchanged = existing
    && existing.subject === clean
    && existing.name === group.name
    && existing.kind === group.kind
    && Date.now() - Date.parse(existing.lastSeen || 0) < LAST_SEEN_WRITE_MS;
  if (unchanged) return existing;

  registry[jid] = {
    name: group.name,
    subject: clean,
    kind: group.kind,
    firstSeen: existing?.firstSeen || now,
    lastSeen: now
  };
  writeJsonAtomic(file, registry);
  return registry[jid];
}

export function entryFor(jid, file = PATHS.groups) {
  return load(file)[jid] || null;
}

export function all(file = PATHS.groups) {
  return load(file);
}

/**
 * Resolve a name typed on the command line to a JID.
 * Accepts the exact configured name, the live subject, a case-insensitive
 * substring, or a raw JID (passed straight through).
 */
export function resolveJid(nameOrJid, file = PATHS.groups) {
  const query = String(nameOrJid || '').trim();
  if (!query) return null;
  if (query.includes('@')) return query;

  const registry = load(file);
  const lower = query.toLowerCase();
  const entries = Object.entries(registry);

  const exact = entries.find(([, v]) =>
    v.name?.toLowerCase() === lower || v.subject?.toLowerCase() === lower);
  if (exact) return exact[0];

  const partial = entries.filter(([, v]) =>
    v.name?.toLowerCase().includes(lower) || v.subject?.toLowerCase().includes(lower));
  if (partial.length === 1) return partial[0][0];
  if (partial.length > 1) {
    const names = partial.map(([jid, v]) => `${v.name} (${jid})`).join(', ');
    throw new Error(`"${query}" matches more than one group: ${names}`);
  }
  return null;
}
