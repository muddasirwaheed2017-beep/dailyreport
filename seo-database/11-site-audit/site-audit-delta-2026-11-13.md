# Site Audit Delta — 2026-11-13 (Day 158)

**Source:** mcp__Ahrefs__site-audit-issues, project_id=9621894
**Pull:** Live (Ahrefs MCP working ✅)
**Previous:** site-audit-delta-2026-11-12.md (D157)

---

## Issue Count Summary

| Issue Level | D157 (2026-11-12) | D158 (2026-11-13) | Delta | Flag |
|-------------|------------------|------------------|-------|------|
| Errors (crawled > 0) | 21 (4XX) + 7 (img) = 28 total | **28** | 0 | ✅ Stable |
| Warnings (significant) | 84 (title long) + 51 (meta desc long) + 1 (H1 missing) = 136 | **136** | 0 | ✅ Stable |
| Notices (key) | 1620 (schema.org) + 1100 (noindex) + 82 (title/SERP) + 13 (multi H1) = 2815 | **2815** | 0 | ✅ Stable |

**URGENT trigger (net new errors > 10): NOT TRIGGERED ✅**

---

## Detailed Issue Table

| Issue | D157 | D158 | Change | Category | Flag |
|-------|------|------|--------|----------|------|
| 4XX pages (404) | 21 | **21** | 0 | Internal pages | ✅ |
| 4XX page receives organic traffic | 0 | **0** | 0 | Error | ✅ |
| Image file size too large | 7 | **7** | 0 | Images | ✅ |
| Missing alt text | 0 | **0** | 0 | Images | ✅ |
| Title too long | 84 | **84** | 0 | Content | ✅ |
| Meta description too long | 51 | **51** | 0 | Content | ✅ |
| H1 tag missing or empty (indexable) | 1 | **1** | 0 | Content | ⚠️ Persist (D157 new) |
| H1 tag changed | — | — | -1 (resolved) | Content | ✅ Improved |
| Noindex page | 1100 | **1100** | 0 | Indexability | ✅ (pagination) |
| Schema.org validation error | 1620 | **1620** | 0 | Structured Data | ✅ Stable |
| Page & SERP title mismatch | 82 | **81** | -1 | Content | ✅ Improved |
| Organic traffic dropped | 12 (D157 new) | **0** | -12 | Other | ✅ **RESOLVED — was temporary fluctuation as predicted** |
| Pages dropped from Top 10 | 1 | **0** | -1 | Other | ✅ **RESOLVED** |
| Sprint-attributable broken links | 0 | **0** | 0 | Links | ✅ |
| Changed pages not submitted to IndexNow | — | 0 | -1 | AI Discoverability | ✅ Improved |

---

## Key Observations

**POSITIVE: D157 notices resolved.**
Both "Organic traffic dropped" (+12 pages in D157) and "Pages dropped from Top 10" (+1 in D157) have fully reversed in D158. This confirms the D157 prediction: these were temporary Ahrefs detection window oscillations, not real traffic losses. The underlying organic traffic metric (+3 KWs, stable traffic) supports this interpretation.

**H1 missing (indexable) = 1 page persistent.**
First flagged in D157 (new +1). Remains at 1 in D158. Likely a Shopify theme-generated page (product or collection) with an empty H1 slot. Deferred for manual investigation when Shopify admin access is restored via non-cloud IP.

**Page & SERP title mismatch: 82→81.**
One further Google rewrite resolved. This counter naturally fluctuates as Google adjusts its display titles — values in the 80–85 range are normal for a site with 157+ articles with descriptive long-tail titles.

**IndexNow: Changed pages not submitted count dropped by 1.**
Improvement in AI discoverability indexing signal. No action needed.

---

## Sprint-Attributable Broken Links Tracker

**Running clean streak: 83 consecutive days (D76–D158). Zero sprint-attributable broken links. ✅**

---

## Action Items

| Item | Priority | Owner | Timeline |
|------|----------|-------|----------|
| Investigate H1 missing (1 indexable page) | Medium | CNC dev team | When Shopify admin accessible |
| Monitor image file size too large (7 images) | Low | CNC dev team | Batch fix session |
| Schema.org 1620 errors (long-standing) | Low | CNC dev team | Shopify theme update cycle |
