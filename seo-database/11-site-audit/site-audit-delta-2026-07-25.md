# Site Audit Delta — 2026-07-25 (Day 51)

## API Status
`mcp__Ahrefs__site-audit-projects` → "Insufficient plan" — 25th consecutive session
`mcp__Ahrefs__site-audit-issues` → Not called (project_id required from projects endpoint — unavailable)

## Metrics (Carried Forward)

| Metric | Today (2026-07-25) | Yesterday (2026-07-24) | Delta |
|---|---|---|---|
| Total errors | N/A (API unavailable) | N/A | — |
| Total warnings | N/A | N/A | — |
| Total notices | N/A | N/A | — |
| Last confirmed reading | 36 errors (Day 35, 2026-07-04) | 36 errors | 0 (21-day gap) |

## Top Error Categories (Last Confirmed — Day 35, 2026-07-04)
Data not available for today. Last confirmed: 36 errors total.

## URGENT Flag
NOT TRIGGERED ✅ — No new data available. 21-day gap in site audit data.

## Notes
- Ahrefs "Insufficient plan" blocks site-audit-projects and site-audit-issues for 25 consecutive sessions.
- Last confirmed crawl: Day 35 (2026-07-04) — 36 errors.
- Sprint-attributable 577-error root cause (wrong handles in cross-links) has been fixed via v7 Step 4.6 verification since Day 13.
- 38 articles pre-committed but not yet pushed to Shopify — these articles are not indexed and therefore not crawlable by Ahrefs. Site audit error count may be artificially low due to these articles being absent from live site.
- Rescue push from local machine is critical to get accurate audit data for these 38 articles.
- Action: Upgrade Ahrefs plan to restore site-audit MCP access.
