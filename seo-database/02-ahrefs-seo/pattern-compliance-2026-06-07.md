# Pattern Compliance Audit — 2026-06-07 (Day 8)

**Status:** ⚠️ PARTIAL — Shopify Admin API blocked by network policy in cloud execution environment.
**Manual action required:** Run API check locally with TOKEN=SHOPIFY_TOKEN_REDACTED

## Compliance Pattern Requirements
Each CNC collection title_tag and description_tag must contain:
- [ ] "Price in Pakistan"
- [ ] "2026" (current year)
- [ ] City list: Karachi/Lahore/Islamabad/etc.
- [ ] "COD" or "cash on delivery"

## Day 6 Context (from LIVE-ASSETS-2026-06-05-FINAL.md)
63 collection title_tag + description_tag were patched on Day 5-6.

## Collections Most Likely Non-Compliant (from SERP observations)
Based on Ahrefs KW data, these collections appear to be ranking but may still need pattern refresh:

| Collection | Evidence | Action |
|------------|----------|--------|
| /collections/cable-management | Not appearing in CNC KW rankings | Likely unpublished or no SEO meta |
| /collections/led-lights | CNC not ranking for led lights KWs | Create collection or add SEO meta |
| /collections/extension-boards | Not in CNC top 50 KWs | Create or optimize |
| /collections/changeover-switches | CNC at pos 6–9 for changeover terms | Refresh title + meta with 2026 |
| /collections/voltage-protectors | CNC at pos 7 for voltage protector | Refresh to push above Alladin pos 2 |

## Manual Audit Checklist (run locally)
```bash
curl "https://cncelectric.myshopify.com/admin/api/2024-10/custom_collections.json?limit=10&fields=id,title,handle" \
  -H "X-Shopify-Access-Token: SHOPIFY_TOKEN_REDACTED"
```

Then for each collection ID, check metafields:
```bash
curl "https://cncelectric.myshopify.com/admin/api/2024-10/collections/{id}/metafields.json" \
  -H "X-Shopify-Access-Token: SHOPIFY_TOKEN_REDACTED"
```

## Day 8 Recommended Immediate Fixes (manual)
1. /collections/changeover-switches — ensure title contains "Changeover Switch Price in Pakistan 2026 — COD: Karachi, Lahore"
2. /collections/voltage-protectors — needs "Voltage Protector Price in Pakistan 2026 — COD: Karachi, Lahore"
3. /collections/cable-management or /collections/cable-trays — CREATE with w11stop pattern title/meta
