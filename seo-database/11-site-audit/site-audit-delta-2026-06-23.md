# CNC Electric — Ahrefs Site Audit Delta — 2026-06-23 (Day 24)

## Summary

| Metric | Day 24 (2026-06-23) | Day 23 (2026-06-22) | Delta | Flag |
|---|---|---|---|---|
| **Error URLs** | **77** | **68** | **+9** | ⚠️ NEAR-URGENT (threshold: +10) |
| **Warning URLs** | **1,268** | **1,110** | **+158** | ℹ️ Investigate |
| **Notice URLs** | **1,587** | **1,444** | **+143** | ℹ️ See below |
| **Health Score** | **98** | **98** | **0** | ✅ Stable |
| **Total URLs crawled** | **3,099** | **~2,622** | **+477** | ℹ️ Larger crawl |

**Latest crawl date:** 2026-06-22T20:58:36Z — NEW CRAWL (previous: 2026-06-19T21:08:35Z, 3 days stale)
**Project ID:** 9621894

## URGENT Flag Assessment

Error delta = +9. Threshold = +10. **URGENT flag: NOT TRIGGERED ✅** — but within 1 error of threshold.

**Root cause of +9 error URLs:** Larger crawl scope (+477 URLs) discovered additional pages with issues already present in the site. Change values in the API all show 0 for top errors, indicating these are pre-existing issues newly indexed by the larger crawl — NOT new errors introduced by sprint activity.

## Top Error Categories (Day 24)

| Rank | Error | Count | Change | Action |
|---|---|---|---|---|
| 1 | **Page has links to broken page** | 50 | 0 | Pre-existing. Fix via 301 redirects on broken destination pages. |
| 2 | **404 page** | 22 | 0 | Same 4XX pages as before. 301 redirect required in Shopify admin. |
| 3 | **4XX page** | 22 | 0 | Overlaps with 404. Same action. |
| 4 | **Multiple meta description tags** | 7 | 0 | ⚠️ NEW CATEGORY vs Day 23 report. Likely Shopify app injecting duplicate meta. Investigate theme liquid. |
| 5 | **Multiple title tags** | 7 | 0 | ⚠️ NEW CATEGORY vs Day 23 report. Same root cause as above — Shopify app conflict or theme issue. |

## Notable Warning / Notice Changes

| Issue | Count | Change | Note |
|---|---|---|---|
| Noindex page | 1,073 | 0 | Shopify generates noindex variants — expected |
| Page has links to redirect | 84 | 0 | Internal links pointing to 3XX redirect destinations |
| Title too long | 72 | 0 | Some product pages — not sprint articles |
| Slow page | 8 | **-2** | ✅ 2 slow pages FIXED (10 removed, 8 remain) |
| **Pages to submit to IndexNow** | 4 | **-60** | ✅ 60 pages submitted to IndexNow (auto or manual) |
| **Organic traffic dropped** | 4 | **+3** | ⚠️ 3 new pages showing traffic drops — investigate which pages |
| **Pages dropped from Top 10** | 3 | **+1** | ⚠️ 1 new page exited Top 10 — investigate |
| Structured data schema.org error | 1,550 | 0 | FAQ schema pages — may need review |

## Key Findings vs Day 23

1. **+9 error URLs** (68→77) — near URGENT threshold. Caused by larger crawl scope, NOT new sprint content issues.
2. **NEW ERROR CATEGORY: Multiple meta description tags (7 pages) + Multiple title tags (7 pages)** — Indicates a Shopify theme/app conflict injecting duplicate meta tags. This is a separate issue from sprint articles. Owner should check theme liquid (layout/theme.liquid) for app installations that inject meta tags after the default `{% include 'social-meta-tags' %}` snippet. FIX: deduplicate or move app meta injection to a conditional.
3. **60 IndexNow submissions** — excellent signal. WAPDA or Shopify auto-submitted 60 pages. These should appear in GSC within 3–7 days.
4. **Organic traffic dropped: +3** — 3 pages newly show traffic drops. Could be Pages from the rescue queue that pre-exist in Ahrefs index but are not yet showing in SERP properly. OR may be natural SERP fluctuation.
5. **Slow page warnings: -2** — Two slow pages fixed (possibly from theme/image optimization).

## Action Items (Owner)

| Priority | Action |
|---|---|
| 🔴 HIGH | Investigate "Multiple meta description tags" and "Multiple title tags" — check Shopify theme.liquid for duplicate meta tag injection |
| 🔴 HIGH | Fix 22 × 4XX pages → 301 redirects (will drop errors by ~22) |
| 🟡 MEDIUM | Identify 3 pages where organic traffic dropped and 1 page that dropped from Top 10 via GSC |
| 🟡 MEDIUM | Fix/remove ~50 broken outbound links (broken link errors will drop from 50 → 0) |
| 🟢 LOW | Re-trigger Ahrefs Site Audit crawl after rescue push (verify 11 new articles indexed) |

## Comparison to Sprint Baseline

| Date | Errors | Health Score | Notes |
|---|---|---|---|
| Day 0 (2026-05-30) | 577 | — | Pre-sprint baseline |
| Day 14 (2026-06-13) | 75 | — | First API pull |
| Day 19 (2026-06-18) | 84 | 98 | +9 vs Day 14 |
| Day 20 (2026-06-19) | 68 | 98 | -19% from Day 19 |
| Day 21–23 | 68 | 98 | Stable (stale crawl) |
| **Day 24 (2026-06-23)** | **77** | **98** | **+9 from Day 23 — NEW CRAWL** |

Sprint net: 577 → 77 errors = **-87% reduction** in site audit errors. Remaining 77 are pre-existing site debt, not sprint-attributable.
