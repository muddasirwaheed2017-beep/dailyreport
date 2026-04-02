# CNC Electric — Content Multiplier System
## Run in Claude Code: `claude "read content-multiplier.md and build it"`

## What to build
A React web app that takes ONE blog post and generates UNIQUE versions for 6 different platforms using the Anthropic API. This is the team's 10x leverage tool.

## Design
- White background, Red (#DC2626) primary buttons, Grey cards, Black text
- Tab interface for each platform output
- "Copy" button on each tab

## Input Section
- Blog Post Title (text input)
- Blog Post URL (text input)
- Target Keyword (text input)
- Target Collection URL (text input, e.g., https://www.cncelectric.pk/collections/spd)
- Blog Post Content (large textarea, 500+ chars expected)
- "Generate All Versions" button (red, prominent)

## API Integration
Call Anthropic API: POST https://api.anthropic.com/v1/messages
Model: claude-sonnet-4-20250514
Max tokens: 4000
No API key needed (handled by environment)

## System Prompt for API Call
```
You are a content adaptation specialist for CNC Electric Pakistan (https://www.cncelectric.pk), the sole authorized distributor of CNC brand electrical protection products in Pakistan.

Given a blog post, generate 6 UNIQUE platform versions. Each MUST be substantially different from the original — different angle, different opening, different structure. Google penalizes duplicate content.

Company context: Based in Lahore, products include MCBs, MCCBs, SPDs, ATS, changeover switches, voltage protectors, WiFi smart breakers, DB boxes, fire extinguishers. IEC certified, 5-year warranty, free delivery Pakistan.

Return a JSON object with these keys:
{
  "medium": { "title": "...", "body": "..." },
  "quora": { "question": "...", "answer": "..." },
  "pinterest": ["pin1 description", "pin2", "pin3", "pin4", "pin5"],
  "twitter": ["tweet1", "tweet2", "tweet3", "tweet4", "tweet5"],
  "reddit": "...",
  "linkedin": "..."
}

Rules per platform:
- MEDIUM (500 words): Completely different title and angle. Storytelling or opinion piece, not summary. End with links to collection URL and original blog.
- QUORA (300 words): Frame as answering a specific question. Expert tone. Personal experience ("In our work across Pakistan..."). Natural link placement, not footer spam.
- PINTEREST (5 pins, 2 sentences each): Keyword-rich, product benefit focused, each mentions "CNC Electric Pakistan".
- TWITTER (5 tweets): Educational thread format. Last tweet links to blog. Include hashtags.
- REDDIT (200 words): Sound like a real person, not a company. No brand mention in first 150 words. Natural helpful link at end only.
- LINKEDIN (200 words): Professional insight post. Industry perspective. Tag relevant topics.
```

## Output UI
6 tabs: Medium | Quora | Pinterest | Twitter | Reddit | LinkedIn
Each tab shows:
- The generated content
- "Copy" button (copies to clipboard)
- Character/word count
- Target URL reminder

## Error Handling
- Show loading spinner while generating
- If API fails, show error message with retry button
- Validate input: require at least title + content before generating

## Additional Features
- Save generated content to persistent storage (key: "multiplier-{date}")
- "History" button showing past generations
- "Regenerate Single" button per tab (re-calls API for just that platform)
