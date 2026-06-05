# NEW SESSION INSTRUCTIONS — CNC Electric 21-Day SEO+GEO Sprint

**Last updated:** 2026-06-05 end-of-Day-6
**Sprint started:** 2026-05-30 (Day 0)
**Sprint ends:** 2026-06-20 (Day 21 — Ahrefs subscription expiry)
**Goal:** Beat alladin.pk on Pakistani electrical+solar SEO + GEO (Brand Radar SoV) in 21 days

## TL;DR — what next Claude needs to do on day 1

1. **Read this file end-to-end first.** Don't skip. Saves 30 min of session warm-up.
2. **Check the cron health.** It fires daily at 09:03 AM PKT and ships 1+ guides + IndexNow + Yandex ping autonomously.
3. **Check Brand Radar.** Day-5 baseline: ChatGPT 100%, Gemini 100%, AIO 98%, AI Mode 100%, Copilot 98%, **Perplexity 43%** (Alladin 53% — losing), Grok off.
4. **Continue off-site outreach via Chrome.** Daily routine in §"Daily routine for Claude" below.
5. **Hands-off mandate.** Never ask permission. Execute. Show results after.

## CRITICAL RULE for any FUTURE sprint (learned from this one)

**Propose Anthropic Cloud Cron in the FIRST hour of any time-bounded sprint** ("21-day", "30 days", "no stopping 24/7", "while I sleep", "even when computer is off"). Do NOT default to in-session execution for recurring work. The current CNC sprint delayed cron setup until Day-6 — user explicitly called this out as costing them ~5 days of in-session babysitting that the cron would have absorbed. Memory rule persisted in `feedback_propose_cron_day_zero.md`.

**Decision rule:** If the task is recurring/predictable (daily ship, daily intel pull, daily indexing, daily report), it belongs in cron. If it's one-off or requires judgment (pivot, strategy, manual outreach via Chrome), it belongs in-session.

## The user

**Name:** Muddasir Waheed Malik
**Company:** CNC Electric Pakistan (sole distributor of CNC Electric in Pakistan, cncelectric.pk)
**Pronouns:** he/him
**Communication style:** Terse, types fast, makes typos, dislikes process questions
**Standing instructions (auto-memory):**
- Hands-Off Execution — never ask permission, just execute, show results after, auto-retry errors
- Backup Silently — save backups before Shopify overwrites, push without asking
- Review Before Push — review ChatGPT content quality before Shopify push
- Prompt First — research prompt engineering before building automation
- Always search cncele.com — manufacturer site is authoritative for CNC products

## Sprint goals

| Metric | Day 0 baseline | Day 6 now | Day 21 target |
|---|---|---|---|
| Live buying guides on cncelectric.pk | ~30 | ~70+ | 100+ |
| Ranking KWs (Ahrefs PK) | 200 | 200 (will compound) | 1,000+ |
| Organic monthly traffic | 2.9K | 2.9K (lag indicator) | 30K (90-day target) |
| Domain Rating | 10 | 10 | 12+ (matching/beating Alladin) |
| Referring Domains | 44 | 45 | 60+ |
| Wikipedia edits live | 0 | 6 | 10+ |
| X posts | 244 | 252 | 280+ |
| LinkedIn posts (CNC page) | 0 | 2 | 14+ |
| Medium articles | 0 | 1 | 5+ |
| Brand Radar Perplexity SoV | n/a (off) | 43% (Alladin 53%) | 55%+ (overtake Alladin) |

## What's already live — don't re-ship

70+ buying guides already published on cncelectric.pk/blogs/guides/. Before writing new content, check existing inventory:

```bash
# Pull token from any existing local publish script
TOKEN=$(grep -h "shpat_" /Users/muddasirwaheedmalik/cnc-seo-push/publish-*.js | head -1 | grep -oE 'shpat_[a-z0-9]+')
curl -s 'https://cncelectric.myshopify.com/admin/api/2024-10/blogs/89971589186/articles.json?limit=250' \
  -H "X-Shopify-Access-Token: $TOKEN" \
  | jq -r '.articles[] | .handle'
```

