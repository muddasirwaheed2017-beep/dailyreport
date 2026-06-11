# Shopify Support Ticket — AhrefsBot crawler blocked with HTTP 403

## Where to submit

Open: **https://help.shopify.com/en/support/login** (sign in with the Shopify account that owns cncelectric.myshopify.com)

Then: **Help Center → Contact support → "Issues with my online store" → Live Chat** (best for fastest response)

Alternative: https://help.shopify.com/en/questions/contact

## Subject line

```
AhrefsBot crawler getting HTTP 403 on cncelectric.pk — please whitelist AhrefsBot IP range
```

## Ticket body — paste this verbatim

```
Hi Shopify Support,

My store cncelectric.myshopify.com (cncelectric.pk) is being crawled
by AhrefsBot for SEO site audits. The crawler is being served HTTP 403
on every request, which is breaking my Site Audit reports. Real users
and Googlebot are unaffected.

Evidence — I tested the same URL from multiple sources:

1. Curl from my home IP, no special user-agent:
   GET https://www.cncelectric.pk/ → HTTP 200 ✅

2. Curl with Googlebot user-agent from my home IP:
   GET https://www.cncelectric.pk/ → HTTP 200 ✅

3. Curl with AhrefsBot user-agent from my home IP:
   GET https://www.cncelectric.pk/ → HTTP 200 ✅

4. AhrefsBot's actual crawler hitting from Ahrefs's data-centre IPs:
   GET https://www.cncelectric.pk/ → HTTP 403 ❌

This indicates the block is at the IP / ASN level, not user-agent
based. Ahrefs publishes their crawler IPs at:
https://ahrefs.com/robot
(IP ranges are listed in their documentation)

The 403 is also affecting:
- The http://cncelectric.pk/ → https://www.cncelectric.pk/ redirect
  (the 301 succeeds, then the https target returns 403 to AhrefsBot)
- /sitemap.xml access from AhrefsBot

Ahrefs is a legitimate, well-known SEO tool used by millions of sites.
The robots.txt currently allows AhrefsBot (we have not disallowed it).

Please:
1. Confirm whether Shopify's edge / bot management is blocking Ahrefs
   crawler IPs at the platform level.
2. If so, whitelist AhrefsBot's published IP ranges for our store so
   their Site Audit and Brand Radar tools can crawl successfully.

This is affecting our ability to track on-site SEO issues and our
content-update freshness signals to Bing / Yandex via IndexNow.

Thank you,
Muddasir Waheed Malik
Owner, CNC Electric Pakistan
cncelectric.pk
```

## What Shopify will likely say

1. **"Bot management is handled at the edge — we can't whitelist individual IPs."** Most common response. If they say this, ask them to escalate to Tier 2 / Plus support (if you're on Shopify Plus).

2. **"You're hitting our rate limits. Slow down the crawler."** Tell them you can't control Ahrefs's crawl rate; they need to allowlist the bot.

3. **"Use Shopify's built-in SEO tools instead."** Polite "no thanks" — explain you're paid customers of Ahrefs and rely on cross-platform data.

## What also works as a fallback (if Shopify refuses)

- **Submit a Site Audit re-crawl on Ahrefs's side** — already done at 2026-06-10 19:13 PKT. Results in 2-6 hours.
- **Contact Ahrefs support** — they have a "site under crawl protection" workaround where they queue requests differently. Their support is at https://help.ahrefs.com/
- **Add a meta-verification token** — Shopify sometimes allows verified-domain crawlers more leniently if you can prove ownership via DNS TXT.

## Status

- B: Ticket drafted (paste above into Shopify support). NOT yet submitted — requires you to sign in + click Send.
- C: Re-crawl triggered ✅ — running now in Ahrefs panel, status "Now / Starting", 0 URLs crawled as of 02:11 PM. Will complete in 2-6 hours.

## URLs in this ticket

- Shopify support: https://help.shopify.com/en/support/login
- AhrefsBot IP documentation: https://ahrefs.com/robot
- Affected store: https://cncelectric.pk (Shopify ID cncelectric.myshopify.com)
- Ahrefs project: https://app.ahrefs.com/site-audit/9621894/overview
