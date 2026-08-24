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
import { PATHS, WATCHED_GROUPS, SEEDS, INVOICE_GROUP_PATTERNS } from './config.js';
import * as store from './store.js';
import * as checkpoint from './checkpoint.js';
import * as registry from './registry.js';
import * as push from './push.js';
import * as analyze from './analyze.js';
import * as context from './context.js';
import { gate } from './filter.js';
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

// ─── test-email ──────────────────────────────────────────────
// Phase 3a: prove the push channel end-to-end before WhatsApp is involved.
async function testEmail() {
  const status = push.emailStatus();
  process.stdout.write(
    'email config\n' +
    `  transports          ${status.transports.join(', ') || '(none)'}\n` +
    `  smtp                ${status.host}\n` +
    `  GMAIL_USER          ${status.user}\n` +
    `  GMAIL_APP_PASSWORD  ${status.appPassword}\n` +
    `  NOTIFY_EMAIL_TO     ${status.to}\n\n`
  );
  if (status.missing.length) {
    const n = status.missing.length;
    throw new Error(
      `cannot send — missing ${status.missing.join(', ')}; `
      + `set ${n === 1 ? 'it' : 'them'} in whatsapp-notify/.env`
    );
  }

  const result = await push.sendTestEmail();
  if (!result.ok) throw new Error(`send failed — ${result.error}`);
  process.stdout.write(`sent \u2713  accepted by Gmail for: ${(result.accepted || []).join(', ')}\n`);
  process.stdout.write(`messageId ${result.messageId}\n`);
}

// ─── test-brief ──────────────────────────────────────────────
// Proves the whole chain — Anthropic API -> brief -> email — on a canned
// batch, before WhatsApp is ever paired. Touches no store and no checkpoint.
const SAMPLE_BATCH = [
  { id: 'sample-1', sender: 'Zoe',    text: 'XIN PU DONG sailed today, sending final B/L', hasMedia: false, mediaName: null },
  { id: 'sample-2', sender: 'Zoe',    text: '',       hasMedia: true,  mediaName: 'BL A92GX23404.pdf' },
  { id: 'sample-3', sender: 'Shahid', text: 'thanks', hasMedia: false, mediaName: null }
];

async function testBrief(flags) {
  const now = Date.now();
  const batch = SAMPLE_BATCH.map((m, i) => ({ ...m, ts: now - (SAMPLE_BATCH.length - i) * 60_000 }));

  const gated = gate(batch);
  process.stdout.write(
    `batch: ${batch.length} message(s) — kept ${gated.kept}, dropped ${gated.dropped}\n` +
    `media ${gated.hasMedia} · keywords [${gated.keywords.join(', ')}] · ` +
    `${gated.forced ? 'straight to the brief (no triage call)' : 'triage first'}\n\n`
  );

  const grounding = context.forPrompt();
  const grounded = Object.values(grounding.shipments || {}).some((v) => v?.status && v.status !== 'unknown');
  if (!grounded) {
    process.stdout.write(
      'NOTE: context.json has no real shipment status yet, so the brief cannot\n' +
      '      mention specific discrepancies. Fill it in for grounded briefs.\n\n'
    );
  }

  const result = await analyze.brief(grounding, gated.messages);
  if (result.error) throw new Error(`the model call failed — ${result.error}`);
  if (result.skip) {
    process.stdout.write("Claude replied 'skip' — nothing would be pushed.\n");
    return;
  }

  process.stdout.write(`--- brief ---\n${result.text}\n-------------\n\n`);

  if (flags['no-email']) {
    process.stdout.write('(--no-email: not sent)\n');
    return;
  }
  const delivery = await push.send(result.text, { title: 'CNC Shipments (test)' });
  if (!delivery.ok) throw new Error(`brief written but not delivered — ${JSON.stringify(delivery.results)}`);
  process.stdout.write('emailed \u2713 — this is exactly what a real brief will look like\n');
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
  // Configured scope first — this is the answer to "what will it watch?",
  // and it is available before the device has ever been paired.
  process.stdout.write('WATCHING (from src/config.js):\n');
  for (const g of WATCHED_GROUPS) {
    const seed = SEEDS[g.name];
    process.stdout.write(
      `  ${g.name}  [${g.kind}]  seed ${seed ? seed.at : '(deployment timestamp)'}\n`
    );
  }
  process.stdout.write(
    `  invoice/payment catch-all: ${INVOICE_GROUP_PATTERNS.length === 0
      ? 'DISABLED — invoice traffic is ignored by this module'
      : INVOICE_GROUP_PATTERNS.join(', ')}\n\n`
  );

  process.stdout.write('SEEN (from groups.json):\n');
  const all = registry.all();
  if (Object.keys(all).length === 0) {
    process.stdout.write('  (none yet — run `listen` once so groups are discovered)\n');
    return;
  }
  for (const [jid, entry] of Object.entries(all)) {
    process.stdout.write(`  ${entry.name}  [${entry.kind}]  ${jid}\n`);
  }
}

// ─── entry point ──────────────────────────────────────────────
async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { flags, positional } = parseFlags(rest);

  switch (command) {
    case 'listen': {
      // `npm start -- --pair 923001234567` links with a code instead of a QR.
      if (flags.pair && flags.pair !== true) process.env.WA_PAIR_PHONE = String(flags.pair);
      const { start } = await import('./listener.js');
      await start();
      // Hold the process open with a referenced timer. A pending promise is
      // NOT enough — Node exits once no referenced handle remains, regardless
      // of unsettled promises, so without this the listener could exit 0 with
      // no output the moment the socket dropped. SIGINT/SIGTERM, handled in
      // listener.js, are what actually stop it.
      process.stdout.write('listener running — press Ctrl-C to stop\n');
      setInterval(() => {}, 1 << 30);
      await new Promise(() => {});
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
    case 'test-email':
      await testEmail();
      break;
    case 'test-brief':
      await testBrief(flags);
      break;
    default:
      process.stdout.write(
        'wa-notify <command>\n\n' +
        '  listen [--pair <number>]            run the listener; --pair links by code\n' +
        '  catchup <groupName> [--from TS]     re-analyse from a point in time\n' +
        '                      [--dry-run]     ...without pushing or moving the cursor\n' +
        '  import <groupName> <file.jsonl>     merge pasted messages into the store\n' +
        '  status                              cursors and unanalysed counts\n' +
        '  groups                              watch scope + JID <-> name registry\n' +
        '  test-email                          send a one-shot test email\n' +
        '  test-brief [--no-email]             run a sample batch through Claude + email it\n\n' +
        `store: ${PATHS.store}\ncheckpoint: ${PATHS.checkpoint}\n`
      );
      process.exitCode = command ? 1 : 0;
  }
}

main().catch((err) => {
  process.stderr.write(`error: ${err.message}\n`);
  process.exitCode = 1;
});
