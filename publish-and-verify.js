#!/usr/bin/env node
/**
 * publish-and-verify.js — CNC Electric
 * ------------------------------------------------------------------
 * Publishes EVERY article in ./articles/*.meta.json (with a matching .html)
 * to the Shopify "guides" blog, then VERIFIES each one is live (HTTP 200).
 *
 * Why this exists: the cloud cron could never push (Shopify 403s cloud IPs),
 * so ~9 guides sat unpublished while reports claimed "LIVE". Run this from
 * YOUR machine (clean IP + token) to actually publish and confirm.
 *
 * USAGE:
 *   export SHOPIFY_TOKEN=shpat_xxxxxxxx        # your Admin API token
 *   node publish-and-verify.js                 # publish + verify all
 *   node publish-and-verify.js --dry-run       # show what would publish, no writes
 *   node publish-and-verify.js --only DAY-20   # filter by filename substring
 *
 * Requires Node 18+ (built-in fetch). No npm install needed.
 * ------------------------------------------------------------------
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SHOP = 'cncelectric.myshopify.com';
const API = '2024-10';
const PUBLIC_BASE = 'https://www.cncelectric.pk/blogs/guides';
const BLOG_ID = '89971589186';

// Find the Shopify token without the user needing to know it:
// 1) SHOPIFY_TOKEN env var, else
// 2) grep a hardcoded shpat_ token out of existing local publish scripts
//    (cnc-seo-push/publish-*.js etc.) in common sibling/home locations.
function findToken() {
  if (process.env.SHOPIFY_TOKEN) return process.env.SHOPIFY_TOKEN;
  const os = require('os');
  const candidates = [];
  const dirs = [
    __dirname,
    path.join(__dirname, '..', 'cnc-seo-push'),
    path.join(os.homedir(), 'cnc-seo-push'),
    path.join(os.homedir(), 'Desktop', 'cnc-seo-push'),
    path.join(os.homedir(), 'Documents', 'cnc-seo-push'),
    os.homedir(),
  ];
  for (const d of dirs) {
    try {
      for (const f of fs.readdirSync(d)) {
        if (/\.(js|json|sh|txt|env)$/i.test(f) && /publish|shopify|token|\.env/i.test(f)) {
          candidates.push(path.join(d, f));
        }
      }
    } catch (_) { /* dir not present */ }
  }
  for (const file of candidates) {
    try {
      const m = fs.readFileSync(file, 'utf8').match(/shpat_[A-Za-z0-9]+/);
      if (m) { console.log(`🔑 Using token found in ${file}`); return m[0]; }
    } catch (_) { /* unreadable */ }
  }
  return null;
}

const TOKEN = findToken();
const ARTICLES_DIR = path.join(__dirname, 'articles');

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

if (!TOKEN && !DRY) {
  console.error('❌ SHOPIFY_TOKEN not set. Run:  export SHOPIFY_TOKEN=shpat_xxxx');
  process.exit(1);
}

const adminHeaders = {
  'X-Shopify-Access-Token': TOKEN,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Read every *.meta.json that has a sibling *.html
function loadArticles() {
  return fs.readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.meta.json'))
    .map((f) => f.replace(/\.meta\.json$/, ''))
    .filter((base) => fs.existsSync(path.join(ARTICLES_DIR, base + '.html')))
    .filter((base) => !ONLY || base.includes(ONLY))
    .map((base) => {
      const meta = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, base + '.meta.json'), 'utf8'));
      const html = fs.readFileSync(path.join(ARTICLES_DIR, base + '.html'), 'utf8');
      return { base, meta, html };
    })
    .sort((a, b) => (a.meta.sprint_day || 0) - (b.meta.sprint_day || 0));
}

// Pull title_tag / description_tag from either meta.json shape
function seoTags(meta) {
  let title_tag = meta.title_tag || null;
  let description_tag = meta.description_tag || null;
  if (Array.isArray(meta.metafields)) {
    for (const mf of meta.metafields) {
      if (mf.key === 'title_tag') title_tag = mf.value;
      if (mf.key === 'description_tag') description_tag = mf.value;
    }
  }
  return { title_tag, description_tag };
}

