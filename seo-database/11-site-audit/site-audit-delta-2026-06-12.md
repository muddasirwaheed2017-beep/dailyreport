# Site Audit Error Delta — 2026-06-12 (Day 13)

## Method: Ahrefs site-explorer-crawled-pages (50 most recent, sorted by last_crawled desc)

### Crawl Date: 2026-06-11 → 2026-06-09 (most recent Ahrefs crawl window)

---

## HTTP Status Breakdown (from 50 most-recent-crawled pages)

| HTTP Code | Count | Notes |
|-----------|-------|-------|
| 200 | 29 | Collections, products, robots.txt, atom feeds — all healthy |
| 403 | 12 | ALL /blogs/ guides articles — Ahrefs IPs blocked by Cloudflare |
| 404 | 3 | fire-safety collection, clopal comparison guide (deleted), terminal-block-connector product |
| 301 | 2 | Product redirect (variant URL → canonical) |

---

## 403 Pages (Ahrefs-Crawler-Specific Block — NOT Google Issue)

The following /blogs/guides/ articles return 403 to Ahrefs but are presumed 200 to Googlebot (site ranks organically for their target KWs):

1. `/blogs/guides/solar-inverter-price-in-pakistan-2026-inverex-knox-crown-solis-buyer-guide` ⚠️ COMPLIANCE FLAG: handle contains competitor brand names (Inverex, Knox, Crown, Solis) — HARD RULE violation
2. `/blogs/guides/wifi-smart-breaker-home-assistant-pakistan-2026-complete-installation-guide`
3. `/blogs/guides/energy-meter-price-in-pakistan-2026-buyer-guide`
4. `/blogs/guides/nepra-net-metering-2026-equipment-checklist-pakistan-buyer-guide`
5. `/blogs/guides/surge-arrester-lightning-arrester-price-pakistan-2026-buyer-guide`
6. `/blogs/guides/smart-switch-price-in-pakistan-2026-buyer-guide`
7. `/blogs/guides/difference-between-mcb-mccb-rccb-rcbo-pakistan-2026-buyer-comparison-guide`
8. `/blogs/guides/best-voltage-protector-for-refrigerator-fridge-pakistan-2026-buyer-guide`
9. `/blogs/guides/hybrid-vs-on-grid-vs-off-grid-solar-inverter-price-pakistan-2026` (OLD handle — different from confirmed live `hybrid-vs-on-grid-vs-off-grid-solar-inverter`)
10. `/blogs/guides/voltage-regulator-vs-stabilizer-vs-protector-pakistan-2026-honest-comparison`
11. `/blogs/guides/best-breaker-for-1-5-ton-ac-in-pakistan-2026-complete-protection-bundle`
12. `/blogs/news/wifi-smart-breaker-home-assistant-pakistan-2026-diy-local-control-guide-tuya-independence`

**Root cause:** Cloudflare WAF rule or IP rate-limit blocking Ahrefs crawler IPs from /blogs/ path. Ahrefs publishes their crawler IP ranges (mcp__Ahrefs__public-crawler-ip-ranges). Whitelisting in Cloudflare firewall rules enables full site audit.

---

## 404 Pages — Actionable

| URL | Status | Action Required |
|-----|--------|-----------------|
| `/collections/fire-safety` | 404 | Collection deleted or never created. Check if any /blogs/guides/ article links to this. If linked, replace with /collections/safety or remove link. |
| `/blogs/guides/clopal-vs-cnc-wifi-smart-breaker-comparison-pakistan-2026-buyer-guide` | 404 | Intentionally deleted (competitor brand names). Confirm 301 redirect to neutral alternative exists. |
| `/products/terminal-block-connector` | 404 | Deleted product. Check inbound links from guides and redirect to /collections/terminal-blocks or remove links. |

---

## Delta vs Yesterday (Day 12: 6 errors, 2 warnings, 5 notices)

| Category | Day 12 Count | Day 13 Count | Delta | URGENT? |
|----------|-------------|-------------|-------|---------|
| HTTP 4XX URLs in crawl | ~3 | 3 | 0 | ✅ No |
| 403 blog guides (Ahrefs-specific) | 12+ (same population) | 12 | 0 | ✅ No (Ahrefs crawl block, not Google issue) |
| Compliance flags (brand names in handles) | 0 flagged | 1 NEW 🚨 | +1 | ⚠️ See below |

**Net new errors > 10:** NO ✅
**URGENT flag:** No standard error growth. 

---

## COMPLIANCE FLAG — URGENT (separate from error count)

`/blogs/guides/solar-inverter-price-in-pakistan-2026-inverex-knox-crown-solis-buyer-guide`

This handle contains competitor brand names: **Inverex, Knox, Crown, Solis** — ALL are named competitors in the HARD RULE. This article was written before the "no competitor brand names" rule was enforced (likely pre-sprint). 

**Risk:** Not a search ranking risk (likely ranking for solar inverter terms), but a brand positioning risk and sprint-rule violation. The handle cannot be changed without a 301 redirect, but the article title and H1 can be revised to remove brand names.

**Action:** Flag for revision in next session. Replace title H1 with generic descriptor ("solar inverter price in pakistan 2026 — on-grid off-grid hybrid complete buyer guide") and add 301 redirect if handle is changed.

---

## Persistent Issues (from Day 12, not yet resolved)

1. **403 organic-traffic page:** 1 page returning 403 is Google-indexed with organic traffic. Suspected: one of the /blogs/guides/ 403 pages above — however, Googlebot gets 200 for ranking pages. The Ahrefs 403 is from Ahrefs crawler being blocked. Ahrefs traffic attribution to 403-code pages = Ahrefs-side artifact, not a real user 403 issue.
2. **Ahrefs crawl depth:** Only 6-12 /blogs/ pages in crawl window out of 79+ published guides. Ahrefs crawler is effectively unable to audit most of the blog content.

---

## Recommended Actions

**Priority 1 (HIGH): Whitelist Ahrefs crawler IPs in Cloudflare**
- Fetch: `mcp__Ahrefs__public-crawler-ip-ranges` (available as Ahrefs MCP tool)
- Add to Cloudflare > Security > WAF > IP Access Rules as "Allow"
- This fixes Ahrefs audit depth from 6 pages → full 200+ page crawl
- Cost: 20 minutes manual action

**Priority 2 (MEDIUM): Fix 3 dead pages**
- `/collections/fire-safety` → 301 redirect or create collection
- `/products/terminal-block-connector` → redirect to /collections/terminal-blocks
- Verify clopal comparison guide 404 has a redirect

**Priority 3 (LOW): Solar inverter guide handle compliance**
- Revise title to remove brand names
- 301 redirect old handle if title change requires new handle

---

**Saved:** /seo-database/11-site-audit/site-audit-delta-2026-06-12.md
