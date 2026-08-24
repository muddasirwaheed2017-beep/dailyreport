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
//
// Reconnection is deliberately single-flighted. An earlier version called
// start() again from the 'close' handler, which meant every dead socket
// spawned a fresh one while its own listeners stayed attached — the sockets
// multiplied, process signal handlers were re-registered on each pass, and the
// QR never survived long enough to be scanned. Now exactly one socket is live
// at a time, stale sockets are torn down and their events ignored, and retries
// back off.
// ═══════════════════════════════════════════════════════════════
import { PATHS, PAIR_PHONE } from './config.js';
import * as store from './store.js';
import * as checkpoint from './checkpoint.js';
import * as registry from './registry.js';
import { FlushBuffer } from './buffer.js';
import { normalize, groupJidOf } from './normalize.js';
import { runAnalysis } from './pipeline.js';
import { isAfter, ensureDir } from './util.js';
import { line, warn } from './logger.js';

const subjects = new Map(); // jid -> subject

// ─── connection lifecycle state ──────────────────────────────
let generation = 0;        // increments per connection attempt
let liveSock = null;       // the one socket allowed to act
let backoffMs = 1_000;
let consecutiveFailures = 0;
let stopping = false;
let signalsBound = false;

const MAX_BACKOFF_MS = 30_000;

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

function teardown(sock) {
  if (!sock) return;
  try { sock.ev.removeAllListeners(); } catch { /* already gone */ }
  try { sock.end(undefined); } catch { /* already closed */ }
}

/**
 * Start the listener. Safe to call once; reconnection is handled internally.
 */
export async function start({ analyse = runAnalysis } = {}) {
  const baileys = await import('@whiskeysockets/baileys');
  const makeWASocket = baileys.default?.default || baileys.default || baileys.makeWASocket;
  const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, Browsers } = baileys;
  const { default: pino } = await import('pino');
  const { default: qrcode } = await import('qrcode-terminal');

  ensureDir(PATHS.store);
  ensureDir(PATHS.auth);
  checkpoint.deployedAt(); // stamp the deployment instant on first ever run

  // One buffer for the whole process lifetime — it must survive reconnects,
  // otherwise a blip would drop whatever was queued but not yet flushed.
  const buffer = new FlushBuffer(async (jid, meta) => {
    try {
      return await analyse(jid, { name: meta.name, kind: meta.kind });
    } catch (err) {
      warn(`analysis run for ${meta.name || jid} threw: ${err.stack || err.message}`);
      return { status: 'error', jid, error: err.message };
    }
  });

  // Registered once, not per connection.
  if (!signalsBound) {
    signalsBound = true;
    const shutdown = (signal) => {
      stopping = true;
      line(`${signal} — shutting down (buffered work resumes on next start)`);
      buffer.stop();
      teardown(liveSock);
      process.exit(0);
    };
    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  }

  const deps = { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, Browsers, pino, qrcode };
  return connect(deps, buffer);
}

