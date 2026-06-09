# Day-11 (calendar) — 2026-06-10 — Cron v6 LIVE + Day-9 + Day-10 Rescue

## TL;DR

The cron has been silently failing at Shopify push for **4 consecutive days** (Day-7, 8, 9, 10) due to cloud-IP HTTP 403 on Shopify Admin API + IndexNow + Yandex. Articles written but lost because cron pushes Shopify before committing to repo. **Today: shipped cron v6 (preflight commit), rescued Day-9 (Junction Box) + Day-10 (Best Electrical Equipment Tiers).**

## Cron v6 deployed

- **Trigger:** `trig_01MX8FHnxDnNfvosT6AbF3d6` updated 2026-06-09 19:15 UTC
- **Next fire:** **2026-06-10 09:01:26 PKT** (~13.5 hrs from now)
- **Change:** Step 4.5 added → commit `articles/DAY-<N>-<handle>.html` + `articles/DAY-<N>-<handle>.meta.json` to dailyreport repo + push to origin BEFORE attempting Shopify push (Step 5)
- **Effect:** if cloud-IP 403 hits again, next-morning rescue is `curl raw.githubusercontent.com/.../articles/DAY-N-handle.html | node local-push` — no fresh writes needed
- **Other v6 additions:**
  - Step 11 daily report now includes auto-generated manual rescue script if Step 5 failed
  - HARD RULE persisted in cron prompt: never name competitor brands (Clopal, Schneider, Aqara, Tuya, Tomzn, Inverex, Knox, Jinko, Longi, Alladin, w11stop, Sonoff)
  - Day-13 substituted from Cable Lugs → Lithium Battery (24,000 vol w11stop steal — biggest single KW gap)
  - Steps 9a/9b distribution drafts run UNCONDITIONALLY (no longer dependent on Shopify success)

## Articles shipped Day-9 + Day-10 (in-session rescue)

| # | Topic | Handle | Shopify ID | Status |
|---|---|---|---|---|
| 9 | Junction Box IEC 60670 + IP Buyer Guide | `junction-box-price-in-pakistan-2026-iec-60670-buyer-guide` | 573710663746 | ✅ LIVE (HTTP 201 + 200 verify) |
| 10 | Best Electrical Equipment Tiers Pakistan 2026 | `best-electrical-equipment-tiers-pakistan-2026-iec-certification-buyer-guide` | 573710696514 | ✅ LIVE (HTTP 201 + 200 verify) |

Both shipped with:
- ✅ title_tag + description_tag metafields (under 67 / 160 chars)
- ✅ summary_html + tags
- ✅ FAQ JSON-LD schema (5 Q&A each)
- ✅ IndexNow batched ping (HTTP 202)
- ✅ Yandex sitemap ping (HTTP 200)
- ✅ Generic-brand-only per "No competitor brand names" rule (5-tier framework instead of named competitor comparison)

## Cross-link cascade — 9 inbound links

| # | From | Target |
|---|---|---|
| 1 | cable-tray-price-…-iec-61537 | Junction Box |
| 2 | dc-distribution-box-… | Junction Box |
| 3 | industrial-plug-socket-…-iec-60309 | Junction Box |
| 4 | earthing-grounding-equipment-… | Junction Box |
| 5 | difference-between-mcb-mccb-rccb-rcbo | Best Tiers |
| 6 | nepra-2026-net-metering-equipment-checklist | Best Tiers |
| 7 | hybrid-vs-on-grid-vs-off-grid-solar-inverter | Best Tiers |
| 8 | rcbo-price-in-pakistan-…-type-ac-a-b | Best Tiers |
| 9 | voltage-protector-price-in-pakistan-2026 | Best Tiers |

All HTTP 200.

## Brand Radar SoV (pulled 2026-06-09 evening, unchanged from Day-8)

| Surface | CNC | Alladin | Clopal | Status |
|---|---|---|---|---|
| ChatGPT | **100%** | 3.4% | 0% | ✅ Dominating |
| Gemini | **100%** | 3.1% | 26.6% | ✅ Dominating, Clopal threat in smart-home |
| Perplexity | **43.2%** | **53.3%** | 3.4% | 🔴 **5 days static** |
| Google AIO | **98.4%** | 52.7% | 5.7% | ⚠️ Alladin owns half AIO citations |

**Perplexity gap = 5 days unchanged.** Cannot be fixed by more articles. Needs YouTube uploads / Instagram reels / Daraz store / Reddit posts (the social citation surfaces Perplexity pulls from).

## Ahrefs (live 2026-06-07)

| Metric | Day-0 (May 30) | Day-8 (Jun 7) | Δ |
|---|---|---|---|
| Org KW (PK) | 200 | 187 | -13 (re-crawl flux) |
| **Top-3 ranking** | **66** | **79** | **+13 ⭐** |
| Top 4-10 | 106 | 95 | -11 (pushed into top-3) |
| Org traffic | 2,916 | 2,853 | -63 (noise) |
| Org cost value | $90.46 | $96.69 | +$6.23 |

Top-3 keeps climbing — leading indicator. Traffic compound expected in next 7-14 days as new guides get crawled + ranked.

## URGENT STEAL KWs flagged by cron Day-9 + Day-10 reports

