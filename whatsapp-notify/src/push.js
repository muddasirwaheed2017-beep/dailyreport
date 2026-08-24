// ═══════════════════════════════════════════════════════════════
// PUSH (step 6) — phone notification via Telegram bot and/or Pushover.
// Selected with WA_PUSH_PROVIDER=telegram|pushover|both|none.
// ═══════════════════════════════════════════════════════════════
import { PUSH_PROVIDER, TELEGRAM, PUSHOVER } from './config.js';

let transport = null;

/** Tests inject a stub here; production leaves it alone. */
export function setTransport(fn) {
  transport = fn;
}

async function sendTelegram(text, title) {
  if (!TELEGRAM.botToken || !TELEGRAM.chatId) {
    return { ok: false, provider: 'telegram', error: 'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set' };
  }
  const body = { chat_id: TELEGRAM.chatId, text: title ? `${title}\n${text}` : text, disable_web_page_preview: true };
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    return { ok: false, provider: 'telegram', error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
  }
  return { ok: true, provider: 'telegram' };
}

async function sendPushover(text, title) {
  if (!PUSHOVER.token || !PUSHOVER.user) {
    return { ok: false, provider: 'pushover', error: 'PUSHOVER_TOKEN / PUSHOVER_USER not set' };
  }
  const form = new URLSearchParams({
    token: PUSHOVER.token,
    user: PUSHOVER.user,
    message: text,
    ...(title ? { title } : {})
  });
  const res = await fetch('https://api.pushover.net/1/messages.json', { method: 'POST', body: form });
  if (!res.ok) {
    return { ok: false, provider: 'pushover', error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
  }
  return { ok: true, provider: 'pushover' };
}

/**
 * Send one brief. Returns { ok, results } — ok is true if at least one
 * configured transport accepted it. A push failure never throws: the
 * checkpoint still has to advance, and the brief is on disk in the log.
 */
export async function send(text, { title } = {}) {
  if (transport) return transport(text, { title });

  const provider = PUSH_PROVIDER;
  if (provider === 'none') return { ok: true, results: [{ ok: true, provider: 'none', skipped: true }] };

  const jobs = [];
  if (provider === 'telegram' || provider === 'both') jobs.push(sendTelegram(text, title));
  if (provider === 'pushover' || provider === 'both') jobs.push(sendPushover(text, title));
  if (jobs.length === 0) {
    return { ok: false, results: [{ ok: false, provider, error: `unknown WA_PUSH_PROVIDER "${provider}"` }] };
  }

  const settled = await Promise.allSettled(jobs);
  const results = settled.map((s) =>
    s.status === 'fulfilled' ? s.value : { ok: false, provider, error: s.reason?.message || String(s.reason) });
  return { ok: results.some((r) => r.ok), results };
}
