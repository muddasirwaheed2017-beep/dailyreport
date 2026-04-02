import { useState, useEffect, useCallback, useRef } from "react";

// ═══ FULL PROJECT CONTEXT FOR AI CHATBOT ═══
const PROJECT_CONTEXT = `You are the AI backlink strategist for CNC Electric Pakistan. You have COMPLETE knowledge of this project.

COMPANY: CNC Electric Pakistan — sole authorized distributor of CNC brand electrical protection products
WEBSITE: https://www.cncelectric.pk
LOCATION: Lahore, Pakistan
CURRENT DR: 1.8 | REFERRING DOMAINS: 27 | BACKLINKS: 220 | TRAFFIC: 1,153/mo
TARGET: DR 50 in 3 months (aggressive but the plan is designed for it)

PRODUCT COLLECTION URLS (use these in any content/emails you write):
- Circuit Breakers (MCB): /collections/circuit-breakers
- AC Breakers: /collections/ac-breaker
- MCCB Breakers: /collections/ac-mccb-breakers
- ACB Breakers: /collections/acb-breakers
- SPD Surge Protection: /collections/spd
- DC SPD: /collections/dc-spd
- ATS Automatic Transfer Switch: /collections/ats
- Changeover Switches: /collections/changeovers
- Voltage Protectors: /collections/voltage-protectors
- WiFi Smart Breakers: /collections/wifi-smart-circuit-breakers
- DB Boxes: /collections/db-boxes
- Fire Extinguishers: /collections/fire-extinguisher
- DC Breaker: /collections/dc-breaker
- Magnetic Contactors: /collections/magnetic-contactors
- RCCB/RCBO: /collections/rccb
- Solar DB Box: /collections/solar-db-box
- Selector Switch: /collections/selector-switch
- Timer: /collections/timer-ah2n
- Voltage Regulator: /collections/voltage-regulator

TOP KEYWORD RANKINGS (Pakistan):
- "fire extinguisher" 5,500/mo #8 — ZERO backlinks, highest volume
- "spd" 1,400/mo #1 — ZERO backlinks, extremely fragile
- "circuit breaker" 1,200/mo #1 — 2 referring domains only
- "breaker" 1,200/mo #1
- "voltage protector" 900/mo #1 FEATURED SNIPPET — zero backlinks vs clopal.com DR 26
- "change over switch" 800/mo #10 — alladin.pk is #1
- "mcb breaker" 700/mo #1 — only 2 RDs
- "mccb breaker" 700/mo #1
- "magnetic contactor" 600/mo #1 — zero backlinks
- "spd stands for" 600/mo #1
- "contactor" 500/mo #6
- "selector switch" 500/mo #13
- "changeover switch" 450/mo #10
- "rccb breaker" 400/mo #1
- "db box" 400/mo #1
- "voltage protector price" 350/mo #9
- "breaker price in pakistan" 350/mo #10
- "dc breaker" 250/mo #1
- "rcbo breaker" 250/mo #1
- "acb breaker" 250/mo #1
- "automatic transfer switch" 200/mo #1

COMPETITORS:
- daraz.pk DR 81 (marketplace, 90 common keywords)
- powerhouseexpress.com.pk DR 44 (500+ RDs, 47 common KW) — our DR 50 roadmap
- industryparts.pk DR 36 (300+ RDs, 66 common KW)
- alladin.pk DR 30 (200+ RDs, 70 common KW) — biggest keyword overlap
- clopal.com DR 26 (150+ RDs, 48 common KW)
- c-power.pk DR 13 (our own retail site, 66 common KW)

BACKLINK STRATEGY OVERVIEW:
Tier 1: Profile sites (Crunchbase DR91 dofollow, About.me DR93 dofollow, Wellfound DR90 dofollow, LinkedIn DR98, Pinterest DR94, Medium DR95, etc.)
Tier 2: Industry directories (ENF Solar DR62, Pakistan directories, B2B directories)
Tier 3: YouTube video descriptions (DR 99, each video has 10+ collection links)
Tier 4: Outreach (ProPakistani DR73, guest posts, solar installer partnerships, HARO/SOS editorial links)
Tier 5: Linkable assets (calculators, infographics, data reports that earn links passively)
Tier 6: Community (Quora DR93 answers, Reddit, blog comments)

TEAM:
- Hanan: Manual execution (profiles, posting, sending emails)
- Bilal: AI-generated content (Quora answers, emails, articles — generated in this dashboard)
- Muddasir: Technical builds in Claude Code (calculators, tools, analyzers, infographics)

EMAILS AVAILABLE:
ProPakistani PR pitch, Solar installer partnership, Guest post pitch, Unlinked mention reclaim, Follow-up, Calculator distribution, Data report distribution.

BLOG POSTS ON SITE:
- SPD vs No SPD guide
- RCBO vs RCCB comparison
- MCB Full Form guide
- MCCB Guide
- Changeover Types
- MCB Size Chart
- VP vs Stabilizer
- Solar DB Box Guide
- Fire Extinguisher Guide
- Net Metering 2026

When asked to write content, ALWAYS:
1. Include the specific collection URL (not just homepage)
2. Write as an expert at CNC Electric Pakistan
3. Use Pakistan context (load shedding, solar boom, voltage issues)
4. Be genuinely helpful, not salesy
5. 300 words for Quora, 500 for Medium, 1200 for guest posts`;

