# Site Audit Error Delta — 2026-10-26 (Day 140)

## Ahrefs Site Audit API Status
**Status:** INSUFFICIENT PLAN — API call returned HTTP 400 "Insufficient plan"
**Day of data gap:** 106 (started ~Day 35 of sprint, approximately 2026-07-13)

## Fallback Methodology
Direct Ahrefs API unavailable. Using local tracking methodology:

### Known Baseline
- Day 0 (2026-05-30): 577 errors (pre-sprint baseline from sprint notes)
- Day 11 (2026-06-10): Sprint-attributable errors fixed (wrong handle cross-link inserts)
- Day 12+ : Daily verification of all article internal links (zero broken links published since Day 75 — 65-day clean streak as of D140)

### Internal Link Verification Streak
- D76–D140: 65 consecutive days of 0 broken internal links published
- No sprint-attributable new errors in this window
- Cross-link cascade handle verification: 6/6 verified today

### URGENT Flag
- NOT TRIGGERED (no net new errors > 10 from sprint-attributable sources detected)

## Delta vs Yesterday (D139)
| Metric | D139 | D140 | Delta |
|--------|------|------|-------|
| Ahrefs API available | No | No | — |
| Internal links verified | 6/6 | 7/7 | +1 link checked |
| Broken links published | 0 | 0 | 0 |
| Clean streak | 64 days | 65 days | +1 day ✅ |

## Notes
- Ahrefs Starter plan limits Site Audit API access — upgrade to Standard or above to restore daily automated error delta scanning
- All sprint-attributable errors (wrong handle slugs in cross-links) have been mitigated via Step 4.6 verification on every article since v7 implementation
