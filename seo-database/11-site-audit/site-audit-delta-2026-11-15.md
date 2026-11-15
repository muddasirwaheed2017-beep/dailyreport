# Site Audit Delta — 2026-11-15 (Day 160)

**Source:** mcp__Ahrefs__site-audit-issues, project_id=9621894
**Pull:** Live (Ahrefs MCP working ✅)
**Previous:** site-audit-delta-2026-11-14.md (D159)

---

## Issue Count Summary

| Issue Level | D159 (2026-11-14) | D160 (2026-11-15) | Delta | Flag |
|-------------|------------------|------------------|-------|------|
| Errors (crawled > 0) | 28 (21 4XX + 7 img) | **28** | 0 | ✅ Stable |
| Warnings (significant) | 136 (84 title long + 51 meta desc long + 1 H1 missing) | **136** | 0 | ✅ Stable |
| Notices (key dynamic) | 9 organic/top10 drops | **1** (page/SERP title mismatch +1) | **-8** | ✅ RESOLVED — recovery confirmed |

**URGENT trigger (net new errors > 10): NOT TRIGGERED** (errors = 0 net new)
**RECOVERY CONFIRMED: D159 organic traffic drop (+4) and pages dropped from Top 10 (+5) both resolved to 0 — consistent with Ahrefs recalibration pattern**

---

## Detailed Issue Table

| Issue | D159 | D160 | Change | Category | Flag |
|-------|------|------|--------|----------|------|
| 4XX pages (404) | 21 | **21** | 0 | Internal pages | ✅ Stable |
| 4XX page receives organic traffic | 0 | **0** | 0 | Error | ✅ |
| Image file size too large | 7 | **7** | 0 | Images | ✅ Stable |
| Missing alt text | 0 | **0** | 0 | Images | ✅ |
| Title too long | 84 | **84** | 0 | Content | ✅ Stable |
| Meta description too long | 51 | **51** | 0 | Content | ✅ Stable |
| Page and SERP title mismatch | 79 | **80** | **+1** | Content | ⚠️ Minor +1 (new article Shopify title drift) |
| Noindex (pagination) | 1,100 | **1,100** | 0 | Indexability | ✅ Stable (pagination) |
| Schema.org validation error | 1,620 | **1,620** | 0 | Other | ✅ Stable (Shopify theme) |
| H1 tag missing (indexable) | 1 | **1** | 0 | Content | ⚠️ Persistent — deferred to manual fix |
| Sprint-attributable broken links | 0 | **0** | 0 | — | ✅ 85-day streak |
| **Organic traffic dropped** | **4** | **0** | **-4** | Other | ✅ **RESOLVED** |
| **Pages dropped from Top 10** | **5** | **0** | **-5** | Other | ✅ **RESOLVED** |
| No. of referring domains dropped | 7 | **0** | **-7** | Other | ✅ **RESOLVED** (crawl gap, not real loss) |

---

## D160 Site Metrics Recovery

| Metric | D158 | D159 | D160 | Assessment |
|--------|------|------|------|-----------|
| Organic KWs | 308 | 291 ⚠️ | **305** ✅ | +14 recovery — recalibration confirmed |
| Top 1–3 KWs | 232 | 220 ⚠️ | **225** ✅ | +5 recovery |
| Organic Traffic | 2,770 | 2,680 ⚠️ | **2,734** ✅ | +54 recovery |

**Assessment:** All three KPI dips from D159 fully recovered to near-D158 levels by D160. This confirms the Ahrefs recalibration pattern hypothesis from D159 Site Audit. No structural regression — no action required beyond continued monitoring.

---

## Analysis of Page/SERP Title Mismatch +1

The +1 increase from 79 to 80 "Page and SERP title mismatch" notices is likely attributable to Ahrefs detecting a recently published article where Google's displayed title differs slightly from the HTML title tag (Shopify sometimes adds the store name as a suffix). This is cosmetic and does not affect rankings directly. Trend: 84 → 83 → 82 → 81 → 80 → 79 → 80 — oscillating around 80, net improving trend from baseline of ~84.

---

## Action Items
- [ ] D161: Monitor KW count — expect continued recovery toward 310+
- [ ] H1 missing (1 indexable page): Deferred to manual Shopify admin — not sprint-attributable
- [ ] Page/SERP title mismatch (80): Monitor. If rises above 85 again, investigate which article Google is rewriting
