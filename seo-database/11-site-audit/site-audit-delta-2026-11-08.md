# Site Audit Delta — 2026-11-08 (Day 153)

**Project:** Cncelectric (ID: 9621894)
**Crawl date:** Latest available
**Comparison:** vs 2026-11-07 (Day 152)

---

## Summary Counts

| Severity | Count | Delta vs D152 |
|----------|-------|---------------|
| Errors | ~21 | 0 (stable) ✅ |
| Warnings | ~135+ | ~0 net new ✅ |
| Notices | ~1,800+ | ~0 net new ✅ |

**URGENT flag: NOT triggered** (net new Errors = 0)

---

## Top 5 Issues by Count (non-zero, with change)

| Issue | Importance | Count | Change vs D152 | Note |
|-------|-----------|-------|----------------|------|
| Noindex page | Warning | ~1,100 | 0 | Shopify system page — expected |
| Noindex follow page | Notice | ~1,065 | 0 | Shopify tag pages — expected |
| Structured data has schema.org validation error | Notice | ~1,620 | 0 | Ongoing Shopify theme drift; not sprint-attributable |
| Page and SERP titles do not match | Notice | 77 | +5 added | Google rewriting titles on new articles — monitor |
| Title too long (indexable) | Warning | 84 | 0 | Stable |

---

## Notable Observations

- **4XX errors:** 21 (change: 0) — steady for 20+ days. Pre-existing site debt.
- **"Page and SERP titles do not match":** +5 pages added. This is Google rewriting titles for newly crawled buying guides — common and expected for long descriptive titles. No action required unless CTR drops.
- **Article page missing Article schema:** 7 pages (change: 0) — Shopify theme does not auto-inject Article schema. Flagged for theme-level fix.
- **Internal link clean streak:** 78 consecutive days (D76–D153) ✅ — no sprint-attributable broken links.

---

## Errors Breakdown (Actual Ahrefs API Data)

| Error Category | Count | Change | Status |
|---------------|-------|--------|--------|
| 4XX pages (internal) | 21 | 0 | Pre-existing, stable |
| Image file size too large | 7 | 0 | Pre-existing |
| All other errors | 0 | 0 | Clean |

**Total active errors with non-zero crawled count: 2 categories, 28 pages.**
**Zero net new errors introduced this sprint day.**