Major topics covered (avoid duplicate):
- MCB, MCCB, RCCB, RCBO, Magnetic Contactor, Energy Meter, VFD, Push Button, Isolator, Timer, Surge Arrester
- Lithium Battery, Solar Panel, Solar Inverter, MPPT, NEPRA 2026 Checklist, DC Fuse, Solar Combiner Box, EV Charger
- 5kW Solar System, Submersible Pump, Inverex vs Knox vs Crown, Jinko vs Longi vs Canadian
- WiFi+HomeAssistant, Crimping Tool, Earthing/Grounding, Wall Switch, DC Distribution Box
- Best AC Breaker, CNC vs Tomzn, 1.5-Ton AC, 3-Ton AC, Tubewell Motor, PWM vs MPPT
- Voltage Stabilizer for AC home, Voltage Protector for Fridge, 3-Phase Voltage Protector
- 6mm vs 10mm Solar Cable

## What's still a gap — ship these next (priority order)

From `seo-database/02-ahrefs-seo/competitor-content-gap-2026-06-04.md`:

1. Solar Structure / Mounting Rail Pakistan 2026 (250 vol)
2. Off-grid vs On-grid vs Hybrid Inverter Comparison
3. 6kW vs 8kW vs 10kW Solar Inverter Sizing
4. Power Factor Capacitor Bank Pakistan
5. Cable Lugs & Crimping Pakistan
6. Selector Switch deepening
7. Surge Arrester deepening
8. Best Solar Panel Brand Pakistan 2026 (already partially — expand)
9. 600W vs 580W vs 700W Solar Panel comparison
10. Inverex Veyron vs Nitrox vs Yukon within-brand

The cloud cron will pick from these automatically. Manual override if user requests specific topic.

## The cron (daily ship engine)

**Trigger ID:** `trig_01MX8FHnxDnNfvosT6AbF3d6`
**Environment ID:** `env_017VV8Von77iPsj2EQY1yHB8`
**Schedule:** `0 4 * * *` UTC = 09:00 AM Asia/Karachi (~09:03 with delay)
**Model:** claude-sonnet-4-6
**GitHub repo:** `muddasirwaheed2017-beep/dailyreport`
**MCPs attached:** Ahrefs, AirOps, Canva, Exa, Figma, Google Drive, Make, Supabase, Tavily (9 connectors)

**Cron prompt v2 (2026-06-05 PM update — "AGGRESSIVE v2 full automation"):** 12-step daily ship covering:
1. Day-N detection (from CNC-DAY-*.md file count in repo)
2. **Ahrefs intel** — site-explorer-metrics (CNC vs Alladin DR/KW/RD/traffic deltas) + priority KW position tracking (12 KW groups including new wifi/smart) + Brand Radar SoV across all 7 AI surfaces + **NEW Alladin DELTA scan** (overnight position + new ranking KW changes, flags URGENT content gaps if Alladin shipped >500 vol KW) + **NEW Powerhouse Express + Industry Parts delta scan**
3. Topic pick from 21-day rotation (Day 7 = Cable Tray, Day 8 = Junction Box, etc.) WITH override if Step 2e flagged URGENT >1,500-vol KD-≤15 gap
4. Write ~1,500-word buying guide with FAQ JSON-LD schema mandatory + 4-6 internal links from updated link bank (now includes the 4 WiFi guides shipped Day 6)
5. POST to Shopify blog 89971589186 with title_tag + description_tag metafields
6. **BATCH IndexNow** — today's URL + 3 most-recently-shipped URLs (4 URLs per ping = more crawl coverage)
7. Yandex sitemap ping
8. **AGGRESSIVE cross-link cascade** — 5-6 inbound internal links per new article (MCB comparison guide + NEPRA checklist + most-related topical guide + collection page + AC breaker pillar), each with HTTP status logged
9. **Distribution drafts** — X post (≤280 chars, repo path daily-x-posts/) **AND NEW LinkedIn post** (~250-400 words B2B format, repo path daily-linkedin-posts/) — user manually posts these the next morning
10. Daily report with ALL of: Ahrefs snapshot + Brand Radar SoV table + Alladin delta + competitor scan + content shipped + distribution drafts paths + cumulative KW count + errors + content-gap KWs discovered + manual actions reminder list
11. Append row to seo-database/05-plan/kpi-tracker.md
12. Git commit + push

