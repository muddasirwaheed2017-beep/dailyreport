// End-to-end exercise of capture -> checkpoint -> gate -> analyse -> push,
// with the Anthropic client and the push transport stubbed out.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// config.js reads these at import time, so they must be set before any
// module under test is loaded.
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'wa-notify-test-'));
process.env.WA_STORE_DIR = path.join(TMP, 'store');
process.env.WA_CHECKPOINT = path.join(TMP, 'checkpoint.json');
process.env.WA_CONTEXT = path.join(TMP, 'context.json');
process.env.WA_GROUPS = path.join(TMP, 'groups.json');
process.env.WA_LOG_DIR = path.join(TMP, 'logs');
process.env.WA_PUSH_PROVIDER = 'none';

const store = await import('../src/store.js');
const checkpoint = await import('../src/checkpoint.js');
const registry = await import('../src/registry.js');
const context = await import('../src/context.js');
const analyze = await import('../src/analyze.js');
const { stripMarkdown } = analyze;
const push = await import('../src/push.js');
const { subjectFor } = push;
const { gate, isFiller, keywordsIn } = await import('../src/filter.js');
const { FlushBuffer } = await import('../src/buffer.js');
const { normalize } = await import('../src/normalize.js');
const { runAnalysis } = await import('../src/pipeline.js');
const { buildDigest, messagesForDay, todayLocal } = await import('../src/digest.js');
const { WATCHED_GROUPS, INVOICE_GROUP_PATTERNS, BROWSER, REJECTED_PLATFORMS } = await import('../src/config.js');

const SHIPMENTS = '111111111-1600000000@g.us';
const IMPORTS = '222222222-1600000000@g.us';
const INVOICES = '333333333-1600000000@g.us';

const AUG = (day, hour = 12) => Date.parse(`2026-08-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00+05:00`);

function msg(id, ts, text, extra = {}) {
  return { id, ts, sender: extra.sender || 'Ahmed', text, hasMedia: false, mediaName: null, ...extra };
}

// ── Stub the two outbound edges ───────────────────────────────
let replies = [];
let pushed = [];

analyze.setClient({
  messages: {
    create: async ({ model }) => {
      const next = replies.shift();
      if (!next) throw new Error(`stub had no reply queued for ${model}`);
      if (next instanceof Error) throw next;
      return { content: [{ type: 'text', text: next }] };
    }
  }
});
push.setTransport(async (text, opts) => {
  pushed.push({ text, ...opts });
  return { ok: true, results: [{ ok: true, provider: 'stub' }] };
});

function reset() {
  replies = [];
  pushed = [];
}

// ════════════════════════════════════════════════════════════
test('capture: append is unfiltered, deduplicated and ordered', () => {
  store.appendMessage(SHIPMENTS, msg('m2', AUG(25, 10), 'second'));
  store.appendMessage(SHIPMENTS, msg('m1', AUG(25, 9), 'ok'));       // filler still captured
  store.appendMessage(SHIPMENTS, msg('m2', AUG(25, 10), 'second'));  // duplicate

  const all = store.readMessages(SHIPMENTS);
  assert.equal(all.length, 2, 'duplicate id was not re-appended');
  assert.deepEqual(all.map((m) => m.id), ['m1', 'm2'], 'sorted by ts');
  assert.deepEqual(Object.keys(all[0]).sort(), ['hasMedia', 'id', 'mediaName', 'sender', 'text', 'ts']);
});

test('capture: history sync backfill lands in the same store', () => {
  const written = store.appendMessages(SHIPMENTS, [
    msg('h1', AUG(24, 8), 'backfilled from history'),
    msg('m1', AUG(25, 9), 'ok') // overlaps a live message — must not duplicate
  ]);
  assert.equal(written, 1);
  assert.equal(store.readMessages(SHIPMENTS).length, 3);
});

// ════════════════════════════════════════════════════════════
test('scope: ONLY the two shipping groups are watched', () => {
  assert.ok(registry.classify('CNC Shipments'), 'CNC Shipments is watched');
  assert.ok(registry.classify('CNC Import matters'), 'CNC Import matters is watched');

  // The invoice / payment side stays on the existing Meta-API route.
  for (const subject of [
    'CNC Invoices', 'CNC Payments', 'PayGate Bank Feeds',
    'Invoice Discussion', 'Payment Confirmations', 'Family', 'Random Group'
  ]) {
    assert.equal(registry.classify(subject), null, `${subject} must NOT be watched`);
  }

  const watched = WATCHED_GROUPS.map((g) => g.name).sort();
  assert.deepEqual(watched, ['CNC Import matters', 'CNC Shipments']);
  assert.deepEqual(INVOICE_GROUP_PATTERNS, [], 'no invoice catch-all');
});

