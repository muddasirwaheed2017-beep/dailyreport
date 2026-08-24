// ═══════════════════════════════════════════════════════════════
// CHECKPOINT — checkpoint.json
//
//   <groupJID> -> last_analyzed { id, ts, text }
//
// The cursor tracks what CLAUDE has ANALYSED, not what the human has read.
// Reading ahead in WhatsApp must never move it, so the capture path never
// touches this file — the only writers are advance() (after an analysis run
// finishes, push or no push) and repoint() (the manual `catchup` command).
// ═══════════════════════════════════════════════════════════════
import { PATHS, SEEDS, SEED_TZ_OFFSET } from './config.js';
import { readJson, writeJsonAtomic, endOfDayMs, compareMessages, toMs, isoOf } from './util.js';

function load(file = PATHS.checkpoint) {
  return readJson(file, {});
}

function save(data, file = PATHS.checkpoint) {
  writeJsonAtomic(file, data);
}

function slug(name) {
  return String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/**
 * The deployment timestamp, stamped once and then reused forever. Invoice /
 * payment groups seed here so they start fresh at first deploy — and stay
 * anchored to that same instant even if the group is first seen weeks later.
 */
export function deployedAt(file = PATHS.checkpoint) {
  const data = load(file);
  if (!data._meta?.deployed_at) {
    const now = Date.now();
    data._meta = { ...(data._meta || {}), deployed_at: now, deployed_at_iso: isoOf(now) };
    save(data, file);
    return now;
  }
  return data._meta.deployed_at;
}

function seedFor(name, kind, file) {
  // An explicit override always wins: WA_SEED_CNC_SHIPMENTS=2026-08-21T18:00:00+05:00
  const override = process.env[`WA_SEED_${slug(name)}`];
  if (override) {
    const ts = toMs(override);
    if (ts == null) throw new Error(`WA_SEED_${slug(name)}="${override}" is not a parsable timestamp`);
    return { id: `seed:${slug(name).toLowerCase()}`, ts, text: null };
  }

  const seed = SEEDS[name];
  if (seed) {
    // The seeds are dated to the day, so anchor at the end of that day in
    // Asia/Karachi — a message read earlier the same day is never replayed.
    return {
      id: `seed:${slug(name).toLowerCase()}`,
      ts: endOfDayMs(seed.date, SEED_TZ_OFFSET),
      text: seed.text
    };
  }

  // Invoice / payment groups (and any watched group without a seed): start
  // fresh at the deployment timestamp.
  return { id: `seed:deploy`, ts: deployedAt(file), text: null };
}

/** Read a group's cursor, seeding it on first sight. Never returns null. */
export function ensure(jid, { name, kind } = {}, file = PATHS.checkpoint) {
  const data = load(file);
  if (data[jid]?.last_analyzed) return data[jid].last_analyzed;

  const groupName = name || data[jid]?.name || jid;
  const groupKind = kind || data[jid]?.kind || 'shipping';
  const last_analyzed = seedFor(groupName, groupKind, file);

  const fresh = load(file); // re-read: deployedAt() may have written _meta
  fresh[jid] = {
    name: groupName,
    kind: groupKind,
    seeded_at: isoOf(Date.now()),
    last_analyzed
  };
  save(fresh, file);
  return last_analyzed;
}

export function get(jid, file = PATHS.checkpoint) {
  return load(file)[jid]?.last_analyzed || null;
}

/**
 * Move the cursor to the newest message of a processed batch.
 *
 * Called after EVERY analysis run — including runs that produced no push
 * because the batch was all filler — so filler is never re-read. Only ever
 * moves forward.
 */
export function advance(jid, batch, file = PATHS.checkpoint) {
  if (!Array.isArray(batch) || batch.length === 0) return get(jid, file);

  const newest = batch.reduce((a, b) => (compareMessages(a, b) >= 0 ? a : b));
  const data = load(file);
  const current = data[jid]?.last_analyzed;
  if (current && compareMessages(newest, current) <= 0) return current; // never rewind

  const last_analyzed = {
    id: newest.id ?? null,
    ts: newest.ts ?? null,
    text: newest.text ?? null
  };
  data[jid] = { ...(data[jid] || {}), last_analyzed, updated_at: isoOf(Date.now()) };
  save(data, file);
  return last_analyzed;
}

/**
 * Manual re-point, used by `catchup`. This is the one operation allowed to
 * move the cursor BACKWARDS, so that pasted-in missed messages get re-read.
 */
export function repoint(jid, ts, { id = null, text = null, name, kind } = {}, file = PATHS.checkpoint) {
  const ms = toMs(ts);
  if (ms == null) throw new Error(`Cannot parse "${ts}" as a timestamp`);
  const data = load(file);
  data[jid] = {
    ...(data[jid] || {}),
    ...(name ? { name } : {}),
    ...(kind ? { kind } : {}),
    last_analyzed: { id, ts: ms, text },
    updated_at: isoOf(Date.now()),
    repointed_at: isoOf(Date.now())
  };
  save(data, file);
  return data[jid].last_analyzed;
}

export function all(file = PATHS.checkpoint) {
  const { _meta, ...groups } = load(file);
  return groups;
}
