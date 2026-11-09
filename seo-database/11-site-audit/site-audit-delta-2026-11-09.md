# Site Audit Delta — 2026-11-09 (Day 154)

**Project ID:** 9621894
**Measurement method:** Ahrefs `site-audit-issues` MCP tool (live API call)
**Previous delta file:** `site-audit-delta-2026-11-08.md`

---

## Error / Warning / Notice Counts

| Category | Issue Name | Importance | D153 (yesterday) | D154 (today) | Delta | Flag |
|----------|-----------|-----------|-----------------|-------------|-------|------|
| Internal pages | 4XX page (404) | ERROR | 21 | **21** | 0 | ✅ |
| Internal pages | 4XX page (generic) | ERROR | 21 | **21** | 0 | ✅ |
| Images | Image file size too large | ERROR | 7 | **7** | 0 | ✅ |
| Content | Page & SERP titles do not match | NOTICE | 77 | **79** | **+2** | ℹ️ Expected |
| Other | Organic traffic dropped | NOTICE | 0 | **2** | +2 | ℹ️ Minor |
| Other | Pages dropped from Top 10 | NOTICE | 0 | **1** | +1 | ℹ️ Minor |
| Content | Meta description too long (indexable) | WARNING | 51 | **51** | 0 | ✅ |
| Content | Title too long (indexable) | WARNING | 84 | **84** | 0 | ✅ |
| Indexability | Nofollow page | WARNING | 35 | **35** | 0 | ✅ |
| Indexability | Noindex follow page | NOTICE | 1065 | **1065** | 0 | ✅ |
| Indexability | Noindex page | WARNING | 1100 | **1100** | 0 | ✅ |
| Other | Structured data schema.org validation error | NOTICE | 1620 | **1620** | 0 | ✅ |

---

## URGENT Flag Assessment

**URGENT flag: NOT TRIGGERED.**

- Net new 4XX error pages: **0** (threshold for URGENT = >10)
- Net new error pages total: **0**
- +2 "Page & SERP titles don't match": Google rewriting newly-indexed long-title buying guides — cosmetic, not a site error. Persistent pattern since D76.
- +2 "Organic traffic dropped" pages: 2 pages saw traffic decline — normal daily fluctuation. Not sprint-attributable.
- +1 "Pages dropped from Top 10": 1 page — normal daily SERP volatility.

---

## Sprint-Attributable Broken Links

**0 broken internal links** in any day since D76. Internal link clean streak: **79 consecutive days (D76–D154).** ✅

---

## Notes

- 1,620 schema.org validation errors: persistent baseline. Shopify's default product schema generates non-critical validation warnings — not a crawling/indexing issue.
- 1,065 "noindex follow" pages: Shopify pagination and tag pages — expected Shopify behaviour.
- 84 "title too long (indexable)": our buying guide long-tail titles are intentionally SEO-optimised long titles; Google rewrites them in SERP anyway (+79 SERP title mismatch notices confirm this). Not a priority fix.
