# Site Audit Error Delta — 2026-07-13 (Day 39)

## API Status
- `mcp__Ahrefs__site-audit-projects` — "Insufficient plan" (13th consecutive day)
- `mcp__Ahrefs__site-audit-issues` — not called (requires project_id from site-audit-projects)
- `mcp__Ahrefs__management-projects` — not tested (pattern: "Insufficient plan")

## Error Counts
| Metric | 2026-07-13 | 2026-07-12 | Delta |
|---|---|---|---|
| Total Errors | N/A (API unavailable) | N/A (API unavailable) | — |
| Total Warnings | N/A | N/A | — |
| Total Notices | N/A | N/A | — |

## Top 5 Error Categories
All N/A — API unavailable.

## Last Known State
- Last confirmed error count: **36 errors** (Day 35, 2026-07-04) — 9 days ago
- Sprint baseline error count (Day 11, 2026-06-10): fixed 577 → 36 on Day 11; stable since
- Urgent flag: NOT TRIGGERED (no live data to compare)

## History
| Date | Errors | Warnings | Source |
|---|---|---|---|
| 2026-07-04 (Day 35) | 36 | N/A | Last live reading |
| 2026-07-05 to 2026-07-13 | N/A | N/A | API unavailable |

## Notes
- 13 consecutive sessions with "Insufficient plan" on site-audit API
- Ahrefs plan type does not include site-audit-projects endpoint
- Sprint recommendation: check Ahrefs subscription plan for site audit access
- DR endpoint (public-domain-rating-free) remains available at zero API cost
