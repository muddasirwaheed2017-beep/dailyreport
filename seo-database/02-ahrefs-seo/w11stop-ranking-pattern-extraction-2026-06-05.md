# w11stop.com — Ranking pattern extraction + cncelectric.pk implementation plan

**User correction 2026-06-05 PM:** w11stop is NOT a CNC dealer. They're a multi-brand marketplace where CNC is 6 items out of 595 MCCBs and 1,143 components. They rank top-3 on Pakistani electrical KWs because of their **SEO architecture**, not partnership. Strategy: extract their winning patterns, implement on cncelectric.pk, steal their traffic.

## Why w11stop ranks (the decoded playbook)

### Pattern 1 — TITLE TEMPLATE (the single biggest move)

Every product page title:
```
[Brand] [Model] [Spec] Price in Pakistan | w11stop.com
```

Examples:
- "CNC AC Breaker 4 Pole MCB Price in Pakistan | w11stop.com"
- "ABB S 201 Single Pole Miniature Circuit Breaker Price in Pakistan | w11stop.com"
- "Chint MCB eB-63 C Double Pole 4.5 kA Circuit Breaker Price in Pakistan | w11stop.com"

Every category page title:
```
[Category] Price in Pakistan Updated [Month YYYY]
```

Examples:
- "MCBs Price in Pakistan Updated April 2026"
- "MCCBs Price in Pakistan Updated April 2026"
- "Memory Cards Price in Pakistan Updated April 2026"
- "Computer Parts Price in Pakistan - Updated March 2026"

Every brand landing page title:
```
[Brand] Official Price in Pakistan Updated [Month YYYY]
```

Examples:
- "CNC Official Price in Pakistan Updated August 2025"
- "CHINT Official Price in Pakistan Updated April 2026"
- "RICOH Official Price in Pakistan Updated April 2026"
- "Total Official Price in Pakistan Updated August 2025"

**Why this destroys SERP:** Google sees "Updated June 2026" + exact-match "Price in Pakistan" KW + brand qualifier → treats page as fresh + authoritative. Auto-refreshes monthly = perpetual freshness signal.

### Pattern 2 — URL STRUCTURE

- Category: `/mcb-breakers`, `/mccb-breakers`, `/circuit-breakers`
- Product: `/cnc-ac-breaker-4-pole-mcb` (clean, no SKU codes, KW-rich)
- Brand: `/chint-electric`, `/cnc`, `/total` (single-word landing)
- Long-tail: `/processor-price-in-pakistan` (exact KW = URL slug)

### Pattern 3 — BODY CONTENT TEMPLATE (every product page)

Boilerplate that runs on autopilot:
```
OVERVIEW: Go to the 'BUY NOW' button and have it at your doorstep.
Explore w11stop.com to find the latest [PRODUCT] products and 
other electronic components at discounted prices in Pakistan with 
cash-on-delivery service available throughout the country.

Features:
- [bullet list]

w11stop.com provides cash on delivery service all over Pakistan 
including Karachi, Lahore, Islamabad, Multan, Peshawar, Faisalabad 
and many other cities.
```

Key elements:
- "Price in Pakistan" repeated 3-5 times naturally
- Mentions 6 Pakistani cities by name (local SEO signal)
- "Cash on delivery" CTA (transactional intent capture)
- "discounted prices" (price-comparison search intent)

### Pattern 4 — CATEGORY PAGE PRICE-RANGE SCHEMA (high-value)

Every category page ends with:
```
The minimum [category] price in Pakistan is Rs. X and the estimated 
average price is Rs. Y. The maximum price of [category] in Pakistan is 
Rs. Z. w11stop.com provides cash on delivery service all over Pakistan 
including Karachi, Lahore, Islamabad, Multan, Peshawar, Faisalabad and 
many other cities.

| Product Name | Price |
|---|---|
| [Product 1] | Rs. XX/- |
| [Product 2] | Rs. XX/- |
| ... (10-15 rows)
```

