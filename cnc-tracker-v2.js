/* ============================================================
   CNC ELECTRIC — STOREFRONT TRACKING SCRIPT v2.0
   Inject into Shopify theme.liquid before </body>
   
   v2.0 Changes:
   - UTM parameter parsing and storage
   - Click ID capture (fbclid, gclid, msclkid, ttclid)
   - Traffic source classification (channel grouping)
   - Cart attribute injection for session stitching
   - Referrer-based source detection
   - All v1 features preserved
   ============================================================ */

(function() {
  'use strict';

  // ── Firebase Config ──────────────────────────────────────
  var FIREBASE_PROJECT = 'cnc-website-tracking';
  var FIREBASE_KEY = 'AIzaSyB7zR2KAGyygQuZV1R23henUjFq9i6Uvfs';
  var FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT + '/databases/(default)/documents/';

  // ── Session & Visitor ID ─────────────────────────────────
  function generateId() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function getOrCreateId(key, storage, expDays) {
    // Try cookie first, then storage
    var val = getCookie(key);
    if (!val && storage) {
      try { val = storage.getItem(key); } catch(e) {}
    }
    if (!val) {
      val = generateId();
    }
    // Save to both cookie and storage
    setCookie(key, val, expDays);
    if (storage) {
      try { storage.setItem(key, val); } catch(e) {}
    }
    return val;
  }

  // Visitor ID: persists 365 days (returning visitor detection)
  var visitorId = getOrCreateId('_cnc_vid', localStorage, 365);
  // Session ID: expires after 30 min of inactivity
  var sessionId = getOrCreateId('_cnc_sid', sessionStorage, 0.02);
  // Refresh session cookie on activity
  setCookie('_cnc_sid', sessionId, 0.02);

  // ── UTM & Attribution Capture ────────────────────────────
  var params = new URLSearchParams(window.location.search);
  
  // UTM Parameters
  var utmSource = params.get('utm_source') || '';
  var utmMedium = params.get('utm_medium') || '';
  var utmCampaign = params.get('utm_campaign') || '';
  var utmContent = params.get('utm_content') || '';
  var utmTerm = params.get('utm_term') || '';
  var utmId = params.get('utm_id') || '';

  // Click IDs (ad platform attribution)
  var fbclid = params.get('fbclid') || '';
  var gclid = params.get('gclid') || '';
  var msclkid = params.get('msclkid') || '';
  var ttclid = params.get('ttclid') || '';
  var campaignId = params.get('campaign_id') || '';
  var adId = params.get('ad_id') || '';

  // Store UTMs in localStorage (persist across pages within session)
  function storeIfNew(key, value) {
    if (value) {
      try { localStorage.setItem(key, value); } catch(e) {}
    }
  }

  // Only overwrite if this page has UTM params (landing page from ad)
  if (utmSource) {
    storeIfNew('_cnc_utm_source', utmSource);
    storeIfNew('_cnc_utm_medium', utmMedium);
    storeIfNew('_cnc_utm_campaign', utmCampaign);
    storeIfNew('_cnc_utm_content', utmContent);
    storeIfNew('_cnc_utm_term', utmTerm);
    storeIfNew('_cnc_utm_id', utmId);
    storeIfNew('_cnc_campaign_id', campaignId);
    storeIfNew('_cnc_ad_id', adId);
  }
  if (fbclid) storeIfNew('_cnc_fbclid', fbclid);
  if (gclid) storeIfNew('_cnc_gclid', gclid);
  if (msclkid) storeIfNew('_cnc_msclkid', msclkid);
  if (ttclid) storeIfNew('_cnc_ttclid', ttclid);

  // Read stored UTMs (may have been set on landing page, now on subsequent page)
  function getStored(key) {
    try { return localStorage.getItem(key) || ''; } catch(e) { return ''; }
  }

  var attribution = {
    utm_source: utmSource || getStored('_cnc_utm_source'),
    utm_medium: utmMedium || getStored('_cnc_utm_medium'),
    utm_campaign: utmCampaign || getStored('_cnc_utm_campaign'),
    utm_content: utmContent || getStored('_cnc_utm_content'),
    utm_term: utmTerm || getStored('_cnc_utm_term'),
    utm_id: utmId || getStored('_cnc_utm_id'),
    campaign_id: campaignId || getStored('_cnc_campaign_id'),
    ad_id: adId || getStored('_cnc_ad_id'),
    fbclid: fbclid || getStored('_cnc_fbclid'),
    gclid: gclid || getStored('_cnc_gclid'),
    msclkid: msclkid || getStored('_cnc_msclkid'),
    ttclid: ttclid || getStored('_cnc_ttclid'),
    referrer: document.referrer,
    landing_page: window.location.pathname,
    channel: '' // Set below
  };

  // ── Channel Classification ───────────────────────────────
  function classifyChannel(attr, ref) {
    // Paid Social (Facebook/Meta)
    if (attr.utm_medium === 'paid' && attr.utm_source === 'facebook') return 'Facebook Paid';
    if (attr.fbclid) return 'Facebook Paid';
    if (ref.indexOf('facebook.com') !== -1 || ref.indexOf('fb.com') !== -1 || ref.indexOf('m.facebook.com') !== -1) {
      return attr.utm_medium === 'paid' ? 'Facebook Paid' : 'Facebook Organic';
    }
    // Paid Search (Google Ads)
    if (attr.gclid) return 'Google Ads';
    if (attr.utm_medium === 'cpc' || attr.utm_medium === 'ppc') return 'Paid Search';
    // Organic Search
    if (ref.indexOf('google.com') !== -1 || ref.indexOf('google.com.pk') !== -1) return 'Google Organic';
    if (ref.indexOf('bing.com') !== -1) return 'Bing Organic';
    if (ref.indexOf('yahoo.com') !== -1) return 'Yahoo Organic';
    // Social
    if (ref.indexOf('instagram.com') !== -1) return 'Instagram';
    if (ref.indexOf('twitter.com') !== -1 || ref.indexOf('x.com') !== -1) return 'Twitter/X';
    if (ref.indexOf('linkedin.com') !== -1) return 'LinkedIn';
    if (ref.indexOf('youtube.com') !== -1) return 'YouTube';
    if (ref.indexOf('tiktok.com') !== -1) return 'TikTok';
    if (ref.indexOf('whatsapp.com') !== -1 || ref.indexOf('wa.me') !== -1) return 'WhatsApp';
    // Email
    if (attr.utm_medium === 'email') return 'Email';
    // SMS
    if (attr.utm_medium === 'sms') return 'SMS';
    // Referral
    if (ref && ref.indexOf('cncelectric.pk') === -1 && ref !== '') return 'Referral';
    // Direct
    return 'Direct';
  }

  attribution.channel = classifyChannel(attribution, document.referrer);

  // ── Cart Attribute Injection ─────────────────────────────
  // This is the critical session stitching mechanism.
  // Writes our tracking IDs into Shopify's cart so they appear
  // in order webhooks as note_attributes.
  function syncToCart() {
    try {
      fetch('/cart.js').then(function(r) { return r.json(); }).then(function(cart) {
        // Skip if already synced this session
        if (cart.attributes && cart.attributes['_cnc_sid'] === sessionId) return;
        
        fetch('/cart/update.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attributes: {
              '_cnc_sid': sessionId,
              '_cnc_vid': visitorId,
              '_cnc_src': attribution.utm_source,
              '_cnc_med': attribution.utm_medium,
              '_cnc_cmp': attribution.utm_campaign,
              '_cnc_cnt': attribution.utm_content,
              '_cnc_fbclid': attribution.fbclid,
              '_cnc_gclid': attribution.gclid,
              '_cnc_cid': attribution.campaign_id,
              '_cnc_aid': attribution.ad_id,
              '_cnc_ch': attribution.channel,
              '_cnc_land': attribution.landing_page,
              '_cnc_ref': attribution.referrer ? (new URL(attribution.referrer, 'https://x.com')).hostname : ''
            }
          })
        }).catch(function() {});
      }).catch(function() {});
    } catch(e) {}
  }

  // Sync on page load and after add-to-cart
  window.addEventListener('load', function() { setTimeout(syncToCart, 800); });

  // ── Page & Product Context ───────────────────────────────
  function detectPageType() {
    var path = window.location.pathname;
    if (path === '/') return 'home';
    if (path.indexOf('/products/') === 0) return 'product';
    if (path.indexOf('/collections/') === 0) return 'collection';
    if (path.indexOf('/cart') === 0) return 'cart';
    if (path.indexOf('/checkouts/') === 0) return 'checkout';
    if (path.indexOf('/pages/') === 0) return 'page';
    if (path.indexOf('/blogs/') === 0) return 'blog';
    if (path.indexOf('/search') === 0) return 'search';
    return 'other';
  }

  function getMetaContent(property) {
    var el = document.querySelector('meta[property="' + property + '"]') ||
             document.querySelector('meta[name="' + property + '"]');
    return el ? el.getAttribute('content') : null;
  }

  function extractProductData() {
    try {
      var metaProduct = document.querySelector('meta[property="og:type"][content="product"]');
      if (!metaProduct) return null;
      var data = {
        title: getMetaContent('og:title'),
        price: getMetaContent('product:price:amount'),
        currency: getMetaContent('product:price:currency') || 'PKR',
        image: getMetaContent('og:image'),
        url: window.location.pathname
      };
      if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
        data.productId = window.ShopifyAnalytics.meta.product.id;
        data.variantId = window.ShopifyAnalytics.meta.product.variants && 
                         window.ShopifyAnalytics.meta.product.variants[0] ? 
                         window.ShopifyAnalytics.meta.product.variants[0].id : null;
      }
      return data;
    } catch(e) { return null; }
  }

  function extractCollectionData() {
    if (window.location.pathname.indexOf('/collections/') !== 0) return null;
    return {
      title: getMetaContent('og:title'),
      url: window.location.pathname,
      handle: window.location.pathname.replace('/collections/', '').split('/')[0]
    };
  }

  var pageType = detectPageType();
  var productData = extractProductData();
  var collectionData = extractCollectionData();

  // ── Device Info ──────────────────────────────────────────
  var deviceInfo = {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    deviceType: window.innerWidth <= 768 ? 'mobile' : (window.innerWidth <= 1024 ? 'tablet' : 'desktop'),
    language: navigator.language,
    touchSupport: 'ontouchstart' in window
  };

  // ── Firestore REST API ───────────────────────────────────
  function toFV(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'number') return Number.isInteger(val)
      ? { integerValue: String(val) } : { doubleValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(toFV) } };
    if (typeof val === 'object') {
      var fields = {};
      for (var k in val) { if (val.hasOwnProperty(k)) fields[k] = toFV(val[k]); }
      return { mapValue: { fields: fields } };
    }
    return { stringValue: String(val) };
  }

  function sendToCollection(collection, data) {
    var fields = {};
    for (var k in data) { if (data.hasOwnProperty(k)) fields[k] = toFV(data[k]); }
    fetch(FIRESTORE_URL + collection + '?key=' + FIREBASE_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: fields }),
      keepalive: true
    }).catch(function(err) { /* silent */ });
  }

  // ── Firebase SDK Loading ─────────────────────────────────
  var db = null;
  var isReady = false;

  function loadFirebase() {
    var s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js';
    s1.onload = function() {
      var s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js';
      s2.onload = initFirebase;
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  }

  function initFirebase() {
    try {
      firebase.initializeApp({
        apiKey: FIREBASE_KEY,
        authDomain: FIREBASE_PROJECT + '.firebaseapp.com',
        projectId: FIREBASE_PROJECT,
        storageBucket: FIREBASE_PROJECT + '.firebasestorage.app',
        messagingSenderId: '510778332738',
        appId: '1:510778332738:web:0305d7fb678ee4042cffdb'
      });
      db = firebase.firestore();
      isReady = true;
      recordSession();
      recordPageView();
      flushQueue();
    } catch(e) {}
  }

  // ── Session Record ───────────────────────────────────────
  function recordSession() {
    if (!db) return;
    db.collection('sessions').doc(sessionId).set({
      visitorId: visitorId,
      sessionId: sessionId,
      startedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      device: deviceInfo,
      referrer: document.referrer,
      landingPage: window.location.pathname,
      pagesViewed: [window.location.pathname],
      eventsCount: 0,
      status: 'active',
      // NEW: Attribution data on every session
      attribution: attribution,
      channel: attribution.channel,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      campaign_id: attribution.campaign_id,
      ad_id: attribution.ad_id,
      fbclid: attribution.fbclid,
      gclid: attribution.gclid
    }, { merge: true });

    // Update visitor record
    db.collection('visitors').doc(visitorId).set({
      visitorId: visitorId,
      lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
      lastSession: sessionId,
      device: deviceInfo,
      lastChannel: attribution.channel
    }, { merge: true });
  }

  // ── Page View Record ─────────────────────────────────────
  function recordPageView() {
    if (!db) return;
    var pvData = {
      visitorId: visitorId,
      sessionId: sessionId,
      url: window.location.pathname,
      fullUrl: window.location.href,
      title: document.title,
      pageType: pageType,
      referrer: document.referrer,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      device: deviceInfo.deviceType,
      viewportWidth: deviceInfo.viewportWidth,
      // NEW: Source on every pageview
      channel: attribution.channel,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign
    };
    if (productData) pvData.product = productData;
    if (collectionData) pvData.collection = collectionData;
    db.collection('pageviews').add(pvData);

    // Update session
    db.collection('sessions').doc(sessionId).update({
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      pagesViewed: firebase.firestore.FieldValue.arrayUnion(window.location.pathname),
      eventsCount: firebase.firestore.FieldValue.increment(1)
    }).catch(function() {});
  }

  // ── Event Recording ──────────────────────────────────────
  var eventQueue = [];

  function recordEvent(type, data) {
    var evt = {
      type: type,
      visitorId: visitorId,
      sessionId: sessionId,
      page: window.location.pathname,
      pageType: pageType,
      channel: attribution.channel,
      timestamp: null,
      data: data || {}
    };

    if (!db) {
      evt.timestamp = new Date().toISOString();
      eventQueue.push(evt);
      return;
    }

    evt.timestamp = firebase.firestore.FieldValue.serverTimestamp();
    db.collection('events').add(evt);
    db.collection('sessions').doc(sessionId).update({
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      eventsCount: firebase.firestore.FieldValue.increment(1)
    }).catch(function() {});
  }

  function flushQueue() {
    if (!db || eventQueue.length === 0) return;
    var q = eventQueue.splice(0, eventQueue.length);
    q.forEach(function(evt) {
      evt.timestamp = firebase.firestore.FieldValue.serverTimestamp();
      db.collection('events').add(evt);
    });
  }

  // ── Scroll Tracking ──────────────────────────────────────
  var maxScroll = 0;
  var scrollMilestones = {};
  var pageLoadTime = Date.now();

  function getTimeOnPage() { return Math.round((Date.now() - pageLoadTime) / 1000); }

  window.addEventListener('scroll', function() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var viewH = window.innerHeight;
    var pageH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    if (pageH <= viewH) return;
    var depth = Math.round(((scrollTop + viewH) / pageH) * 100);
    depth = Math.min(depth, 100);
    if (depth > maxScroll) {
      maxScroll = depth;
      [25, 50, 75, 100].forEach(function(m) {
        if (depth >= m && !scrollMilestones[m]) {
          scrollMilestones[m] = true;
          recordEvent('scroll_milestone', { depth: m, timeOnPage: getTimeOnPage() });
        }
      });
    }
  }, { passive: true });

  // ── Click Tracking ───────────────────────────────────────
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a, button, [data-action], .product-card, input[type="submit"]') || e.target;
    var clickData = {
      element: target.tagName.toLowerCase(),
      text: (target.textContent || '').trim().substring(0, 100),
      classes: (target.className || '').toString().substring(0, 200),
      id: target.id || null,
      href: target.href || null,
      posX: e.clientX, posY: e.clientY,
      pageX: e.pageX, pageY: e.pageY,
      timeOnPage: getTimeOnPage()
    };
    if (target.closest('[name="add"], .add-to-cart, [data-add-to-cart], form[action="/cart/add"] button, form[action="/cart/add"] input[type="submit"]')) {
      clickData.isAddToCart = true;
      recordAddToCart(target);
      // Re-sync cart attributes after add
      setTimeout(syncToCart, 1500);
    }
    if (target.closest('.product-card, .grid-product, .product-item, [data-product-card]')) {
      clickData.isProductClick = true;
    }
    recordEvent('click', clickData);
  }, true);

  // ── Add to Cart ──────────────────────────────────────────
  function recordAddToCart(target) {
    var pd = productData || {};
    var form = target.closest('form');
    var qty = 1;
    if (form) { var qi = form.querySelector('[name="quantity"]'); if (qi) qty = parseInt(qi.value) || 1; }
    
    recordEvent('add_to_cart', {
      product: pd.title || document.title,
      productId: pd.productId || null,
      price: pd.price || null,
      quantity: qty,
      url: window.location.pathname,
      timeOnPage: getTimeOnPage()
    });

    if (db) {
      db.collection('cart_events').add({
        visitorId: visitorId, sessionId: sessionId,
        action: 'add', product: pd.title || document.title,
        productId: pd.productId || null, price: pd.price || null,
        quantity: qty, page: window.location.pathname,
        channel: attribution.channel,
        utm_source: attribution.utm_source,
        utm_campaign: attribution.utm_campaign,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  // ── AJAX Cart Interception ───────────────────────────────
  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function() {
      var url = arguments[0];
      var opts = arguments[1] || {};
      if (typeof url === 'string') {
        if (url.indexOf('/cart/add') !== -1 && opts.method && opts.method.toUpperCase() === 'POST') {
          recordEvent('ajax_add_to_cart', { url: url, timeOnPage: getTimeOnPage() });
          setTimeout(syncToCart, 1500);
        }
        if (url.indexOf('/checkout') !== -1) {
          recordEvent('checkout_initiated', { timeOnPage: getTimeOnPage() });
        }
      }
      return origFetch.apply(this, arguments);
    };
  }

  var origXHR = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (url && url.indexOf('/cart/add') !== -1 && method.toUpperCase() === 'POST') {
      recordEvent('xhr_add_to_cart', { url: url, timeOnPage: getTimeOnPage() });
      setTimeout(syncToCart, 1500);
    }
    return origXHR.apply(this, arguments);
  };

  // ── Hesitation Detection ─────────────────────────────────
  function setupHesitation() {
    var targets = document.querySelectorAll('.price, [data-price], .product-price, .price__regular, .price__sale, .money, [name="add"], .add-to-cart, [data-add-to-cart], .product-form__submit');
    var timers = {};
    Array.prototype.forEach.call(targets, function(el, i) {
      el.addEventListener('mouseenter', function() {
        timers[i] = setTimeout(function() {
          recordEvent('hesitation', {
            element: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().substring(0, 100),
            classes: (el.className || '').toString().substring(0, 200),
            duration: 2000, timeOnPage: getTimeOnPage()
          });
        }, 2000);
      });
      el.addEventListener('mouseleave', function() {
        if (timers[i]) { clearTimeout(timers[i]); delete timers[i]; }
      });
    });
  }

  // ── Mouse Movement (Heatmap Data) ────────────────────────
  var mousePos = [];
  var mouseSampleCount = 0;

  document.addEventListener('mousemove', function(e) {
    mouseSampleCount++;
    if (mouseSampleCount % 10 !== 0) return;
    mousePos.push({ x: e.pageX, y: e.pageY, vx: e.clientX, vy: e.clientY, t: Date.now() });
    if (mousePos.length >= 50) flushMouse();
  }, { passive: true });

  function flushMouse() {
    if (!db || mousePos.length === 0) return;
    var batch = mousePos.splice(0, mousePos.length);
    db.collection('mouse_movements').add({
      visitorId: visitorId, sessionId: sessionId,
      page: window.location.pathname, pageType: pageType,
      pageHeight: document.documentElement.scrollHeight,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: deviceInfo.viewportWidth,
      viewportHeight: deviceInfo.viewportHeight,
      positions: batch,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  // ── Rage Click Detection ─────────────────────────────────
  var clickTimes = [];
  document.addEventListener('click', function(e) {
    var now = Date.now();
    clickTimes.push({ time: now, x: e.clientX, y: e.clientY });
    if (clickTimes.length > 5) clickTimes.shift();
    if (clickTimes.length >= 3) {
      var recent = clickTimes.slice(-3);
      var diff = recent[2].time - recent[0].time;
      var dist = Math.max(Math.abs(recent[0].x - recent[2].x), Math.abs(recent[0].y - recent[2].y));
      if (diff < 2000 && dist < 50) {
        recordEvent('rage_click', {
          posX: e.clientX, posY: e.clientY, pageX: e.pageX, pageY: e.pageY,
          element: e.target.tagName.toLowerCase(),
          text: (e.target.textContent || '').trim().substring(0, 100),
          timeOnPage: getTimeOnPage()
        });
        clickTimes = [];
      }
    }
  }, true);

  // ── Exit Intent ──────────────────────────────────────────
  var exitFired = false;
  document.addEventListener('mouseout', function(e) {
    if (exitFired) return;
    if (e.clientY <= 0 && e.relatedTarget === null) {
      exitFired = true;
      recordEvent('exit_intent', { timeOnPage: getTimeOnPage(), scrollDepth: maxScroll });
    }
  });

  // ── Tab Visibility ───────────────────────────────────────
  document.addEventListener('visibilitychange', function() {
    recordEvent(document.hidden ? 'tab_hidden' : 'tab_visible', { timeOnPage: getTimeOnPage() });
  });

  // ── Page Exit ────────────────────────────────────────────
  window.addEventListener('beforeunload', function() {
    flushMouse();
    recordEvent('page_exit', {
      timeOnPage: getTimeOnPage(),
      maxScrollDepth: maxScroll,
      page: window.location.pathname
    });
    if (db) {
      db.collection('sessions').doc(sessionId).update({
        lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'ended'
      }).catch(function() {});
    }
  });

  // ── Search Tracking ──────────────────────────────────────
  if (pageType === 'search') {
    var sq = params.get('q') || params.get('query') || '';
    if (sq) {
      var si = setInterval(function() {
        if (isReady) {
          clearInterval(si);
          recordEvent('search', {
            query: sq,
            resultsCount: document.querySelectorAll('.search-result, .grid-product, .product-card').length
          });
        }
      }, 200);
    }
  }

  // ── Cross-sell Tracking ──────────────────────────────────
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-cnc-crosssell')) {
          recordEvent('crosssell_shown', { product: node.getAttribute('data-cnc-crosssell'), timeOnPage: getTimeOnPage() });
          node.addEventListener('click', function() {
            recordEvent('crosssell_clicked', { product: node.getAttribute('data-cnc-crosssell'), timeOnPage: getTimeOnPage() });
          });
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ── Initialize ───────────────────────────────────────────
  function init() {
    loadFirebase();
    setupHesitation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
