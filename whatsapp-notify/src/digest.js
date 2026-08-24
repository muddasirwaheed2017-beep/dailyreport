// ═══════════════════════════════════════════════════════════════
// On-demand daily digest.
//
// Deliberately separate from the alert pipeline: this is a report, not an
// analysis run. It reads the store for a calendar day and NEVER touches the
// checkpoint — asking for a recap must not change what the alerting side
// considers unread, or a digest would silently suppress the next real brief.
// ═══════════════════════════════════════════════════════════════
import Anthropic from '@anthropic-ai/sdk';
import { MODELS, TZ_OFFSET } from './config.js';
import * as store from './store.js';
import * as registry from './registry.js';
import { renderMessages } from './analyze.js';
import { getClientForDigest } from './analyze.js';

export const DIGEST_SYSTEM = `You are a freight co-pilot for a Pakistani importer (Malik Sons / Cognitive Solutions) buying electrical & auto parts from China (supplier CNC / Zhejiang Changcheng) via forwarder Qasim, shipping Ningbo->Karachi.

Summarise ONE day of WhatsApp traffic from ONE group, for someone who was not reading it.

Format exactly:

📋 WHAT HAPPENED
<2-4 sentences of plain narrative — the actual events of the day, in order>

🔑 KEY POINTS
• <specifics: dates, PO/PI/BL numbers, amounts, vessel names, document filenames>

✅ DECISIONS / AGREED
• <what was settled, and by whom>

📌 OPEN — NEEDS ACTION
• <who owes what to whom, and by when if stated>

⚠️ RISKS & DISCREPANCIES
• <mismatches, delays, errors, anything that could cost money — omit this whole section if genuinely none>

Rules: be concrete, always prefer names/numbers/dates over generalities. Skip greetings, acknowledgements and chit-chat entirely. Do not invent anything not in the messages. If a section has nothing, omit that section's heading rather than writing "none". If the whole day had no substantive business content, reply with exactly one line saying so.`;

/** Start and end of a local calendar day, as epoch ms. */
export function dayBounds(dateStr, tzOffset = TZ_OFFSET) {
  const start = Date.parse(`${dateStr}T00:00:00.000${tzOffset}`);
  const end = Date.parse(`${dateStr}T23:59:59.999${tzOffset}`);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new Error(`Cannot parse date "${dateStr}" with offset "${tzOffset}"`);
  }
  return { start, end };
}

/** Today's date in the configured timezone, as YYYY-MM-DD. */
export function todayLocal(tzOffset = TZ_OFFSET, now = Date.now()) {
  const sign = tzOffset.startsWith('-') ? -1 : 1;
  const [h, m] = tzOffset.slice(1).split(':').map(Number);
  const shifted = new Date(now + sign * ((h * 60 + m) * 60_000));
  return shifted.toISOString().slice(0, 10);
}

/** Every captured message for a group within one local day. */
export function messagesForDay(jid, dateStr, tzOffset = TZ_OFFSET) {
  const { start, end } = dayBounds(dateStr, tzOffset);
  return store.readMessages(jid).filter((m) => m.ts >= start && m.ts <= end);
}

/**
 * Build the digest for one group and one day.
 * Returns { group, date, count, text, empty }.
 */
export async function buildDigest(jid, dateStr, { client } = {}) {
  const entry = registry.entryFor(jid);
  const label = entry?.name || jid;
  const messages = messagesForDay(jid, dateStr);

  if (messages.length === 0) {
    return { group: label, date: dateStr, count: 0, text: null, empty: true };
  }

  const anthropic = client || getClientForDigest();
  const response = await anthropic.messages.create({
    model: MODELS.brief,
    max_tokens: 4096,
    system: DIGEST_SYSTEM,
    messages: [{
      role: 'user',
      content: `GROUP: ${label}\nDATE: ${dateStr}\nMESSAGES (${messages.length}):\n\n${renderMessages(messages)}`
    }]
  });

  const text = (response.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  return { group: label, date: dateStr, count: messages.length, text, empty: false };
}
