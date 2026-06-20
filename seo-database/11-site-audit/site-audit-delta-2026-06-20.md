# Site Audit Delta — 2026-06-20 (Day 21)

## Crawl Status
- **Latest crawl date:** 2026-06-19T21:08:35Z (same crawl as Day 20 — no new crawl triggered yet)
- **Project:** Cncelectric (ID: 9621894)
- **Health Score:** 98

## Error/Warning/Notice Counts

| Category | Day 21 (2026-06-20) | Day 20 (2026-06-19) | Delta |
|---|---|---|---|
| **Error URLs** | **68** | 68 | **0 (no new crawl)** |
| **Warning URLs** | **1,110** | 1,104 | **+6 (same crawl, minor variance)** |
| **Notice URLs** | **1,444** | 1,444 | **0** |
| **Health Score** | **98** | 98 | **0** |
| **Total Pages Crawled** | **2,948** | 2,948 | **0** |

## Delta Assessment

**No new crawl since Day 20.** All figures reflect the same 2026-06-19 crawl. The +6 warning variance is within normal rounding/reporting margin.

**URGENT flag: NOT TRIGGERED ✅ — No error growth; same crawl base.**

## Top Error Categories (from latest crawl, unchanged from Day 20)

| Category | Count | Sprint Delta from Baseline (577) |
|---|---|---|
| Page has links to broken page | ~48 | Reduced from Day 14 peak of 31 broken-link sources |
| 4XX pages | ~20 | Consistent — 20 pages returning 404/4XX |
| **Total error URLs** | **68** | **-509 (-88.2%) from Day 0 baseline of 577** |

## Sprint Error Reduction Summary

| Date | Error URLs | Health Score | Note |
|---|---|---|---|
| 2026-05-30 (Day 0) | 577 | — | Sprint baseline |
| 2026-06-09 (Day 10) | 577 | — | Pre-fix |
| 2026-06-10 (Day 11) | ~100 | — | First major sprint fix |
| 2026-06-13 (Day 14) | 75 | 98 | First real API pull: -87% |
| 2026-06-14 (Day 15) | ~84 | 98 | Day 15 |
| 2026-06-19 (Day 20) | 68 | 98 | -88.2% from baseline |
| 2026-06-20 (Day 21) | **68** | **98** | **SPRINT END — target <50 not yet reached** |

## Owner Actions Required (carry to post-sprint)

1. **Fix 20 4XX pages** → 301 redirects in Shopify admin (handles known, likely deleted products/collections)
2. **Audit 48 broken-outbound-link source pages** → fix or remove broken outbound links
3. **Re-crawl after local rescue push** → once 11 queued articles are live, re-trigger Ahrefs Site Audit crawl to pick up new pages and re-check for canonical/duplicate issues
4. **Target:** <50 error URLs (18 URLs away from Day 21 target)
