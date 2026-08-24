// ═══════════════════════════════════════════════════════════════
// The Baileys listener.
//
// Order of operations on every incoming message is deliberate:
//   1. append to store/<groupJID>.jsonl   (capture — unconditional)
//   2. check the checkpoint                (is this past what Claude analysed?)
//   3. buffer it for the next flush        (analysis)
//
// Offline history sync (`messaging-history.set`) feeds step 1 through exactly
// the same path, so a reconnect backfills the store instead of losing days.
// ═══════════════════════════════════════════════════════════════
import { PATHS } from './config.js';
import * as store from './store.js';
import * as checkpoint from './checkpoint.js';
import * as registry from './registry.js';
import { FlushBuffer } from './buffer.js';
import { normalize, groupJidOf } from './normalize.js';
import { runAnalysis } from './pipeline.js';
import { isAfter, ensureDir } from './util.js';
import { line, warn } from './logger.js';

const subjects = new Map(); // jid -> subject

async function subjectFor(sock, jid) {
  if (subjects.has(jid)) return subjects.get(jid);
  const known = registry.entryFor(jid);
  if (known?.subject) {
    subjects.set(jid, known.subject);
    return known.subject;
  }
  try {
    const meta = await sock.groupMetadata(jid);
    const subject = meta?.subject || '';
    // Only cache a real answer — caching '' would make one transient failure
    // ignore that group for the rest of the process.
    if (subject) subjects.set(jid, subject);
    return subject;
  } catch (err) {
    warn(`could not fetch metadata for ${jid}: ${err.message}`);
    return '';
  }
}

export async function start({ analyse = runAnalysis } = {}) {
  const baileys = await import('@whiskeysockets/baileys');
  const makeWASocket = baileys.default?.default || baileys.default || baileys.makeWASocket;
  const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, Browsers } = baileys;
  const { default: pino } = await import('pino');
  const { default: qrcode } = await import('qrcode-terminal');

  ensureDir(PATHS.store);
  ensureDir(PATHS.auth);
  checkpoint.deployedAt(); // stamp the deployment instant on first ever run

  const { state, saveCreds } = await useMultiFileAuthState(PATHS.auth);
  const { version } = await fetchLatestBaileysVersion();

  const buffer = new FlushBuffer(async (jid, meta) => {
    try {
      return await analyse(jid, { name: meta.name, kind: meta.kind });
    } catch (err) {
      warn(`analysis run for ${meta.name || jid} threw: ${err.stack || err.message}`);
      return { status: 'error', jid, error: err.message };
    }
  });

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: process.env.WA_LOG_LEVEL || 'warn' }),
    browser: Browsers?.appropriate ? Browsers.appropriate('Chrome') : undefined,
    // Ask WhatsApp for the backlog so a reconnect refills the store.
    syncFullHistory: true,
    markOnlineOnConnect: false // reading in the app must not be affected
  });

  sock.ev.on('creds.update', saveCreds);

  // After a restart the store may already hold post-cursor messages that were
  // captured but never analysed (shutdown mid-buffer, or a crash). Sweep once
  // on connect so they are not stranded until the next live message arrives.
  const sweep = () => {
    for (const [jid, entry] of Object.entries(registry.all())) {
      const cursor = checkpoint.ensure(jid, { name: entry.name, kind: entry.kind });
      const pending = store.readSince(jid, cursor).length;
      if (pending === 0) continue;
      line(`startup sweep: ${pending} unanalysed message(s) in ${entry.name}`);
      buffer.add(jid, { name: entry.name, kind: entry.kind });
    }
  };

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      line('scan this QR with WhatsApp > Linked devices:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      line('connected to WhatsApp');
      sweep();
    }
    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = status === DisconnectReason?.loggedOut;
      warn(`connection closed (${status ?? 'unknown'})${loggedOut ? ' — logged out, delete auth/ and re-pair' : ', reconnecting'}`);
      if (!loggedOut) start({ analyse }).catch((err) => warn(`reconnect failed: ${err.message}`));
    }
  });

  // ── CAPTURE: live messages ───────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const waMessage of messages) {
      const jid = groupJidOf(waMessage);
      if (!jid) continue;

      const subject = await subjectFor(sock, jid);
      const group = registry.classify(subject);
      if (!group) continue; // not one of the watched groups

      registry.remember(jid, subject);

      const record = normalize(waMessage);
      if (!record) continue;

      // 1. Capture first, always, before anything can reject it.
      const written = store.appendMessage(jid, record);
      if (!written) continue; // already captured (retry / history overlap)

      // `append` (a historical backfill) still gets stored, but only live
      // notifications drive the flush timer.
      if (type !== 'notify') continue;

      // 2. Only messages past the analysis cursor are worth buffering.
      const cursor = checkpoint.ensure(jid, { name: group.name, kind: group.kind });
      if (!isAfter(record, cursor)) continue;

      // 3. Buffer for the 90s-quiet / 10-message flush.
      buffer.add(jid, { name: group.name, kind: group.kind });
    }
  });

  // ── CAPTURE: offline history sync on reconnect ─────────────────────
  sock.ev.on('messaging-history.set', async ({ messages = [], isLatest, syncType }) => {
    const perGroup = new Map();
    for (const waMessage of messages) {
      const jid = groupJidOf(waMessage);
      if (!jid) continue;
      const record = normalize(waMessage);
      if (!record) continue;
      if (!perGroup.has(jid)) perGroup.set(jid, []);
      perGroup.get(jid).push(record);
    }

    for (const [jid, records] of perGroup) {
      const subject = await subjectFor(sock, jid);
      const group = registry.classify(subject);
      if (!group) continue;
      registry.remember(jid, subject);

      const written = store.appendMessages(jid, records);
      if (written > 0) {
        line(`history sync (${syncType ?? '?'}): backfilled ${written} message(s) into ${group.name}`);
        // Anything past the cursor is analysed on the normal flush cadence.
        const cursor = checkpoint.ensure(jid, { name: group.name, kind: group.kind });
        const fresh = records.filter((r) => isAfter(r, cursor)).length;
        if (fresh > 0) buffer.add(jid, { name: group.name, kind: group.kind });
      }
    }
    if (isLatest) line('history sync complete');
  });

  sock.ev.on('groups.update', (updates) => {
    for (const update of updates) {
      if (update.id && update.subject) {
        subjects.set(update.id, update.subject);
        registry.remember(update.id, update.subject);
      }
    }
  });

  // Buffered-but-unflushed groups are safe to drop on exit: every message is
  // already in the store and the cursor has not moved, so the startup sweep
  // picks them up on the next boot.
  const shutdown = (signal) => {
    line(`${signal} — shutting down (buffered work resumes on next start)`);
    buffer.stop();
    process.exit(0);
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  return { sock, buffer };
}
