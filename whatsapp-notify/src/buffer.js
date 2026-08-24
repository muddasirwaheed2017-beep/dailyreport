// ═══════════════════════════════════════════════════════════════
// Per-group flush scheduler (step 3): flush after 90s of quiet, or as soon
// as 10 new messages are queued.
//
// The buffer only counts — it never holds the messages. The batch itself is
// always re-read from the store against the checkpoint at flush time, so a
// restart or a history sync can't leave anything stranded in memory.
// ═══════════════════════════════════════════════════════════════
import { FLUSH_QUIET_MS, FLUSH_MAX_MESSAGES } from './config.js';

export class FlushBuffer {
  constructor(onFlush, { quietMs = FLUSH_QUIET_MS, maxMessages = FLUSH_MAX_MESSAGES } = {}) {
    this.onFlush = onFlush;
    this.quietMs = quietMs;
    this.maxMessages = maxMessages;
    this.groups = new Map(); // jid -> { count, timer, meta }
  }

  /** Register one new post-cursor message for a group. */
  add(jid, meta = {}) {
    let state = this.groups.get(jid);
    if (!state) {
      state = { count: 0, timer: null, meta };
      this.groups.set(jid, state);
    }
    state.meta = { ...state.meta, ...meta };
    state.count += 1;

    if (state.count >= this.maxMessages) {
      return this.flush(jid, 'max-messages');
    }

    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => this.flush(jid, 'quiet'), this.quietMs);
    if (typeof state.timer.unref === 'function') state.timer.unref();
    return null;
  }

  flush(jid, reason = 'manual') {
    const state = this.groups.get(jid);
    if (!state) return Promise.resolve(null);
    if (state.timer) clearTimeout(state.timer);
    this.groups.delete(jid);
    return Promise.resolve(this.onFlush(jid, { ...state.meta, reason, queued: state.count }));
  }

  flushAll(reason = 'shutdown') {
    return Promise.all([...this.groups.keys()].map((jid) => this.flush(jid, reason)));
  }

  pending(jid) {
    return this.groups.get(jid)?.count || 0;
  }

  stop() {
    for (const state of this.groups.values()) {
      if (state.timer) clearTimeout(state.timer);
    }
    this.groups.clear();
  }
}
