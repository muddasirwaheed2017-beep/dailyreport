# Site Audit Error Delta — 2026-06-14 (Day 15)

## Method: Ahrefs site-audit-issues MCP (project_id: 9621894)

---

## Summary Totals

| Category | Today (2026-06-14) | Yesterday (2026-06-13) | Delta |
|----------|-------------------|----------------------|-------|
| Errors | **75** | 75 | **0 — STABLE ✅** |
| Warnings | **999** | 1,000 | **-1 ✅** |
| Notices | **2,563** | 3,002 | **-439 ✅ Improving** |

**No net new errors. No URGENT flag triggered (delta threshold: >10 new errors).**

---

## Error Breakdown (all change=0 — pre-existing site debt, not sprint-attributable)

| Importance | Issue | Pages | Change vs Yesterday |
|------------|-------|-------|---------------------|
| **Error** | Page has links to broken page | **31** | **0** |
| **Error** | 404 page | **22** | **0** |
| **Error** | 4XX page | **22** | **0** |

**Total error instances: 75 (3 categories)**

---

## Warning Breakdown (top 7)

| Importance | Issue | Pages | Change |
|------------|-------|-------|--------|
| Warning | Noindex page | 776 | 0 |
| Warning | Title too long | 78 | 0 |
| Warning | Page has links to redirect | 68 | 0 |
| Warning | Nofollow page | 35 | 0 |
| Warning | Meta description too long | 24 | 0 |
| Warning | 3XX redirect | 17 | 0 |
| Warning | CSS file size too large | 1 | 0 |

**Total warning instances: 999 (7 categories)**

---

## Notice Improvements

Notices improved by **-439** since yesterday. This is consistent with Ahrefs re-crawling recently published content and resolving indexing notices as pages get discovered by search engines.

---

## Sprint Context

| Date | Errors | Warnings | Notices | Notes |
|------|--------|----------|---------|-------|
| 2026-06-09 | 577 | — | — | Pre-sprint baseline (sprint-attributable broken links) |
| 2026-06-10 | ~6 est. | — | — | Sprint-attributable errors fixed |
| 2026-06-13 | 75 | 1,000 | 3,002 | First full API pull |
| **2026-06-14** | **75** | **999** | **2,563** | **Today — stable errors, notices improving** |

**Cumulative error reduction: 577 → 75 = 87% reduction since sprint start.**

---

## Recommendations

| Priority | Action |
|----------|--------|
| 🔴 P1 | Fix 22 × 404 pages — set up 301 redirects in Shopify admin (local machine required) |
| 🔴 P1 | Fix 31 × broken-link pages — remove/replace broken outgoing links in source articles |
| 🟡 P2 | Batch IndexNow 441 pending pages (local machine required) |
| 🟢 P3 | Title-too-long: 78 pages to review — lower priority |
