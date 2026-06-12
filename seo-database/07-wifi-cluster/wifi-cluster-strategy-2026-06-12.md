# WiFi Cluster Strategy — 2026-06-12

## Total addressable Pakistani search volume — WiFi + smart switch cluster

Cluster total (Ahrefs PK live pull, KD universally 0 to 2):

| Sub-cluster | Monthly volume PK | KD | CNC status |
|---|---|---|---|
| wifi breaker (350) + wifi circuit breaker (80) + wifi smart breaker (30) + wifi smart circuit breaker (10) + wifi breaker price PK (100) + wifi breaker switch (80) + smart wifi breaker (60) + wifi circuit breaker PK (30) | **740** | 0 | **#1 for "wifi breaker price"**, #4 for plain "wifi breaker" — keystone ✅ |
| wifi switch (350) + wifi smart switch (200) + smart wifi switch (150) + wifi switch controller (150) + wifi switch PK (80) + wifi switch price PK (80) + wifi smart switch price PK (70) + wifi smart switch PK (60) + wifi on off switch (50) + smart switch wifi (30) + wifi control switch (30) + wifi electrical switch (30) | **1,280** | 0 | NOT in top 10 — biggest gap ❌ |
| smart switch PK (separate from above) | ~150 | 0 | NOT in top 10 ❌ |
| Application-specific (geyser, AC, motor, water pump, tubewell, signboard) | ~200 | n/a | shipped today ✅ |
| Changeover / ATS (wifi changeover 60 + wifi change over 10 + wifi ats 10 + wifi changeover breaker 10) | 90 | n/a | bridge-able from our changeover authority |
| Branded ("cnc wifi breaker") | 40 | n/a | should be #1 (verify) |
| **Total Pakistani search demand** | **~2,500/mo** | | |

If CNC owned 70% of cluster traffic at ~6% CTR = **~105 visitors/month** at current volume. At PKR 18,000 average WiFi unit price × 1-2% conversion = **PKR 19,000 to 37,000 / month** in attributable revenue, growing as KW volume grows (these are still emerging terms).

## CNC current asset inventory (audit 2026-06-12)

- **1 collection** at /collections/wifi-smart-circuit-breakers (now deepened June 12)
- **17 articles in /blogs/guides/** covering WiFi MCB, WiFi switch, smart switch, wall switch, smart switch board, timer switch, energy meter, electric meter, thermostat, WiFi breaker use cases, troubleshooting, Tuya app setup, 3-phase WiFi breaker, WiFi breaker vs smart plug, WiFi breaker price guide
- **9 articles in /blogs/news/** covering WiFi smart breaker NEPRA + PTA + solar + UPS rules, ROI math, Home Assistant integration, brand comparison, vs normal MCB, complete guide, solar export, geyser/AC/water-pump (shipped today)

## Actions executed today (2026-06-12)

### Action 1 — /collections/wifi-smart-circuit-breakers deepened (PUT 200)
- Body fully restructured with PKR price matrix (1P/2P/4P × 16 to 125 A)
- 8-question FAQ JSON-LD added (will-it-work-without-internet, 3-phase, MCB vs RCBO, Tuya + HA integration, NEPRA solar export, AC sizing, tubewell sizing, PTA data residency)
- 16-link cluster aside
- description_tag refresh (NEPRA 2026 + IEC 60898-1 hooks)
- IndexNow ping 202

### Action 2 — 15-article cross-link cascade (15× PUT 200)
All major WiFi guides + news articles now link to the keystone collection:
- 12 guides + 3 news → /collections/wifi-smart-circuit-breakers
- Idempotent backlink box at end of body

### Action 3 — New news article shipped (POST 201)
`wifi-switch-for-geyser-ac-water-pump-motor-pakistan-2026-application-buyer-rules-news`
- ~13 KB, ~2,000 words
- Target keywords: wifi switch for geyser (50 vol), wifi switch for ac (10), wifi switch for water pump (10), wifi switch for motor (30), 63 amp wifi breaker (10), wifi switch for ac (10)
- IEC 60898-1, IEC 61009, IEC 60947-4-1, IEC 60364-7-708, NEPRA 2026 referenced
- 8 FAQs (sizing per appliance, C vs D curve, leakage protection, three-phase tubewell, NEPRA export limit, internet-down behaviour, 48 °C Lahore summer, WiFi switch vs WiFi MCB)
- Generic descriptors only — no Tuya, Sonoff, Aqara, Tomzn brand names
- IndexNow 202 + Yandex 200

## Highest-leverage next moves (priority order)

### Move A — Refresh wifi-switch-pakistan-2026-best-smart-wall-switch-pakistani-homes-buyer-guide (id 573692772418)
Currently the closest article to "wifi switch" 350-vol KW. Needs:
- June-12 freshness block
- PKR price matrix by gang count (1G / 2G / 3G / 4G WiFi wall switches)
- IEC 60669-2-1 reference
- FAQ JSON-LD with 8 questions
- Cluster aside linking the keystone collection + the application-specific news article shipped today
- description_tag refresh
- IndexNow + Yandex

### Move B — Build new /collections/wifi-smart-switches collection
Only if CNC manufactures or stocks WiFi wall switches (verify on cncele.com authoritative site). If yes, build collection following the same pattern as the breakers collection. If no, skip this and lean on Move A.

### Move C — Refresh smart-switch-price-in-pakistan-2026-buyer-guide (id 573692739650)
Target the "smart switch" + "smart switch pakistan" pure terms. Same refresh pattern as Move A.

### Move D — Build a tubewell-specific WiFi MCB news article
"WiFi Tubewell Controller Pakistan 2026 — 3-Phase Smart MCB with Phase-Failure + Over-Voltage News" — target 3-phase tubewell farmers, Punjab-Sindh agri irrigation cluster. Volume 60+ across "wifi switch for motor" + "wifi switch for water pump" + "wifi changeover switch" + farmer-search long-tails.

### Move E — Refresh smart-switch-board-pakistan-2026 — focus on full DB-box smart-home wiring spec (lift for "smart switch board" 40 vol + bridge to "switch board" 2,200 vol authority page)

### Move F — Brand defend pass for "cnc wifi breaker" (40 vol branded)
Confirm CNC ranks #1 for own brand. If not, fix via title-tag + h1 + first-paragraph reinforcement on the relevant page.

## What NOT to do

- Don't write more articles naming Tuya, Sonoff, Aqara, Tomzn, Clopal, Sonoff, Shelly, Chint in the title or handle. Past indexed articles stay per the standing rule but new ones use generic descriptors only.
- Don't create duplicate collection — adding /collections/wifi-switches if there are no actual WiFi switch SKUs creates a thin-content penalty. Verify SKUs first on the manufacturer site.
- Don't refresh more than 3 WiFi articles per session — Google needs 2 to 5 days to re-index and re-rank. Burst-refresh defeats the purpose.