test('checkpoint: shipping groups are seeded from the given values', () => {
  const shipments = checkpoint.ensure(SHIPMENTS, { name: 'CNC Shipments', kind: 'shipping' });
  assert.equal(shipments.text, 'OLD SHIPMENT TRACKING');
  assert.equal(shipments.ts, Date.parse('2026-08-21T23:59:59+05:00'));

  const imports = checkpoint.ensure(IMPORTS, { name: 'CNC Import matters', kind: 'shipping' });
  assert.equal(imports.text, "I'll share first thing tomorrow");
  assert.equal(imports.ts, Date.parse('2026-08-23T00:00:00+05:00'));
});

test('checkpoint: invoice groups are seeded to the deployment timestamp', () => {
  const before = Date.now();
  const cursor = checkpoint.ensure(INVOICES, { name: 'CNC Invoices', kind: 'invoice' });
  assert.equal(cursor.ts, checkpoint.deployedAt());
  assert.ok(cursor.ts <= before + 1000 && cursor.ts > before - 60_000);
  assert.equal(cursor.text, null);
});

test('checkpoint: only post-cursor messages are ever read', () => {
  const cursor = checkpoint.ensure(SHIPMENTS, { name: 'CNC Shipments', kind: 'shipping' });
  const since = store.readSince(SHIPMENTS, cursor);
  // h1 (Aug 24) and m1/m2 (Aug 25) are after the Aug-21 seed; nothing before it.
  assert.deepEqual(since.map((m) => m.id), ['h1', 'm1', 'm2']);
  assert.ok(since.every((m) => m.ts > cursor.ts));
});

test('checkpoint: capturing more messages does not move the cursor', () => {
  const before = checkpoint.get(SHIPMENTS);
  store.appendMessage(SHIPMENTS, msg('read-ahead', AUG(26, 9), 'human read this in the app'));
  assert.deepEqual(checkpoint.get(SHIPMENTS), before, 'reading ahead must not advance the cursor');
});

test('checkpoint: advance moves to the newest of the batch and never rewinds', () => {
  const jid = 'advance-test@g.us';
  checkpoint.repoint(jid, AUG(1), { name: 'advance test' });
  const batch = [msg('a', AUG(5)), msg('c', AUG(9)), msg('b', AUG(7))];
  const moved = checkpoint.advance(jid, batch);
  assert.equal(moved.id, 'c');
  assert.equal(moved.ts, AUG(9));

  checkpoint.advance(jid, [msg('old', AUG(2))]);
  assert.equal(checkpoint.get(jid).id, 'c', 'cursor never goes backwards on advance');
});

// ════════════════════════════════════════════════════════════
test('filter: one-word acks, bare mentions and emoji are filler', () => {
  assert.ok(isFiller(msg('x', 1, 'ok')));
  assert.ok(isFiller(msg('x', 1, 'thanks')));
  assert.ok(isFiller(msg('x', 1, 'ok done')));
  assert.ok(isFiller(msg('x', 1, '@923001234567')));
  assert.ok(isFiller(msg('x', 1, '👍')));
  assert.ok(!isFiller(msg('x', 1, 'vessel rolled to next week')));
  assert.ok(!isFiller(msg('x', 1, '', { hasMedia: true, mediaName: 'BL.pdf' })));
});

test('filter: keywords match acronyms and B/L', () => {
  assert.deepEqual(keywordsIn('ETA is 12 Sep, B/L released'), ['ETA', 'B/L']);
  assert.deepEqual(keywordsIn('send the PI and PL'), ['PI', 'PL']);
  assert.deepEqual(keywordsIn('nothing to report here'), []);
});

test('filter: a batch with media or a keyword keeps its filler', () => {
  const chatty = [msg('1', 1, 'ok'), msg('2', 2, 'thanks')];
  assert.equal(gate(chatty).kept, 0);

  const withKeyword = [msg('1', 1, 'ok'), msg('2', 2, 'ETA now 12 Sep')];
  const gated = gate(withKeyword);
  assert.equal(gated.kept, 2, 'filler is kept as context when the batch matters');
  assert.ok(gated.forced);
  assert.deepEqual(gated.keywords, ['ETA']);

  const withMedia = [msg('1', 1, 'ok'), msg('2', 2, '', { hasMedia: true, mediaName: 'BL.pdf' })];
  assert.equal(gate(withMedia).kept, 2);
});

