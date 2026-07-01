# CNC Electric — Site Audit Delta — 2026-07-01 (Day 32)

## Source: mcp__Ahrefs__site-audit-issues — project_id: 9621894

## Summary

| Category | Day 32 (2026-07-01) | Day 31 (2026-06-30) | Delta | Flag |
|---|---|---|---|---|
| **4XX / 404 pages (Error)** | **22** | 22 | **0** | — |
| **Multiple meta description tags (Error)** | **7** | 7 | **0** | — |
| **Multiple title tags (Error)** | **7** | 7 | **0** | — |
| **SERP title changed (Notice)** | **2** | 4 | **-2 ✅ IMPROVEMENT** | Google reverted 2 title rewrites |
| **Page and SERP titles do not match (Notice)** | **44** | 43 | **+1** | Minor increase |
| **Title too long (Warning)** | **75** | 72 | **+3 new** | ⚠️ 3 new long titles detected |
| **Meta description too long (Warning)** | **40** | 37 | **+3 new** | ⚠️ 3 new long meta descriptions |
| **Schema.org validation error (Notice)** | **1562 crawled, 12 new** | ~1550 | **+12 new** | Notice level — Shopify schema pages |
| **Noindex follow page (Notice)** | **1047 crawled, +9 new** | ~1038 | **+9 new** | Normal Shopify tag/collection pages |
| **Noindex page (Warning)** | **1082 crawled, +9 new** | ~1073 | **+9 new** | Normal Shopify pagination/filters |
| **Pages to submit to IndexNow (Notice)** | **5 new (+5)** | 0 | **+5** | Ahrefs detected 5 pages needing IndexNow ping |
| **CSS file size too large (Warning)** | 1 | 1 | 0 | Stable |
| **Nofollow page (Warning)** | 35 | 35 | 0 | Stable |
| **Multiple H1 tags (Notice)** | 20 | 20 | 0 | Stable |

## URGENT Flag Assessment

**URGENT: NOT TRIGGERED ✅**

No Error-level category grew by more than 10.

Largest changes:
- Schema.org validation error: +12 new (Notice level — below Error threshold, and a Notice category)
- Title too long: +3 new (Warning level)
- Meta description too long: +3 new (Warning level)

## Key Observations

**SERP title changed: -2 (Day 32) vs +1 cumulative on Day 31**
Google has reverted 2 of the previously rewritten buying guide titles back to original tag values. Current count: 2 pages where Google's SERP title differs from the original title tag. Net improvement from the 4 cumulative count on Day 31. Trend: positive — suggests keyword-first title format used in recent articles (Days 28-32) is being accepted by Google without rewrite.

**Title too long +3 new (now 75 total):**
Three new long-title pages detected since Day 31. Likely: newly crawled Shopify generated pages (tag pages, collection filter combinations) with auto-generated titles combining product name + category + brand. Not sprint-attributable (buying guide titles are H1s, not Shopify collection page titles). Monitor.

**Meta description too long +3 new (now 40 total):**
Same pattern — Shopify auto-generated meta descriptions for collection filter pages. Not sprint-attributable.

**Pages to submit to IndexNow (+5):**
Ahrefs detected 5 pages as candidates for IndexNow submission. IndexNow API is blocked from cloud IP (HTTP:000 pattern matching Shopify push failures). These should be submitted during the rescue push session from local machine.

**Schema.org validation errors (+12 new):**
1562 total pages with schema.org errors, 12 new since last crawl. These are likely Shopify-generated Product schema pages (Shopify's auto-generated Product schema occasionally has validation issues). Not sprint-attributable — buying guide articles use custom Article + FAQPage schema which is validated before commit.

## Action Items

1. During rescue push session: batch-submit 5 IndexNow pages
2. During rescue push session: investigate 3 new long title pages and 3 new long meta description pages (likely Shopify collection filters — may not be actionable)
3. Monitor SERP title changed count — currently at 2, target is 0. Use keyword-first title format for all new articles (already implemented Days 28+)
4. Investigate 12 new schema.org validation errors — run GSC Rich Results Test on affected pages during next local session
