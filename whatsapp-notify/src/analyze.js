// ═══════════════════════════════════════════════════════════════
// ANALYSE (step 5) — Anthropic Messages API.
//   triage() runs the cheap model over batches with no media and no keyword
//   hit; brief() runs the freight co-pilot spec over everything that survives.
// ═══════════════════════════════════════════════════════════════
import Anthropic from '@anthropic-ai/sdk';
import { MODELS, SYSTEM_PROMPT, TRIAGE_PROMPT } from './config.js';

let client = null;

/** Tests inject a stub here; production leaves it alone. */
export function setClient(instance) {
  client = instance;
}

function getClient() {
  // Credentials resolve from the environment (ANTHROPIC_API_KEY,
  // ANTHROPIC_AUTH_TOKEN, or an `ant auth login` profile).
  if (!client) client = new Anthropic();
  return client;
}

function textOf(response) {
  return (response.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

/**
 * The brief is delivered as plain-text email, where markdown is not rendered —
 * "**SUMMARY:**" arrives on the phone with the asterisks visible. The model
 * adds them anyway, so strip them rather than editing the agreed system prompt.
 */
export function stripMarkdown(text) {
  return String(text || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold**
    .replace(/__(.+?)__/g, '$1')       // __bold__
    .replace(/(^|\s)\*(\S(?:.*?\S)?)\*(?=\s|$)/g, '$1$2') // *italic*
    .replace(/^#{1,6}\s+/gm, '')       // # headings
    .replace(/[ \t]+$/gm, '')          // trailing spaces
    .replace(/\n{3,}/g, '\n\n')        // collapse big gaps
    .trim();
}

/** Render a batch the way the model sees it. */
export function renderMessages(batch) {
  return batch
    .map((m) => {
      const when = m.ts ? new Date(m.ts).toISOString() : 'unknown time';
      const who = m.sender || 'unknown';
      const attachment = m.hasMedia ? ` [attachment: ${m.mediaName || 'file'}]` : '';
      const body = String(m.text || '').trim() || (m.hasMedia ? '(no caption)' : '(empty)');
      return `[${when}] ${who}: ${body}${attachment}`;
    })
    .join('\n');
}

// The SDK already retries 408/409/429/5xx twice. We only add a label so the
// caller can tell "the model said nothing" apart from "the call never landed".
function describe(err) {
  if (err instanceof Anthropic.NotFoundError) return `bad model id or endpoint (404): ${err.message}`;
  if (err instanceof Anthropic.RateLimitError) return `rate limited (429): ${err.message}`;
  if (err instanceof Anthropic.APIConnectionError) return `could not reach the API: ${err.message}`;
  if (err instanceof Anthropic.APIError) return `API error ${err.status ?? '?'}: ${err.message}`;
  return err.message;
}

/**
 * Cheap triage: is there anything here worth a notification at all?
 * Fails open (PUSH) so a triage outage can never swallow a real update.
 */
export async function triage(batch) {
  try {
    const response = await getClient().messages.create({
      model: MODELS.triage,
      max_tokens: 64,
      system: TRIAGE_PROMPT,
      messages: [{ role: 'user', content: `MESSAGES:\n${renderMessages(batch)}` }]
    });
    const verdict = textOf(response).toUpperCase();
    return { push: !verdict.startsWith('SKIP'), verdict, error: null };
  } catch (err) {
    return { push: true, verdict: null, error: describe(err) };
  }
}

/**
 * The brief itself. Returns { text, skip, error }.
 * `skip` is true when Claude replied 'skip' — nothing gets pushed, but the
 * caller still advances the checkpoint.
 */
export async function brief(contextJson, batch) {
  const content = [
    'CONTEXT (current shipment status and open discrepancies):',
    JSON.stringify(contextJson, null, 2),
    '',
    'MESSAGES (latest WhatsApp traffic):',
    renderMessages(batch)
  ].join('\n');

  try {
    const response = await getClient().messages.create({
      model: MODELS.brief,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }]
    });
    const text = stripMarkdown(textOf(response));
    return { text, skip: /^['"`]?skip['"`.]?$/i.test(text), error: null };
  } catch (err) {
    return { text: '', skip: false, error: describe(err) };
  }
}
