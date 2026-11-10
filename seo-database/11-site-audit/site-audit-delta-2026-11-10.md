# Ahrefs Site Audit Delta — 2026-11-10 (Day 155)

**Project ID:** 9621894 (cncelectric.pk)
**Compared:** D155 (2026-11-10) vs D154 (2026-11-09)

---

## Error Summary

| Issue | Importance | D154 | D155 | Delta | Flag |
|-------|-----------|------|------|-------|------|
| 4XX pages (404) | ERROR | 21 | **21** | 0 | ✅ Stable |
| 4XX pages (total incl. non-404) | ERROR | 21 | **22** | **+1** | ⚠️ 1 new 4XX |
| 4XX page receives organic traffic | ERROR | 0 | **1** | **+1** | ⚠️ Monitor |
| Image file size too large | ERROR | 7 | **7** | 0 | ✅ Stable |
| Page & SERP titles do not match | NOTICE | 79 | **78** | **-1** | ✅ Improvement |
| Title too long | WARNING | 84 | **83** | **-1** | ✅ Improvement |
| Organic traffic dropped | NOTICE | 2 | **4** | +2 | ℹ️ Normal volatility |
| Pages dropped from Top 10 | NOTICE | 1 | **2** | +1 | ℹ️ Normal volatility |
| Structured data schema.org validation error | NOTICE | 1620 | **1618** | -2 | ✅ Improvement |
| Noindex follow page | NOTICE | 1065 | **1064** | -1 | ✅ Improvement |
| Noindex page | WARNING | 1100 | **1099** | -1 | ✅ Improvement |
| Indexable page became non-indexable | NOTICE | 0 | **1** | +1 | ℹ️ Monitor |
| Sprint-attributable broken internal links | — | 0 | **0** | 0 | ✅ |
| Internal link clean streak | — | 79 days | **80 days** | +1 | ✅ |

---

## URGENT Flag Assessment

**URGENT: NOT TRIGGERED.**

Net new ERROR-level issues: +1 (one new 4XX page added in crawl). This is below the URGENT threshold of >10 new errors.

The new 4XX receiving organic traffic warrants monitoring — this is likely a Shopify-side URL change (product deleted or handle changed) unrelated to sprint activity. No sprint-attributable broken links confirmed (clean streak now 80 days, D76–D155).

---

## Positive Signals

- Page & SERP title mismatch: -1 (78 from 79) — Google rewriting pattern continuing to stabilise on established articles.
- Title too long: -1 (83 from 84) — consistent slow decline as Google applies its own title length normalisation.
- Schema.org validation errors: -2 (1618 from 1620) — slow continuous improvement, likely Google re-indexing corrected article schema.
- Noindex pages: -1 each for follow/noindex categories — consistent with Shopify pagination and tag page behaviour.

---

## Action Items

- [ ] Identify the specific 4XX URL receiving organic traffic (requires Shopify admin access — deferred to manual session).
- [ ] Confirm sprint-attributable vs pre-existing for the new 4XX — check article handle list against 404 page list when Shopify access is restored.