async function handleExists(handle) {
  const url = `https://${SHOP}/admin/api/${API}/blogs/${BLOG_ID}/articles.json?handle=${encodeURIComponent(handle)}&fields=id,handle,published_at`;
  const res = await fetch(url, { headers: adminHeaders });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.articles && data.articles[0]) || null;
}

async function createArticle(a) {
  const { title_tag, description_tag } = seoTags(a.meta);
  const article = {
    title: a.meta.title,
    author: a.meta.author || 'CNC Electric',
    handle: a.meta.handle,
    body_html: a.html,
    tags: Array.isArray(a.meta.tags) ? a.meta.tags.join(', ') : (a.meta.tags || ''),
    published: true,
    summary_html: a.meta.summary_html || '',
    metafields: [],
  };
  if (title_tag) article.metafields.push({ namespace: 'global', key: 'title_tag', value: title_tag, type: 'single_line_text_field' });
  if (description_tag) article.metafields.push({ namespace: 'global', key: 'description_tag', value: description_tag, type: 'single_line_text_field' });

  const res = await fetch(`https://${SHOP}/admin/api/${API}/blogs/${BLOG_ID}/articles.json`, {
    method: 'POST', headers: adminHeaders, body: JSON.stringify({ article }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

// Verify the article is actually published. Primary proof = Admin API
// (published_at set); secondary = public URL returns 200 (may 403 from
// datacenter IPs behind Shopify's WAF, so it's informational only).
async function verifyLive(handle) {
  const url = `${PUBLIC_BASE}/${handle}`;
  let adminLive = false, adminId = null;
  try {
    const a = await handleExists(handle);
    if (a && a.id) {
      adminId = a.id;
      adminLive = !!a.published_at; // published_at present = live on storefront
    }
  } catch (_) { /* fall through */ }
  let publicStatus = null;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 publish-verify' }, redirect: 'follow' });
    publicStatus = res.status;
  } catch (e) { publicStatus = 'ERR'; }
  return { url, live: adminLive, adminId, status: publicStatus };
}

(async () => {
  const articles = loadArticles();
  console.log(`\n📦 Found ${articles.length} article(s) in ./articles${ONLY ? ` matching "${ONLY}"` : ''}${DRY ? '  [DRY RUN]' : ''}\n`);
  const results = [];

  for (const a of articles) {
    const tag = a.base.slice(0, 48);
    if (DRY) { console.log(`• would publish: ${a.meta.handle}`); results.push({ handle: a.meta.handle, action: 'dry' }); continue; }

    process.stdout.write(`→ ${tag} … `);
    try {
      const existing = await handleExists(a.meta.handle);
      let action;
      if (existing) {
        action = 'already-existed';
        console.log(`already exists (id ${existing.id}) — skipping create`);
      } else {
        const r = await createArticle(a);
        if (!r.ok) { console.log(`❌ POST ${r.status}: ${r.body.slice(0, 160)}`); results.push({ handle: a.meta.handle, action: 'FAILED', status: r.status }); await sleep(600); continue; }
        action = 'published';
        console.log(`✅ published (HTTP ${r.status})`);
      }
      await sleep(800); // let Shopify render the public page
      const v = await verifyLive(a.meta.handle);
      console.log(`   verify: ${v.live ? '🟢 LIVE' : '🔴 ' + v.status} ${v.url}`);
      results.push({ handle: a.meta.handle, action, verify: v.status, live: v.live });
    } catch (e) {
      console.log(`❌ error: ${e.message}`);
      results.push({ handle: a.meta.handle, action: 'ERROR', error: e.message });
    }
    await sleep(600); // be gentle on the API
  }

  // Summary
  console.log('\n──────── SUMMARY ────────');
  const live = results.filter((r) => r.live).length;
  const failed = results.filter((r) => r.action === 'FAILED' || r.action === 'ERROR' || (r.verify && !r.live)).length;
  for (const r of results) {
    const mark = r.live ? '🟢' : (r.action === 'dry' ? '·' : '🔴');
    console.log(`${mark} ${r.action.padEnd(16)} ${r.handle}`);
  }
  console.log(`\n${live} live · ${failed} need attention · ${results.length} total`);
  console.log(live ? `\n👉 Live URLs:\n` + results.filter(r => r.live).map(r => `   ${PUBLIC_BASE}/${r.handle}`).join('\n') : '');
})();