This price-range schema + comparison table captures "min/max/average price" KW intent that Pakistani buyers actively search.

### Pattern 5 — MULTI-BRAND PRESENCE (parity scale)

w11stop's MCCB category has 595 products across brands:
- ABB (140), Hyundai Heavy Industries (118), Mitsubishi Electric (80), Terasaki (79), Chint Electric (40), LS (27), Hyundai (24), Fuji Electric (21), Sigma elektrik (16), Schneider Electric (4), Hitachi (24), Legrand (28), Tomzn (2), **CNC (6)**

CNC is only 1% of their MCCB inventory. They rank for "CNC [SKU] price in pakistan" because of the title/URL/body template — not because they push CNC.

**Implication:** We don't need w11stop's brand depth. cncelectric.pk needs the same title/URL/body patterns applied to OUR existing CNC SKUs to outrank them on CNC-branded queries.

### Pattern 6 — CATEGORY CONSOLIDATION

w11stop has 30 pages of MCCBs (595 SKUs). They funnel all that link equity into one category URL via pagination. cncelectric.pk has fewer SKUs but should consolidate similarly — every MCCB SKU should link back to a single `/collections/mccb-breakers` category page with the same price-range schema + comparison table.

## Implementation plan for cncelectric.pk (priority order)

### Move 1 — TITLE PATTERN OVERHAUL (highest impact, fastest)

Update every product page title + every collection page title:

**Before:** "CNC YC6VA Voltage Protector"  
**After:** "CNC YC6VA Voltage Protector Price in Pakistan Updated June 2026"

**Before:** "Voltage Protectors – CNC Electric Pakistan"  
**After:** "Voltage Protector Price in Pakistan Updated June 2026 | CNC Electric"

The monthly "Updated [Month YYYY]" tag refreshes via Shopify metafield monthly auto-update. Need to:
- Update all ~50 collection pages
- Update all product page templates
- Set up monthly auto-update cron to refresh month/year label

### Move 2 — META DESCRIPTION TEMPLATE

Standardise every product + collection page meta description:
```
[Product/Category] price in Pakistan [Month YYYY]: PKR X-Y range. 
[Top 3 specs / brands]. Free Pakistan delivery + cash on delivery. 
Karachi · Lahore · Islamabad · Multan · Peshawar · Faisalabad.
```

### Move 3 — PRICE-RANGE SCHEMA on every collection page

Add to every collection page body:
```
The minimum [collection] price in Pakistan is PKR X and the average 
is PKR Y. The maximum is PKR Z. Free Pakistan delivery on orders 
over PKR 5,000. Cash on delivery across Karachi, Lahore, Islamabad, 
Multan, Peshawar, Faisalabad.

| Product Name | Price (PKR) |
|---|---|
| CNC YCB7-63 1P 6A C-Curve MCB | 450 |
| CNC YCB7-63 1P 10A C-Curve MCB | 450 |
| ... (top 10-15 SKUs)
```

This single move captures the "min/max/average price" search intent that w11stop currently owns.

### Move 4 — BODY CONTENT FOOTER on every product page

Add to every product page (after product description):
```
[PRODUCT NAME] price in Pakistan [Month YYYY]. CNC Electric Pakistan 
is the sole authorized distributor of CNC Electric — IEC 60898-1 + 
60947-2 compliant, 5-year warranty. Cash on delivery + free Pakistan 
delivery on orders over PKR 5,000. Available in Karachi, Lahore, 
Islamabad, Multan, Peshawar, Faisalabad, Rawalpindi, Gujranwala, 
and across Pakistan.
```

### Move 5 — CITY-SPECIFIC LANDING PAGES (Pakistani local SEO)

w11stop captures "city + product" local SEO via city mentions. cncelectric.pk should ship:
- /pages/cnc-electric-karachi
- /pages/cnc-electric-lahore
- /pages/cnc-electric-islamabad
- /pages/cnc-electric-multan
- /pages/cnc-electric-peshawar
- /pages/cnc-electric-faisalabad