// ════════════════════════════════════════════════════════════
test('pipeline: all-filler batch pushes nothing but still advances the cursor', async () => {
  reset();
  const jid = 'filler-run@g.us';
  checkpoint.repoint(jid, AUG(1), { name: 'Filler Group', kind: 'shipping' });
  store.appendMessages(jid, [msg('f1', AUG(2), 'ok'), msg('f2', AUG(3), '👍')]);

  const result = await runAnalysis(jid, { name: 'Filler Group', kind: 'shipping' });
  assert.equal(result.status, 'filler');
  assert.equal(pushed.length, 0);
  assert.equal(checkpoint.get(jid).id, 'f2', 'cursor advanced past the filler');
  assert.equal(store.readSince(jid, checkpoint.get(jid)).length, 0, 'filler is not re-read');
});

test('pipeline: a keyword batch is briefed and pushed', async () => {
  reset();
  replies = ['📦 SUMMARY: Vessel rolled to 12 Sep.\n✅ DO: Ask Qasim to confirm the new ETA.'];
  const jid = 'brief-run@g.us';
  checkpoint.repoint(jid, AUG(1), { name: 'CNC Shipments', kind: 'shipping' });
  store.appendMessages(jid, [
    msg('b1', AUG(2), 'ok'),
    msg('b2', AUG(3), 'vessel rolled, new ETA 12 Sep', { sender: 'Qasim' })
  ]);

  const result = await runAnalysis(jid, { name: 'CNC Shipments', kind: 'shipping' });
  assert.equal(result.status, 'pushed');
  assert.equal(pushed.length, 1);
  assert.match(pushed[0].text, /SUMMARY/);
  assert.equal(pushed[0].title, 'CNC Shipments');
  assert.equal(checkpoint.get(jid).id, 'b2');
  assert.equal(replies.length, 0, 'media/keyword batch skips the triage call');

  const recorded = context.load().recent_briefs.at(-1);
  assert.equal(recorded.pushed, true);
  assert.match(recorded.line, /Vessel rolled/);
});

test("pipeline: a 'skip' reply pushes nothing and still advances", async () => {
  reset();
  replies = ['PUSH', 'skip']; // triage lets it through, the brief says skip
  const jid = 'skip-run@g.us';
  checkpoint.repoint(jid, AUG(1), { name: 'Chat Group', kind: 'shipping' });
  store.appendMessages(jid, [msg('s1', AUG(2), 'how was the wedding yesterday')]);

  const result = await runAnalysis(jid, { name: 'Chat Group', kind: 'shipping' });
  assert.equal(result.status, 'skip');
  assert.equal(pushed.length, 0);
  assert.equal(checkpoint.get(jid).id, 's1');
});

test('pipeline: triage SKIP short-circuits before the expensive brief', async () => {
  reset();
  replies = ['SKIP'];
  const jid = 'triage-run@g.us';
  checkpoint.repoint(jid, AUG(1), { name: 'Chat Group 2', kind: 'shipping' });
  store.appendMessages(jid, [msg('t1', AUG(2), 'traffic on Shahrah-e-Faisal is terrible today')]);

  const result = await runAnalysis(jid, { name: 'Chat Group 2', kind: 'shipping' });
  assert.equal(result.status, 'triage-skip');
  assert.equal(pushed.length, 0);
  assert.equal(replies.length, 0, 'only the cheap call was made');
  assert.equal(checkpoint.get(jid).id, 't1');
});

test('pipeline: an API failure holds the cursor so nothing is lost', async () => {
  reset();
  replies = [new Error('connection reset')];
  const jid = 'error-run@g.us';
  checkpoint.repoint(jid, AUG(1), { name: 'CNC Shipments', kind: 'shipping' });
  store.appendMessages(jid, [msg('e1', AUG(2), 'container 40HQ stuck at KICT, demurrage running')]);

  const result = await runAnalysis(jid, { name: 'CNC Shipments', kind: 'shipping' });
  assert.equal(result.status, 'error');
  assert.equal(checkpoint.get(jid).ts, AUG(1), 'cursor held at the pre-run position');

  // The retry succeeds and the message is still there to analyse.
  replies = ['📦 SUMMARY: Container stuck at KICT.\n⚠️ CAUTION: Demurrage accruing.'];
  const retry = await runAnalysis(jid, { name: 'CNC Shipments', kind: 'shipping' });
  assert.equal(retry.status, 'pushed');
  assert.equal(checkpoint.get(jid).id, 'e1');
});

