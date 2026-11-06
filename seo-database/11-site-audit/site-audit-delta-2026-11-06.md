# Site Audit Delta — 2026-11-06 (Day 151)

**Project:** Cncelectric (ID: 9621894)
**Crawl date:** Latest available
**Comparison:** vs 2026-11-05 (Day 150)

---

## Summary Counts

| Severity | Count | Delta vs D150 |
|----------|-------|---------------|
| Errors | ~21 | 0 (stable) |
| Warnings | ~135+ | ~0 net new |
| Notices | ~1,800+ | ~+2 schema.org validation |

**URGENT flag: NOT triggered** (net new Errors = 0)

---

## Top 5 Issues by Count (non-zero, with change)

| Issue | Importance | Count | Change vs D150 | Note |
|-------|-----------|-------|----------------|------|
| Noindex page | Warning | 1,100 | +1 | Shopify system page — expected |
| Noindex follow page | Notice | 1,065 | +1 | Shopify tag pages — expected |
| Structured data schema.org validation error | Notice | 1,620 | +2 | Ongoing Shopify theme drift; not sprint-attributable |
| Changed pages not submitted to IndexNow | Notice | 2 | -544 ✅ MAJOR IMPROVEMENT | Dropped from 546 to 2 — crawl refresh after bulk change resolution |
| Title too long (indexable) | Warning | 84 | 0 | Stable |

---

## Notable Changes vs Yesterday

| Issue | Change | Assessment |
|-------|--------|------------|
| Changed pages not submitted to IndexNow | -544 (546 → 2) ✅ | Massive improvement — Ahrefs recrawl resolved most flagged pages |
| Pages dropped from Top 10 | +1 (3 → 4) | Slight concern — 4 pages now — monitor which ones |
| Organic traffic dropped pages | -3 (7 → 4) ✅ | Improving — was 7, now 4 |
| Structured data schema.org errors | +2 new | Ongoing Shopify theme issue; not sprint-attributable |
| 404/4XX pages | 0 | Stable at 21 — pre-existing, not sprint-attributable |
| 5XX pages | 0 | Stable at 0 (was fixed D150) ✅ |

---

## Sprint-Attributable Errors

**Zero.** Internal link clean streak maintained at **76 days (D76–D151)**.
No broken internal links introduced by sprint articles.

---

## Positive Signals

1. **IndexNow not-submitted count dropped from 546 to 2** — most previously-flagged changed pages have now been processed by Ahrefs. This is a natural crawl cycle resolution, not a fix on our end (IndexNow from cloud IP still blocked), but it removes the visual noise from the audit report.
2. **Organic traffic dropped pages improved** — from 7 to 4, suggesting some of the D147–D149 articles are picking up initial impressions.
3. **5XX pages remain at 0** — server health maintained.

---

## Action Items

1. **Pages dropped from Top 10 (now 4):** Identify via Ahrefs rank tracker — priority targets for internal link boost in D152+ articles.
2. **Schema.org validation errors (+2 new):** Attribute to Shopify theme; flag for manual session fix.
3. **IndexNow (2 remaining):** Negligible — residual from last crawl window. No action needed.

---

*Generated: 2026-11-06 | Sprint Day 151 | v7.C compliant*
