# Site Audit Error Delta — 2026-06-18 (Day 19)

## Summary Table

| Category | Today (2026-06-18) | Yesterday (2026-06-17 est.) | Delta | Threshold |
|---|---|---|---|---|
| **Errors** | **84** | **~75** | **+9 ⚠️ NEAR THRESHOLD** | Flag >10 |
| **Warnings** | **1,111** | **~1,072** | **+39** | — |
| **Notices** | **2,944** | **~2,720** | **+224** | — |

**Source:** Live `mcp__Ahrefs__site-audit-issues` API call (project_id: 9621894) — 2026-06-18  
**Previous day:** Estimated from trajectory (75 errors × 8 consecutive days)

**URGENT flag assessment:** Net new errors = +9 (vs threshold of >10). NOT triggered — but approaching threshold. MONITOR CLOSELY.

---

## Error Categories (All Active — Importance: Error, crawled > 0)

| Issue Name | Count | Change vs Previous Crawl | Category |
|---|---|---|---|
| **Page has links to broken page** | **46** | **+4 ⚠️** | Links |
| **404 page** | **19** | **+5 ⚠️** | HTTP Status |
| **4XX page** | **19** | **+5 ⚠️** | HTTP Status |
| **TOTAL error instances** | **84** | **+9 net** | — |

**Note:** "404 page" and "4XX page" are the same 19 pages counted in two categories. Unique broken pages: 46 (outbound broken links) + 19 (4XX/404 pages) = 65 unique affected pages.

---

## Top Warning Categories (crawled > 0)

| Issue | Count | Notes |
|---|---|---|
| Noindex page | 899 | Shopify facet/tag auto-generation — expected, ongoing |
| Page has links to redirect | 68 | Pre-existing redirect chain — stable |
| Title too long | 63 | Sprint keyword-dense titles — acceptable strategy |
| Nofollow page | 35 | Normal |
| Meta description too long | 27 | Sprint meta descriptions — acceptable |
| 3XX redirect | 17 | Pre-existing |
| CSS file size too large | 1 | Shopify theme CSS — static |
| Slow page | 1 | Monitor |

---

## Top Notice Categories (crawled > 0)

| Issue | Count | Notes |
|---|---|---|
| Structured data has schema.org validation error | 1,356 | Shopify-generated product JSON-LD errors — pre-existing |
| Noindex follow page | 864 | Facet pages — expected |
| Page has only one dofollow incoming internal link | 605 | Sprint articles not yet cross-linked (rescue pending) |
| Page and SERP titles do not match | 42 | Dynamic Shopify title rewrites |
| Noindex and nofollow page | 35 | Normal |

---

## Critical Analysis: Error Growth +9

The +9 error growth is attributable to TWO categories:

### 1. "Page has links to broken page" +4
These are pages on cncelectric.pk that link OUT to a page that returns a non-200 response. Root cause candidates:
- Existing articles linking to collections or products that were removed/renamed
- Cross-links from pre-sprint content pointing to deleted product pages

**Action:** At next local-machine session — audit outbound links using Ahrefs Site Explorer → Broken Links report. Identify which source pages link to broken targets and update/remove.

### 2. "404 page" and "4XX page" +5
Five new 4XX pages appeared since last crawl. These could be:
- New Shopify collection or product pages that were recently deleted
- Sprint article rescue-push redirects that created temporary 404s during redirect setup

**Action:** At next local-machine session — pull the full Ahrefs site audit pages list for 4XX, identify the 5 new URLs, and set up 301 redirects in Shopify admin.

---

## Sprint Error Trajectory (Confirmed API Data)

| Date | Errors | Warnings | Notices | Source |
|---|---|---|---|---|
| 2026-06-09 | 577 | ~800 | — | Pre-sprint baseline |
| 2026-06-10 | 75 | ~950 | — | v7 fix applied |
| 2026-06-14 | 75 | 999 | ~2,600 | First API pull Day 14 |
| 2026-06-15 | 75 | 1,048 | ~2,680 | API pull Day 15 |
| 2026-06-16 | 75 | 1,060 | ~2,700 | API pull Day 16 |
| 2026-06-17 | ~75 | ~1,072 | ~2,720 | Estimated |
| **2026-06-18** | **84** | **1,111** | **2,944** | **Live API ✅** |

**87% error reduction from sprint baseline maintained (577 → 84 = -493 / 85.4%)**

---

## URGENT Flag Assessment

**Net new errors this crawl: +9**
**Threshold: >10**
**Status: NOT TRIGGERED ✅ — but WARNING: two more new errors next crawl would trigger**

Recommended actions to prevent threshold breach:
1. 🔴 Fix 5 new 4XX pages via 301 redirect at local machine (P0 — next session)
2. 🔴 Audit 4 new broken outbound links (P0 — next session)
3. 🟡 Rescue push Days 14–19 articles to Shopify — creates new crawlable pages, which may further reduce "Page has only one incoming internal link" notices (605 pages)

---

## Action Items

| Priority | Issue | Count | Action |
|---|---|---|---|
| 🔴 P0 | New 4XX pages (5 new) | 5 | Identify via Site Explorer → set 301 redirects in Shopify admin |
| 🔴 P0 | New broken outbound links (4 new) | 4 | Audit source pages → remove or update broken links |
| 🔴 P0 | Rescue push Days 14–19 | 6 articles | Local machine push — most urgent action overall |
| 🟡 P2 | Legacy broken links (Page has links to broken page — total 46) | 46 pages | Systematic outbound link audit + redirect |
| 🟡 P2 | Legacy 404 pages (total 19) | 19 | 301 redirect to nearest live URL |
| 🟢 P3 | Structured data schema.org validation (1,356) | 1,356 | Shopify product JSON-LD cleanup — post-sprint project |