// ═══ HANAN'S TASKS ═══
const HANAN_TASKS = [
  {id:1, date:"Apr 03", cat:"PROFILE", title:"Crunchbase + About.me + Wellfound (3 DOFOLLOW links)",
   steps:"1. crunchbase.com → Sign Up → Create 'CNC Electric Pakistan' → Electrical Distribution → Lahore → paste description → website link → logo\n2. about.me → about.me/cncelectricpakistan → headline + bio + website button → logo\n3. wellfound.com → Create company → Hardware/E-Commerce → same description → logo\n\nPaste all 3 profile URLs in proof field",
   why:"3 dofollow links from DR 90+ in one session. Foundation for DR growth."},
  {id:2, date:"Apr 03", cat:"PROFILE", title:"LinkedIn Company Page + Gravatar + Disqus",
   steps:"1. linkedin.com/company/setup/new → CNC Electric Pakistan → Electrical Manufacturing → full description + specialties → logo + banner → POST announcement with /collections/circuit-breakers link\n2. gravatar.com → business email → CNC logo → website link\n3. disqus.com → CNC Electric Pakistan → website link → logo",
   why:"LinkedIn (DR 98) validates brand. Gravatar+Disqus enable branded blog commenting for Week 3+."},
  {id:3, date:"Apr 04", cat:"PROFILE", title:"Google Business Profile (FULL setup) + Trustpilot",
   steps:"1. business.google.com → CNC Electric Pakistan → Electrical Supply Store → full address/phone/hours → website → Add 15 products with images + links → Upload 20+ photos → Write first Google Post\n2. trustpilot.com/business → Claim → Electronics category → Send review request to 15 customers via WhatsApp",
   why:"Google Business = DIRECT ranking factor. Trustpilot reviews = E-E-A-T trust signal."},
  {id:4, date:"Apr 04", cat:"PROFILE", title:"Pinterest Business + Facebook verify + Twitter verify",
   steps:"1. business.pinterest.com → Create account → CLAIM website → 5 boards (Circuit Breakers, Solar, Smart Home, DB Boxes, Safety) → 25 pins total → each links to specific collection\n2. Facebook About → verify website + create pinned post with /collections link\n3. Twitter bio → add website",
   why:"Pinterest (DR 94) creates 25 deep links to collection pages. Facebook/Twitter verify existing signals."},
  {id:5, date:"Apr 05", cat:"PROFILE", title:"YouTube — Update ALL existing video descriptions",
   steps:"studio.youtube.com → Content → For EACH video: Edit → paste full description template (Bilal generates in AI Engine tab) → FIRST LINE must be product link → Save\n\nAlso: YouTube About section → website + top 3 collection links\nVimeo → channel + 3 videos with different descriptions\nFlipboard → magazine with 5 blog posts",
   why:"YouTube DR 99. If 15 videos, this creates 150+ links. Highest ROI task of entire plan."},
  {id:6, date:"Apr 06", cat:"PROFILE", title:"Medium publication + first article + SlideShare + Issuu + Behance",
   steps:"1. medium.com → Create 'CNC Electric Pakistan' publication → Publish article (Bilal generates in AI Engine) → add /collections/spd and /blogs/spd links\n2. slideshare.net → Upload product catalog (Muddasir creates) → description with website\n3. issuu.com → Upload same catalog as flipbook\n4. behance.net → Project with 10 product images → link in description",
   why:"4 content platforms DR 93-95. Medium article creates second Google entry for SPD."},
  {id:7, date:"Apr 07", cat:"PROFILE", title:"GitHub org + Quora setup + post first 5 answers",
   steps:"1. github.com → Org: CNC-Electric-Pakistan → Public repo: product-datasheets → README with website\n2. quora.com → Credentials: 'Electrical Protection Specialist at CNC Electric Pakistan' → website link\n3. Post 5 answers (Bilal generates in AI Engine):\n   Q1: MCB breaker → /collections/circuit-breakers\n   Q2: SPD full form → /collections/spd\n   Q3: Changeover switch → /collections/ats\n   Q4: Voltage protector → /collections/voltage-protectors\n   Q5: Fire extinguisher → /collections/fire-extinguisher",
   why:"GitHub (DR 96) signals credibility. 5 Quora answers defend your fragile #1 positions with DR 93 links."},
  {id:8, date:"Apr 08", cat:"REVIEW", title:"Week 1 Review — verify all profiles live",
   steps:"Google each: 'site:crunchbase.com CNC Electric Pakistan', 'site:about.me cncelectricpakistan', etc.\nCount total profiles. Verify all have correct website link.\nReport: X created, Y live, Z pending",
   why:"Catch dead/rejected profiles early. Fix before moving to directories."},
  {id:9, date:"Apr 09", cat:"DIRECTORY", title:"ENF Solar + SolarBusinessHub + List.Solar",
   steps:"1. enfsolar.com → Register as Component Distributor → List 4 products separately:\n   DC SPD → /collections/dc-spd\n   DC Breaker → /collections/dc-breaker\n   DC MCCB → /collections/dc-mccb-breaker\n   Solar DB Box → /collections/solar-db-box\n2. solarbusinesshub.com → Register\n3. list.solar → Submit listing",
   why:"ENF Solar DR 62 — THE solar directory. cncele.com has 8 links. Each product = separate backlink."},
  {id:10, date:"Apr 10", cat:"DIRECTORY", title:"5 Pakistan directories (identical NAP on all)",
   steps:"BusinessList.pk + PakBiz.com + TradeKey + B2Bmap.com + Lookup.pk\nSame name/address/phone on every single one. Category: Electrical Equipment, Lahore.",
   why:"Pakistan directories = geographic relevance. Consistent NAP = local SEO ranking factor."},
  {id:11, date:"Apr 11", cat:"DIRECTORY", title:"Rozee.pk + Zameen + UrduPoint + 3 more PK directories",
   steps:"Rozee.pk company page + Zameen business listing + UrduPoint + DirectoryPakistan + Pakistanies + PakBD",
   why:"Rozee (DR 50) and Zameen (DR 60) are high-authority Pakistan platforms."},
  {id:12, date:"Apr 13", cat:"DIRECTORY", title:"5 international B2B directories",
   steps:"GlobalSources.com (DR 73) + EC21 (DR 58) + EWorldTrade (DR 52) + Kompass (DR 72) + Hotfrog (DR 62)",
   why:"International B2B = professional/wholesale credibility signal."},
  {id:13, date:"Apr 14", cat:"QUORA", title:"Post Quora answers 6-10 (Bilal generates)",
   steps:"Q6: RCBO vs RCCB → /collections/rccb\nQ7: DC breaker solar → /collections/dc-breaker\nQ8: DB box wiring → /collections/db-boxes\nQ9: WiFi breaker → /collections/wifi-smart-circuit-breakers\nQ10: Magnetic contactor → /collections/magnetic-contactors",
   why:"5 more DR 93 deep links defending fragile #1 positions."},
  {id:14, date:"Apr 15", cat:"REVIEW", title:"Week 2 Review + first Ahrefs check",
   steps:"Ahrefs → cncelectric.pk → DR + RDs + New backlinks (14 days)\nGoogle: 'CNC Electric Pakistan' → which profiles appear?\nExpected: DR 2.5-4, 45-60 RDs",
   why:"First measurement checkpoint."},
  {id:15, date:"Apr 16", cat:"OUTREACH", title:"Send ProPakistani + TechJuice pitch emails",
   steps:"Use emails from AI Engine tab (Bilal generates personalized versions)\nProPakistani: editor@propakistani.pk\nTechJuice: contact form\nAlso: Register on SOS + Qwoted + Featured.com",
   why:"One ProPakistani link (DR 73) > 50 directory listings."},
  {id:16, date:"Apr 17", cat:"AHREFS", title:"Hack 1: Steal powerhouseexpress.com.pk backlinks",
   steps:"Ahrefs → Site Explorer → powerhouseexpress.com.pk → Backlinks → Dofollow, DR>10, one per domain → Export top 100 → Analyze: directory? guest post? news? → Create action list",
   why:"Their DR 44 with 500+ RDs IS your roadmap."},
  {id:17, date:"Apr 18", cat:"OUTREACH", title:"Act on Hack 1 + Medium Article #2",
   steps:"Register on directories found. Draft pitches for blogs found.\nPublish Medium article #2 (Bilal generates): changeover switch topic → links to /collections/ats",
   why:"Changeover switch 800/mo #10 — attacking from Medium platform."},
  {id:18, date:"Apr 20", cat:"QUORA", title:"Post Quora answers 11-15",
   steps:"Q11-15: MCCB vs MCB, selector switch, solar protection, timer switch, breaker price PK\nCheck HARO/SOS/Qwoted for journalist queries",
   why:"15 total Quora answers = 15 deep links from DR 93."},
  {id:19, date:"Apr 21", cat:"AHREFS", title:"Weekly check + Hack 3: unlinked mentions",
   steps:"Content Explorer → 'CNC Electric Pakistan' → 'cncelectric.pk' → Find mentions without links → Send reclaim emails (Bilal generates)",
   why:"40-60% conversion rate — easiest links to get."},
  {id:20, date:"Apr 22", cat:"REVIEW", title:"Week 3 Review",
   steps:"ProPakistani status? HARO wins? Hack 1 targets actioned?\nExpected: DR 4-6, 65-80 RDs", why:"Mid-month checkpoint."},
  {id:21, date:"Apr 23", cat:"OUTREACH", title:"Solar installer partnership emails (20 companies)",
   steps:"Use Bilal's researched list + AI-generated personalized emails\nSend all 20. Record in outreach log.\nSet follow-up: 7 days",
   why:"Solar installer links = contextually perfect. 3-5 wins = massive relevance signal."},
  {id:22, date:"Apr 24", cat:"OUTREACH", title:"Guest post pitching (5 blogs)",
   steps:"Google: 'electrical write for us', 'solar guest post'\nSelect 5 blogs DR 15+. Send pitch emails (Bilal generates).",
   why:"One guest post on DR 30+ site = 20 directory listings."},
  {id:23, date:"Apr 25", cat:"QUORA", title:"Post Quora answers 16-20",
   steps:"Q16-20: load shedding, net metering, industrial socket, distribution board, ACB breaker",
   why:"20 Quora answers in one month = massive deep link distribution."},
  {id:24, date:"Apr 27", cat:"AHREFS", title:"Weekly check + Hack 2: Link Intersect",
   steps:"Link Intersect → cncelectric.pk vs alladin.pk + clopal.com → DR>15 → Top 30 targets\nFollow up ALL pending outreach",
   why:"Monthly competitor rotation reveals new targets."},
  {id:25, date:"Apr 28", cat:"OUTREACH", title:"Blog commenting (10 blogs) + Medium #3",
   steps:"Find 10 electrical/solar blogs → genuine 3+ sentence comments\nPublish Medium #3 (fire extinguisher topic) → link /collections/fire-extinguisher",
   why:"Blog comments build presence. Medium #3 supports 5,500/mo keyword."},
  {id:26, date:"Apr 29", cat:"REVIEW", title:"Month 1 Final Audit",
   steps:"Ahrefs: DR + RDs + Backlinks screenshot\nVerify all profiles indexed\nCount everything. Fill KPI tab.\nExpected: DR 6-10, 80-100 RDs, 500+ backlinks",
   why:"Month 1 = foundation complete. Real acceleration starts Month 2."},
];

