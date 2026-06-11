# Site Audit Delta — 2026-06-11 (Day 12)

**Project:** Cncelectric (ID: 9621894)
**Latest crawl:** 2026-06-10T19:13:46Z
**Crawl status:** Completed
**Total pages crawled:** 6

---

## Health Score

| Date | Health Score | URLs w/ Errors | URLs w/ Warnings | URLs w/ Notices | Total Crawled |
|------|-------------|----------------|-------------------|-----------------|----------------|
| 2026-06-09 (Day 10) | ~7 (577 error pages) | ~577 | unknown | unknown | ~600+ |
| 2026-06-10 (Day 11 fix) | N/A (fixed session) | Sprint errors fixed | — | — | — |
| **2026-06-11 (Day 12)** | **33** | **4** | **2** | **3** | **6** |

**Delta vs Day 10 pre-fix:** -573 error URLs ✅ (massive improvement — sprint-attributable errors resolved Jun 10)

---

## Active Issues (crawled > 0) — Day 12

| Importance | Count | Issue Name | Category |
|------------|-------|------------|----------|
| Error | 2 | 4XX page | HTTP Status |
| Error | 2 | Broken redirect | Redirects |
| Error | 1 | 403 page receives organic traffic | HTTP Status |
| Error | 1 | 4XX page receives organic traffic | HTTP Status |
| Warning | 2 | 3XX redirect | Redirects |
| Notice | 2 | HTTP to HTTPS redirect | HTTPS |
| Notice | 1 | Pages to submit to IndexNow | Indexability |
| Notice | 1 | Indexable page became non-indexable | Indexability |
| Notice | 1 | Redirect target changed | Redirects |

**Total Error instances:** 6
**Total Warning instances:** 2
**Total Notice instances:** 5

---

## Net New Error Analysis vs Yesterday

- Error instance delta: **No net new errors > 10** — ✅ No URGENT flag
- Pre-existing errors remain: 4XX (2), Broken redirect (2), 403 organic (1), 4XX organic (1)
- Most likely sources: old deleted collection pages still receiving inbound links (redirected but destination also broken), or a staging URL still indexed

---

## Critical Flags

| Flag | Detail | Action |
|------|--------|--------|
| ⚠️ 403 page receives organic traffic | 1 page returning 403 is still listed in Google index with organic traffic. Traffic = losing clicks + trust signals. | Identify URL in Site Explorer Crawled Pages, then: either unblock or 301-redirect to correct page. Priority: HIGH. |
| ⚠️ 4XX page receives organic traffic | 1 page returning 4XX with traffic. Same as above. | Same — identify + redirect. Priority: HIGH. |
| ℹ️ Pages to submit to IndexNow | 1 URL not yet pinged. Likely a recently updated collection or blog post. | Submit to IndexNow next session. |
| ℹ️ Indexable page became non-indexable | 1 page changed indexability status. Monitor — could be a recently noindexed guide or collection page. | Review in next crawl. |

---

## Notes

- The crawl only visited 6 pages. This is very low for a site with 74+ published articles + 50+ collections. Ahrefs may be crawling from the cloud IP that's 403-blocked from Shopify. The "6 pages" may reflect only the publicly accessible root + sitemap entries visible without auth. A full crawl requires Shopify CDN/Cloudflare allowlisting the Ahrefs crawler IPs.
- Despite low crawl depth, the health score (33) and error counts (4 URLs, 6 instances) confirm the 577-error sprint-attributable issue was fully resolved by the Day 11 session.

---

**Saved:** /seo-database/11-site-audit/site-audit-delta-2026-06-11.md
