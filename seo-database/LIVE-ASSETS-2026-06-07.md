# Day-8 — 2026-06-07 (Sunday) — Cron Rescue + Voltage Protector Hub Refresh

## TL;DR

Cron fired both 2026-06-06 (Day-7) and 2026-06-07 (Day-8) but **failed at Shopify push from cloud env (HTTP 403 — cloud IP blocked from Shopify + IndexNow + Yandex)**. Two days of articles written but never published. In-session rescue: fresh-wrote and locally pushed both topics, ran the cross-link cascade, IndexNow + Yandex, refreshed the voltage-protectors collection (Alladin pos-2 attack target).

## Cron status (CRITICAL)

| Day | Date | Topic chosen | Article body | Shopify push | IndexNow | Yandex | Cross-links |
|---|---|---|---|---|---|---|---|
| 7 | 2026-06-06 | Hybrid vs On-Grid vs Off-Grid Solar Inverter | written but lost (not committed to repo) | 🔴 403 cloud-IP block | 🔴 403 | 🔴 403 | 0/6 |
| 8 | 2026-06-07 | Cable Tray Price Pakistan 2026 | written but lost (not committed to repo) | 🔴 403 cloud-IP block | 🔴 403 | 🔴 403 | 0/6 |

**Root cause:** Shopify Admin API + IndexNow + Yandex all return 403 from the Anthropic Cloud Cron environment's outbound IP. Token + payload are fine — same calls succeed from local. Likely abuse-list / fraud-IP scoring from Shopify on the cloud IP range, not a true allowlist.

**Cron prompt didn't include "save HTML body to repo before push" step** — so when push 403'd, the article body was lost in the cron container. Article reports (CNC-DAY-7/8.md) live in the repo with metadata, but the HTML body wasn't committed.

**Fix for cron v6 (proposed):** Add Step 4.5 → commit article HTML to dailyreport repo BEFORE Step 5 (Shopify push). That way 403'd articles can be locally rescued from the repo HTML the next morning.

## Rescue moves (in-session Day-8)

### 2 buying guides shipped locally

| # | Topic | Handle | Shopify ID | Status |
|---|---|---|---|---|
| 1 | Hybrid vs On-Grid vs Off-Grid Solar Inverter | `hybrid-vs-on-grid-vs-off-grid-solar-inverter-price-pakistan-2026` | 573698932802 | ✅ LIVE (HTTP 200) |
| 2 | Cable Tray Price Pakistan 2026 — IEC 61537 | `cable-tray-price-in-pakistan-2026-iec-61537-buyer-guide` | 573698965570 | ✅ LIVE (HTTP 200) |

Both shipped with:
- ✅ title_tag + description_tag metafields (under 67 / 160 chars)
- ✅ summary_html + tags
- ✅ FAQ JSON-LD schema injected (5 Q&A each — Perplexity / AI Overview citation boost)
- ✅ IndexNow batched ping to Bing + Yandex (HTTP 202)
- ✅ Yandex sitemap ping (HTTP 200)

### Cross-link cascade (10 inbound links)

Inbound links added to both new articles from 10 high-PR existing guides:

**Hybrid inverter inbound (6):**
1. 5kw-solar-system-price-in-pakistan-2026-hybrid-on-grid-off-grid-complete-package
2. nepra-2026-net-metering-equipment-checklist-pakistan-complete-list
3. net-metering-pakistan-2026-nepra-regulations-guide
4. off-grid-solar-system-design-pakistan-complete-sizing-protection-guide-2026
5. pwm-vs-mppt-charge-controller-pakistan-2026-honest-comparison-payback
6. voltage-protector-price-in-pakistan-2026-buying-guide

**Cable tray inbound (5):**
1. nepra-2026-net-metering-equipment-checklist-pakistan-complete-list (shared)
2. difference-between-mcb-mccb-rccb-rcbo-pakistan-2026-buyer-comparison-guide
3. industrial-plug-socket-price-in-pakistan-2026-ip44-ip66-iec-60309-buyer-guide
4. earthing-grounding-equipment-price-pakistan-2026-copper-rod-cable-buyer-guide
5. dc-distribution-box-price-pakistan-2026-12v-24v-48v-off-grid-buyer-guide

### Voltage protector collection refresh — Alladin pos-2 attack

The Day-8 cron report flagged "voltage protector" (1,900 vol, KD 0) as the highest-leverage single SoV move — CNC pos 7 vs Alladin pos 2.

Updates to `/collections/voltage-protectors` (ID 299253432386):
- ✅ Freshness date stamp bumped May 2026 → **June 7, 2026**
- ✅ New cluster aside (6 internal links) to the 2026 buying-guide hub — buying guide, 3-phase, fridge, vs regulator, vs stabilizer, hybrid solar inverter
- ✅ description_tag refreshed with concrete price anchors (5 kVA PKR 5,400 / 25 kVA 3-ph PKR 42,000)
- ✅ IndexNow ping (HTTP 202)

Ranking jump from pos 7 → pos 2 still needs off-page (backlinks) work — this on-page refresh is necessary but not sufficient. Cluster strategy will compound as the new linked guides accrue authority.

## Unpublished asset flag