Each page lists CNC products available in that city + WhatsApp number + COD info.

### Move 6 — BRAND COMPARISON CONTENT (capture competitor brand KWs)

w11stop ranks for "CNC vs Chint", "CNC vs Schneider" because they sell both. cncelectric.pk can rank for the same by writing comparison content:
- /blogs/guides/cnc-vs-chint-electrical-comparison-pakistan-2026
- /blogs/guides/cnc-vs-schneider-electrical-comparison-pakistan-2026
- /blogs/guides/cnc-vs-abb-mcb-comparison-pakistan-2026
- /blogs/guides/cnc-vs-terasaki-mccb-comparison-pakistan-2026
- /blogs/guides/cnc-vs-ls-electrical-comparison-pakistan-2026

These already exist as a category — should be extended.

### Move 7 — MONTHLY AUTO-REFRESH CRON

Add to existing daily cron — on day-1 of each month:
- Update all collection page titles to "Updated [Month YYYY]"
- Update all product page metafields to "[Month YYYY]" in title_tag
- Bump price-range schema with current min/max/avg (small variance from cataloged prices)
- Trigger fresh IndexNow ping for all touched URLs

## What the daily cron should now do (v4 — pattern adoption)

Replace the v3 "w11stop reseller monitor" Step 2g with:

```
## 2g. w11stop COMPETITOR scan (daily, not weekly)
- Pull w11stop.com top 30 organic KWs (all categories, not just CNC)
- Identify KWs where w11stop top-3 AND cncelectric.pk not ranking
- Flag top 10 highest-volume opportunity KWs
- Output to seo-database/02-ahrefs-seo/w11stop-kw-gap-YYYY-MM-DD.md
- These become next-day buying guide topic candidates
- Also pull w11stop's URL slug pattern, title pattern (monthly check)

## 2h. PATTERN COMPLIANCE check on cncelectric.pk (daily)
- Sample 10 cncelectric.pk product/collection pages via Shopify API
- Verify each has: "Price in Pakistan", "Updated [Month YYYY]", city list, COD mention, price-range schema (if collection)
- Flag pages missing any pattern element for next-day patching
```

## Why this beats Alladin

Alladin uses similar patterns to w11stop. By matching w11stop's playbook on cncelectric.pk, CNC simultaneously closes the gap to Alladin + w11stop. Both are using the same SEO architecture — copy it once, get parity with two competitors.

Projected impact:
| Move | KW gain | Timeline |
|---|---|---|
| Title pattern overhaul (50 pages) | +100-150 new ranked KWs | 14-30 days |
| Meta description standardisation | +20-30 KWs | 7-14 days |
| Price-range schema on collections | +30-50 "min/max/average" KWs | 21-45 days |
| City-specific landing pages × 6 | +50-100 local KWs | 30-60 days |
| Brand comparison guides × 5 | +50-80 "X vs Y" KWs | 30-60 days |
| Monthly auto-refresh cron | +0 KWs but freshness boost | ongoing |

**Combined projected: +250-410 new ranked KWs by Day 60 — directly closes the gap vs Alladin's 350 KW lead.**

## Action items

### For Claude (immediate)
- [x] Save this strategy doc
- [x] Deprecate the reseller-pivot doc + delete outreach email
- [ ] Update cron prompt v4 — w11stop = competitor (not reseller), daily KW gap scan, pattern compliance check
- [ ] Add a SECOND daily-fire cron at 12:00 PKT for the title/meta patching loop (don't burden morning content-ship cron)

### For user (manual, can wait)
- Decide if title overhaul is bulk-ship via Shopify API (yes — cron will do it) or you want to manually approve each batch
- No outreach to w11stop needed — they are not a partner, they're a SERP competitor whose architecture we are copying
