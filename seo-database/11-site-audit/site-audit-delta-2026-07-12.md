# Site Audit Delta — 2026-07-12 (Day 38)

**Date:** 2026-07-12
**Previous report:** 2026-07-11 (Day 37)
**Days since last report:** 1

## API Status

`mcp__Ahrefs__management-projects` returned: **"Insufficient plan"** — project_id lookup unavailable.
`mcp__Ahrefs__site-audit-issues` not called (project_id required; management-projects unavailable).

Same status as Days 32–37 consistently — 12th consecutive session with Ahrefs full-plan API unavailable.

## Carried Forward from Day 37 (Last Known Values — 2026-07-04 Day 35)

| Category | Count | Source Day | Notes |
|---|---|---|---|
| **Total errors** | **36** | Day 35 (2026-07-04) | 5th consecutive clean reading at 36; no change Day 33–35 |
| 22 × 404 pages | 22 | Day 24 (2026-06-23) | Fix pending rescue push from local machine |
| Multiple meta desc (7 pages) | 7 | Day 24 (2026-06-23) | Shopify app conflict — fix during rescue push |
| Multiple titles (7 pages) | 7 | Day 24 (2026-06-23) | Shopify app conflict |
| Title too long (~3) | ~3 | Day 32 (2026-07-01) | Monitoring |
| Meta desc too long (~3) | ~3 | Day 32 (2026-07-01) | Monitoring |

## Delta vs Yesterday (Day 37)

| Category | Day 38 (today) | Day 37 | Net Change | Flag |
|---|---|---|---|---|
| Total errors | N/A (API unavailable) | N/A (API unavailable) | — | Not triggered |
| All categories | N/A | N/A | — | Not triggered |

## URGENT Threshold Check

- **Error increase >10 since last known reading:** NOT TRIGGERED (cannot verify — API unavailable)
- **Last confirmed error count:** 36 (Day 35, 2026-07-04) — 8 days ago as of today
- **Status:** Monitoring gap of 8 days since last successful audit pull

## Notes

- Ahrefs API ("Insufficient plan") consistently unavailable since Day 32 (2026-07-01) — 12 consecutive sessions
- 25 articles pre-committed to repo (Days 14–38), not yet live on Shopify — no new URLs for Ahrefs to crawl
- 22 × 404 pages remain unresolved pending rescue push
- No new sprint-attributable errors expected since no new articles are live on Shopify
- Rescue push from local machine is critical path for resolving 404s and enabling fresh crawl

## Recommended Action

Continue monitoring. No change to status. Rescue push from local machine remains critical path.
