# Site Audit Delta — 2026-07-26 (Day 52)

## API Status
`mcp__Ahrefs__site-audit-projects` → "Insufficient plan" — 26th consecutive session
`mcp__Ahrefs__site-audit-issues` → Not called (project_id required from projects endpoint — unavailable)

## Metrics (Carried Forward)

| Metric | Today (2026-07-26) | Yesterday (2026-07-25) | Delta |
|---|---|---|---|
| Total errors | N/A (API unavailable) | N/A | — |
| Total warnings | N/A | N/A | — |
| Total notices | N/A | N/A | — |
| Last confirmed reading | 36 errors (Day 35, 2026-07-04) | 36 errors (carried forward) | 0 (22-day gap) |

## Top Error Categories (Last Confirmed — Day 35, 2026-07-04)
Data not available for today. Last confirmed: 36 errors total (22-day gap since last reading).

## URGENT Flag
NOT TRIGGERED ✅ — No new data available. 22-day gap in site audit data.

## Notes
- Ahrefs "Insufficient plan" blocks site-audit-projects and site-audit-issues for 26 consecutive sessions (Days 27–52).
- Last confirmed crawl: Day 35 (2026-07-04) — 36 errors.
- 39 articles pre-committed but not yet pushed to Shopify (Days 14–52). These articles are absent from live site and therefore not crawlable by Ahrefs. Site audit error count may be artificially low.
- Sprint-attributable 577-error root cause (wrong handles in cross-links) fixed via v7 Step 4.6 verification since Day 13.
- Rescue push from local machine is critical to get accurate audit data for these 39 articles.
- Action required: Upgrade Ahrefs plan to restore site-audit MCP access OR use Screaming Frog locally to audit live site directly.
