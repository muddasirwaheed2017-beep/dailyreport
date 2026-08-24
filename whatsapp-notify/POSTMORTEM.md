# wa-notify — build log, mistakes, and what to do differently

Written 2026-08-24, the day this went from empty directory to running. Aimed at
whoever builds the next thing like it — including future me. It is deliberately
blunt about what was wrong, because the wrong turns cost far more time than the
code did.

**Headline:** the code took a couple of hours. Getting WhatsApp to accept a
connection took the rest of the day, and the cause was a **single wrong string**
in my own config — not WhatsApp, not the network, not the library. I had the
evidence in hand three hours before I read it properly.

---

## 1. What was built

A listener that reads two WhatsApp shipping groups, decides whether anything
happened worth knowing, and emails a three-line brief.

```
WhatsApp group message
   │
   ├─1─ append to store/<groupJID>.jsonl        ← capture, unconditional
   ├─2─ past the checkpoint?                    ← if not, stop
   └─3─ buffer                                  ← flush at 90s quiet OR 10 msgs
                │
                ├─ read store from cursor forward
                ├─ drop filler UNLESS media or a freight keyword
                ├─ cheap triage model (only if no media/keyword)
                ├─ claude-sonnet-4-6 writes the brief
                ├─ email it (Gmail SMTP)
                └─ advance the cursor
```

~2,100 lines of source, 421 of tests, 26 tests, no network or credentials
needed to run them.

---

## 2. Three design decisions that paid off

### 2.1 Capture before analysis, always

The append to disk is the *first* thing that happens, synchronously, before the
checkpoint is even read. Analysis can fail, the model can be down, the filter
can be wrong — none of it can lose a message.

This turned out to matter more than expected: when the whole WhatsApp layer was
broken for hours, the value of "nothing is ever dropped" was the only reason a
broken connection wasn't also a data-loss event.

### 2.2 The cursor tracks the machine, not the human

`checkpoint.json` records what *Claude has analysed*, never what the person has
read. Reading ahead in the app must not move it. That meant one hard rule: the
capture path never writes the checkpoint. Only the end of an analysis run, and
the manual `catchup` command, do.

Easy to state, easy to violate accidentally. It's pinned by a test.

### 2.3 Transport-agnostic core

Only `listener.js` and `normalize.js` know what Baileys is. The store,
checkpoint, filter, analysis, push, and CLI sit behind a plain
`{id, ts, sender, text, hasMedia, mediaName}` record.

**This is the single most valuable structural decision.** When it looked like
Baileys might have to be thrown away entirely for a browser-driven library, the
blast radius was two files out of eleven. Everything else was already proven
and would not have changed. Build the doorway as a doorway.

---

## 3. The big one: an entire day lost to a five-character string

### Symptom

```
connected to WA
not logged in, attempting registration...
Error: Connection Terminated          ← ~200ms later
connection closed (428)
```

Forever, on loop. **No QR code ever emitted.** Fresh credentials, normal home
internet, an account in daily use.

### Actual cause

Baileys decides what kind of client to announce itself as from the `browser`
tuple you pass it:

```js
// node_modules/@whiskeysockets/baileys/lib/Utils/validate-connection.js
const PLATFORM_MAP = {
    'Mac OS': proto.ClientPayload.WebInfo.WebSubPlatform.DARWIN,
    Windows:  proto.ClientPayload.WebInfo.WebSubPlatform.WIN32
};
const getWebInfo = (config) => {
    let webSubPlatform = ...WebSubPlatform.WEB_BROWSER;
    if (config.syncFullHistory && PLATFORM_MAP[config.browser[0]]) {
        webSubPlatform = PLATFORM_MAP[config.browser[0]];
    }
    return { webSubPlatform };
};
```

I had set `syncFullHistory: true` and a browser whose `[0]` was `'Mac OS'`. So
every handshake claimed to be **the native macOS desktop app**. WhatsApp refuses
that identity and hangs up before issuing a QR.

The fix is one line:

```js
export const BROWSER = ['Ubuntu', 'Chrome', '22.04.4'];  // absent from PLATFORM_MAP
```

Note the trap within the trap: `Browsers.appropriate('Chrome')` — which looks
like the safe, neutral choice — resolves `[0]` from the **host OS**. On a Mac
that is `'Mac OS'`. So the "sensible default" was also broken, and it was broken
in a way that only reproduces on macOS.

Choosing `Ubuntu` over disabling `syncFullHistory` is deliberate: both dodge the
map, but only one keeps the history backfill the store depends on.

### The evidence I ignored

The very first debug log contained this:

```json
"webInfo":{"webSubPlatform":"DARWIN"}
```

That is the answer, in plain text, hours before I found it. I skimmed the log
for something that looked like an *error* and treated the payload dump as
noise. **The registration payload was the whole story.**

