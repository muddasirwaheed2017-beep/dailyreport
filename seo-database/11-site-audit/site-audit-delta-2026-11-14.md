# Site Audit Delta — 2026-11-14 (Day 159)

**Source:** mcp__Ahrefs__site-audit-issues, project_id=9621894
**Pull:** Live (Ahrefs MCP working ✅)
**Previous:** site-audit-delta-2026-11-13.md (D158)

---

## Issue Count Summary

| Issue Level | D158 (2026-11-13) | D159 (2026-11-14) | Delta | Flag |
|-------------|------------------|------------------|-------|------|
| Errors (crawled > 0) | 28 (21 4XX + 7 img) | **28** | 0 | ✅ Stable |
| Warnings (significant) | 136 (84 title long + 51 meta desc long + 1 H1 missing) | **136** | 0 | ✅ Stable |
| Notices (key dynamic) | 0 "organic traffic dropped" + 0 "pages dropped" | **4 + 5** | **+9** | ⚠️ FLAGGED |

**URGENT trigger (net new errors > 10): NOT TRIGGERED** (errors = 0 net new)
**WARNING: Organic traffic dropped: +4 pages new; Pages dropped from Top 10: +5 pages new — FLAGGED (see below)**

---

## Detailed Issue Table

| Issue | D158 | D159 | Change | Category | Flag |
|-------|------|------|--------|----------|------|
| 4XX pages (404) | 21 | **21** | 0 | Internal pages | ✅ Stable |
| 4XX page receives organic traffic | 0 | **0** | 0 | Error | ✅ |
| Image file size too large | 7 | **7** | 0 | Images | ✅ Stable |
| Missing alt text | 0 | **0** | 0 | Images | ✅ |
| Title too long | 84 | **84** | 0 | Content | ✅ Stable |
| Meta description too long | 51 | **51** | 0 | Content | ✅ Stable |
| Page and SERP title mismatch | 81 | **79** | **-2** | Content | ✅ Improved |
| Noindex (pagination) | 1,100 | **1,100** | 0 | Indexability | ✅ Stable (pagination) |
| Schema.org validation error | 1,620 | **1,620** | 0 | Other | ✅ Stable (Shopify theme) |
| H1 tag missing (indexable) | 1 | **1** | 0 | Content | ⚠️ Persist — deferred |
| Sprint-attributable broken links | 0 | **0** | 0 | — | ✅ 84-day streak |
| **Organic traffic dropped** | **0** | **4** | **+4** | Other | ⚠️ FLAGGED |
| **Pages dropped from Top 10** | **0** | **5** | **+5** | Other | ⚠️ FLAGGED |
| No. of referring domains dropped | 0 | **7** | **+7** | Other | ⚠️ FLAGGED (notice level) |

---

## Analysis of Flagged Issues

### Organic KW count drop context
Ahrefs D159 pull shows CNC organic KWs = 291 (D158: 308), Top 1-3 = 220 (D158: 232). This -17 KW / -12 Top 1-3 dip is coincident with the "Pages dropped from Top 10" notice (+5 pages) and "Organic traffic dropped" (+4 pages).

**Assessment: Likely Ahrefs detection window recalibration, not structural regression.**
- Pattern matches D157 event exactly (D157: +12 pages organic traffic dropped, +1 page dropped from Top 10 → D158: fully resolved at 0)
- Ahrefs refresh cycles for smaller domains (DR 11) can show 2-week oscillations in KW count as the crawl index refreshes
- No corresponding Google Search Console signal (would require manual check)
- alladin.pk traffic INCREASED on this crawl (+451: 16,794→17,245) — if there were a broad Pakistan SERP update, would expect alladin.pk to also move irregularly

**Recommendation:** Monitor D160. If KW count does not recover toward 300+ within 2 days, escalate to manual GSC investigation.

### No. of referring domains dropped: +7
Ahrefs noticed 7 referring domains dropped this cycle. At DR 11 / 44 RDs, losing 7 RDs would be significant (-16%). However, the "dropped" notice typically reflects Ahrefs crawl window (they don't crawl every page daily) — lost RDs at this count are almost always temporary re-crawl gaps rather than actual link losses. Monitor D161 for resolution.

---

## Action Items
- [ ] D160: Re-pull metrics — expect KW count recovery if pattern holds
- [ ] D160: Check if "No. of referring domains dropped" resolves (crawl gap vs. real loss)
- [ ] H1 missing (1 indexable page): Deferred to manual Shopify admin — not sprint-attributable