**`clopal-vs-cnc-wifi-smart-breaker-comparison-pakistan-2026-buyer-guide`** (Shopify ID 573694214210)
- Created 2026-06-06 03:21 PKT
- Status: **unpublished / draft** (correctly so)
- Conflict: title + handle + tags name competitor brand "Clopal" → violates auto-memory rule "No competitor brand names" (2026-06-05)
- Confirms intent: `unpublish-clopal-article.js` script already in repo means user pivoted away from this strategy
- **Action: leave unpublished.** Don't re-publish. If user wants the comparison framing, rewrite with generic descriptors ("budget wifi breakers" vs "IEC-grade smart MCB") and a new handle.

## Brand Radar deltas (Ahrefs MCP pull, 2026-05-30 → 2026-06-07)

| Surface | CNC SoV | Alladin SoV | Powerhouse | Industry Parts | Clopal | Notes |
|---|---|---|---|---|---|---|
| ChatGPT | **100%** | 3.4% | 25.0% | 21.5% | 0% | ✅ Holding dominance |
| Perplexity | **43.2%** | **53.3%** | 7.2% | 0% | 3.4% | 🔴 Still losing by 10.1pp — same as Day-6 |

Perplexity gap unchanged for 3 days running — needs YouTube / Instagram / Daraz social signal injection (per Day-6 plan). Confirmed in Day-7 + Day-8 cron reports.

## Ahrefs CNC vs Alladin (live 2026-06-07)

| Metric | CNC | Alladin | Delta | Day-0 baseline (CNC) |
|---|---|---|---|---|
| Org keywords | 188 | 1,339 | -1,151 | 200 |
| Top 1-3 ranking | 77 | 522 | -445 | 68 |
| Monthly traffic | 2,820 | 28,987 | -26,167 | 2,916 |
| Organic cost (USD) | $96.21 | $866.73 | -89% |  |

CNC has slipped 200 → 188 ranking KWs (likely re-crawl / consolidation noise — fresh guides indexing now). Top-3 count grew 68 → 77 (+9). Traffic flat 2,820 vs 2,916 (within noise band). New guides need 7-30 days to compound.

## Sprint scoreboard (Day-0 → Day-8)

| Metric | Day-0 (2026-05-30) | Day-6 (2026-06-05) | Day-8 (2026-06-07) | Day-21 target |
|---|---|---|---|---|
| Live buying guides | ~30 | 70+ | **72+** (+2 in-session rescue) | 100+ |
| Ranking KWs (Ahrefs PK) | 200 | 200 | 188 (re-crawl flux) | 1,000+ |
| Top-3 KWs | 68 | 200+ claimed | 77 (Ahrefs live) | 90+ |
| Organic traffic / mo | 2,916 | 2,900 | 2,820 | 30K (90-day) |
| DR | 10 | 10 | 11 (per Day-8 cron) | 12+ |
| RDs | 44 | 45 | (not pulled today) | 60+ |
| Wikipedia edits | 0 | 6 | 6 (no change) | 10+ |
| X posts | 244 | 252 | 252 (no change) | 280+ |
| LinkedIn posts | 0 | 2 LIVE + 1 draft | 2 LIVE (no change) | 14+ |
| Medium articles | 0 | 1 LIVE | 1 LIVE (no change) | 5+ |
| Perplexity SoV CNC | n/a (off) | 43% | **43.2%** | 55%+ |
| Perplexity SoV Alladin | n/a (off) | 53% | **53.3%** | (overtake) |

## Pending for in-session next sessions (chrome / off-site)

1. ⏳ LinkedIn Post #3 (WiFi MCB B2B angle) — draft saved Day-6
2. ⏳ LinkedIn Post #4 — fresh from today's Hybrid Inverter article (~250-word B2B angle)
3. ⏳ LinkedIn Post #5 — Cable Tray article (industrial buyer angle)
4. ⏳ Medium republish — Hybrid vs On-Grid vs Off-Grid (high search-volume topic)
5. ⏳ X posts staggered (4 drafts saved Day-6 — re-staggered through Day 7-10)
6. ⏳ Wikipedia Edit 7 (small grammar/cite fix, keep account live)
7. ⏳ Turn ON Grok polling in Ahrefs Brand Radar (1-click dashboard)
8. ⏳ Diagnose cron 403 — fix v6 to commit HTML body before push

## Manual user actions (unchanged from Day-6)

1. Set up Daraz official CNC store (Perplexity signal)
2. Hire Lahore video editor (PKR 25K/month) for IG/YT shorts
3. Tier-1 PR pitches (Dawn, BR, Tribune, The News)

## Files / scripts created Day-8

- `hybrid-vs-ongrid-vs-offgrid-article-2026-06-07.html` — Day-7 rescue article body
- `cable-tray-article-2026-06-07.html` — Day-8 rescue article body
- `publish-day7-day8-rescue-2026-06-07.js` — Shopify push + FAQ schema + IndexNow + Yandex
- `cross-link-day7-day8-rescue-2026-06-07.js` — initial cascade (5 OK, 3 miss)
- `cross-link-day7-day8-rescue-pass2.js` — corrected-handle cascade (5 OK)
- `refresh-voltage-protector-collection-2026-06-07.js` — collection hub refresh
- `seo-database/LIVE-ASSETS-2026-06-07.md` — this file