// Month 2-3 weekly summaries for Hanan
const HANAN_M2M3 = [
  {id:27, date:"May Wk5", cat:"OUTREACH", title:"Hack 1 on alladin.pk + Quora 21-25 + HARO check + follow up all outreach"},
  {id:28, date:"May Wk6", cat:"OUTREACH", title:"Hack 1 on clopal.com + distribute load calculator to 20 sites + guest post submission + Quora 26-30"},
  {id:29, date:"May Wk7", cat:"OUTREACH", title:"Hack 1 on industryparts.pk + broken link campaign (20 emails) + partnership round 2 + Quora 31-35 + infographic distribution"},
  {id:30, date:"May Wk8", cat:"REVIEW", title:"MONTH 2 AUDIT: Pitch Safety Report to 10 news sites + guest post #2 + Quora 36-40. Expected: DR 15-25, 200-300 RDs"},
  {id:31, date:"Jun Wk9", cat:"OUTREACH", title:"Hack 1 on chintglobal + HARO intensive (10 queries) + guest post #3 + Quora 41-45 + Medium #7"},
  {id:32, date:"Jun Wk10", cat:"OUTREACH", title:"PR blitz: pitch report to 20 sites + broken link round 2 + Quora 46-50 + guest post pitch round 3"},
  {id:33, date:"Jun Wk11", cat:"OUTREACH", title:"Link Intersect new combos + partnership round 3 (construction companies) + Quora 51-55 + guest post #4"},
  {id:34, date:"Jun Wk12", cat:"REVIEW", title:"3-MONTH FINAL AUDIT: DR target 35-50. Count everything. Plan Months 4-6."},
];

