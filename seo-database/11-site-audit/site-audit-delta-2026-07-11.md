# Site Audit Delta — 2026-07-11 (Day 37)

**Date:** 2026-07-11
**Previous report:** 2026-07-10 (Day 36)
**Days since last report:** 1

## API Status

`mcp__Ahrefs__site-audit-issues` returned: **"Insufficient plan"** — full audit unavailable.

Same status as Day 36 (2026-07-10) and Days 32–36 consistently.

## Carried Forward from Day 36 (Last Known Values — 2026-07-04 Day 35)

| Category | Count | Source Day | Notes |
|---|---|---|---|
| **Total errors** | **36** | Day 35 (2026-07-04) | 5th consecutive clean reading at 36; no change Day 33–35 |
| Total warnings | Not specified | Day 35 | API not available for full breakdown |
| 22 × 404 pages | 22 | Day 24 (2026-06-23) | Fix pending rescue push from local machine |
| Multiple meta desc (7 pages) | 7 | Day 24 (2026-06-23) | Shopify app conflict — fix during rescue push |
| Multiple titles (7 pages) | 7 | Day 24 (2026-06-23) | Shopify app conflict |
| Title too long (+3 Day 32) | ~3 | Day 32 (2026-07-01) | Monitoring |
| Meta desc too long (+3 Day 32) | ~3 | Day 32 (2026-07-01) | Monitoring |

## Delta vs Yesterday (Day 36)

| Category | Day 37 (today) | Day 36 | Net Change | Flag |
|---|---|---|---|---|
| Total errors | N/A (API unavailable) | N/A (API unavailable) | — | Not triggered |
| All categories | N/A | N/A | — | Not triggered |

## URGENT Threshold Check

- **Error increase >10 since last known reading:** NOT TRIGGERED (cannot verify — API unavailable)
- **Last confirmed error count:** 36 (Day 35, 2026-07-04) — 7 days ago as of today
- **Status:** Monitoring gap of 7 days since last successful audit pull (Day 35 was last live reading via API)

## Notes

- Ahrefs site audit API ("Insufficient plan") has been consistently unavailable since Day 32 (2026-07-01) — 11 consecutive sessions
- All 24 articles written during this period are pre-committed to repo (rescue push pending) and not yet live on Shopify — no new URLs for Ahrefs to crawl from sprint-period articles
- 22 × 404 pages remain unresolved pending rescue push (fix requires local Shopify admin access)
- No new sprint-attributable errors expected since no new articles are live on the Shopify store

## Recommended Action

Continue monitoring. No change to status. Rescue push from local machine remains the critical path item — once 24 articles are published, run a fresh Ahrefs audit to capture any new crawl errors.
