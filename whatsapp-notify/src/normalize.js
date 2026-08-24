// ═══════════════════════════════════════════════════════════════
// Baileys WAMessage -> the flat store record { id, ts, sender, text,
// hasMedia, mediaName }. Kept separate from the socket so it can be tested
// without a WhatsApp connection.
// ═══════════════════════════════════════════════════════════════

const MEDIA_KEYS = [
  'imageMessage', 'videoMessage', 'documentMessage', 'audioMessage',
  'stickerMessage', 'documentWithCaptionMessage'
];

/** Unwrap the ephemeral / view-once / edited envelopes Baileys nests. */
function unwrap(message) {
  let current = message;
  for (let depth = 0; current && depth < 6; depth += 1) {
    const next =
      current.ephemeralMessage?.message ||
      current.viewOnceMessage?.message ||
      current.viewOnceMessageV2?.message ||
      current.viewOnceMessageV2Extension?.message ||
      current.documentWithCaptionMessage?.message ||
      current.editedMessage?.message ||
      current.protocolMessage?.editedMessage;
    if (!next) return current;
    current = next;
  }
  return current;
}

export function extractText(message) {
  const m = unwrap(message) || {};
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    m.reactionMessage?.text ||
    ''
  );
}

export function extractMedia(message) {
  const m = unwrap(message) || {};
  const key = MEDIA_KEYS.find((k) => m[k]);
  if (!key) return { hasMedia: false, mediaName: null };

  const node = m[key];
  const name =
    node.fileName ||
    node.title ||
    (node.mimetype ? `${key.replace('Message', '')}.${node.mimetype.split('/')[1] || 'bin'}` : key.replace('Message', ''));
  return { hasMedia: true, mediaName: name };
}

/**
 * @param {object} waMessage a Baileys WAMessage
 * @returns {{id, ts, sender, text, hasMedia, mediaName}|null} null for
 *          messages with no id or no content at all (e.g. protocol receipts)
 */
export function normalize(waMessage) {
  const key = waMessage?.key;
  if (!key?.id) return null;
  if (!waMessage.message) return null;

  const rawTs = waMessage.messageTimestamp;
  const seconds = typeof rawTs === 'object' && rawTs !== null && 'low' in rawTs
    ? Number(rawTs.low)
    : Number(rawTs);
  const ts = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : Date.now();

  const { hasMedia, mediaName } = extractMedia(waMessage.message);
  const text = extractText(waMessage.message);

  // Nothing to record: no text, no attachment.
  if (!text && !hasMedia) return null;

  return {
    id: key.id,
    ts,
    // pushName is what the brief needs ("Shahid said..."); the participant
    // JID is the fallback when WhatsApp does not send a display name.
    sender: waMessage.pushName || key.participant || key.remoteJid || 'unknown',
    text,
    hasMedia,
    mediaName
  };
}

export function groupJidOf(waMessage) {
  const jid = waMessage?.key?.remoteJid;
  return jid && jid.endsWith('@g.us') ? jid : null;
}