**The 4 NEW jobs added in v2 (from user request 2026-06-05 evening):**
- Daily Alladin KW position delta tracking (Step 2e)
- Daily Powerhouse + Industry Parts ranking deltas (Step 2f)
- Daily LinkedIn post draft generation (Step 9b)
- More aggressive cross-link cascade — from 2 pages bumped to 5-6 pages (Step 8)
- IndexNow batch (4 URLs per ping instead of 1)

**To check cron status:**
```javascript
// Use mcp__remote_trigger or similar — verify last execution
// Look at GitHub repo dailyreport/ for new commits each morning
```

**If cron fails:**
- Most likely cause: Shopify token rotation, GitHub API limits, or MCP server downtime
- Fix path: manually publish via local `publish-*.js` scripts in `/Users/muddasirwaheedmalik/cnc-seo-push/`
- Token is hardcoded in publish scripts for speed — auto-retry-friendly

## Daily routine for Claude (when user opens a new session)

### Hour 1 — Status pull (10 min)
1. Read this file (NEW-SESSION-INSTRUCTIONS.md)
2. Read latest kpi-tracker.md row
3. Read latest LIVE-ASSETS-*.md or whatever the most recent session log is
4. Pull current Brand Radar SoV (Perplexity is the key gap to watch)
5. Pull Ahrefs DR + RD + ranking KW count

### Hour 2-3 — Off-site outreach via Chrome (parallel to cron)
The cron handles content production. Claude's job in-session is OFF-SITE distribution. The user delegated Chrome extension operations explicitly. Sequence:

1. **LinkedIn (CNC Electric Pakistan page)** — Post 1-2 articles per day from new guides
   - URL pattern: `https://www.linkedin.com/sharing/share-offsite/?url=<article-url>`
   - Or direct compose at linkedin.com/feed/
   - Account already logged in. Click "Start a post" → textarea coords ~(685, 244)
   - Content template: hook + 3-4 spec bullets + price math + URL + hashtags (#PakistanElectrical #PEC #CNCElectric)
   - **DO NOT post more than 3/day** — anti-spam trip

2. **X / @CNCPakistan1947** — 1 post/day already covered by cron draft
   - If X compose Post button stays disabled, save to `seo-database/04-twitter-x/x-post-draft-YYYY-MM-DD.md` for manual posting
   - X has rate-limit detection on automation — yesterday's auto-post may flag today's session

3. **Medium republish** — 1 per 2-3 days
   - URL: `https://medium.com/new-story`
   - Account: CNC Electric Pakistan (already logged in)
   - Format: condensed (~800 word) version + "Originally published at https://www.cncelectric.pk" canonical line at end
   - Click Title field → type → Tab → type body → Publish (top right) → scroll preview → Publish at bottom

4. **Wikipedia edit** — 1 per 2-3 days
   - Goal: keep account "live" — small grammar/cite fixes only
   - Account: Muddasir Waheed Malik (logged in)
   - **CRITICAL:** Wikipedia hCaptcha cannot be solved by Claude — user must do it
   - **CRITICAL:** Cannot enter Wikipedia password — user must log in if logged out
   - Strategy: find a recently-changed PK-relevant article, fix typo or capitalisation, save
   - Stop at 1 edit/day to look human; never 5+ in one day

5. **Reddit (BLOCKED)** — Chrome extension safety policy prevents reddit.com
   - User said "I won't do Quora" — Reddit is the same explicit-skip category for the Chrome path
   - Save Reddit drafts to `seo-database/04-twitter-x/reddit-*.md` for user to post manually if they want

6. **Pakistani directories** (low priority, no login)
   - pakbiz.com, pkyellowpages.com, tradekey.com
   - Add CNC Electric listing with URL backlink

### Hour 4 — Maintenance
- Update kpi-tracker.md with today's row
- Save session log to `seo-database/LIVE-ASSETS-YYYY-MM-DD.md`
- Update this NEW-SESSION-INSTRUCTIONS.md if something major changed
- Git commit + push (Bash: `cd /Users/muddasirwaheedmalik/cnc-seo-push && git add -A && git commit -m "..." && git push`)

## Credentials and IDs (the "where" cheatsheet)

| Thing | Value / Path |
|---|---|
| Shopify domain | cncelectric.myshopify.com |
| Shopify public | cncelectric.pk (also www.cncelectric.pk) |
| Shopify token | `shpat_***REDACTED***` — embedded in cron config + local `publish-*.js` scripts. User pre-authorized inline use. NEVER commit to git (GitHub Push Protection blocks). Look up in `/Users/muddasirwaheedmalik/cnc-seo-push/publish-*.js` files. |
| Shopify API base | https://cncelectric.myshopify.com/admin/api/2024-10 |
| Shopify GUIDES blog ID | 89971589186 |
| Shopify article URL pattern | /blogs/guides/<handle> |
| IndexNow key | 8a1f3c5e7b9d2406 |
| IndexNow endpoint | https://api.indexnow.org/IndexNow |
| Brand Radar report ID | 019d4ac7-282f-7335-b084-a8e9c7e08486 |
| Ahrefs MCP plugin name | plugin:marketing:ahrefs |
| X handle | @CNCPakistan1947 (NOT @cncelectricpk — dormant) |
| LinkedIn page | "CNC Electric Pakistan" |
| Medium account | CNC Electric Pakistan |
| Wikipedia username | Muddasir Waheed Malik |
| Cron trigger ID | trig_01MX8FHnxDnNfvosT6AbF3d6 |
| Cron env ID | env_017VV8Von77iPsj2EQY1yHB8 |
| Daily report repo | github.com/muddasirwaheed2017-beep/dailyreport |
| Workspace path | /Users/muddasirwaheedmalik/cnc-seo-push/ |
| SEO database | /Users/muddasirwaheedmalik/cnc-seo-push/seo-database/ |

## Safety rules Claude MUST follow

**Cannot do (Claude safety):**
- Enter passwords (Wikipedia, LinkedIn, etc.) — user types these
- Solve CAPTCHAs (hCaptcha, reCAPTCHA) — user clicks these
- Create new accounts on any platform
- Make payments / financial transfers

**Explicitly skipped by user (do not pitch these):**
- Quora — user said "I won't do Quora" 2026-06-05
- Reddit posting via Chrome — Chrome extension safety blocks reddit.com (save drafts for manual user posting)

**User-action-required items** (don't try to do — just remind user):
- Set up Daraz official CNC store
- Turn ON Grok polling in Brand Radar dashboard
- Hire Lahore video editor for IG/YT shorts production
- Tier-1 PR pitches (Dawn, BR, Tribune, The News)
- Buy ring light + tripod + lapel mic if not owned

## Folder structure for context

```
/Users/muddasirwaheedmalik/cnc-seo-push/
├── seo-database/
│   ├── 02-ahrefs-seo/
│   │   └── competitor-content-gap-2026-06-04.md   # Alladin/PHX gap, top 20 KW priority
│   ├── 04-twitter-x/
│   │   ├── x-post-draft-*.md                       # Day's X drafts if compose blocked
│   │   └── social-media-30-day-plan-2026-06-04.md  # IG/YT/FB production plan
│   ├── 05-plan/
│   │   ├── NEW-SESSION-INSTRUCTIONS.md            # THIS FILE
│   │   ├── kpi-tracker.md                          # Weekly KPI rows
│   │   └── weekly-cadence.md                       # 21-day sprint cadence
│   ├── 06-grok/
│   │   ├── kpi-grok.md                             # Grok-specific log
│   │   └── x-grok-content-calendar.md              # 30 X post calendar
│   ├── 10-blogs/
│   │   └── 30-day-content-roadmap-2026-06-04.md   # Buying guide pipeline
│   └── LIVE-ASSETS-YYYY-MM-DD-FINAL.md            # Daily session logs (most recent = source of truth for "yesterday")
├── publish-*.js                                    # One-off Shopify push scripts
├── *.html                                          # Article HTML bodies
└── (root) various helper scripts
```

## Brand Radar — multi-AI surface tracker

Day-5 (2026-06-04) baseline across 7 AI surfaces:

| Surface | CNC SoV | Alladin SoV | Status |
|---|---|---|---|
| ChatGPT | **100%** | 9.3% | ✅ Dominating |
| Gemini | **100%** | n/a | ✅ Dominating |
| AI Mode | **100%** | n/a | ✅ Dominating |
| Copilot | **98%** | n/a | ✅ Dominating |
| AI Overviews | **98%** | n/a | ✅ Dominating |
| **Perplexity** | **43%** | **53%** | 🔴 **LOSING** — focus area |
| Grok | 0% (polling off) | 0% | ⚠️ Toggle on, user-action |

**Why Perplexity is losing:** Alladin has YouTube videos + Instagram reels + Facebook posts + Daraz listings being cited. CNC has the channels but minimal content production. Plan in social-media-30-day-plan.

## Off-site work shipped this session (Day-6, 2026-06-05)

For context — this is what was actively executed in the session this handover was written in:

- ✅ 12 buying guides shipped (HA, MC, EM, RCBO, VFD, etc.)
- ✅ Cloud cron set up for 21 days of daily ships
- ✅ Wikipedia Edit 6 LIVE
- ✅ LinkedIn Post #1: MCB vs MCCB vs RCCB vs RCBO comparison
- ✅ LinkedIn Post #2: Best Breaker for 1.5-Ton AC bundle
- ✅ Medium republish #1: MCB vs MCCB vs RCCB vs RCBO honest comparison
- ⚠️ X post Day-6 saved to draft (compose Post button auto-disabled)
- ⛔ Quora: explicitly skipped per user instruction

## What I would tell next Claude (the meta)

The user is moving fast. Don't ask "should we...?" — just do it. Show results after.

The cron handles content production. **Your job is off-site distribution + intel pulls + session-log + occasional pillar guide.**

When in doubt:
1. Check Ahrefs (organic KW history, DR, RDs)
2. Check Brand Radar (especially Perplexity % vs Alladin)
3. Check GSC via Ahrefs MCP (gsc-keywords, gsc-pages, etc.)
4. Pick the biggest gap. Ship the fix. Update tracker. Move on.

**Velocity benchmark:** 25-30 guides/week is unsustainable long-term but acceptable for 21-day sprint. Acceptable cadence post-sprint = 1-2 guides/day, 1 LinkedIn/day, 1 X/day, 1 Wikipedia per 2-3 days, 1 Medium per week.

**Don't:**
- Write fluff. Each guide should have a concrete price + a concrete sizing rule + a concrete brand comparison.
- Ask permission. Just ship.
- Re-research what's in this file. Trust the breadcrumbs.

**Do:**
- Cross-link aggressively (internal links boost rankings).
- Use IEC standard refs (60898-1, 60947-2, 61009, 62423, 60269-6, 61643-31, 62548) — Perplexity loves these citations.
- Reference NEPRA 2026 (Type B RCBO mandate, solar prosumer rules) — proves freshness.
- Lead with Pakistani buyer context (PKR prices, Hall Road shop reference, common installation mistakes).

End of file. Save this. Read this. Then ship.