async function connect(deps, buffer) {
  const {
    makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion,
    DisconnectReason, Browsers, pino, qrcode
  } = deps;

  if (stopping) return null;

  // Any socket from a previous attempt is dead to us from here on.
  teardown(liveSock);
  liveSock = null;

  const myGeneration = ++generation;
  const isCurrent = () => myGeneration === generation && !stopping;

  const { state, saveCreds } = await useMultiFileAuthState(PATHS.auth);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const paired = Boolean(state.creds?.registered);
  line(`WhatsApp Web v${version.join('.')}${isLatest ? '' : ' (not latest)'} · `
    + `credentials: ${paired ? 'already paired' : 'none yet, expecting a QR'}`);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: process.env.WA_LOG_LEVEL || 'silent' }),
    browser: Browsers.macOS('Desktop'),
    // Ask WhatsApp for the backlog so a reconnect refills the store.
    syncFullHistory: true,
    markOnlineOnConnect: false // reading in the app must not be affected
  });
  liveSock = sock;

  sock.ev.on('creds.update', saveCreds);

  // Pairing-code login. This MUST win the race against Baileys' own automatic
  // QR registration: setting creds.pairingCode/creds.me is what switches the
  // handshake to the link_code route. Baileys fires its QR registration a few
  // hundred ms in, so we start asking immediately and retry fast until the
  // socket accepts the node.
  let pairAttempts = 0;
  let pairLastError = null;
  let pairGotCode = false;
  if (PAIR_PHONE && !paired) {
    const askForCode = async () => {
      if (!isCurrent() || pairGotCode || sock.authState?.creds?.registered) return;
      pairAttempts += 1;
      try {
        const code = await sock.requestPairingCode(PAIR_PHONE);
        pairGotCode = true;
        const pretty = String(code).match(/.{1,4}/g)?.join('-') || code;
        line('');
        line('┌─────────────────────────────────────────────────┐');
        line(`│  PAIRING CODE:  ${pretty.padEnd(31)}│`);
        line('│                                                 │');
        line('│  On the phone: WhatsApp > Settings >            │');
        line('│  Linked Devices > Link a Device >               │');
        line('│  "Link with phone number instead"               │');
        line('└─────────────────────────────────────────────────┘');
        line(`enter it for +${PAIR_PHONE} — expires in about a minute`);
      } catch (err) {
        pairLastError = err.message;
        if (pairAttempts < 20 && isCurrent()) {
          const t = setTimeout(askForCode, 100);
          if (typeof t.unref === 'function') t.unref();
        }
      }
    };
    const first = setTimeout(askForCode, 60);
    if (typeof first.unref === 'function') first.unref();
  }

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

  const scheduleReconnect = (immediate = false) => {
    if (!isCurrent()) return; // a newer attempt already owns the reconnect
    const wait = immediate ? 0 : backoffMs;
    if (!immediate) backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
    if (wait) line(`reconnecting in ${Math.round(wait / 1000)}s`);
    const timer = setTimeout(() => {
      connect(deps, buffer).catch((err) => {
        warn(`reconnect failed: ${err.message}`);
        scheduleReconnect();
      });
    }, wait);
    if (typeof timer.unref === 'function') timer.unref();
  };

  sock.ev.on('connection.update', (update) => {
    if (!isCurrent()) return; // event from a socket we have already replaced

    const { connection, lastDisconnect, qr } = update;

    if (qr && PAIR_PHONE) return; // pairing by code — the QR is not the route
    if (qr) {
      line('');
      line('┌─────────────────────────────────────────────────┐');
      line('│  Scan with WhatsApp:                            │');
      line('│  Settings > Linked Devices > Link a Device      │');
      line('└─────────────────────────────────────────────────┘');
      qrcode.generate(qr, { small: true });
      line('waiting for the scan — a new code appears if this one expires');
    }

    if (connection === 'open') {
      backoffMs = 1_000;
      consecutiveFailures = 0;
      line('connected to WhatsApp');
      const watched = Object.values(registry.all()).map((g) => g.name);
      line(watched.length
        ? `watching: ${watched.join(', ')}`
        : 'watching: (groups are identified as their first message arrives)');
      sweep();
    }

    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode;

      if (status === DisconnectReason.loggedOut) {
        warn('logged out on the phone — delete the auth/ folder and run `npm start` again to re-pair');
        stopping = true;
        return;
      }

      // 515 is the expected "now reconnect properly" handshake right after a
      // successful QR scan. It is success, not failure — go straight back.
      if (status === DisconnectReason.restartRequired) {
        line('pairing accepted, reconnecting');
        scheduleReconnect(true);
        return;
      }

      consecutiveFailures += 1;
      warn(`connection closed (${status ?? 'unknown'})`);
      if (PAIR_PHONE && !paired && !pairGotCode) {
        warn(`pairing code not obtained — ${pairAttempts} attempt(s), last error: ${pairLastError || 'never ran'}`);
      }

      // A run of 428s with no successful open almost always means the stored
      // credentials are half-written from an interrupted pairing.
      if (consecutiveFailures === 5) {
        warn('repeated failures without connecting — if this does not clear, stop with Ctrl-C,');
        warn(`delete the auth folder (rm -rf "${PATHS.auth}") and run \`npm start\` again`);
      }

      scheduleReconnect();
    }
  });

  // ── CAPTURE: live messages ─────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (!isCurrent()) return;
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

  // ── CAPTURE: offline history sync on reconnect ─────────────
  sock.ev.on('messaging-history.set', async ({ messages = [], isLatest, syncType }) => {
    if (!isCurrent()) return;
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
    if (!isCurrent()) return;
    for (const update of updates) {
      if (update.id && update.subject) {
        subjects.set(update.id, update.subject);
        registry.remember(update.id, update.subject);
      }
    }
  });

  return { sock, buffer };
}
