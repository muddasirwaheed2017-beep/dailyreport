# Site Audit Delta — 2026-07-18 — Day 44

## API Status
- `mcp__Ahrefs__site-audit-projects` → "Insufficient plan" (18th consecutive session)
- `mcp__Ahrefs__site-audit-issues` → Not called (project_id unavailable without projects list)

## Error Count Delta
| Metric | Today (2026-07-18) | Yesterday (2026-07-17) | Delta |
|---|---|---|---|
| Total errors | N/A (API unavailable) | N/A | — |
| Total warnings | N/A | N/A | — |
| Total notices | N/A | N/A | — |
| Last known reading | 36 errors (Day 35, 2026-07-04) | 36 errors | 0 (14-day gap) |

## URGENT Flag
- NOT TRIGGERED ✅ — cannot confirm increase; no live data available for 18 consecutive sessions

## Top Error Categories (Carried Forward from Day 35)
1. Missing meta description — estimated 8–12 pages
2. Broken internal links (pre-sprint-attributable) — estimated 6–10
3. Missing alt text on images — estimated 5–8 pages
4. Thin content pages — estimated 3–5
5. Duplicate title tags — estimated 2–4

## Notes
- Sprint-attributable 404 errors (wrong handle slugs) were fixed in Day 10 session (2026-06-09).
- 30 articles (Days 14–43) are pre-committed but not yet live on Shopify — not crawlable by Ahrefs.
- When rescue push is executed from local machine, expect a new crawl with 30+ new pages indexed.
- Ahrefs site audit API access requires Ahrefs plan upgrade. Current plan: "Insufficient" for all site-audit endpoints.

## Action Required
- Owner: Upgrade Ahrefs plan or check billing status to restore site-audit-projects access.
- After rescue push: Trigger new Ahrefs crawl manually from Ahrefs dashboard.
