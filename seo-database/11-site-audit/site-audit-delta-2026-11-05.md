# Site Audit Delta — 2026-11-05 (Day 150)

**Project:** Cncelectric (ID: 9621894)
**Crawl date:** Latest available
**Comparison:** vs 2026-11-04 (Day 149)

---

## Summary Counts

| Severity | Count | Delta |
|----------|-------|-------|
| Errors | ~21 | 0 (stable) |
| Warnings | ~135+ | ~0 net new |
| Notices | ~1,800+ | +11 (schema changes) |

**URGENT flag: NOT triggered** (net new Errors = 0)

---

## Top 5 Categories by Count (non-zero)

| Issue | Importance | Count | Change | Note |
|-------|-----------|-------|--------|------|
| Noindex follow page | Notice | 1,064 | +4 | Shopify tag pages expected |
| Noindex page | Warning | 1,099 | +4 | Shopify system pages expected |
| Structured data schema.org validation error | Notice | 1,618 | +11 (5 added, 6 new) | Ongoing; schema drift in Shopify theme |
| Changed pages not submitted to IndexNow | Notice | 546 | +537 changed | Cloud IP 403 blocks IndexNow — known |
| Title too long | Warning | 84 | +1 new | New article D150 title length — monitor |

---

## Notable Changes vs Yesterday

| Issue | Change | Assessment |
|-------|--------|------------|
| 5XX pages | -4 removed ✅ | Server errors resolved — positive |
| Pages dropped from Top 10 | 3 changed | Monitor — 3 pages moved out of Top 10 |
| Organic traffic dropped | 7 changed | Monitor — 7 pages with traffic decline |
| Meta description too long (non-indexable) | +2 new | Minor — article long titles; acceptable |
| Structured data schema.org validation error | +6 new | Ongoing Shopify theme issue; not sprint-attributable |
| 404/4XX pages | 0 change | Stable at 21 — pre-existing, not sprint-attributable |

---

## Sprint-Attributable Errors

**Zero.** Internal link clean streak maintained at 75 days (D76–D150).
No broken internal links introduced by sprint articles.

---

## Action Items

1. **Pages dropped from Top 10 (3):** Identify which 3 pages via Ahrefs rank tracker — may need content refresh or internal link boost.
2. **Schema.org validation errors (+6 new):** Check if new articles introduced malformed JSON-LD. Article-level schemas should be validated on next Shopify manual session.
3. **IndexNow (546 not submitted):** Requires manual session from non-cloud IP or Shopify app webhook. Ongoing known blocker.
4. **5XX pages resolved (-4):** No action needed — positive signal.

---

*Generated: 2026-11-05 | Sprint Day 150 | v7.C compliant*
