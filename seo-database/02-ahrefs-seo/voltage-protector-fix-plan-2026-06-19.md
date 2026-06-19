# Voltage Protector — Position Recovery Plan (pos 5 → 1–3)

**Created:** 2026-06-19 (Sprint Day 20)
**Owner action:** Execute from local machine (Shopify push is 403-blocked from cloud)
**Why this matters:** Highest-value ranking fix left in the sprint. "voltage protector" is an
1,800-vol head term where CNC regressed **pos 1 → 5** (~75% of the term's clicks lost). Recovering
to pos 1–3 is the biggest single organic-traffic lever remaining.

---

## Target cluster (from Day-19 rank tracker)

| Keyword | Vol | Current pos | Target | Gap |
|---|---|---|---|---|
| voltage protector | 1,800 | **5** | 1–3 | primary |
| voltage protector price in pakistan | 600 | 2 | 1 | near |
| voltage protection device | 400 | 4 | 1–3 | secondary |
| 3 phase voltage protector | — | — | hold | cluster |

Competitor: Alladin sits **pos 2** for "voltage protector". This is a head-to-head SERP fight.

## Likely regression cause
Pos 1→5 over ~9 days with no manual change = **freshness decay + thin internal-link equity** on the
collection/guide vs a competitor that refreshed. Fix = re-establish freshness + topical depth +
internal-link cascade + schema. No new page needed.

---

## Execution checklist (local machine)

### 1. Refresh the money page — `/collections/voltage-protectors`
- [ ] Update `body_html` top block with a **dated freshness line**: "Updated June 2026 — NEPRA 2026 prosumer voltage limits".
- [ ] Add a **cluster aside** (8–10 internal links) to: voltage-protector-fridge, 3-phase-voltage-protector,
      voltage-stabilizer-ac-home, voltage-protection-device guide, changeover/ATS, surge-arrester,
      energy-meter, db-box, net-metering, NEPRA-2026-checklist.
- [ ] Rewrite `description_tag` (meta description) to lead with **"voltage protector price in Pakistan 2026"**
      + a concrete PKR range + IEC ref. Keep ≤ 160 chars.
- [ ] Rewrite `title_tag`: `Voltage Protector Price in Pakistan 2026 | Single & 3-Phase` (head term first).

### 2. Deepen the supporting guide (the article that ranks for the term)
- [ ] Add/confirm a **PKR price matrix** (single-phase 3kW–9kW, 3-phase 380V; Rs 1,800 – Rs 12,000 band).
- [ ] Add **IEC standard references**: IEC 60947-6-1 (ATS/voltage monitoring relays),
      IEC 61008/61009 (RCCB/RCBO context), NEPRA 2026 prosumer over/under-voltage rules.
- [ ] Add **8-question FAQ + FAQPage JSON-LD** (Perplexity/AIO citation booster).
- [ ] Pakistani buyer context: WAPDA voltage swings, generator changeover spikes, motor-load protection,
      common Hall Road mistakes (undersized relay, no neutral monitoring).

### 3. Cross-link cascade — 6 inbound links to the voltage-protector page
Add a contextual link **to** `/collections/voltage-protectors` (anchor "voltage protector") **from**
these high-PR live pages:
- [ ] voltage-stabilizer-ac-home guide
- [ ] voltage-protector-fridge guide
- [ ] 3-phase-voltage-protector guide
- [ ] best-electrical-equipment-tiers guide
- [ ] energy-meter guide
- [ ] changeover/ATS guide

Each PUT should return HTTP 200 — log status.

### 4. Re-index
- [ ] IndexNow batch ping: collection URL + supporting guide URL (key `8a1f3c5e7b9d2406`,
      endpoint `https://api.indexnow.org/IndexNow`).
- [ ] Yandex sitemap ping.

### 5. Verify (T+3 days)
- [ ] Re-pull rank tracker for "voltage protector" — expect pos 5 → 3 or better within one crawl cycle.
- [ ] Confirm `/collections/voltage-protectors` shows June-2026 freshness in Google cache.

---

## Definition of done
- Collection + guide refreshed, 6 inbound cross-links live (HTTP 200), FAQ schema valid,
  both URLs re-indexed, rank tracker re-checked at T+3.

## Cannot be done from this cloud session — why
Shopify Admin API returns **403 from cloud IPs** (14-day block). All steps above require the local
`cnc-seo-push/publish-*.js` token. This file IS the runbook for that local session.