// ═══ MUDDASIR BACKLOG ═══
const MUDDASIR_TASKS = [
  {id:1, priority:"CRITICAL", title:"Electrical Load Calculator", desc:"Full HTML/JS calculator. Users enter appliances → get MCB rating, DB box size, wire gauge + CNC product links.", file:"01-load-calculator.md", time:"2-3 hrs"},
  {id:2, priority:"CRITICAL", title:"Content Multiplier System", desc:"React app: paste blog → API generates Medium + Quora + Pinterest + Reddit + Twitter versions.", file:"02-content-multiplier.md", time:"3-4 hrs"},
  {id:3, priority:"CRITICAL", title:"Link Intersect Analyzer", desc:"Process 7,994-domain CSV. Auto-categorize, score, generate outreach emails for top targets.", file:"03-link-intersect-analyzer.md", time:"3-4 hrs"},
  {id:4, priority:"HIGH", title:"Profile Audit Dashboard", desc:"Track all 25+ profiles. Status, DR, dofollow/nofollow ratio. One-click verification.", file:"04-profile-audit-and-reports.md", time:"2-3 hrs"},
  {id:5, priority:"HIGH", title:"Weekly Report Generator", desc:"Input Ahrefs numbers → DR trend chart + pace analysis toward DR 50.", file:"04-profile-audit-and-reports.md", time:"2-3 hrs"},
  {id:6, priority:"HIGH", title:"Solar Sizing Calculator", desc:"User enters bill + city → panel count + ALL protection equipment with CNC product links.", file:"(create new .md)", time:"3-4 hrs"},
  {id:7, priority:"HIGH", title:"MCB/MCCB Selection Guide", desc:"Interactive quiz → recommends specific CNC product. Embeddable widget.", file:"(create new .md)", time:"2-3 hrs"},
  {id:8, priority:"HIGH", title:"Product Catalog PDF", desc:"10-page catalog for SlideShare/Issuu. All products with specs + links.", file:"Claude Code", time:"2-3 hrs"},
  {id:9, priority:"MEDIUM", title:"Infographic: DB Box Anatomy", desc:"Labeled diagram of every DB box component. SVG/HTML. Distribute to directories.", file:"Claude Code", time:"2-3 hrs"},
  {id:10, priority:"MEDIUM", title:"Infographic: Breaker Comparison", desc:"MCB vs MCCB vs ACB vs RCCB vs RCBO visual chart. Embeddable.", file:"Claude Code", time:"2-3 hrs"},
  {id:11, priority:"MEDIUM", title:"Pakistan Electrical Safety Report 2026", desc:"10-page data report. Fire stats, solar adoption, market data. PDF + blog. THE link magnet.", file:"ChatGPT Pro research", time:"4-6 hrs"},
  {id:12, priority:"MEDIUM", title:"Embeddable Widget: Breaker Selector", desc:"Other sites embed it = automatic backlink. Interactive quiz format.", file:"Claude Code", time:"3-4 hrs"},
  {id:13, priority:"MEDIUM", title:"Competitor Backlink Deep Analysis", desc:"Process powerhouseexpress 500+ RDs. Find patterns. Generate complete strategy.", file:"Claude Code + Ahrefs", time:"3-4 hrs"},
  {id:14, priority:"LOW", title:"Schema Markup Generator", desc:"LocalBusiness + Product + FAQ structured data for all key pages.", file:"Claude Code", time:"2 hrs"},
  {id:15, priority:"LOW", title:"Anchor Text Analyzer", desc:"Process backlink data, analyze distribution, flag over-optimization.", file:"Claude Code", time:"2 hrs"},
  {id:16, priority:"LOW", title:"Press Kit Page", desc:"Company background, downloadable assets, media contact. For journalists.", file:"Claude Code", time:"2 hrs"},
];