test('pipeline: a dry run leaves no trace', async () => {
  reset();
  replies = ['📦 SUMMARY: Something happened.'];
  const jid = 'dry-run@g.us';
  checkpoint.repoint(jid, AUG(1), { name: 'Dry Group', kind: 'shipping' });
  store.appendMessages(jid, [msg('d1', AUG(2), 'ETA slipped to 14 Sep')]);
  const briefsBefore = context.load().recent_briefs.length;

  const result = await runAnalysis(jid, { name: 'Dry Group', kind: 'shipping', dryRun: true });
  assert.equal(result.status, 'pushed');
  assert.equal(pushed.length, 0, 'nothing was pushed');
  assert.equal(checkpoint.get(jid).ts, AUG(1), 'cursor did not move');
  assert.equal(context.load().recent_briefs.length, briefsBefore, 'no context record written');
  assert.equal(store.readSince(jid, checkpoint.get(jid)).length, 1, 'the message is still pending');
});

test('pipeline: a transport that sends nothing is not reported as delivered', async () => {
  reset();
  replies = ['\u{1F4E6} SUMMARY: Vessel sailed.'];
  const jid = 'not-sent@g.us';
  checkpoint.repoint(jid, AUG(1), { name: 'CNC Shipments', kind: 'shipping' });
  store.appendMessages(jid, [msg('n1', AUG(2), 'ETA now 12 Sep')]);

  // WA_PUSH_PROVIDER=none reports ok:true while sending nothing. That must not
  // be recorded as a delivered brief, or you go looking in the wrong inbox.
  push.setTransport(async () => ({ ok: true, results: [{ ok: true, provider: 'none', skipped: true }] }));
  const result = await runAnalysis(jid, { name: 'CNC Shipments', kind: 'shipping' });
  assert.equal(result.status, 'pushed', 'the batch was still analysed');
  assert.equal(context.load().recent_briefs.at(-1).pushed, false, 'not recorded as delivered');

  // Restore the stub the other tests rely on.
  push.setTransport(async (text, opts) => {
    pushed.push({ text, ...opts });
    return { ok: true, results: [{ ok: true, provider: 'stub' }] };
  });
});

test('pipeline: nothing new past the cursor is a no-op', async () => {
  reset();
  const result = await runAnalysis('brief-run@g.us', { name: 'CNC Shipments', kind: 'shipping' });
  assert.equal(result.status, 'empty');
  assert.equal(pushed.length, 0);
});

// ════════════════════════════════════════════════════════════
test('brief: markdown is stripped so plain-text email reads cleanly', () => {
  const raw = '\u{1F4E6} **SUMMARY:** Vessel sailed.\n\n\u2705 **DO:** Verify the B/L.\n\n\n\u26A0\uFE0F __CAUTION:__ *check* the NTN.';
  assert.equal(
    stripMarkdown(raw),
    '\u{1F4E6} SUMMARY: Vessel sailed.\n\n\u2705 DO: Verify the B/L.\n\n\u26A0\uFE0F CAUTION: check the NTN.'
  );
  // A lone asterisk in prose is left alone.
  assert.equal(stripMarkdown('rate is 3.5 * 2 per unit'), 'rate is 3.5 * 2 per unit');
});

test('client identity: never claims to be a native desktop app', () => {
  // Baileys maps browser[0] of 'Mac OS'/'Windows' to a desktop-app
  // webSubPlatform when syncFullHistory is on, and WhatsApp terminates the
  // handshake for that identity before issuing a QR. Regressing this is an
  // endless 428 loop with no QR, which is very hard to diagnose from symptoms.
  assert.ok(Array.isArray(BROWSER) && BROWSER.length === 3, 'browser is a 3-tuple');
  assert.ok(
    !REJECTED_PLATFORMS.includes(BROWSER[0]),
    `browser[0] is "${BROWSER[0]}" — that identity is refused by WhatsApp`
  );
});