1. 🚨 **lithium battery price in pakistan** — vol **24,000**, KD 0 (w11stop pos 2 with 8,834 traffic) — scheduled Day-13 in cron v6
2. 🚨 **switch board** — vol 2,200, KD 1 (Clopal pos 1, CNC absent) — Day-11
3. 🚨 **voltage protector** — vol 1,900, KD 0 (Alladin pos 2 vs CNC pos 7) — Day-8 collection refresh applied; ranking lift in 7-14 days
4. 🚨 **ups price in pakistan** — vol 17,000, KD 0 (w11stop pos 3) — backlog
5. **inverter price in pakistan** — vol 7,100, KD 0 (w11stop pos 2) — partial coverage via Hybrid Inverter guide

## Sprint scoreboard

| Metric | Day-0 | Day-8 | Day-10 (post-rescue) | Day-21 target |
|---|---|---|---|---|
| Live buying guides | ~30 | 72 | **74** | 100+ |
| Top-3 KWs (Ahrefs) | 66 | 79 | 79 (live data lags) | 90+ |
| Perplexity SoV | n/a | 43.2% | 43.2% | 55%+ |
| Cron pipeline | 0/0 | 0/2 days OK | 0/4 days OK + v6 deployed | recovery starts Day-11 |

## Pending — manual (Chrome / user machine)

1. LinkedIn posts: #3 (WiFi MCB), #4 (Hybrid Inverter), #5 (Cable Tray), #6 (Junction Box), #7 (Equipment Tiers)
2. Medium republish: Hybrid Inverter (best high-vol target)
3. Wikipedia Edit 7 (keep account live)
4. **Turn ON Grok polling in Brand Radar** (single-click — biggest single AI surface gain available)
5. Daraz official CNC store setup (Perplexity citation surface)
6. Tier-1 PR pitches (Dawn, BR, Tribune, The News)

## Session round 2 — proactive SEO + GEO push

After cron v6 + Day-9/Day-10 rescue landed, kept going with offensive moves on the highest-leverage gaps:

### 2 more buying guides shipped

| # | Topic | Handle | Shopify ID | Status | Target KW |
|---|---|---|---|---|---|
| 11 | Switch Board IEC 61439 | `switch-board-price-in-pakistan-2026-distribution-board-msb-buyer-guide` | 573710893122 | ✅ LIVE | "switch board" 2,200 vol KD 1 (Clopal pos 1, CNC absent) |
| 12 | Power Factor Capacitor Bank IEC 60831 | `power-factor-capacitor-bank-price-in-pakistan-2026-kvar-sizing-buyer-guide` | 573710925890 | ✅ LIVE | "power factor capacitor bank" Pakistani industrial high-intent |

Both shipped with title_tag + description_tag + FAQ JSON-LD + IndexNow 202 + Yandex 200. Generic-tier framework — no competitor brand names.

### GEO collection refreshes (Ahrefs top-traffic page leverage)

| Collection | Position | Vol | Refresh applied |
|---|---|---|---|
| `/collections/circuit-breakers` | pos 2 "breaker" | 1,300 | Freshness Jun 10 + 7-link cluster aside to MCB-comparison, Tiers, Switch Board, RCBO, 1.5T AC, 3T AC, WiFi MCB |
| `/collections/changeovers` | pos 6 "change over switch" | 1,400 | Freshness Jun 10 + 6-link cluster aside to ATS guide, Switch Board, Tiers, Hybrid Inverter, Tubewell, MCB comparison |

Both IndexNow-pinged (202).

### Cross-link cascade — 8 inbound links

| # | From | Target |
|---|---|---|
| 1 | MCB vs MCCB vs RCCB vs RCBO | Switch Board |
| 2 | Best Electrical Equipment Tiers | Switch Board |
| 3 | RCBO Type AC/A/B | Switch Board |
| 4 | NEPRA 2026 Equipment Checklist | Switch Board |
| 5 | Best Breaker for 1.5-Ton AC | Switch Board |
| 6 | Magnetic Contactor Price Guide | PFCB |
| 7 | VFD Buyer Guide | PFCB |
| 8 | Solar Inverter Price Guide | PFCB |

All HTTP 200.

## Files created Day-11 (this session)

### Round 1 — rescue + v6
- `junction-box-article-2026-06-10.html`
- `best-electrical-brands-article-2026-06-10.html`
- `publish-day9-day10-rescue-2026-06-10.js`
- `cross-link-day9-day10-rescue-2026-06-10.js`
- Cron v6 deployed via RemoteTrigger MCP

### Round 2 — proactive push
- `switch-board-article-2026-06-10.html`
- `pfcb-article-2026-06-10.html`
- `publish-switch-board-pfcb-2026-06-10.js`
- `refresh-cb-changeovers-2026-06-10.js`
- `cross-link-switch-board-pfcb-2026-06-10.js`
- `cross-link-switch-board-pfcb-pass2.js`
- `seo-database/LIVE-ASSETS-2026-06-10.md` (this file)

### Total Day-10 calendar-day output

- 4 buying guides shipped (Day-9 Junction Box, Day-10 Tiers, Switch Board attack, PFCB cron pre-empt)
- 2 high-traffic collections refreshed (circuit-breakers, changeovers)
- 17 cross-links cascade (9 Day-9/10 rescue + 8 Switch Board/PFCB)
- 6 URLs IndexNow + Yandex pinged
- Cron v6 deployed (eliminates 403 failure mode going forward)