---

## 4. Four wrong assumptions, in the order I made them

Each one cost a round trip, a code change, and the user's patience.

### 4.1 "It's the reconnect storm"

The close handler called `start()` again, which built a new socket while the
dead one kept its listeners. Sockets multiplied ~1/second and process signal
handlers were re-registered each pass (`11 SIGINT listeners added` was the
tell).

**This was a real bug and worth fixing.** It was not the cause. The 428 survived
the fix unchanged.

> **Lesson: finding *a* bug is not finding *the* bug.** A plausible mechanism
> that explains the symptom is not evidence that it *is* the mechanism. After
> fixing it, I should have predicted the outcome explicitly — "if this was the
> cause, the next run shows a QR" — instead of hoping.

### 4.2 "The library must be out of date"

Checked: 6.7.24 *was* the current stable; 7.0.0 was only a release candidate.
Ruled out in two minutes. This one was cheap and correct to check.

### 4.3 "WhatsApp is blocking this account or this network"

Reinforced by a real GitHub issue describing near-identical symptoms and by
research that said upgrading wouldn't help. I concluded the wall was external
and started planning a rewrite onto a browser-driven library.

**Completely wrong.** The account and network were fine the whole time — the
same account linked to `web.whatsapp.com` from a browser without trouble.

> **Lesson: "it's the platform, not me" is the most expensive conclusion
> available, so it needs the strongest evidence.** I reached it on a symptom
> match and a forum thread. What I actually had was: *my client* fails, and I
> had never once tested a *non-my-client* baseline.

### 4.4 "Pairing by code will bypass the QR block"

It won't. Both routes send the same identity in the same handshake before the
paths diverge. It was refused at exactly the same millisecond.

Worse, the first implementation waited 4 seconds to request the code while the
socket died at 0.77s — so it never fired at all, and I reported "pairing code
didn't work" when **it had never been tried**.

> **Lesson: before reporting an experiment failed, verify the experiment ran.**
> Instrument the attempt itself, not just the outcome. My retry loop's error was
> also swallowed by an `isCurrent()` guard, so there was no output at all —
> silence read as a result when it was an absence of one.

---

## 5. The 15-minute test I should have run first

**Open `web.whatsapp.com` in a browser and try to link.**

- Links fine → the account and network are healthy; the problem is *my client*.
- Refuses → the problem is upstream of any code.

One test, two minutes, splits the entire problem space in half. I suggested it
twice and let it get skipped both times, then spent hours on the half it would
have eliminated.

> **Lesson: when stuck, stop fixing and find the cheapest experiment that
> discriminates.** Don't just find *a* test — find the one that halves the
> search space. And when the user skips it, ask again; it was worth more than
> everything I did instead.

---

## 6. Sandbox vs. real machine

I develop in a Linux container; the app runs on the user's Mac. Everything that
went wrong at go-live lived in that gap.

| Thing | Container | User's Mac | Cost |
|---|---|---|---|
| Outbound SMTP (465/587) | **blocked** | fine | couldn't test email at all |
| WhatsApp WebSocket | **blocked** | fine | couldn't reproduce the bug locally |
| Node | 22.22 | **20.11** | two real bugs, one silent |
| `Browsers.appropriate()[0]` | `'Ubuntu'` (fine) | **`'Mac OS'` (broken)** | **the entire outage** |

That last row is the sharp one. The bug was *invisible in my environment by
construction* — the same function returns a safe value on Linux and a
fatal one on macOS.

> **Lesson: enumerate what differs between where you build and where it runs,
> before shipping, not after.** OS, runtime version, network egress. Anything
> that branches on `process.platform` or the host OS is a latent
> environment-specific bug and deserves a test that pins the value, not the
> behaviour.

I did turn each of these into a permanent improvement rather than a one-off fix
— see §8.

---

## 7. Node version bugs (both silent, both nasty)

Target machine was Node **20.11.0**. I'd written for 22.

| API | Needs | On 20.11 | Symptom |
|---|---|---|---|
| `process.loadEnvFile()` | 20.12+ | throws | **`.env` silently not loaded** — every credential reported "unset" despite a perfect file |
| `node --test "glob"` | 21+ | matches nothing | `Could not find 'test/*.test.js'` |

The first was genuinely dangerous: the user had filled in `.env` correctly, and
the tool told them their values were missing. The error was one line of warning
buried under the output. Now there's a built-in fallback parser and it works on
both.

The glob one: **quoted** `"test/*.test.js"` makes *Node* expand it (21+);
**unquoted** makes the *shell* expand it (works everywhere). Prefer the shell.

> **Lesson: pin `engines` to the oldest runtime you actually support, and verify
> every API you use against it** — not against whatever you happen to be running.

