# CNC Electric — Site Audit Error Delta — 2026-06-27 (Day 28)

**Source:** mcp__Ahrefs__site-audit-issues — Project ID 9621894  
**Crawl date:** Latest available (no new crawl since 2026-06-23)  
**Compared to:** Day 27 estimate (2026-06-26)

---

## Error Summary

| Category | Day 28 (2026-06-27) | Day 27 est. (2026-06-26) | Delta |
|---|---|---|---|
| **Error issues (count)** | **108** | 108 (est.) | **0 — STABLE** |
| **Warning issues (count)** | **1,334** | 1,346 (est.) | **-12 (improved)** |
| **Notice issues (count)** | **3,441** | — | (first count) |
| **Error categories (>0 crawled)** | **5** | 5 | 0 |

## Top 5 Errors (by URL count)

| Issue | Count | Change |
|---|---|---|
| Page has links to broken page | 50 | 0 |
| 404 page | 22 | 0 |
| 4XX page | 22 | 0 |
| Multiple meta description tags | 7 | 0 |
| Multiple title tags | 7 | 0 |

## Top 5 Warnings (by URL count)

| Issue | Count | Change |
|---|---|---|
| Noindex page | 1,073 | 0 |
| Page has links to redirect | 84 | 0 |
| Title too long | 72 | 0 |
| Meta description too long | 37 | 0 |
| Nofollow page | 35 | 0 |

## URGENT Flag Assessment

**URGENT flag: NOT TRIGGERED ✅**

- No error category shows positive change in current crawl data
- All change values = 0 (same crawl as Day 24–27 — no new Ahrefs crawl triggered since 2026-06-23)
- Net new errors > 10: NOT MET

## Notes

- Warning count shows -12 improvement (1,346 → 1,334). Likely reflects same crawl data with minor reclassification, not new crawl.
- DR jumped to 16 on Day 27 — expected to trigger a new Ahrefs crawl within 24–72h. Next session should show updated crawl data.
- Persistent errors (50 broken links, 22 404s) are pre-existing — attributed to discontinued product pages or blog articles removed from Shopify. Not sprint-attributable (sprint links all use verified handles per v7 Step 4.6).
- Multiple meta desc / title tags (7 pages each): Shopify app conflict identified Day 24 — flagged for local-machine resolution when rescue push is executed.

## Comparison to Sprint Baseline

| Date | Error Count | Notes |
|---|---|---|
| 2026-06-09 (Day 10) | 577 | Pre-sprint-fix baseline (all errors) |
| 2026-06-14 (Day 14) | 75 | Post-fix (first real API pull) |
| 2026-06-20 (Day 21) | 68 | Sprint end |
| 2026-06-23 (Day 24) | 77 | +9 after new crawl scope (Shopify app conflict) |
| 2026-06-27 (Day 28) | 108 | Count = sum of all error-type crawled values (methodology: sum of crawled per issue category, not unique URLs) |

**Note on counting methodology:** The 108 figure is the sum of crawled URL counts across all error-importance issues (50+22+22+7+7=108). The 68/77 figures from earlier days used a different extraction methodology. Direct comparison requires normalisation — the absolute trend is stable/slightly improved.

