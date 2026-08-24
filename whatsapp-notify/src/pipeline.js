// ═══════════════════════════════════════════════════════════════
// The analysis run: read post-cursor messages -> gate -> triage -> brief
// -> push -> advance the checkpoint. Shared by the live listener and by
// the manual `catchup` command so both behave identically.
// ═══════════════════════════════════════════════════════════════
import * as store from './store.js';
import * as checkpoint from './checkpoint.js';
import * as context from './context.js';
import * as analyze from './analyze.js';
import * as push from './push.js';
import { gate } from './filter.js';
import { logPush, line, warn } from './logger.js';

// One run at a time per group: a flush timer and a `catchup` must not read
// the same post-cursor window simultaneously and push the brief twice.
const running = new Map();

async function withLock(jid, fn) {
  const previous = running.get(jid) || Promise.resolve();
  const current = previous.catch(() => {}).then(fn);
  running.set(jid, current.catch(() => {}));
  return current;
}

/**
 * Run one analysis for a group.
 *
 * Returns { status, ... } where status is one of:
 *   empty        nothing new past the cursor
 *   filler       batch was all filler — no push, cursor still advanced
 *   triage-skip  cheap model judged it noise — no push, cursor advanced
 *   skip         Claude replied 'skip' — no push, cursor advanced
 *   pushed       brief sent
 *   error        analysis failed — cursor deliberately NOT advanced
 */
export async function runAnalysis(jid, { name, kind, dryRun = false } = {}) {
  return withLock(jid, async () => {
    const cursor = checkpoint.ensure(jid, { name, kind });
    const batch = store.readSince(jid, cursor);
    const label = name || jid;

    if (batch.length === 0) return { status: 'empty', jid, group: label, batch: 0 };

    const gated = gate(batch);
    // In a dry run nothing is persisted: no cursor move, no push, and no
    // entry in context.json or the push log.
    const advanceCursor = () => (dryRun ? cursor : checkpoint.advance(jid, batch));
    const record = (entry) => { if (!dryRun) context.recordBrief(entry); };
    const log = (entry) => (dryRun ? null : logPush(entry));

    // Everything was filler. No push — but move the cursor past it so the
    // same "ok / thanks / 👍" run is not re-read on the next flush.
    if (gated.messages.length === 0) {
      advanceCursor();
      record({ group: label, summary: `${batch.length} filler message(s), no brief`, pushed: false });
      log({ jid, group: label, status: 'filler', batch: batch.length, pushed: false });
      line(`${label}: ${batch.length} filler message(s) — cursor advanced, nothing pushed`);
      return { status: 'filler', jid, group: label, batch: batch.length };
    }

    // No media and no keyword hit: spend a cheap triage call before the brief.
    if (!gated.forced) {
      const verdict = await analyze.triage(gated.messages);
      if (verdict.error) warn(`${label}: triage failed (${verdict.error}) — falling through to the brief`);
      if (!verdict.push) {
        advanceCursor();
        record({ group: label, summary: `triage: no action in ${batch.length} message(s)`, pushed: false });
        log({ jid, group: label, status: 'triage-skip', batch: batch.length, pushed: false });
        line(`${label}: triage says SKIP for ${batch.length} message(s) — cursor advanced`);
        return { status: 'triage-skip', jid, group: label, batch: batch.length };
      }
    }

    const result = await analyze.brief(context.forPrompt(), gated.messages);

    // The batch was never actually analysed — leave the cursor where it is
    // so the next run picks these messages up again.
    if (result.error) {
      warn(`${label}: brief failed (${result.error}) — cursor held at ${cursor.ts}`);
      log({ jid, group: label, status: 'error', batch: batch.length, pushed: false, error: result.error });
      return { status: 'error', jid, group: label, batch: batch.length, error: result.error };
    }

    if (result.skip) {
      advanceCursor();
      record({ group: label, summary: `claude: skip (${batch.length} message(s))`, pushed: false });
      log({ jid, group: label, status: 'skip', batch: batch.length, pushed: false });
      line(`${label}: Claude replied 'skip' — cursor advanced, nothing pushed`);
      return { status: 'skip', jid, group: label, batch: batch.length };
    }

    let delivery = { ok: true, results: [{ ok: true, provider: 'dry-run', skipped: true }] };
    if (!dryRun) delivery = await push.send(result.text, { title: label });

    // A transport that was configured away (WA_PUSH_PROVIDER=none) reports
    // success while sending nothing. That is legitimate for testing but must
    // never read as "delivered".
    const delivered = delivery.results.filter((r) => r.ok && !r.skipped);
    const skipped = delivery.results.filter((r) => r.skipped);

    // The cursor advances whether or not the transport accepted it: the batch
    // WAS analysed, and the brief is preserved in logs/pushes.jsonl.
    advanceCursor();
    record({ group: label, summary: result.text, pushed: delivered.length > 0 });
    log({
      jid, group: label, status: 'pushed', batch: batch.length, analysed: gated.messages.length,
      keywords: gated.keywords, hasMedia: gated.hasMedia,
      pushed: delivered.length > 0, transports: delivery.results, brief: result.text
    });

    // Say what actually happened. Reporting "pushed" for a brief that was
    // written but never delivered sends you looking in the wrong place.
    if (delivered.length > 0) {
      line(`${label}: brief EMAILED (${delivered.map((r) => r.provider).join(', ')}) `
        + `for ${gated.messages.length}/${batch.length} message(s)`);
    } else if (skipped.length > 0) {
      warn(`${label}: brief written but NOT SENT — transport is "${skipped.map((r) => r.provider).join(', ')}". `
        + 'Set WA_PUSH_PROVIDER=email in .env to actually deliver it.');
      line(`--- brief that was not sent ---\n${result.text}\n-------------------------------`);
    } else {
      warn(`${label}: brief written but DELIVERY FAILED — `
        + delivery.results.map((r) => `${r.provider}: ${r.error || 'unknown error'}`).join('; '));
      line(`--- brief that was not sent ---\n${result.text}\n-------------------------------`);
    }

    return { status: 'pushed', jid, group: label, batch: batch.length, brief: result.text, delivery };
  });
}
