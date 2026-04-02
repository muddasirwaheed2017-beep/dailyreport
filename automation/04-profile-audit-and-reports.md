# CNC Electric — Profile Audit Dashboard + Weekly Report Generator
## Run in Claude Code: `claude "read profile-audit-and-reports.md and build it"`

## TOOL 1: Profile Audit Dashboard

### What it does
Tracks all 25+ backlink profiles CNC Electric has created. Shows which are live, pending, or broken. One-click verification instead of manually Googling each profile.

### Pre-loaded Profile Data
```
Crunchbase|91|Dofollow|https://www.crunchbase.com/organization/cnc-electric-pakistan
About.me|93|Dofollow|https://about.me/cncelectricpakistan
Wellfound|90|Dofollow|
LinkedIn|98|Nofollow|
YouTube|99|Nofollow|
Pinterest|94|Nofollow|
Medium|95|Nofollow|
SlideShare|95|Nofollow|
Issuu|93|Nofollow|
Behance|94|Nofollow|
Disqus|91|Nofollow|
Trustpilot|93|Nofollow|
Quora|93|Nofollow|
GitHub|96|Nofollow|
Vimeo|96|Nofollow|
Flipboard|91|Nofollow|
Gravatar|90|Nofollow|
Google Business|0|Direct|
Facebook|96|Nofollow|
Twitter|93|Nofollow|
ENF Solar|62|Dofollow|
BusinessList.pk|15|Varies|
PakBiz.com|10|Varies|
TradeKey|40|Varies|
Rozee.pk|50|Nofollow|
Zameen.com|60|Nofollow|
```

### UI Layout
- Top: Summary cards — Total Profiles | Live | Pending | Not Created | Dofollow Count | Total DR Value
- Progress bar: X/25 complete → visual fill
- Table: Site Name | DR | Link Type | Profile URL (editable) | Date Created (editable) | Status (dropdown: Live/Pending/Not Created/Error) | Notes
- Each row: green left border if Live, yellow if Pending, red if Error, grey if Not Created
- "Add New Profile" button at bottom
- "Export Status Report" button → text summary

### Storage
Use persistent storage. Key: "profiles-v1". Save entire profile list as JSON.

---

## TOOL 2: Weekly Backlink Report Generator

### What it does  
Input weekly Ahrefs numbers → generates professional visual report with DR trend chart, progress toward DR 50, new/lost links analysis.

### Input Fields
- Week Number (1-12 dropdown)
- Date (auto-filled based on week)
- Current DR
- Current Referring Domains
- Current Total Backlinks
- New Links This Week (textarea, one per line: "site | URL | DR")
- Lost Links This Week (textarea)
- Quora Answers Posted This Week (number)
- Outreach Emails Sent (number)
- Notes (textarea)

### Storage
Save each week: key "report-week-{N}". Load all previous weeks for charts.

### Report Output

#### Header
"CNC Electric Pakistan — Backlink Progress Report"
"Week {N} | {date range}"

#### KPI Cards (with arrows showing change from last week)
- DR: {current} (↑{change})
- Referring Domains: {current} (↑{change})  
- Total Backlinks: {current} (↑{change})

#### DR Progress Bar
Visual: 1.8 ————●———————————— 50
Shows current DR position on the path to 50

#### Charts (use recharts library)
1. Line Chart: DR over all recorded weeks (X: week, Y: DR)
   - Include target line at DR 50
   - Include milestone markers at DR 10, 20, 30
2. Bar Chart: New referring domains per week
3. Pie Chart: Link types (Dofollow vs Nofollow)

#### Tables
- New Links This Week: Site | URL | DR | Type
- Lost Links This Week: Site | Reason

#### Pace Analysis (auto-calculated)
- Average new RDs/week so far: {X}
- Required pace for DR 50 by Week 12: {Y} new RDs/week
- Status: "On Track" (green) / "Behind Pace" (yellow) / "At Risk" (red)

### Design
- White background, professional report style
- Red (#DC2626) header bar with CNC branding
- Charts in grey/red/black color scheme
- Print-friendly layout
