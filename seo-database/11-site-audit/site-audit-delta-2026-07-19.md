# Site Audit Delta — 2026-07-19 — Day 45

## API Status
- `mcp__Ahrefs__site-audit-projects`: "Insufficient plan" — 19th consecutive session without live data
- `mcp__Ahrefs__site-audit-issues`: Not called (project_id unknown without site-audit-projects response)

## Delta vs Yesterday (2026-07-18)

| Metric | Today (2026-07-19) | Yesterday (2026-07-18) | Delta |
|---|---|---|---|
| Total errors | N/A (API unavailable) | N/A | — |
| Total warnings | N/A | N/A | — |
| Total notices | N/A | N/A | — |
| Last confirmed reading | 36 errors (Day 35, 2026-07-04) | 36 errors | 0 (15-day gap) |

## URGENT Flag
**NOT TRIGGERED ✅** — no live data available, cannot confirm any increase or decrease.

## Context
- 577 errors found on 2026-06-09 (Day 10) — sprint-attributable portion fixed 2026-06-10 (wrong handle slugs in cross-links)
- Last confirmed reading: 36 errors on 2026-07-04 (Day 35) — significant improvement from 577
- 31 articles pre-committed (Days 14–44) but NOT live on Shopify — these pages cannot generate crawl errors until rescue-pushed and indexed
- Once rescue push executes and articles are live, expect a new crawl that may surface article-level issues (missing images, etc.) — monitor post-rescue

## Action Required
- Upgrade Ahrefs plan to restore site-audit-projects API access
- Execute rescue push (Days 14–44 articles) from local machine, then trigger new site audit crawl
- Register free Ahrefs API key before 2026-08-01 (public-domain-rating-free deprecation warning)
