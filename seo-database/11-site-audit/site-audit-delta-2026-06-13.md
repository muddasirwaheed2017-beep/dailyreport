# Site Audit Error Delta — 2026-06-13 (Day 14)

## Method: Ahrefs site-audit-issues MCP (project_id: 9621894) — FIRST FULL API PULL

**Historic context:**
- 2026-06-09 (sprint reference): 577 errors (pre-fix baseline)
- 2026-06-10: Sprint-attributable errors fixed (Day 11 report)
- 2026-06-12 (Day 13): Estimated via crawled-pages (~3 4XX, 12 Ahrefs-blocked /blogs/)
- **2026-06-13 (TODAY): 75 Errors | 1,000 Warnings | 3,002 Notices — FIRST REAL API PULL**

---

## Summary Totals

| Category | Count | vs Sprint Baseline (2026-06-09) |
|----------|-------|-------------------------------|
| Errors | **75** | ↓ from 577 — **87% reduction** ✅ |
| Warnings | 1,000 | First full measurement |
| Notices | 3,002 | First full measurement |

---

## Top Issues (crawled > 0, sorted by volume)

| Importance | Issue | Pages | Change | URGENT? |
|------------|-------|-------|--------|---------|
| Notice | Structured data schema.org validation error | 1,187 | +1,187 | ⚠️ High volume (FAQ schema review needed) |
| Warning | Noindex page | 776 | +776 | ℹ️ Expected (paginated/filter pages) |
| Notice | Noindex follow page | 741 | +741 | ℹ️ Expected |
| Notice | Page has only one dofollow internal link | 526 | +526 | ⚠️ Cross-link cascade fixes this |
| Notice | Pages to submit to IndexNow | **441** | +441 | 🚨 BATCH IndexNow needed |
| Warning | Title too long | 78 | +78 | ⚠️ Review |
| Warning | Page has links to redirect | 68 | +68 | ℹ️ 301 chain — OK if single-hop |
| Notice | Page and SERP titles do not match | 44 | +44 | ℹ️ Shopify meta override |
| Warning | Nofollow page | 35 | +35 | ℹ️ Expected |
| **Error** | **Page has links to broken page** | **31** | **+31** | **🚨 URGENT — action needed** |
| Warning | Meta description too long | 24 | +24 | ⚠️ Review |
| **Error** | **404 page** | **22** | **+22** | **🚨 URGENT** |
| **Error** | **4XX page** | **22** | **+20** | **🚨 URGENT** |
| Warning | 3XX redirect | 17 | +15 | ℹ️ OK if single-hop |
| Notice | Multiple H1 tags | 11 | +11 | ⚠️ Shopify theme issue |
| Notice | Pages with high AI content | 5 | +5 | ℹ️ Expected (AI-assisted content) |
| Notice | Indexable page not in sitemap | 2 | +2 | ⚠️ Check sitemap update |

---

## URGENT ERROR BREAKDOWN

### Error 1: Page has links to broken page (31 pages)
Pages that contain outgoing links pointing to 404/broken URLs.  
**Root cause candidates:** Old links to `/collections/fire-safety` (404), `/products/terminal-block-connector` (404), deleted clopal comparison guide.  
**Action:** Run site-audit-page-explorer to identify source pages. Then fix or remove broken links.

### Error 2: 404 pages (22 pages)
**Known confirmed 404s (from Day 12/13 crawl):**
- `/collections/fire-safety` — collection deleted
- `/products/terminal-block-connector` — product deleted
- `/blogs/guides/clopal-vs-cnc-wifi-smart-breaker-comparison-pakistan-2026-buyer-guide` — intentionally deleted

**Additional 19 pages unknown** — need site-audit-page-explorer pull to enumerate.

**Action:** Create 301 redirects for all 404 pages (Shopify > Navigation > URL Redirects).

---

## Net New Errors vs Yesterday's Estimate

| Metric | Day 13 Estimate | Day 14 Actual API | Delta |
|--------|----------------|-------------------|-------|
| Total errors | ~3 (4XX only, partial) | 75 | N/A (first real API pull) |
| 4XX pages | 3 | 22 | First accurate count |
| Broken link pages | 0 (not detected) | 31 | First accurate count |

**URGENT flag (>10 net new errors):** 🚨 YES — 75 real errors detected for first time.  
**Context:** This is NOT a deterioration from yesterday. This is the first complete site audit data. Sprint baseline was 577 errors; we're now at 75 — an 87% reduction.

---

## IndexNow Gap — CRITICAL

441 pages flagged "Pages to submit to IndexNow" — these are pages Ahrefs has indexed but that have NOT been submitted to IndexNow for accelerated crawling. This likely includes all 21 buying guides + dozens of collection/product pages.

**Action required from local machine:**
```bash
# Batch IndexNow — all known guides
KEY="9621894b91234abcdef1234567890abc"
BASE="https://www.cncelectric.pk"
for SLUG in \
  "blogs/guides/solar-panel-stand-price-in-pakistan-2026-l2-l3-mounting-buyer-guide" \
  "blogs/guides/industrial-buzzer-bell-siren-price-pakistan-2026-hooter-audible-alarm-buyer-guide" \
  "blogs/guides/cable-lugs-crimping-pakistan-2026-iec-61238-din-46235-buyer-guide" \
  "blogs/guides/power-factor-capacitor-bank-price-in-pakistan-2026-kvar-sizing-buyer-guide" \
  "blogs/guides/best-electrical-equipment-tiers-pakistan-2026-iec-certification-buyer-guide" \
  "blogs/guides/junction-box-price-in-pakistan-2026-iec-60670-buyer-guide" \
  "blogs/guides/cable-tray-price-in-pakistan-2026-iec-61537-buyer-guide"; do
  curl -s "https://api.indexnow.org/indexnow?url=${BASE}/${SLUG}&key=${KEY}"
done
```

---

## Recommendations by Priority

| Priority | Action | Owner |
|----------|--------|-------|
| 🔴 P1 | Fix 22 × 404 pages → 301 redirects in Shopify admin | Local machine |
| 🔴 P1 | Fix 31 × broken-link pages — remove/replace broken outgoing links | Next session |
| 🟡 P2 | Batch IndexNow 441 pages | Local machine |
| 🟡 P2 | Fix 1,187 schema.org validation errors (FAQ structured data) | Next session |
| 🟢 P3 | Review 78 title-too-long pages | Future sprint |
| 🟢 P3 | Internal cross-link cascade to fix "only 1 inbound link" on 526 pages | Ongoing sprint |
