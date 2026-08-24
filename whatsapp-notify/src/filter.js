// ═══════════════════════════════════════════════════════════════
// Relevance gate (step 4).
// Pure filler is dropped from a batch — UNLESS the batch carries a
// document/image or hits any freight keyword, in which case the whole batch
// goes through untouched (the "ok" right after a B/L photo is context).
// ═══════════════════════════════════════════════════════════════
import { KEYWORDS, FILLER_WORDS } from './config.js';

const FILLER_SET = new Set(FILLER_WORDS.map((w) => w.toLowerCase()));

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// \b does not fire next to "/", so "B/L" needs its own boundary handling.
const KEYWORD_PATTERNS = KEYWORDS.map((word) => {
  const body = escapeRe(word);
  const left = /^[A-Za-z0-9]/.test(word) ? '(?<![A-Za-z0-9])' : '';
  const right = /[A-Za-z0-9]$/.test(word) ? '(?![A-Za-z0-9])' : '';
  return { word, re: new RegExp(`${left}${body}${right}`, 'i') };
});

/** Which freight keywords appear in a piece of text. */
export function keywordsIn(text) {
  const s = String(text || '');
  return KEYWORD_PATTERNS.filter(({ re }) => re.test(s)).map(({ word }) => word);
}

const EMOJI_ONLY = /^[\p{Extended_Pictographic}\p{Emoji_Component}\s‍]+$/u;

/**
 * Is this message pure filler on its own?
 * One-word acks, bare @mentions, emoji-only reactions, and empty text with
 * no attachment all qualify.
 */
export function isFiller(message) {
  if (message.hasMedia) return false;

  const raw = String(message.text || '').trim();
  if (!raw) return true;

  // Strip @mentions — what is left is the actual content.
  const withoutMentions = raw.replace(/@[\w+\d]+/g, ' ').trim();
  if (!withoutMentions) return true; // bare @mention

  if (keywordsIn(withoutMentions).length > 0) return false;
  if (EMOJI_ONLY.test(withoutMentions)) return true;

  const words = withoutMentions
    .replace(/[.!?,:;…]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return true;
  if (words.length > 2) return false;

  // One or two words, and all of them are acknowledgements ("ok done").
  return words.every((w) => FILLER_SET.has(w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')));
}

/**
 * Apply the gate to a batch.
 *
 * Returns { messages, kept, dropped, hasMedia, keywords, forced } where
 * `messages` is what analysis should see and `forced` records that the batch
 * bypassed filler-dropping because of media or a keyword hit.
 */
export function gate(batch) {
  const hasMedia = batch.some((m) => m.hasMedia);
  const keywords = [...new Set(batch.flatMap((m) => keywordsIn(m.text)))];
  const forced = hasMedia || keywords.length > 0;

  const messages = forced ? batch.slice() : batch.filter((m) => !isFiller(m));

  return {
    messages,
    kept: messages.length,
    dropped: batch.length - messages.length,
    hasMedia,
    keywords,
    forced
  };
}
