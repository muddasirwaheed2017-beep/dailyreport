# PSX SLM + Banking Alerts → WhatsApp

Automated market updates for **SLM (Service Long March Tyres)** and the **PSX banking
sector**, pushed to your WhatsApp **3× every weekday** (market open, midday, close).

It runs on **Google Apps Script** (Google's servers) — nothing on your side needs to
stay on, it's free, and it reuses your existing Meta WhatsApp Cloud API number.

Implementation: [`psx-slm-banking-alerts.js`](./psx-slm-banking-alerts.js)

## Why Apps Script (not a server / GitHub Action)

You already send WhatsApp via Meta Cloud API from Apps Script
(`whatsapp-webhook-v1.js`). Apps Script has built-in **time-driven triggers**, so the
whole "send me alerts on a schedule" requirement is solved with zero new
infrastructure or secrets to manage.

## Setup (one time, ~5 min)

1. Go to <https://script.google.com> → **New project**.
2. Paste the entire contents of `psx-slm-banking-alerts.js`, **Save**.
3. **Project Settings** (⚙️) → set **Time zone** to **`(GMT+05:00) Karachi`** so the
   9:30 / 12:30 / 15:30 trigger times line up with the PSX session.
4. Add your WhatsApp token: **Project Settings → Script Properties → Add property**
   - Property: `META_ACCESS_TOKEN`  ·  Value: *your permanent Meta System-User token*
   - (Or paste it into `CONFIG.META_ACCESS_TOKEN` in the code — Script Properties is safer.)
5. Run **`testDataFetch`** once → check the Execution log shows a real SLM price and a
   formatted message preview. (Grant permissions when prompted.)
6. Run **`sendNow`** → confirm the WhatsApp message arrives on `923244465966`.
7. Run **`setupAlertTriggers`** → creates the 3 daily triggers. Done.

It now fires **Mon–Fri** automatically and skips weekends.

## Schedule

| Run | Time (PKT) | Purpose |
|-----|-----------|---------|
| Open | ~09:30 | Opening levels |
| Midday | ~12:30 | Mid-session check |
| Close | ~15:30 | Closing summary |

Change the `hours = [9, 12, 15]` array in `setupAlertTriggers()` to adjust, then
re-run that function.

## ⚠️ Important: WhatsApp 24-hour rule

Meta only delivers **free-form text** if you messaged the business number within the
last 24h. Scheduled alerts will often fall outside that window (e.g. overnight), so
some sends may be rejected. Two ways to guarantee delivery:

- **Quick / free:** send any WhatsApp message ("hi") to your business number each
  morning to re-open the 24h window. Fine for testing.
- **Robust (recommended):** in **Meta Business Manager → WhatsApp Manager →
  Message Templates**, create an approved **Utility** template named `psx_update`
  with a single body parameter `{{1}}` (language `en_US`). Then in `sendNow()` swap
  `sendWhatsApp(...)` for `sendWhatsAppTemplate(...)` — already included in the script.

## What each alert contains

- **SLM**: last price, change & %, day range, volume
- **Indices**: KSE-100 and KSE-30 for market context
- **Banking sector**: HBL, UBL, MCB, MEBL (Meezan), BAHL, ABL, NBP, BAFL, FABL —
  each with price & %, plus an up/down breadth count

Edit `CONFIG.BANK_SYMBOLS`, `CONFIG.INDEX_SYMBOLS`, or `CONFIG.STOCK_SYMBOL` to change
coverage.

## Data source

PSX Data Portal (`dps.psx.com.pk`) intraday + EOD JSON endpoints. The portal blocks
generic scrapers, so the script sends browser-style headers (which Apps Script's
Google-IP requests pass). If PSX ever changes the endpoint, only `getQuote()` /
`fetchJson()` need updating.

## Troubleshooting

- **No data / `data unavailable`** → run `testDataFetch`, check the `PSX Alert Log`
  sheet for `HTTP`/`PARSE` rows. PSX may have changed the endpoint path.
- **WhatsApp not arriving** → check log for `WA_ERR`. Code `131047`/`470` = 24h window
  lapsed → use a template (above). `190` = token expired → refresh `META_ACCESS_TOKEN`.
- **Wrong times** → project time zone isn't Asia/Karachi (step 3).
