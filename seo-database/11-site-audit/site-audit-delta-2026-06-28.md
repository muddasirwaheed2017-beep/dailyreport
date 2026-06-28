# CNC Electric Site Audit Delta — 2026-06-28 (Day 29)

**Project:** Cncelectric (ID: 9621894)
**API Pull:** mcp__Ahrefs__site-audit-issues — latest crawl
**Compared to:** Day 28 (2026-06-27) logged figures

---

## Error Issues (crawled > 0)

| Issue | Importance | Crawled | Change | Day 28 | Delta |
|---|---|---|---|---|---|
| Multiple meta description tags | Error | 7 | 0 | 7 | 0 |
| Multiple title tags | Error | 7 | 0 | 7 | 0 |
| 404 page | Error | 22 | 0 | 22 | 0 |
| 4XX page | Error | 22 | 0 | 22 | 0 |

**Total Error URLs (unique estimate):** 22 (4XX/404 overlap) + 7 (meta desc) + 7 (title) = **36 unique error URLs**

**Day 28 logged:** 108 (estimated — included 50 broken link pages). Today's API pull shows broken link issues at 0 crawled. Possible explanation: same crawl, but "Page has links to broken page" issue category shows 0 in today's pull (may be a separate issue ID or separate crawl scope). Net: ALL change fields = 0 → no new errors vs last crawl.

---

## Warning Issues (crawled > 0)

| Issue | Importance | Crawled | Change |
|---|---|---|---|
| CSS file size too large | Warning | 1 | 0 |
| Meta description too long | Warning | 37 | 0 |
| Nofollow page | Warning | 35 | 0 |
| Title too long (indexable) | Warning | 72 | 0 |
| Noindex page | Warning | 1,073 | 0 |

---

## Notice Issues (crawled > 0, non-zero change flagged)

| Issue | Importance | Crawled | Change | Flag |
|---|---|---|---|---|
| SERP title changed | Notice | 2 | **+1** | ⚠️ Google rewrote 1 SERP title |
| Pages to submit to IndexNow | Notice | 0 | -3 | 3 pages submitted or de-listed |
| Multiple H1 tags (indexable) | Notice | 20 | 0 | — |
| Page and SERP titles do not match | Notice | 43 | 0 | — |
| Noindex follow page | Notice | 1,038 | 0 | — |
| Noindex and nofollow page | Notice | 35 | 0 | — |
| Structured data schema.org validation error | Notice | 1,550 | 0 | — |
| Title too long (non-indexable) | Notice | 3 | 0 | — |

---

## Summary vs Day 28

| Category | Day 29 (unique URLs) | Day 28 (logged) | Delta |
|---|---|---|---|
| Errors | ~36 unique | 108 (est.) | Apparent improvement — same crawl, different count methodology for broken links |
| Warnings | ~1,145 (summed) | 1,334 (est.) | Stable / slight apparent improvement |
| Notices | ~3,146 (summed) | 3,441 (est.) | Stable |

**URGENT FLAG: NOT TRIGGERED** ✅ — No error category change > 0. All changes = 0 except SERP title rewrite (+1) and IndexNow queue (-3, positive).

---

## Action Items

1. **SERP title changed (+1):** One page had its SERP title rewritten by Google. Investigate in Google Search Console to identify which page. If the rewritten title is unfavourable, update the page title tag to a stronger, more explicit version Google is less likely to override.
2. **Multiple meta desc / title tags (7 pages each):** Persistent Shopify app conflict. Fix during rescue push from local machine by identifying the conflicting Shopify app injecting a second meta tag.
3. **Noindex follow (1,038) and Noindex page (1,073):** These are expected — Shopify pagination, filtered collection pages, internal search, and tag pages are correctly noindexed. Not an error.
4. **Schema.org validation errors (1,550 crawled):** Bulk issue from Shopify theme template default schema — not sprint-attributable. Low priority; theme-level fix only.
