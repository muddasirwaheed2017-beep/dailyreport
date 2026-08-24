# WhatsApp Smart Notify (with checkpoint)

A Baileys listener for the shipping groups (**CNC Shipments**, **CNC Import
matters**) and the invoice/payment groups. It captures every message to disk
before doing anything else, tracks a per-group cursor of what *Claude* has
analysed, and pushes a short freight brief to your phone when something
actually happens.

The existing Meta-API invoice routing in `../whatsapp-webhook-v1.js` is
untouched — this module is additive and runs alongside it.

## The three guarantees

1. **Nothing is lost.** Every incoming message is appended to
   `store/<groupJID>.jsonl` immediately and unfiltered, before any analysis
   decides anything. Baileys' offline history sync writes to the same files, so
   a reconnect backfills rather than skips.
2. **Nothing is analysed twice.** `checkpoint.json` holds
   `<groupJID> -> last_analyzed {id, ts, text}`. Runs read only messages
   strictly after that cursor.
3. **The cursor is Claude's, not yours.** Reading ahead in the WhatsApp app
   never moves it. The only writers are the end of an analysis run and the
   manual `catchup` command.

## Flow

```
message arrives
   └─> 1. append to store/<groupJID>.jsonl        ← capture, unconditional
       2. is it past the checkpoint?              ← if not, stop
       3. buffer it                               ← flush after 90s quiet, or 10 queued

on flush
   └─> read store from the cursor forward
       drop pure filler …unless the batch has media or a freight keyword
       ├─ nothing left        → no push, cursor still advances past the filler
       ├─ no media/keyword    → haiku triage; SKIP → no push, cursor advances
       └─ otherwise           → claude-sonnet-4-6 brief
                                 'skip'    → no push, cursor advances
                                 a brief   → push, log, cursor advances
                                 API error → nothing advances, retried next run
```

An API failure is the one case where the cursor is **held** — the batch was
never analysed, so it must stay unread.

## Setup

```bash
cd whatsapp-notify
npm install
cp .env.example .env      # fill in ANTHROPIC_API_KEY + your push transport
npm start                 # scan the QR with WhatsApp > Linked devices
```

The QR only appears on first run; the pairing is stored in `auth/`.

## Seeding

`checkpoint.json` is created on first run from `src/config.js`:

| Group | Seeded to |
|---|---|
| CNC Import matters | 2026-08-23 — *"I'll share first thing tomorrow"* (Shahid) |
| CNC Shipments | 2026-08-21 — *"OLD SHIPMENT TRACKING"* (Ahmed, image) |
| invoice / payment groups | the deployment timestamp (start fresh) |

> The two shipping seeds are dated to the **day**, not the minute, so they are
> anchored to the last instant of that day in Asia/Karachi
> (`2026-08-21T23:59:59+05:00`). That guarantees nothing already read is
> replayed. If a message later on that same day still needs analysing, set the
> exact time instead: `WA_SEED_CNC_SHIPMENTS=2026-08-21T17:40:00+05:00`.

The deployment timestamp is stamped once, into `checkpoint._meta.deployed_at`,
so an invoice group first seen weeks later still seeds to the original deploy
instant rather than to the moment it was discovered.

## Commands

```bash
wa-notify listen                          # run the listener
wa-notify status                          # cursors + how much is unanalysed
wa-notify groups                          # JID <-> name registry
wa-notify catchup <groupName> [--from TS] # re-run analysis from a point in time
wa-notify import <groupName> <file.jsonl> # merge pasted messages into the store
```

### Manual catch-up

For the edge case where the listener was down long enough that WhatsApp did
**not** backfill:

```bash
# 1. Paste what was missed into a JSONL file — ts, sender, text are enough
cat > missed.jsonl <<'J'
{"ts":"2026-08-22T11:00:00+05:00","sender":"Qasim","text":"Vessel rolled, new ETD 26 Aug"}
{"ts":"2026-08-22T14:20:00+05:00","sender":"Qasim","text":"draft B/L attached","hasMedia":true,"mediaName":"BL-DRAFT.pdf"}
J

# 2. Merge it into the store (de-duplicated, so re-running is harmless)
wa-notify import "CNC Shipments" missed.jsonl

# 3. Re-point the cursor behind the gap and analyse
wa-notify catchup "CNC Shipments" --from "2026-08-22T00:00:00+05:00"
```

`--from` is the only operation allowed to move a cursor **backwards**. Add
`--dry-run` to see the batch size without pushing or moving anything. Group
names match case-insensitively on a substring, so `catchup shipments` works.

## Relevance gate

Filler (one-word acks, bare `@mentions`, emoji-only) is dropped from a batch —
**unless** the batch carries a document/image or hits any of:

`ETD · ETA · vessel · container · B/L · invoice · PI · PL · FTA · price · rate ·
payment · NTN · roll · delay · typhoon · KICT · SAPT · demurrage`

in which case the whole batch goes through intact, because the "ok" right after
a B/L photo is context worth keeping.

## Files

| Path | What it holds |
|---|---|
| `store/<groupJID>.jsonl` | every captured message: `{id, ts, sender, text, hasMedia, mediaName}` |
| `checkpoint.json` | `<groupJID> -> last_analyzed {id, ts, text}` |
| `context.json` | current A/B/C/PO27 status, open discrepancies, last ~30 briefs |
| `groups.json` | group JID ↔ name registry (learned as groups are seen) |
| `logs/pushes.jsonl` | one line per run: pushed, skipped, filler, or error |
| `auth/` | Baileys pairing credentials |

All of these are runtime state and are gitignored. Edit `context.json`'s
`shipments` and `open_discrepancies` by hand to give Claude the current picture;
`recent_briefs` is maintained automatically.

## Source layout

| Module | Responsibility |
|---|---|
| `src/listener.js` | Baileys socket, live capture, history sync, startup sweep |
| `src/store.js` | the JSONL capture store |
| `src/checkpoint.js` | cursors: seed, advance, re-point |
| `src/buffer.js` | the 90s-quiet / 10-message flush scheduler |
| `src/filter.js` | filler drop + keyword/media gate |
| `src/analyze.js` | the two Anthropic calls |
| `src/push.js` | Telegram / Pushover transports |
| `src/pipeline.js` | one analysis run, start to finish |
| `src/cli.js` | `listen` / `catchup` / `import` / `status` / `groups` |

## Tests

```bash
npm test
```

22 tests covering capture and de-duplication, the seeding rules, read-ahead not
moving the cursor, the filler gate, all five pipeline outcomes, the flush
triggers, Baileys message normalisation, and the catch-up round trip. The
Anthropic client and the push transport are stubbed, so no network or
credentials are needed.