test('email: subject is the SUMMARY sentence, capped, with the group as fallback', () => {
  assert.equal(
    subjectFor('\u{1F4E6} SUMMARY: XIN PU DONG sailed today.\n\u2705 DO: Chase the B/L.', 'CNC Shipments'),
    '\u{1F4E6} XIN PU DONG sailed today. \u2014 wa-notify'
  );
  // No SUMMARY line -> fall back to the group name.
  assert.equal(subjectFor('skip', 'CNC Import matters'), '\u{1F4E6} CNC Import matters \u2014 wa-notify');
  // Long summaries are truncated so iPhone Mail shows something readable.
  const long = subjectFor(`\u{1F4E6} SUMMARY: ${'x'.repeat(200)}`, 'CNC Shipments');
  assert.ok(long.length < 100, `subject was ${long.length} chars`);
  assert.ok(long.startsWith('\u{1F4E6} ') && long.endsWith(' \u2014 wa-notify'));
});

test('buffer: flushes at 10 queued messages', async () => {
  const flushes = [];
  const buffer = new FlushBuffer((jid, meta) => flushes.push({ jid, meta }), { quietMs: 60_000, maxMessages: 10 });
  for (let i = 0; i < 9; i += 1) buffer.add('g@g.us', { name: 'G' });
  assert.equal(flushes.length, 0);
  buffer.add('g@g.us', { name: 'G' });
  assert.equal(flushes.length, 1);
  assert.equal(flushes[0].meta.reason, 'max-messages');
  assert.equal(flushes[0].meta.queued, 10);
  buffer.stop();
});

test('buffer: flushes after a quiet period', async () => {
  const flushes = [];
  const buffer = new FlushBuffer((jid, meta) => flushes.push(meta), { quietMs: 30, maxMessages: 10 });
  buffer.add('q@g.us', { name: 'Q' });
  await new Promise((r) => setTimeout(r, 15));
  buffer.add('q@g.us', { name: 'Q' }); // resets the quiet timer
  assert.equal(flushes.length, 0);
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(flushes.length, 1);
  assert.equal(flushes[0].reason, 'quiet');
  assert.equal(flushes[0].queued, 2);
  buffer.stop();
});

// ════════════════════════════════════════════════════════════
test('normalize: text, captions and documents', () => {
  const base = (message, extra = {}) => ({
    key: { id: 'k1', remoteJid: SHIPMENTS, participant: '92300@s.whatsapp.net' },
    messageTimestamp: 1756000000,
    pushName: 'Shahid',
    message,
    ...extra
  });

  const plain = normalize(base({ conversation: 'ETA confirmed' }));
  assert.deepEqual(plain, {
    id: 'k1', ts: 1756000000000, sender: 'Shahid',
    text: 'ETA confirmed', hasMedia: false, mediaName: null
  });

  const doc = normalize(base({ documentMessage: { fileName: 'BL-DRAFT.pdf', caption: 'draft B/L' } }));
  assert.equal(doc.hasMedia, true);
  assert.equal(doc.mediaName, 'BL-DRAFT.pdf');
  assert.equal(doc.text, 'draft B/L');

  const img = normalize(base({ imageMessage: { mimetype: 'image/jpeg' } }));
  assert.equal(img.hasMedia, true);
  assert.equal(img.text, '');

  const wrapped = normalize(base({ ephemeralMessage: { message: { extendedTextMessage: { text: 'inside' } } } }));
  assert.equal(wrapped.text, 'inside');

  assert.equal(normalize(base({ protocolMessage: {} })), null, 'contentless protocol messages are dropped');
  assert.equal(normalize({ key: {}, message: {} }), null);
});