---

## 8. What worked, and why

**Tests that need no network or credentials.** The Anthropic client and the push
transport are injectable; both are stubbed. 26 tests run in ~200ms with no keys.
Every single refactor during the WhatsApp firefight was verified in seconds.

**Errors that name the fix, not just the failure.** These were written *because*
each one had already wasted time:

```
GMAIL_APP_PASSWORD is 19 characters — expected a 16-character Google App
Password, not your normal password
Connection timeout (could not reach smtp.gmail.com:465 — is outbound SMTP
blocked on this network?)
cannot send — missing GMAIL_APP_PASSWORD; set it in whatsapp-notify/.env
```

Gmail's own answer to a wrong password is `535`. Ours says which variable, how
long it should be, and where to put it.

**Pinning bugs with tests once found.** The `BROWSER[0]` check is the clearest
case: the failure mode is an infinite loop with no output, and nothing about the
symptom points at a browser string. A future refactor "tidying" that back to
`Browsers.macOS()` would cost another day. The test costs four lines.

**Naming what's being ignored.** A group whose name didn't match was skipped in
silence — indistinguishable from "nothing is arriving". Now it prints every
group on the account and which matched. *Silent skips are invisible bugs;* make
the machine say what it chose not to do.

**Failing fast with a diagnosis.** SMTP with no timeout hangs forever on a
network that drops 465. Now: 20s, then a message naming the likely cause.

---

## 9. Friction that had nothing to do with code

Real time went here. Worth pre-empting.

**New terminal windows start in the home directory.** `npm run test-email` from
`~` fails confusingly. Cost three round trips before I added aliases. Ship the
aliases *first*:

```bash
alias wa='cd ~/dailyreport/whatsapp-notify'
alias wa-start='cd ~/dailyreport/whatsapp-notify && npm start'
alias wa-status='cd ~/dailyreport/whatsapp-notify && npm run status'
```

**`git pull` fails after `npm install <pkg>`** — it edits `package.json` and
`package-lock.json`, and the pull aborts. **The user ran stale code three
separate times without either of us noticing**, once for a full debugging round
where I drew conclusions from output produced by code I'd already fixed.

> **Lesson: when a fix depends on the other machine pulling it, verify the pull
> landed before interpreting anything.** Print a version or a distinctive line
> at startup and check for it. `Updating abc..def` scrolling past is not
> confirmation, and `Already up to date` after a failed merge is actively
> misleading.

**Terminal QR codes frequently won't scan** — density, font, wrapping, contrast.
And WhatsApp rotates the code every ~30s, so a PNG opened in Preview shows a
**dead code with no visible sign it's dead**. The user's phone was reading
expired codes and silently ignoring them. Fixed with a self-refreshing HTML page
showing a code number and timestamp.

> **Lesson: for anything time-limited, display its freshness.** A stale artifact
> that looks identical to a live one is a debugging trap.

---

## 10. Checklist for the next integration

1. **Enumerate build-vs-run differences first.** OS, runtime version, network
   egress. Write them down. Anything branching on host OS is a latent bug.
2. **Turn on the library's own debug logging immediately** — not after three
   guesses. And *read the payload*, not just the error lines. The answer is
   usually in what you're sending.
3. **Establish a non-your-code baseline before blaming the platform.** Official
   client, browser, `curl`. If you have never tested one, you cannot conclude
   "they're blocking me".
4. **When stuck, find the cheapest discriminating experiment** — the one that
   halves the search space — and run it before writing more code.
5. **After fixing a suspected cause, predict the result out loud.** If the
   symptom survives, you fixed something else. Say so plainly and keep going.
6. **Verify your experiment ran before reporting it failed.** Instrument the
   attempt, and never let a guard swallow the diagnostic.
7. **Confirm the other machine pulled your fix** before interpreting its output.
8. **Pin every bug you find with a test**, especially ones whose symptoms point
   somewhere else entirely.
9. **Make the machine announce what it silently skipped.**
10. **Write errors that name the fix.** You are writing them for the person at
    11pm who has already been at it for six hours.

---

## 11. Still open

- `context.json` is empty. Briefs work but stay generic — they can't reference
  A/B/C/PO27 status or known discrepancies until real data is in it.
- Always-on setup (`deploy/install-launchd.sh`) is written but not yet
  installed; the listener currently dies when its Terminal window closes.
- End-to-end live test (a real group message producing a real email) not yet
  confirmed at time of writing.
- `tools/probe-wwebjs.mjs` is kept deliberately: it proved a browser-driven
  fallback pairs successfully, which is the escape hatch if Baileys is blocked
  again.

---

## 12. The one-sentence version

*The bug was one string in my own config; the day was lost to assuming the
platform was at fault before ever testing a client that wasn't mine.*
