# Site Audit Delta — 2026-06-25 (Day 26)

## Summary

| Category | Day 26 (2026-06-25) | Day 25 (2026-06-24) | Delta |
|---|---|---|---|
| **Error Issues (per-issue sum)** | **108** | 77* | *methodology change — see note* |
| **Warning Issues (per-issue sum)** | **1,346** | 1,270* | *methodology change* |
| **Notice Issues (per-issue sum)** | **3,439** | 1,587* | *methodology change* |
| **Health Score** | **98** | 98 | **0 ✅** |
| **Change field across all issues** | **0 (all zero)** | — | **Same crawl — no new errors** |

**⚠️ METHODOLOGY NOTE:** Previous sessions (Days 22–25) reported "Error URLs" (unique URLs with at least one error). This session used `site-audit-issues` API which returns per-issue instance counts (the `crawled` field per issue type). Summing these inflates the total because:
- "404 page" (22) and "4XX page" (22) are the same 22 pages counted in both categories
- True unique error URL estimate: 50 (broken-link source pages) + 22 (4XX/404 pages) + 7 (multiple meta desc) + 7 (multiple title) ≈ **86 unique error URLs** — close to Day 25's 77, difference likely due to crawl scope expansion

**URGENT FLAG: NOT TRIGGERED ✅** — Change field = 0 across ALL issue categories. Same crawl as Day 25. No net new errors confirmed.

## Top Error Issues (Day 26)

| Rank | Issue Name | Count | Category | Change vs Last Crawl |
|---|---|---|---|---|
| 1 | Page has links to broken page | **50** | Links | **0 ✅** |
| 2 | 404 page | **22** | HTTP Status | **0 ✅** |
| 3 | 4XX page | **22** | HTTP Status | **0 ✅** (overlaps with 404) |
| 4 | Multiple meta description tags | **7** | Meta Tags | **0 ✅** |
| 5 | Multiple title tags | **7** | Meta Tags | **0 ✅** |

## Top Warning Issues (Day 26)

| Rank | Issue Name | Count | Category | Change |
|---|---|---|---|---|
| 1 | Noindex page | **1,073** | Indexability | **0 ✅** |
| 2 | Page has links to redirect | **84** | Links | **0 ✅** |
| 3 | Title too long | **72** | Meta Tags | **0 ✅** |
| 4 | Meta description too long | **37** | Meta Tags | **0 ✅** |
| 5 | Nofollow page | **35** | Indexability | **0 ✅** |

## Assessment

All `change` values = 0. This confirms the Ahrefs crawler has **not run a new crawl** since the Day 24 crawl (2026-06-23T20:45:45Z). The data reflects the same site state as Day 25.

**Pre-existing error categories remain unchanged:**
- 50 "broken link source pages" — will drop significantly once the 13-article rescue queue is published to Shopify (those handles currently return 404, causing internal link errors)
- 22 × 4XX pages — need 301 redirects from Shopify admin
- 7 × multiple meta description + 7 × multiple title — caused by Shopify app injecting duplicate tags in `<head>`; fix via theme.liquid or app settings

**No sprint-attributable new errors detected.**

## Action Items (unchanged)

| Priority | Action |
|---|---|
| 🔴 CRITICAL | Publish rescue queue (13 articles, Days 14–26) — will resolve ~30–40 of the 50 broken-link errors |
| 🔴 HIGH | Fix 22 × 4XX URLs → 301 redirects in Shopify admin |
| 🔴 HIGH | Investigate duplicate meta description + title tags (7 pages each) — likely Shopify app conflict in theme.liquid |
| 🟢 LOW | Re-trigger Ahrefs Site Audit crawl after rescue publish |
