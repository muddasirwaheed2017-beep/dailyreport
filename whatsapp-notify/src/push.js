// ═══════════════════════════════════════════════════════════════
// PUSH (step 6) — phone notification via Telegram bot and/or Pushover.
// Selected with WA_PUSH_PROVIDER=telegram|pushover|both|none.
// ═══════════════════════════════════════════════════════════════
import nodemailer from 'nodemailer';
import { PUSH_PROVIDER, PUSH_TRANSPORTS, EMAIL, TELEGRAM, PUSHOVER } from './config.js';

let transport = null;

/** Tests inject a stub here; production leaves it alone. */
export function setTransport(fn) {
  transport = fn;
}

let mailer = null;

function getMailer() {
  if (!mailer) {
    mailer = nodemailer.createTransport({
      host: EMAIL.host,
      port: EMAIL.port,
      secure: EMAIL.secure, // implicit TLS on 465
      auth: { user: EMAIL.user, pass: EMAIL.appPassword },
      // Without these a network that silently drops port 465 (corporate wifi,
      // a sandbox, a hotel captive portal) hangs the send forever and stalls
      // the listener's flush. Fail fast and report instead.
      connectionTimeout: Number(process.env.WA_SMTP_TIMEOUT_MS || 20_000),
      greetingTimeout: Number(process.env.WA_SMTP_TIMEOUT_MS || 20_000),
      socketTimeout: Number(process.env.WA_SMTP_TIMEOUT_MS || 20_000)
    });
  }
  return mailer;
}

/**
 * Subject line: "📦 <shipment/topic> — wa-notify".
 *
 * The topic is the 📦 SUMMARY sentence when the brief has one — that is what
 * is actually readable on a locked iPhone — falling back to the group name.
 */
export function subjectFor(text, title) {
  const summary = String(text || '').match(/📦\s*SUMMARY:\s*(.+)/);
  let topic = (summary?.[1] || title || 'update').trim();
  topic = topic.replace(/^[🚢📦]\s*/, '').replace(/\s+/g, ' ');
  if (topic.length > 70) topic = `${topic.slice(0, 69).trimEnd()}…`;
  return `📦 ${topic} — wa-notify`;
}

function missingEmailConfig() {
  const missing = [];
  if (!EMAIL.user) missing.push('GMAIL_USER');
  if (!EMAIL.appPassword) missing.push('GMAIL_APP_PASSWORD');
  if (!EMAIL.to) missing.push('NOTIFY_EMAIL_TO');
  return missing;
}

async function sendEmail(text, title) {
  const missing = missingEmailConfig();
  if (missing.length) {
    return { ok: false, provider: 'email', error: `${missing.join(' / ')} not set` };
  }
  // A 16-char App Password is the only thing smtp.gmail.com accepts here; a
  // normal account password fails with a confusing 535, so say so up front.
  if (EMAIL.appPassword.length !== 16) {
    return {
      ok: false,
      provider: 'email',
      error: `GMAIL_APP_PASSWORD is ${EMAIL.appPassword.length} characters — expected a 16-character Google App Password, not your normal password`
    };
  }
  try {
    const info = await getMailer().sendMail({
      from: `wa-notify <${EMAIL.user}>`,
      to: EMAIL.to,
      subject: subjectFor(text, title),
      text
    });
    return { ok: true, provider: 'email', messageId: info.messageId, accepted: info.accepted };
  } catch (err) {
    const hint = /invalid login|535/i.test(err.message)
      ? ' (check GMAIL_USER and that GMAIL_APP_PASSWORD is a current App Password)'
      : /timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(err.message)
        ? ` (could not reach ${EMAIL.host}:${EMAIL.port} — is outbound SMTP blocked on this network?)`
        : '';
    return { ok: false, provider: 'email', error: `${err.message}${hint}` };
  }
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

  const wanted = PUSH_TRANSPORTS;
  if (wanted.length === 0 || (wanted.length === 1 && wanted[0] === 'none')) {
    return { ok: true, results: [{ ok: true, provider: 'none', skipped: true }] };
  }

  const jobs = [];
  const unknown = [];
  for (const name of wanted) {
    if (name === 'email') jobs.push(sendEmail(text, title));
    else if (name === 'telegram') jobs.push(sendTelegram(text, title));
    else if (name === 'pushover') jobs.push(sendPushover(text, title));
    else if (name === 'both') { jobs.push(sendTelegram(text, title)); jobs.push(sendPushover(text, title)); }
    else if (name !== 'none') unknown.push(name);
  }
  if (jobs.length === 0) {
    return {
      ok: false,
      results: [{ ok: false, provider: PUSH_PROVIDER, error: `no usable transport in WA_PUSH_PROVIDER="${PUSH_PROVIDER}"` }]
    };
  }

  const settled = await Promise.allSettled(jobs);
  const results = settled.map((s) =>
    s.status === 'fulfilled' ? s.value : { ok: false, provider: PUSH_PROVIDER, error: s.reason?.message || String(s.reason) });
  for (const name of unknown) results.push({ ok: false, provider: name, error: `unknown transport "${name}"` });
  return { ok: results.some((r) => r.ok), results };
}

/** One-shot deliverability check used by `wa-notify test-email`. */
export async function sendTestEmail() {
  return sendEmail(
    [
      '✅ wa-notify email test',
      '',
      'If this reached your iPhone Mail, the push channel is wired correctly.',
      'Real briefs will look like:',
      '',
      '📦 SUMMARY: <one sentence: what just happened>',
      '✅ DO: <the concrete action>',
      '⚠️ CAUTION: <any discrepancy or risk>',
      '',
      `sent ${new Date().toISOString()} from ${EMAIL.host}:${EMAIL.port} as ${EMAIL.user}`
    ].join('\n'),
    '✅ wa-notify email test'
  );
}

/** Config readiness, for the CLI to report without exposing secrets. */
export function emailStatus() {
  return {
    transports: PUSH_TRANSPORTS,
    host: `${EMAIL.host}:${EMAIL.port}`,
    user: EMAIL.user || '(unset)',
    to: EMAIL.to || '(unset)',
    appPassword: EMAIL.appPassword
      ? `set, ${EMAIL.appPassword.length} chars${EMAIL.appPassword.length === 16 ? '' : ' — EXPECTED 16'}`
      : '(unset)',
    missing: missingEmailConfig()
  };
}