// ════════════════════════════════════════════════════════════
test('catchup: re-pointing the cursor backwards re-reads pasted messages', async () => {
  reset();
  const jid = 'catchup-run@g.us';
  registry.remember(jid, 'CNC Shipments');
  checkpoint.repoint(jid, AUG(20), { name: 'CNC Shipments', kind: 'shipping' });

  // Listener was down; the operator pastes the missed traffic into the store.
  store.appendMessages(jid, [
    msg('c1', AUG(21), 'PI 27 revised, price up 3%', { sender: 'CNC' }),
    msg('c2', AUG(22), 'ok')
  ]);
  replies = ['📦 SUMMARY: PI-27 revised 3% higher.\n✅ DO: Approve or push back today.'];
  const first = await runAnalysis(jid, { name: 'CNC Shipments', kind: 'shipping' });
  assert.equal(first.status, 'pushed');
  assert.equal(checkpoint.get(jid).id, 'c2');

  // Re-point behind them and the same window is analysed again.
  assert.equal(registry.resolveJid('CNC Shipments'), jid);
  checkpoint.repoint(jid, AUG(20), { name: 'CNC Shipments', kind: 'shipping' });
  assert.equal(store.readSince(jid, checkpoint.get(jid)).length, 2);

  reset();
  replies = ['📦 SUMMARY: PI-27 revised 3% higher.'];
  const second = await runAnalysis(jid, { name: 'CNC Shipments', kind: 'shipping' });
  assert.equal(second.status, 'pushed');
  assert.equal(pushed.length, 1);
});

test('context: brief history is capped and pushes are logged', () => {
  const briefs = context.load().recent_briefs;
  assert.ok(briefs.length > 0);
  assert.ok(briefs.length <= 30);

  const log = fs.readFileSync(path.join(TMP, 'logs', 'pushes.jsonl'), 'utf8')
    .trim().split('\n').map((l) => JSON.parse(l));
  assert.ok(log.some((e) => e.status === 'pushed' && e.brief));
  assert.ok(log.some((e) => e.status === 'filler' && e.pushed === false));
  assert.ok(log.some((e) => e.status === 'error'));
});

// ═══════════════════════════════════════════════════════════
test('digest: selects one local day and never moves the checkpoint', async () => {
  reset();
  const jid = 'digest-run@g.us';
  registry.remember(jid, 'CNC Shipments');
  store.appendMessages(jid, [
    // 2026-08-19 23:30 PKT — the day before, must be excluded
    { id: 'd0', ts: Date.parse('2026-08-19T23:30:00+05:00'), sender: 'Zoe', text: 'yesterday', hasMedia: false, mediaName: null },
    // inside 2026-08-20 PKT
    { id: 'd1', ts: Date.parse('2026-08-20T00:05:00+05:00'), sender: 'Zoe', text: 'PI 27 revised', hasMedia: false, mediaName: null },
    { id: 'd2', ts: Date.parse('2026-08-20T14:00:00+05:00'), sender: 'Qasim', text: 'ETD 26 Aug', hasMedia: false, mediaName: null },
    { id: 'd3', ts: Date.parse('2026-08-20T23:50:00+05:00'), sender: 'MWM', text: 'noted', hasMedia: false, mediaName: null },
    // 2026-08-21 00:10 PKT — the day after, must be excluded
    { id: 'd4', ts: Date.parse('2026-08-21T00:10:00+05:00'), sender: 'Zoe', text: 'tomorrow', hasMedia: false, mediaName: null }
  ]);

  assert.deepEqual(
    messagesForDay(jid, '2026-08-20', '+05:00').map((m) => m.id),
    ['d1', 'd2', 'd3'],
    'local-day boundaries, not UTC'
  );

  checkpoint.repoint(jid, Date.parse('2026-08-01T00:00:00+05:00'), { name: 'CNC Shipments' });
  const before = checkpoint.get(jid);

  const result = await buildDigest(jid, '2026-08-20', {
    client: { messages: { create: async () => ({ content: [{ type: 'text', text: '📋 WHAT HAPPENED\nPI 27 revised; ETD set to 26 Aug.' }] }) } }
  });

  assert.equal(result.count, 3);
  assert.equal(result.group, 'CNC Shipments');
  assert.match(result.text, /PI 27/);
  // A report must not affect what the alerting side still considers unread.
  assert.deepEqual(checkpoint.get(jid), before, 'digest must not move the cursor');
});

test('digest: a day with no captured messages is reported, not invented', async () => {
  const jid = 'digest-run@g.us';
  const result = await buildDigest(jid, '2026-01-01', {
    client: { messages: { create: async () => { throw new Error('must not call the model'); } } }
  });
  assert.equal(result.empty, true);
  assert.equal(result.count, 0);
  assert.equal(result.text, null);
});

test('digest: todayLocal respects the configured offset', () => {
  // 2026-08-20T20:00Z is already the 21st in Karachi (+05:00).
  const t = Date.parse('2026-08-20T20:00:00Z');
  assert.equal(todayLocal('+05:00', t), '2026-08-21');
  assert.equal(todayLocal('+00:00', t), '2026-08-20');
});

test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));
