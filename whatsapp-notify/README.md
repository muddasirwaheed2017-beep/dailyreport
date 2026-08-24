# WhatsApp Smart Notify (with checkpoint)

A Baileys listener for the two shipping groups — **CNC Shipments** and
**CNC Import matters**. It captures every message to disk
before doing anything else, tracks a per-group cursor of what *Claude* has
analysed, and pushes a short freight brief to your phone when something
actually happens.

**Invoice and payment groups are deliberately NOT watched.** That traffic stays
on the existing Meta-API route in `../whatsapp-webhook-v1.js`, which this module
does not touch. `INVOICE_GROUP_PATTERNS` is empty on purpose — a group is watched
only if it matches `WATCHED_GROUPS` in `src/config.js`.

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

Requires Node 20 or newer (tested on 20.11 and 22). No Node feature newer
than 20.0 is relied on: `.env` loading uses `process.loadEnvFile` where it
exists (Node 20.12+) and a built-in parser otherwise.

```bash
cd whatsapp-notify
npm install
chmod +x src/cli.js
cp .env.example .env      # fill in the values below
npm test                  # expect 24/24 before going further
npm run test-email        # prove email works BEFORE pairing WhatsApp
npm start                 # scan the QR with WhatsApp > Linked Devices
```

The QR only appears on first run; the pairing is stored in `auth/`.

## Email push (Gmail SMTP)

Briefs are delivered by email. `.env` (gitignored) needs:

| Variable | What it is |
|---|---|
| `WA_PUSH_PROVIDER` | `email` (comma-separated list; `email,telegram` also works) |
| `GMAIL_USER` | the sending Gmail address |
| `GMAIL_APP_PASSWORD` | **16-character Google App Password**, not your normal password |
| `NOTIFY_EMAIL_TO` | where briefs are delivered |
| `ANTHROPIC_API_KEY` | for the brief itself |

Getting the App Password: Google Account -> Security -> 2-Step Verification
(must be ON) -> App passwords -> generate. It is 16 characters; spaces are
stripped automatically. `wa-notify test-email` refuses to send and says so if
the value is not 16 characters, because Gmail's own error for a normal password
is an unhelpful `535`.

Mail goes over implicit TLS to `smtp.gmail.com:465`. Subject lines are
"📦 <the SUMMARY sentence> — wa-notify" so the brief is readable on a
locked phone; the body is the full brief. SMTP calls time out after 20s
(`WA_SMTP_TIMEOUT_MS`) so a network that blocks port 465 fails fast with a clear
message instead of stalling the listener.

## Seeding

`checkpoint.json` is created on first run from `src/config.js`:

| Group | Seeded to |
|---|---|
| CNC Shipments | `2026-08-21T23:59:59+05:00` — *"OLD SHIPMENT TRACKING"* (Ahmed, image) |
| CNC Import matters | `2026-08-23T00:00:00+05:00` — *"I'll share first thing tomorrow"* (Shahid) |

> **CNC Import matters is seeded to the START of 23 Aug on purpose.** It
> guarantees nothing after Shahid's "first thing tomorrow" line is skipped;
> re-analysing that short exchange once is the accepted cost. Override either
> with `WA_SEED_CNC_SHIPMENTS` / `WA_SEED_CNC_IMPORT_MATTERS`.

Any watched group without a seed falls back to a once-stamped deployment
timestamp in `checkpoint._meta.deployed_at`. Both current groups have explicit
seeds, so that path is only a safety net.

## Commands

```bash
wa-notify listen                          # run the listener
wa-notify status                          # cursors + how much is unanalysed
wa-notify groups                          # watch scope + JID <-> name registry
wa-notify test-email                      # one-shot email deliverability check
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
| `src/push.js` | email (Gmail SMTP) / Telegram / Pushover transports |
| `src/pipeline.js` | one analysis run, start to finish |
| `src/cli.js` | `listen` / `catchup` / `import` / `status` / `groups` / `test-email` |

## Running it persistently (macOS)

The listener must stay running and the Mac must not sleep. `caffeinate -is`
holds the system awake for exactly as long as the listener lives.

**Quick, for one session** (dies when the terminal closes):

```bash
cd whatsapp-notify && caffeinate -is npm start
```

**Permanent** — a launchd agent that starts at login and restarts on crash:

```bash
bash deploy/install-launchd.sh
```

**Is it still alive?**

```bash
launchctl list | grep wa-notify            # PID and last exit code (0 = healthy)
npm run status                             # cursors + how much is unanalysed
tail -f logs/listener.out.log              # live connection log
tail -5 logs/pushes.jsonl                  # what was actually delivered
pmset -g assertions | grep -i caffeinate   # confirm sleep is being held off
```

A missing PID in `launchctl list`, or a `status` whose `unanalysed` count keeps
climbing, both mean it is not processing. Stop it with
`launchctl unload -w ~/Library/LaunchAgents/com.maliksons.wa-notify.plist`.

## Tests

```bash
npm test
```

24 tests covering capture and de-duplication, the watch scope (invoice groups
must stay unwatched), the seeding rules, read-ahead not moving the cursor, the
filler gate, all five pipeline outcomes, the email subject line, the flush
triggers, Baileys message normalisation, and the catch-up round trip. The
Anthropic client and the push transport are stubbed, so no network or
credentials are needed.
