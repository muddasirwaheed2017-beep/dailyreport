# CNC Electric — Link Intersect Analyzer
## Run in Claude Code: `claude "read link-intersect-analyzer.md and build it"`

## What to build
A React app that processes the 7,994-domain link intersect CSV from Ahrefs, categorizes every domain, scores them by outreach potential, and generates personalized emails for the top targets using the Anthropic API.

## Input
File upload accepting CSV (tab-separated, UTF-16 encoded with BOM)
Expected columns: Domain, Domain Rating, Domain Traffic, Intersect, cncelectric.pk/, bijliwalabhai.com/, cncele.com/, c-power.pk/, chintglobal.com/, smsengs.com/, clopal.com/, aquaelectrical.com/, industryparts.pk/, standardstores.pk/, c3controls.com/

## Processing Pipeline

### Step 1: Parse CSV
- Handle UTF-16 BOM encoding
- Parse tab-separated values
- Extract: domain, DR, traffic, which competitors link from this domain

### Step 2: Filter
- Remove domains with DR < 10 (spam/low value)
- Remove known spam domains containing: seoexpress, rankyour, seoagency, linkfarm
- Remove duplicate domains

### Step 3: Auto-Categorize
| If domain contains... | Category |
|---|---|
| solar, energy, power, renewable | Solar/Energy Industry |
| electric, circuit, switch, breaker, panel, wire, volt | Electrical Industry |
| business, b2b, trade, directory, list, yellow | Business Directory |
| .pk, pakistan, lahore, karachi | Pakistan Local |
| news, press, media, wire, journal, times | News/PR |
| blog, guide, how, tips, diy, home | Blog/Content |
| edu, university, college, research | Academic |
| gov, government, ministry | Government |
| forum, community, discuss | Forum/Community |
| (none of the above) | General |

### Step 4: Score (0-100)
- DR Weight (40%): DR/100 × 40
- Category Relevance (30%): Solar/Electrical=30, Pakistan=25, Directory=20, News=25, Blog=20, Academic/Gov=30, others=10
- Competitor Overlap (30%): (number of competitors linking / total competitors) × 30

### Step 5: Sort by score descending

## Output UI

### Summary Cards (top of page)
- Total domains in file
- Actionable domains (DR 10+)
- By category (pie chart or bar)
- Top 3 categories

### Filterable Table
Columns: Rank | Domain | DR | Category | Score | Competitors Linking | Recommended Action
Filters: Category dropdown, DR min/max sliders, search box

### Recommended Action (auto-assigned)
- Business Directory → "Register your company"
- Blog/Content → "Pitch guest post"
- News/PR → "Send PR story pitch"  
- Forum/Community → "Join and participate"
- Solar/Electrical Industry → "Register as supplier + pitch partnership"
- Academic/Government → "Submit as resource"
- General → "Evaluate manually"

### Email Generator (Anthropic API)
Click any domain row → "Generate Outreach Email" button
API call generates a personalized email based on:
- The domain's category
- The domain's content focus (inferred from domain name)
- CNC Electric's value proposition relevant to that category

Display the email in a modal with "Copy" button.

### Export
"Export Top 50 as CSV" button
"Export Top 100 as CSV" button
"Export All Actionable as CSV" button

## Design
- White background, Red (#DC2626) accent, Black text, Grey (#F3F4F6) cards
- Professional data dashboard look
- Responsive tables with alternating row colors
