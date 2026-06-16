# Site Audit Error Delta — 2026-06-16 (Day 17)

## Summary Table

| Category | Today (2026-06-16) | Yesterday (2026-06-15) | Delta |
|---|---|---|---|
| **Errors** | **75** | **75** | **0 — STABLE ✅** |
| **Warnings** | **1,060** | **1,048** | **+12 ⚠️ (within threshold)** |
| **Notices** | ~2,700 (estimated — crawl lag) | 2,681 | ~+19 |

**Crawl date (latest completed):** 2026-06-15T21:19:33Z
**Health score:** 98 / 100
**Total crawled pages:** 2,782

## Top Error Categories (crawled > 0)

| Issue | Importance | Count | Change vs yesterday |
|---|---|---|---|
| Page has links to broken page | Error | **31** | 0 |
| 404 page | Error | **22** | 0 |
| 4XX page | Error | **22** | 0 |

**Total error instances: 75 — UNCHANGED ✅**

## Top Warning Categories

| Issue | Importance | Count | Change |
|---|---|---|---|
| Noindex page | Warning | **806** | **+6** |
| Title too long | Warning | **99** | **+3** |
| Page has links to redirect | Warning | **68** | 0 |
| Nofollow page | Warning | **35** | 0 |
| Meta description too long | Warning | **27** | 0 |
| 3XX redirect | Warning | **17** | 0 |
| Slow page | Warning | **7** | **+3** |
| CSS file size too large | Warning | **1** | 0 |

**Total warning instances: 1,060 (+12 vs yesterday)**

## URGENT Flag Assessment

**Net new errors > 10 threshold: NOT triggered ✅**
- Total errors unchanged at 75
- Warning increase of +12 is below threshold
- Noindex +6 = Shopify facet/tag pages auto-generated (expected)
- Title too long +3 = sprint guides with keyword-dense titles (correct SEO strategy)
- Slow page +3 ⚠️ = new entry; possible image-heavy rescue articles loading. Monitor next 3 sessions.

## Sprint Error Trajectory

| Date | Errors | Warnings | Notes |
|---|---|---|---|
| 2026-06-09 | 577 | ~800 | Pre-sprint baseline (mass broken links) |
| 2026-06-10 | 75 | ~950 | v7 cross-link fix applied |
| 2026-06-14 | 75 | 999 | Stable |
| 2026-06-15 | 75 | 1,048 | Stable |
| **2026-06-16** | **75** | **1,060** | **Stable ✅** |

**87% error reduction maintained (577 → 75). Sprint cross-link fix holding.**

## Action Items

| Priority | Issue | Count | Action |
|---|---|---|---|
| 🟡 P2 | Page has links to broken page | 31 | Local machine: 301 redirect fixes in Shopify admin |
| 🟡 P2 | 404 / 4XX pages | 22 | Local machine: redirect to nearest live URL |
| 🟢 P3 | Slow page (+3) | 7 | Monitor next session — may resolve as CDN caches article |
| 🟢 P3 | Title too long (+3) | 99 | Sprint strategy (keyword-dense) — acceptable at DR 10 |