// ═══ BILAL AI MODULES ═══
const QUORA_TOPICS = [
  {q:"What is MCB circuit breaker?", kw:"mcb breaker", vol:"700/mo", pos:"#1", link:"/collections/circuit-breakers"},
  {q:"What is SPD / SPD full form in electrical?", kw:"spd", vol:"1,400/mo", pos:"#1", link:"/collections/spd"},
  {q:"How does automatic changeover switch work?", kw:"changeover switch", vol:"800/mo", pos:"#10", link:"/collections/ats"},
  {q:"Do I need voltage protector for AC in Pakistan?", kw:"voltage protector", vol:"900/mo", pos:"#1", link:"/collections/voltage-protectors"},
  {q:"Which fire extinguisher for electrical fires?", kw:"fire extinguisher", vol:"5,500/mo", pos:"#8", link:"/collections/fire-extinguisher"},
  {q:"What is RCBO vs RCCB difference?", kw:"rcbo breaker", vol:"250/mo", pos:"#1", link:"/collections/rccb"},
  {q:"What DC breaker for solar panel?", kw:"dc breaker", vol:"250/mo", pos:"#1", link:"/collections/dc-breaker"},
  {q:"How to wire DB box for home Pakistan?", kw:"db box", vol:"400/mo", pos:"#1", link:"/collections/db-boxes"},
  {q:"WiFi smart breaker worth it?", kw:"wifi switch", vol:"300/mo", pos:"#25", link:"/collections/wifi-smart-circuit-breakers"},
  {q:"What is magnetic contactor?", kw:"magnetic contactor", vol:"600/mo", pos:"#1", link:"/collections/magnetic-contactors"},
  {q:"MCCB vs MCB difference?", kw:"mccb breaker", vol:"700/mo", pos:"#1", link:"/collections/ac-mccb-breakers"},
  {q:"What is selector switch?", kw:"selector switch", vol:"500/mo", pos:"#13", link:"/collections/selector-switch"},
  {q:"Solar panel protection equipment Pakistan?", kw:"solar protection", vol:"—", pos:"—", link:"/collections/solar-db-box"},
  {q:"Timer switch for home?", kw:"timer switch", vol:"400/mo", pos:"#28", link:"/collections/timer-ah2n"},
  {q:"Circuit breaker price in Pakistan?", kw:"breaker price", vol:"350/mo", pos:"#10", link:"/collections/circuit-breakers"},
  {q:"Load shedding solution Pakistan?", kw:"load shedding", vol:"900/mo", pos:"—", link:"/collections/ats"},
  {q:"Net metering Pakistan 2026?", kw:"net metering", vol:"4,300/mo", pos:"—", link:"/blogs/news/net-metering"},
  {q:"Industrial socket types?", kw:"industrial socket", vol:"300/mo", pos:"#13", link:"/collections/industrial-plug-socket"},
  {q:"Distribution board components?", kw:"distribution box", vol:"300/mo", pos:"#1", link:"/collections/db-boxes"},
  {q:"ACB air circuit breaker?", kw:"acb breaker", vol:"250/mo", pos:"#1", link:"/collections/acb-breakers"},
];

const EMAIL_TYPES = [
  {type:"PR / News Pitch", desc:"For ProPakistani, TechJuice, Dawn, news sites"},
  {type:"Solar Installer Partnership", desc:"For solar companies — mutual linking + wholesale"},
  {type:"Guest Post Pitch", desc:"For blogs accepting guest articles"},
  {type:"Unlinked Mention Reclaim", desc:"For sites mentioning CNC without linking"},
  {type:"Calculator Distribution", desc:"Share free tool with blogs/sites"},
  {type:"Data Report Distribution", desc:"Share Safety Report with journalists"},
  {type:"Follow-up", desc:"Follow up on any previous email"},
];

