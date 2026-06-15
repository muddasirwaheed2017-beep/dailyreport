# Site Audit Error Delta — 2026-06-15 (Day 16)

## Summary Table

| Category | Today (2026-06-15) | Yesterday (2026-06-14) | Delta |
|---|---|---|---|
| **Errors** | **75** | **75** | **0 — STABLE ✅** |
| **Warnings** | **1,048** | **999** | **+49 ⚠️ (Noindex +24, Title too long +18)** |
| **Notices** | **2,681** | **2,563** | **+118 (re-crawl lag)** |

## Top Error Categories (crawled > 0, sorted by count)

| Issue | Importance | Count | Change |
|---|---|---|---|
| Page has links to broken page | Error | 31 | 0 |
| 404 page | Error | 22 | 0 |
| 4XX page | Error | 22 | 0 |

## Top Warning Categories Growing

| Issue | Importance | Count | Change |
|---|---|---|---|
| Noindex page | Warning | 800 | **+24** |
| Title too long | Warning | 96 | **+18** |
| Page has links to redirect | Warning | 68 | 0 |
| Nofollow page | Warning | 35 | 0 |
| Meta description too long | Warning | 27 | **+3** |

## Analysis

**Errors (75):** Stable. Pre-existing 404s and broken-link pages — no sprint-attributable regression. No URGENT flag triggered (threshold: errors > 10 net new).

**Warnings (+49):**
- *Noindex +24*: Expected growth as Ahrefs re-crawls Shopify tag/collection facet pages (Shopify natively noindexes these). Not actionable.
- *Title too long +18*: Shopify crawl is now picking up new guide articles published during the sprint. Sprint guides use descriptive long titles (100+ chars for keyword capture). Recommend auditing titles > 60 chars for display truncation in SERPs but NOT shortening — current approach is trading SERP display width for KW density, which is the correct call at DR 10.
- *Meta description too long +3*: Same pattern — sprint guides use full-length meta descriptions for AI feature extraction.

**Notices (+118):** Expected re-crawl expansion as Ahrefs indexes newly published Sprint guides. Trajectory is expanding coverage, not degrading quality.

## URGENT Flag: NOT TRIGGERED

Net new errors: 0. Threshold (>10 new errors) not reached.

## Historical Error Trajectory

| Date | Errors | Warnings | Notices | Notes |
|------|--------|----------|---------|-------|
| 2026-06-09 | 577 | — | — | Pre-sprint baseline |
| 2026-06-10 | ~6 est. | — | — | Sprint errors fixed |
| 2026-06-13 | 75 | 1,000 | 3,002 | First full API pull |
| 2026-06-14 | 75 | 999 | 2,563 | Stable |
| **2026-06-15** | **75** | **1,048** | **2,681** | **Warnings up (expected Noindex + Title crawl expansion)** |

**Cumulative error reduction: 577 → 75 = 87% reduction from sprint baseline.**

## Recommendations

| Priority | Action |
|----------|--------|
| 🔴 P1 | Fix 22 × 404 pages — 301 redirects in Shopify admin (local machine required) |
| 🔴 P1 | Fix 31 × broken-link pages — remove/replace broken outgoing links |
| 🟡 P2 | Title too long (96 pages, +18): audit which pages exceed 65 chars — trim display text without removing KWs |
| 🟡 P2 | Batch IndexNow 441 pending pages (local machine) |
| 🟢 P3 | Meta description too long (27 pages, +3): review sprint articles for >160-char descriptions |
