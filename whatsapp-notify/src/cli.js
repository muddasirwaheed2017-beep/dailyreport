#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// wa-notify — listener + manual catch-up
//
//   listen                             run the WhatsApp listener
//   catchup <groupName> [--from TS]    re-run analysis from a given point
//   status                             show cursors and unanalysed counts
//   groups                             show the JID <-> name registry
//   import <groupName> <file.jsonl>    merge pasted messages into the store
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs';
import { PATHS } from './config.js';
import * as store from './store.js';
import * as checkpoint from './checkpoint.js';
import * as registry from './registry.js';
import { runAnalysis } from './pipeline.js';
import { toMs, isoOf } from './util.js';

function parseFlags(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [key, inline] = arg.slice(2).split('=');
      if (inline !== undefined) flags[key] = inline;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) flags[key] = argv[++i];
      else flags[key] = true;
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

function mustResolve(name) {
  const jid = registry.resolveJid(name);
  if (!jid) {
    const known = Object.values(registry.all()).map((g) => g.name);
    throw new Error(
      `Unknown group "${name}". Known groups: ${known.length ? known.join(', ') : '(none yet — run `listen` once so the group is seen)'}`
    );
  }
  return jid;
}

// ─── catchup ─────────────────────────────────────────────────
// For the edge case where the listener was offline long enough that WhatsApp
// did not backfill: paste the missed messages into store/<jid>.jsonl (or use
// `import`), then re-point the cursor and re-run the analysis from there.
async function catchup(positional, flags) {
  const name = positional[0];
  if (!name) throw new Error('usage: catchup <groupName> [--from <timestamp>] [--dry-run]');

  const jid = mustResolve(name);
  const entry = registry.entryFor(jid) || {};

  if (flags.from) {
    const ts = toMs(flags.from);
    if (ts == null) throw new Error(`--from "${flags.from}" is not a parsable timestamp`);
    checkpoint.repoint(jid, ts, { name: entry.name, kind: entry.kind });
    process.stdout.write(`cursor for ${entry.name || jid} re-pointed to ${isoOf(ts)}\n`);
  }

  const cursor = checkpoint.ensure(jid, { name: entry.name, kind: entry.kind });
  const pending = store.readSince(jid, cursor);
  process.stdout.write(
    `${entry.name || jid}: cursor at ${isoOf(cursor.ts)}, ${pending.length} message(s) to analyse\n`
  );
  if (pending.length === 0) return;

  const dryRun = Boolean(flags['dry-run']);
  const result = await runAnalysis(jid, { name: entry.name, kind: entry.kind, dryRun });
  process.stdout.write(`${result.status}${result.brief ? `\n\n${result.brief}\n` : '\n'}`);
  if (dryRun) process.stdout.write('(dry run — checkpoint not moved, nothing pushed)\n');
}

// ─── import ──────────────────────────────────────────────────
// Merge a hand-assembled JSONL file into a group's store. Same de-duplication
// as the live path, so re-running it is harmless.
function importFile(positional) {
  const [name, file] = positional;
  if (!name || !file) throw new Error('usage: import <groupName> <file.jsonl>');
  const jid = mustResolve(name);

  const records = fs.readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      try {
        return JSON.parse(l);
      } catch (err) {
        throw new Error(`${file} line ${i + 1} is not valid JSON: ${err.message}`);
      }
    })
    .map((r, i) => ({
      id: r.id || `manual:${Date.now()}:${i}`,
      ts: toMs(r.ts),
      sender: r.sender ?? null,
      text: r.text ?? '',
      hasMedia: Boolean(r.hasMedia),
      mediaName: r.mediaName ?? null
    }));

  const missing = records.findIndex((r) => r.ts == null);
  if (missing >= 0) throw new Error(`${file} line ${missing + 1} has a missing or unparsable "ts"`);

  const written = store.appendMessages(jid, records);
  process.stdout.write(
    `imported ${written} new message(s) into ${jid} (${records.length - written} already present)\n` +
    `next: wa-notify catchup "${name}" --from <timestamp just before the first missed message>\n`
  );
}

// ─── status / groups ──────────────────────────────────────────
function status() {
  const cursors = checkpoint.all();
  const jids = new Set([...Object.keys(cursors), ...store.listStoredGroups()]);
  if (jids.size === 0) {
    process.stdout.write('no groups seen yet\n');
    return;
  }
  for (const jid of jids) {
    const entry = registry.entryFor(jid);
    // Seeding is deterministic from config, so showing status is allowed to
    // materialise a cursor that has not been written yet.
    const cursor = cursors[jid]?.last_analyzed
      || (entry ? checkpoint.ensure(jid, { name: entry.name, kind: entry.kind }) : null);
    const pending = cursor ? store.readSince(jid, cursor).length : store.readMessages(jid).length;
    process.stdout.write(
      `${entry?.name || jid}\n` +
      `  jid            ${jid}\n` +
      `  last_analyzed  ${cursor ? `${isoOf(cursor.ts)} — ${JSON.stringify(cursor.text)}` : '(not seeded)'}\n` +
      `  captured       ${store.readMessages(jid).length}\n` +
      `  unanalysed     ${pending}\n`
    );
  }
}

function groups() {
  const all = registry.all();
  if (Object.keys(all).length === 0) {
    process.stdout.write('registry empty — run `listen` once so groups are discovered\n');
    return;
  }
  for (const [jid, entry] of Object.entries(all)) {
    process.stdout.write(`${entry.name}  [${entry.kind}]  ${jid}\n`);
  }
}

// ─── entry point ──────────────────────────────────────────────
async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { flags, positional } = parseFlags(rest);

  switch (command) {
    case 'listen': {
      const { start } = await import('./listener.js');
      await start();
      break;
    }
    case 'catchup':
      await catchup(positional, flags);
      break;
    case 'import':
      importFile(positional);
      break;
    case 'status':
      status();
      break;
    case 'groups':
      groups();
      break;
    default:
      process.stdout.write(
        'wa-notify <command>\n\n' +
        '  listen                              run the WhatsApp listener\n' +
        '  catchup <groupName> [--from TS]     re-analyse from a point in time\n' +
        '                      [--dry-run]     ...without pushing or moving the cursor\n' +
        '  import <groupName> <file.jsonl>     merge pasted messages into the store\n' +
        '  status                              cursors and unanalysed counts\n' +
        '  groups                              JID <-> name registry\n\n' +
        `store: ${PATHS.store}\ncheckpoint: ${PATHS.checkpoint}\n`
      );
      process.exitCode = command ? 1 : 0;
  }
}

main().catch((err) => {
  process.stderr.write(`error: ${err.message}\n`);
  process.exitCode = 1;
});
