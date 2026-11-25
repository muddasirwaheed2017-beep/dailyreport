# Site Audit Delta — 2026-11-25 (Day 170)

**Source:** mcp__Ahrefs__site-audit-issues, project_id=9621894 (live data)

## Error Summary

| Issue Level / Category | D169 (2026-11-24) | D170 (2026-11-25) | Delta | Flag |
|---|---|---|---|---|
| Errors — 4XX pages (404) | 21 | **21** | 0 | ✅ Stable |
| Errors — Image file size too large | 14 | **14** | 0 | ✅ Stable |
| All other Errors | 0 | **0** | 0 | ✅ CLEAN |
| **Total Errors** | **35** | **35** | **0** | **✅ STABLE** |
| Warnings — Title too long | 84 | **84** | 0 | ✅ Stable |
| Warnings — Meta description too long | 52 | **52** | 0 | ✅ Stable |
| Warnings — Slow server response for AI crawlers | 1 (NEW D169) | **0** | **-1 RESOLVED ✅** | ✅ FIXED |
| Sprint-attributable broken links | 0 | **0** | 0 | ✅ |
| URGENT flag (errors net +>10) | ❌ | ❌ | — | — |
| Consecutive clean link days | 94 | **95** | +1 | ✅ |

## Key Finding D170

- **AI crawler slow response warning RESOLVED**: The new warning flagged on D169 ("Slow server response for AI crawlers", change: -1, removed: 1) has been resolved by D170's crawl. No action needed.
- **Total errors remain stable at 35** (21 × 4XX + 14 × image too large). Both are pre-existing issues unrelated to sprint activity.
- **No URGENT flag** — no error category grew by more than 10.

## Notices (stable, no action)
- Article page missing Article schema: 7 (stable)
- Category page missing ItemList schema: 2 (stable)
- Structured data schema.org validation error: 1,621 (stable — Shopify theme limitation)
- Noindex follow page: 1,065 (stable — Shopify collection/tag pages)
- Multiple H1 tags: 13 (stable)
- Meta description too long (warning): 52 (stable)
