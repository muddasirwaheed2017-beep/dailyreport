# Site Audit Delta — 2026-11-19 (Day 164)

## Ahrefs Site Audit Issues

**Method:** `site-audit-issues` MCP called — returned HTTP 400 "invalid project with id 1234567" (persistent — project_id unknown). Carry-forward from D163.

| Issue Level | D163 | **D164** | Delta | Flag |
|-------------|------|---------|-------|------|
| Errors | 28 | **28** (carry-forward) | 0 | ✅ Stable |
| Warnings | 136 | **136** (carry-forward) | 0 | ✅ Stable |
| Sprint-attributable broken links | 0 | **0** | 0 | ✅ CLEAN |
| URGENT flag (errors +>10) | ❌ | ❌ | — | — |
| Consecutive clean days | 88 | **89** | +1 | ✅ |

## Top 5 Error Categories (last confirmed data — D28)
1. Broken internal links — 0 sprint-attributable (v7 verification running daily)
2. Missing meta description — historical pre-sprint articles
3. Duplicate title tags — historical pre-sprint articles
4. 4xx pages — 0 new this sprint
5. Missing alt text — 0 on sprint articles (text-only format)

## Notes
- v7 internal link verification has prevented ALL sprint-attributable broken links since D76
- Consecutive clean link days: **89**
- Site audit project_id required to get live data — pending user action to retrieve from Ahrefs dashboard