// ═══ MAIN APP ═══
export default function App() {
  const [tab, setTab] = useState("hanan");
  const [done, setDone] = useState({});
  const [proofs, setProofs] = useState({});
  const [blink, setBlink] = useState(true);
  const [chatMsgs, setChatMsgs] = useState([{role:"assistant",content:"I'm your CNC Electric backlink strategist. I know all 120 keywords, every competitor's DR, every collection URL, and the full 3-month plan. Ask me anything — write emails, Quora answers, analyze strategy, check progress. What do you need?"}]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selQuora, setSelQuora] = useState(0);
  const [selEmail, setSelEmail] = useState(0);
  const [emailName, setEmailName] = useState("");
  const [emailCompany, setEmailCompany] = useState("");
  const [emailCity, setEmailCity] = useState("");
  const [kpi, setKpi] = useState({});
  const chatEndRef = useRef(null);

  useEffect(() => { const iv=setInterval(()=>setBlink(b=>!b),900); return()=>clearInterval(iv); }, []);
  useEffect(() => {
    (async()=>{
      try{
        const d=await window.storage.get("v3-done"); if(d?.value) setDone(JSON.parse(d.value));
        const p=await window.storage.get("v3-proofs"); if(p?.value) setProofs(JSON.parse(p.value));
        const k=await window.storage.get("v3-kpi"); if(k?.value) setKpi(JSON.parse(k.value));
      }catch(e){}
    })();
  }, []);
  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[chatMsgs]);

  const persist = async(d,p)=>{ try{ await window.storage.set("v3-done",JSON.stringify(d)); await window.storage.set("v3-proofs",JSON.stringify(p)); }catch(e){} };
  const toggleDone = (id)=>{ const n={...done,[id]:!done[id]}; setDone(n); persist(n,proofs); };
  const setProof = (id,v)=>{ const n={...proofs,[id]:v}; setProofs(n); persist(done,n); };

  const callAPI = async(prompt, system="") => {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:2000,
          system: system || PROJECT_CONTEXT,
          messages:[{role:"user",content:prompt}]
        })
      });
      const d = await r.json();
      return d.content?.map(c=>c.text||"").join("\n") || "Error generating content.";
    } catch(e) { return "API error: "+e.message; }
  };

  const genQuora = async()=>{
    setAiLoading(true);
    const t = QUORA_TOPICS[selQuora];
    const out = await callAPI(`Write a 300-word expert Quora answer to: "${t.q}"

Target keyword: ${t.kw} (${t.vol} monthly searches in Pakistan, current position: ${t.pos})
Link to include naturally: https://www.cncelectric.pk${t.link}

Write as an electrical protection specialist at CNC Electric Pakistan. Use Pakistan context (load shedding, voltage issues, solar boom). Be genuinely helpful. Include personal touch: "In our experience across installations in Lahore..."

Do NOT be salesy. The link should appear naturally within the answer or at the end as a resource.`);
    setAiOutput(out); setAiLoading(false);
  };

  const genEmail = async()=>{
    setAiLoading(true);
    const t = EMAIL_TYPES[selEmail];
    const out = await callAPI(`Write a personalized outreach email.
Type: ${t.type}
Recipient name: ${emailName || "[Name]"}
Company: ${emailCompany || "[Company]"}
City: ${emailCity || "[City]"}

Write a professional but warm email from CNC Electric Pakistan. 150-200 words. Include subject line.
Include relevant product link from https://www.cncelectric.pk based on the email type.
If partnership: propose mutual linking + wholesale pricing.
If PR: pitch the authorized distributor story + 15x traffic growth.
If guest post: propose article topic relevant to their audience.
If unlinked mention: politely ask to add link.`);
    setAiOutput(out); setAiLoading(false);
  };

  const genContent = async(type)=>{
    setAiLoading(true);
    const prompts = {
      medium: "Write a 500-word Medium article about SPD surge protection for Pakistan solar systems. Different angle than a technical guide — use storytelling. Title should be attention-grabbing. End with links to /collections/spd and the SPD blog post.",
      pinterest: "Write 10 Pinterest pin descriptions for CNC Electric Pakistan products. 2 sentences each. Keyword-rich. Each specifies which collection URL to link to. Cover: MCBs, SPDs, ATS, changeover switches, voltage protectors, WiFi breakers, DB boxes, fire extinguishers, DC breakers, contactors.",
      google: "Write 5 Google Business Profile posts for CNC Electric Pakistan. 80 words each. Each promotes a different product category with a link to the specific collection page. Include emoji. Tone: professional but engaging.",
      yt_desc: "Write the YouTube video description template for CNC Electric Pakistan. First line: product link placeholder. Then company description. Then list ALL collection URLs. Then warranty/delivery info. Then hashtags. This template will be pasted into every video description."
    };
    const out = await callAPI(prompts[type] || "Generate content for CNC Electric Pakistan backlink building.");
    setAiOutput(out); setAiLoading(false);
  };

  const sendChat = async()=>{
    if(!chatInput.trim()) return;
    const msgs = [...chatMsgs, {role:"user",content:chatInput}];
    setChatMsgs(msgs); setChatInput(""); setChatLoading(true);
    const history = msgs.slice(-10).map(m=>({role:m.role,content:m.content}));
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,system:PROJECT_CONTEXT,messages:history})
      });
      const d = await r.json();
      const reply = d.content?.map(c=>c.text||"").join("\n")||"Sorry, I couldn't generate a response.";
      setChatMsgs([...msgs,{role:"assistant",content:reply}]);
    } catch(e) { setChatMsgs([...msgs,{role:"assistant",content:"API error: "+e.message}]); }
    setChatLoading(false);
  };

  const S = { bg:"#FFFFFF", nav:"#1A1A1A", red:"#DC2626", grey:"#6B7280", light:"#F3F4F6", border:"#E5E7EB" };
  const doneCount = (list)=>list.filter(t=>done[t.id||(t.cat+t.date)]).length;

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:S.bg,minHeight:"100vh",color:"#1A1A1A"}}>
      {/* HEADER */}
      <div style={{background:S.nav,padding:"16px 20px",borderBottom:`4px solid ${S.red}`}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{width:44,height:44,background:S.red,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:"#fff",fontWeight:900,fontSize:16}}>CNC</span>
          </div>
          <div>
            <div style={{fontSize:22,fontWeight:900,color:blink?S.red:"#FFFFFF",transition:"color 0.5s",letterSpacing:1}}>
              CNC ELECTRIC BACKLINKING JOURNEY
            </div>
            <div style={{fontSize:11,color:"#9CA3AF"}}>DR 1.8 → 50 | Operations Dashboard | {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{display:"flex",background:S.light,borderBottom:`1px solid ${S.border}`,overflow:"auto"}}>
        {[
          {k:"hanan",l:"Hanan Tasks",emoji:"📋"},
          {k:"bilal",l:"Bilal AI Engine",emoji:"🤖"},
          {k:"muddasir",l:"Muddasir Backlog",emoji:"🔧"},
          {k:"kpi",l:"KPI Dashboard",emoji:"📊"},
          {k:"chat",l:"AI Assistant",emoji:"💬"},
        ].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:"12px 20px",border:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t.k?800:500,
            background:tab===t.k?"#FFFFFF":S.light,color:tab===t.k?S.red:S.grey,
            borderBottom:tab===t.k?`3px solid ${S.red}`:"3px solid transparent",whiteSpace:"nowrap"
          }}>{t.emoji} {t.l}</button>
        ))}
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"16px 20px 60px"}}>

      {/* ═══ HANAN TAB ═══ */}
      {tab==="hanan" && (
        <div>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <div style={{background:S.light,borderRadius:8,padding:"10px 16px",border:`2px solid ${S.red}`}}>
              <div style={{fontSize:22,fontWeight:900,color:S.red}}>{doneCount(HANAN_TASKS)}/{HANAN_TASKS.length}</div>
              <div style={{fontSize:10,color:S.grey}}>MONTH 1 TASKS</div>
            </div>
          </div>
          {[...HANAN_TASKS,...HANAN_M2M3].map(task=>{
            const key = task.id;
            const isDone = done[key];
            return (
              <div key={key} style={{background:isDone?"#F0FDF4":"#FFF",border:`1px solid ${isDone?"#86EFAC":S.border}`,borderLeft:`5px solid ${isDone?"#22C55E":task.cat==="REVIEW"?S.grey:task.cat==="OUTREACH"?"#EAB308":task.cat==="QUORA"?"#8B5CF6":task.cat==="AHREFS"?"#06B6D4":task.cat==="DIRECTORY"?"#22C55E":S.red}`,borderRadius:8,marginBottom:8,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <button onClick={()=>toggleDone(key)} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${isDone?"#22C55E":S.red}`,background:isDone?"#22C55E":"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:900}}>{isDone?"✓":""}</button>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:S.red,color:"#fff",fontWeight:700}}>{task.date}</span>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:S.light,color:S.grey,fontWeight:700}}>{task.cat}</span>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,color:isDone?"#16A34A":"#1A1A1A",textDecoration:isDone?"line-through":"none"}}>{task.title}</div>
                    {task.why && <div style={{fontSize:11,color:S.grey,marginTop:4,background:"#FEF2F2",padding:"6px 10px",borderRadius:6,borderLeft:`3px solid ${S.red}`}}>{task.why}</div>}
                    {task.steps && <pre style={{fontSize:11,color:"#374151",whiteSpace:"pre-wrap",marginTop:8,background:S.light,padding:10,borderRadius:6,lineHeight:1.6}}>{task.steps}</pre>}
                    <input value={proofs[key]||""} onChange={e=>setProof(key,e.target.value)} placeholder="Paste proof URL here..." style={{width:"100%",marginTop:8,padding:"8px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:12}}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ BILAL AI ENGINE TAB ═══ */}
      {tab==="bilal" && (
        <div>
          <div style={{background:"#FEF2F2",padding:12,borderRadius:8,marginBottom:16,borderLeft:`4px solid ${S.red}`}}>
            <div style={{fontSize:13,fontWeight:700,color:S.red}}>AI Content Engine — Click generate → Review output → Copy → Hanan posts it</div>
          </div>

          {/* Quora Generator */}
          <div style={{background:"#FFF",border:`1px solid ${S.border}`,borderRadius:8,padding:16,marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:800,color:"#1A1A1A",marginBottom:10}}>📝 Quora Answer Generator</div>
            <select value={selQuora} onChange={e=>setSelQuora(+e.target.value)} style={{width:"100%",padding:10,borderRadius:6,border:`1px solid ${S.border}`,fontSize:12,marginBottom:8}}>
              {QUORA_TOPICS.map((t,i)=><option key={i} value={i}>Q{i+1}: {t.q} — {t.kw} ({t.vol}) {t.pos}</option>)}
            </select>
            <button onClick={genQuora} disabled={aiLoading} style={{padding:"10px 24px",background:S.red,color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:13}}>{aiLoading?"Generating...":"Generate Quora Answer"}</button>
          </div>

          {/* Email Generator */}
          <div style={{background:"#FFF",border:`1px solid ${S.border}`,borderRadius:8,padding:16,marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:800,marginBottom:10}}>📧 Outreach Email Generator</div>
            <select value={selEmail} onChange={e=>setSelEmail(+e.target.value)} style={{width:"100%",padding:8,borderRadius:6,border:`1px solid ${S.border}`,fontSize:12,marginBottom:6}}>
              {EMAIL_TYPES.map((t,i)=><option key={i} value={i}>{t.type} — {t.desc}</option>)}
            </select>
            <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
              <input value={emailName} onChange={e=>setEmailName(e.target.value)} placeholder="Recipient name" style={{flex:1,padding:8,borderRadius:6,border:`1px solid ${S.border}`,fontSize:12,minWidth:120}}/>
              <input value={emailCompany} onChange={e=>setEmailCompany(e.target.value)} placeholder="Company name" style={{flex:1,padding:8,borderRadius:6,border:`1px solid ${S.border}`,fontSize:12,minWidth:120}}/>
              <input value={emailCity} onChange={e=>setEmailCity(e.target.value)} placeholder="City" style={{flex:1,padding:8,borderRadius:6,border:`1px solid ${S.border}`,fontSize:12,minWidth:80}}/>
            </div>
            <button onClick={genEmail} disabled={aiLoading} style={{padding:"10px 24px",background:S.red,color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:13}}>{aiLoading?"Generating...":"Generate Email"}</button>
          </div>

          {/* Content Generators */}
          <div style={{background:"#FFF",border:`1px solid ${S.border}`,borderRadius:8,padding:16,marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:800,marginBottom:10}}>✍️ Content Generators</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["medium","Medium Article"],["pinterest","Pinterest Pins (10)"],["google","Google Business Posts (5)"],["yt_desc","YouTube Description Template"]].map(([k,l])=>(
                <button key={k} onClick={()=>genContent(k)} disabled={aiLoading} style={{padding:"8px 16px",background:"#1A1A1A",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:600,fontSize:12}}>{l}</button>
              ))}
            </div>
          </div>

          {/* AI Output */}
          {(aiOutput||aiLoading) && (
            <div style={{background:S.light,border:`1px solid ${S.border}`,borderRadius:8,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:700,color:S.red}}>AI OUTPUT</span>
                <button onClick={()=>{navigator.clipboard.writeText(aiOutput)}} style={{padding:"6px 14px",background:"#22C55E",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:11}}>Copy</button>
              </div>
              <pre style={{fontSize:12,color:"#374151",whiteSpace:"pre-wrap",lineHeight:1.6,maxHeight:400,overflow:"auto"}}>{aiLoading?"Generating with Claude API...":aiOutput}</pre>
            </div>
          )}
        </div>
      )}

      {/* ═══ MUDDASIR TAB ═══ */}
      {tab==="muddasir" && (
        <div>
          <div style={{background:"#FEF2F2",padding:12,borderRadius:8,marginBottom:16,borderLeft:`4px solid ${S.red}`}}>
            <div style={{fontSize:13,fontWeight:700,color:S.red}}>Claude Code Tasks — No deadlines. Pick by priority. Each has a .md file to feed into Claude Code.</div>
          </div>
          {MUDDASIR_TASKS.map(task=>{
            const isDone = done["m-"+task.id];
            const pColor = task.priority==="CRITICAL"?S.red:task.priority==="HIGH"?"#EA580C":task.priority==="MEDIUM"?"#2563EB":S.grey;
            return (
              <div key={task.id} style={{background:isDone?"#F0FDF4":"#FFF",border:`1px solid ${isDone?"#86EFAC":S.border}`,borderLeft:`5px solid ${pColor}`,borderRadius:8,marginBottom:8,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <button onClick={()=>toggleDone("m-"+task.id)} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${isDone?"#22C55E":pColor}`,background:isDone?"#22C55E":"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12}}>{isDone?"✓":""}</button>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontSize:10,padding:"2px 10px",borderRadius:10,background:pColor,color:"#fff",fontWeight:800}}>{task.priority}</span>
                      <span style={{fontSize:10,color:S.grey}}>{task.time}</span>
                      <span style={{fontSize:10,color:"#2563EB",fontWeight:600}}>{task.file}</span>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,textDecoration:isDone?"line-through":"none"}}>{task.title}</div>
                    <div style={{fontSize:12,color:S.grey,marginTop:4}}>{task.desc}</div>
                    <input value={proofs["m-"+task.id]||""} onChange={e=>setProof("m-"+task.id,e.target.value)} placeholder="Paste output/URL here..." style={{width:"100%",marginTop:8,padding:"8px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:12}}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ KPI TAB ═══ */}
      {tab==="kpi" && (
        <div>
          <div style={{fontSize:16,fontWeight:800,marginBottom:16}}>📊 KPI Dashboard — DR 1.8 → 50 Journey</div>
          <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
            {[{l:"Current DR",k:"dr",target:"50"},{l:"Referring Domains",k:"rds",target:"700"},{l:"Total Backlinks",k:"bl",target:"3000+"}].map(m=>(
              <div key={m.k} style={{flex:1,minWidth:120,background:S.light,borderRadius:8,padding:16,border:`1px solid ${S.border}`}}>
                <div style={{fontSize:10,color:S.grey,textTransform:"uppercase",fontWeight:700}}>{m.l}</div>
                <input value={kpi[m.k]||""} onChange={e=>{const n={...kpi,[m.k]:e.target.value};setKpi(n);try{window.storage.set("v3-kpi",JSON.stringify(n))}catch(err){}}} placeholder="Enter..." style={{width:"100%",fontSize:24,fontWeight:900,color:S.red,border:"none",background:"transparent",outline:"none"}}/>
                <div style={{fontSize:10,color:S.grey}}>Target: {m.target}</div>
              </div>
            ))}
          </div>
          {/* DR Progress Bar */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:6}}>DR Progress</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:11,fontWeight:700}}>1.8</span>
              <div style={{flex:1,height:12,background:S.light,borderRadius:6,overflow:"hidden",border:`1px solid ${S.border}`}}>
                <div style={{width:`${Math.min((parseFloat(kpi.dr||1.8)/50)*100,100)}%`,height:"100%",background:`linear-gradient(90deg, ${S.red}, #EF4444)`,borderRadius:6,transition:"width 0.5s"}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700}}>50</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9,color:S.grey}}>
              <span>Start</span><span>DR 10</span><span>DR 20</span><span>DR 30</span><span>DR 40</span><span>DR 50</span>
            </div>
          </div>
          {/* Team Progress */}
          <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>Team Completion</div>
          {[{l:"Hanan (Month 1)",done:doneCount(HANAN_TASKS),total:HANAN_TASKS.length},{l:"Muddasir Backlog",done:MUDDASIR_TASKS.filter(t=>done["m-"+t.id]).length,total:MUDDASIR_TASKS.length}].map(t=>(
            <div key={t.l} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span>{t.l}</span><span style={{fontWeight:700}}>{t.done}/{t.total}</span></div>
              <div style={{height:8,background:S.light,borderRadius:4,overflow:"hidden",border:`1px solid ${S.border}`}}>
                <div style={{width:`${t.total?t.done/t.total*100:0}%`,height:"100%",background:S.red,borderRadius:4,transition:"width 0.3s"}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ AI CHATBOT TAB ═══ */}
      {tab==="chat" && (
        <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 200px)"}}>
          <div style={{background:"#FEF2F2",padding:10,borderRadius:8,marginBottom:10,borderLeft:`4px solid ${S.red}`}}>
            <div style={{fontSize:12,fontWeight:700,color:S.red}}>AI Assistant — Knows all 120 keywords, competitors, URLs, strategy. Ask anything.</div>
          </div>
          <div style={{flex:1,overflow:"auto",marginBottom:10}}>
            {chatMsgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:8}}>
                <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:12,fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap",
                  background:m.role==="user"?S.red:S.light,color:m.role==="user"?"#fff":"#1A1A1A",
                  borderBottomRightRadius:m.role==="user"?2:12,borderBottomLeftRadius:m.role==="user"?12:2
                }}>{m.content}</div>
              </div>
            ))}
            {chatLoading && <div style={{display:"flex",justifyContent:"flex-start",marginBottom:8}}><div style={{padding:"10px 14px",borderRadius:12,background:S.light,fontSize:13,color:S.grey}}>Thinking...</div></div>}
            <div ref={chatEndRef}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()} placeholder="Ask anything — write emails, Quora answers, analyze strategy..." style={{flex:1,padding:"12px 14px",border:`2px solid ${S.border}`,borderRadius:8,fontSize:13,outline:"none"}}/>
            <button onClick={sendChat} disabled={chatLoading} style={{padding:"12px 20px",background:S.red,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>Send</button>
          </div>
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            {["Write ProPakistani email","Next Quora answer to target?","Are we on pace for DR 50?","Write solar installer partnership email for SolarTech Karachi","What keywords are most at risk?"].map(q=>(
              <button key={q} onClick={()=>{setChatInput(q)}} style={{padding:"4px 10px",background:S.light,border:`1px solid ${S.border}`,borderRadius:12,fontSize:10,color:S.grey,cursor:"pointer"}}>{q}</button>
            ))}
          </div>
        </div>
      )}

      </div>

      {/* FOOTER */}
      <div style={{background:S.nav,padding:"12px 20px",textAlign:"center",borderTop:`4px solid ${S.red}`,position:"fixed",bottom:0,left:0,right:0}}>
        <div style={{fontSize:10,color:"#6B7280"}}>CNC Electric Pakistan — Backlink Operations Dashboard v3.0 — Target DR 50</div>
      </div>
    </div>
  );
}
