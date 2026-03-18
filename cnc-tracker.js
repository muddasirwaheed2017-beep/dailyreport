/* ============================================================
   CNC ELECTRIC — STOREFRONT TRACKING SCRIPT v1.0
   Inject into Shopify theme.liquid before </body>
   
   Collects: page views, scroll depth, clicks, hover/dwell,
   add-to-cart, product views, hesitation, session data
   Sends to: Firebase Firestore (direct client SDK)
   ============================================================ */

(function() {
  'use strict';

  // ── Firebase Config ──────────────────────────────────────
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB7zR2KAGyygQuZV1R23henUjFq9i6Uvfs",
    authDomain: "cnc-website-tracking.firebaseapp.com",
    projectId: "cnc-website-tracking",
    storageBucket: "cnc-website-tracking.firebasestorage.app",
    messagingSenderId: "510778332738",
    appId: "1:510778332738:web:0305d7fb678ee4042cffdb"
  };

  // ── Session & Visitor ID ─────────────────────────────────
  function generateId() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getOrCreateId(key, expDays) {
    var val = getCookie(key);
    if (!val) {
      val = generateId();
      setCookie(key, val, expDays);
    }
    return val;
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

  // Visitor ID persists 365 days (returning visitor detection)
  var visitorId = getOrCreateId('_cnc_vid', 365);
  // Session ID expires after 30 min of inactivity
  var sessionId = getOrCreateId('_cnc_sid', 0.02); // ~30 min

  // Refresh session cookie on every page load
  setCookie('_cnc_sid', sessionId, 0.02);

  // ── Page & Product Context ───────────────────────────────
  var pageContext = {
    url: window.location.pathname,
    fullUrl: window.location.href,
    referrer: document.referrer,
    title: document.title,
    timestamp: new Date().toISOString(),
    // Shopify-specific: detect page type
    pageType: detectPageType(),
    productData: extractProductData(),
    collectionData: extractCollectionData()
  };

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

  function extractProductData() {
    // Shopify exposes product data via meta tags and JSON
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

      // Try to get product ID from Shopify's global object
      if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
        data.productId = window.ShopifyAnalytics.meta.product.id;
        data.variantId = window.ShopifyAnalytics.meta.product.variants && 
                         window.ShopifyAnalytics.meta.product.variants[0] ? 
                         window.ShopifyAnalytics.meta.product.variants[0].id : null;
      }

      // Try to get from Shopify's product JSON (available on product pages)
      var productJson = document.querySelector('[data-product-json], script[type="application/json"][data-product-json]');
      if (productJson) {
        try {
          var pData = JSON.parse(productJson.textContent);
          data.productId = data.productId || pData.id;
          data.vendor = pData.vendor;
          data.type = pData.product_type;
          data.tags = pData.tags;
        } catch(e) {}
      }

      return data;
    } catch(e) {
      return null;
    }
  }

  function extractCollectionData() {
    if (window.location.pathname.indexOf('/collections/') !== 0) return null;
    try {
      return {
        title: getMetaContent('og:title'),
        url: window.location.pathname,
        handle: window.location.pathname.replace('/collections/', '').split('/')[0]
      };
    } catch(e) {
      return null;
    }
  }

  function getMetaContent(property) {
    var el = document.querySelector('meta[property="' + property + '"]') ||
             document.querySelector('meta[name="' + property + '"]');
    return el ? el.getAttribute('content') : null;
  }

  // ── Device & Geo Info ────────────────────────────────────
  var deviceInfo = {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    deviceType: window.innerWidth <= 768 ? 'mobile' : (window.innerWidth <= 1024 ? 'tablet' : 'desktop'),
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    touchSupport: 'ontouchstart' in window
  };

  // ── Event Queue ──────────────────────────────────────────
  var eventQueue = [];
  var isFirebaseReady = false;
  var db = null;

  function queueEvent(type, data) {
    var event = {
      type: type,
      visitorId: visitorId,
      sessionId: sessionId,
      page: pageContext.url,
      pageType: pageContext.pageType,
      timestamp: new Date().toISOString(),
      data: data || {}
    };
    eventQueue.push(event);
  }

  // ── Firebase Initialization ──────────────────────────────
  function loadFirebase() {
    // Load Firebase SDK from CDN
    var script1 = document.createElement('script');
    script1.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js';
    script1.onload = function() {
      var script2 = document.createElement('script');
      script2.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js';
      script2.onload = function() {
        initFirebase();
      };
      document.head.appendChild(script2);
    };
    document.head.appendChild(script1);
  }

  function initFirebase() {
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      isFirebaseReady = true;
      
      // Record session start
      recordSessionStart();
      // Record page view
      recordPageView();
      // Flush any queued events
      flushEvents();

      console.log('[CNC Tracker] Firebase connected');
    } catch(e) {
      console.error('[CNC Tracker] Firebase init error:', e);
    }
  }

  // ── Core Recording Functions ─────────────────────────────

  function recordSessionStart() {
    if (!db) return;
    
    var sessionRef = db.collection('sessions').doc(sessionId);
    sessionRef.set({
      visitorId: visitorId,
      sessionId: sessionId,
      startedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      device: deviceInfo,
      referrer: document.referrer,
      landingPage: pageContext.url,
      pagesViewed: [pageContext.url],
      eventsCount: 0,
      status: 'active'
    }, { merge: true });

    // Update visitor record
    var visitorRef = db.collection('visitors').doc(visitorId);
    visitorRef.set({
      visitorId: visitorId,
      lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
      lastSession: sessionId,
      device: deviceInfo,
      sessionsCount: firebase.firestore.Increment ? firebase.firestore.FieldValue.increment(1) : 1
    }, { merge: true });
  }

  function recordPageView() {
    if (!db) return;

    var pvData = {
      visitorId: visitorId,
      sessionId: sessionId,
      url: pageContext.url,
      fullUrl: pageContext.fullUrl,
      title: pageContext.title,
      pageType: pageContext.pageType,
      referrer: pageContext.referrer,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      device: deviceInfo.deviceType,
      viewportWidth: deviceInfo.viewportWidth
    };

    // Add product data if on product page
    if (pageContext.productData) {
      pvData.product = pageContext.productData;
    }
    if (pageContext.collectionData) {
      pvData.collection = pageContext.collectionData;
    }

    db.collection('pageviews').add(pvData);

    // Update session with this page
    db.collection('sessions').doc(sessionId).update({
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      pagesViewed: firebase.firestore.FieldValue.arrayUnion(pageContext.url),
      eventsCount: firebase.firestore.FieldValue.increment(1)
    }).catch(function() {
      // Session doc might not exist yet, ignore
    });
  }

  function recordEvent(type, data) {
    if (!db) {
      queueEvent(type, data);
      return;
    }

    var eventData = {
      type: type,
      visitorId: visitorId,
      sessionId: sessionId,
      page: pageContext.url,
      pageType: pageContext.pageType,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      data: data || {}
    };

    db.collection('events').add(eventData);

    // Update session activity
    db.collection('sessions').doc(sessionId).update({
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      eventsCount: firebase.firestore.FieldValue.increment(1)
    }).catch(function() {});
  }

  function flushEvents() {
    if (!db || eventQueue.length === 0) return;
    var events = eventQueue.splice(0, eventQueue.length);
    events.forEach(function(evt) {
      evt.timestamp = firebase.firestore.FieldValue.serverTimestamp();
      db.collection('events').add(evt);
    });
  }

  // ── Scroll Tracking ──────────────────────────────────────
  var maxScrollDepth = 0;
  var scrollMilestones = { 25: false, 50: false, 75: false, 100: false };
  var pageHeight = 0;

  function trackScroll() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var viewportHeight = window.innerHeight;
    pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    
    if (pageHeight <= viewportHeight) return; // No scroll needed

    var depth = Math.round(((scrollTop + viewportHeight) / pageHeight) * 100);
    depth = Math.min(depth, 100);

    if (depth > maxScrollDepth) {
      maxScrollDepth = depth;

      // Record milestone events
      [25, 50, 75, 100].forEach(function(milestone) {
        if (depth >= milestone && !scrollMilestones[milestone]) {
          scrollMilestones[milestone] = true;
          recordEvent('scroll_milestone', {
            depth: milestone,
            timeOnPage: getTimeOnPage()
          });
        }
      });
    }
  }

  var scrollTimer = null;
  window.addEventListener('scroll', function() {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(trackScroll, 150);
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
      posX: e.clientX,
      posY: e.clientY,
      pageX: e.pageX,
      pageY: e.pageY,
      timeOnPage: getTimeOnPage()
    };

    // Detect specific CNC-relevant clicks
    if (target.closest('[name="add"], .add-to-cart, [data-add-to-cart], form[action="/cart/add"] button, form[action="/cart/add"] input[type="submit"]')) {
      clickData.isAddToCart = true;
      recordAddToCart(target);
    }

    // Detect product card clicks
    if (target.closest('.product-card, .grid-product, .product-item, [data-product-card]')) {
      clickData.isProductClick = true;
    }

    recordEvent('click', clickData);
  }, true);

  // ── Add to Cart Tracking ─────────────────────────────────
  function recordAddToCart(target) {
    var productData = pageContext.productData || {};
    
    // Try to get quantity from form
    var form = target.closest('form');
    var quantity = 1;
    if (form) {
      var qtyInput = form.querySelector('[name="quantity"]');
      if (qtyInput) quantity = parseInt(qtyInput.value) || 1;
    }

    recordEvent('add_to_cart', {
      product: productData.title || document.title,
      productId: productData.productId || null,
      price: productData.price || null,
      quantity: quantity,
      url: pageContext.url,
      timeOnPage: getTimeOnPage()
    });

    // Also record in dedicated cart_events collection
    if (db) {
      db.collection('cart_events').add({
        visitorId: visitorId,
        sessionId: sessionId,
        action: 'add',
        product: productData.title || document.title,
        productId: productData.productId || null,
        price: productData.price || null,
        quantity: quantity,
        page: pageContext.url,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  // ── Fetch-based Cart Interception ────────────────────────
  // Shopify AJAX API cart tracking
  var originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function() {
      var url = arguments[0];
      var options = arguments[1] || {};
      
      if (typeof url === 'string') {
        // Detect add to cart via AJAX
        if (url.indexOf('/cart/add') !== -1 && options.method && options.method.toUpperCase() === 'POST') {
          try {
            var body = options.body;
            if (typeof body === 'string') {
              recordEvent('ajax_add_to_cart', { 
                url: url,
                timeOnPage: getTimeOnPage()
              });
            }
          } catch(e) {}
        }
        
        // Detect checkout initiation
        if (url.indexOf('/checkout') !== -1) {
          recordEvent('checkout_initiated', {
            timeOnPage: getTimeOnPage()
          });
        }
      }
      
      return originalFetch.apply(this, arguments);
    };
  }

  // Also intercept XMLHttpRequest for older themes
  var originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (url && url.indexOf('/cart/add') !== -1 && method.toUpperCase() === 'POST') {
      recordEvent('xhr_add_to_cart', {
        url: url,
        timeOnPage: getTimeOnPage()
      });
    }
    return originalXHROpen.apply(this, arguments);
  };

  // ── Hesitation Detection ─────────────────────────────────
  // Detect when user hovers over price or buy button for >2 seconds
  var hesitationTimers = {};

  function setupHesitationTracking() {
    var priceElements = document.querySelectorAll(
      '.price, [data-price], .product-price, .price__regular, .price__sale, .money'
    );
    var buyButtons = document.querySelectorAll(
      '[name="add"], .add-to-cart, [data-add-to-cart], .btn-add-to-cart, .product-form__submit'
    );
    var allTargets = Array.prototype.slice.call(priceElements)
      .concat(Array.prototype.slice.call(buyButtons));

    allTargets.forEach(function(el, i) {
      el.addEventListener('mouseenter', function() {
        var elId = 'hesitation_' + i;
        hesitationTimers[elId] = setTimeout(function() {
          recordEvent('hesitation', {
            element: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().substring(0, 100),
            classes: (el.className || '').toString().substring(0, 200),
            duration: 2000,
            timeOnPage: getTimeOnPage()
          });
        }, 2000);
      });

      el.addEventListener('mouseleave', function() {
        var elId = 'hesitation_' + i;
        if (hesitationTimers[elId]) {
          clearTimeout(hesitationTimers[elId]);
          delete hesitationTimers[elId];
        }
      });
    });
  }

  // ── Mouse Movement Sampling (for Heatmaps) ──────────────
  var mousePositions = [];
  var mouseSampleCount = 0;

  document.addEventListener('mousemove', function(e) {
    mouseSampleCount++;
    // Sample every 10th movement to reduce data volume
    if (mouseSampleCount % 10 !== 0) return;

    mousePositions.push({
      x: e.pageX,
      y: e.pageY,
      vx: e.clientX,
      vy: e.clientY,
      t: Date.now()
    });

    // Flush mouse data every 50 samples
    if (mousePositions.length >= 50) {
      flushMouseData();
    }
  }, { passive: true });

  function flushMouseData() {
    if (!db || mousePositions.length === 0) return;
    
    var batch = mousePositions.splice(0, mousePositions.length);
    db.collection('mouse_movements').add({
      visitorId: visitorId,
      sessionId: sessionId,
      page: pageContext.url,
      pageType: pageContext.pageType,
      pageHeight: pageHeight || document.documentElement.scrollHeight,
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
    
    // Keep only last 5 clicks
    if (clickTimes.length > 5) clickTimes.shift();
    
    // Check for rage: 3+ clicks within 2 seconds in similar area
    if (clickTimes.length >= 3) {
      var recent = clickTimes.slice(-3);
      var timeDiff = recent[2].time - recent[0].time;
      var maxDist = Math.max(
        Math.abs(recent[0].x - recent[2].x),
        Math.abs(recent[0].y - recent[2].y)
      );
      
      if (timeDiff < 2000 && maxDist < 50) {
        recordEvent('rage_click', {
          posX: e.clientX,
          posY: e.clientY,
          pageX: e.pageX,
          pageY: e.pageY,
          clickCount: 3,
          timeSpan: timeDiff,
          element: e.target.tagName.toLowerCase(),
          text: (e.target.textContent || '').trim().substring(0, 100),
          timeOnPage: getTimeOnPage()
        });
        clickTimes = []; // Reset after detecting
      }
    }
  }, true);

  // ── Time on Page ─────────────────────────────────────────
  var pageLoadTime = Date.now();

  function getTimeOnPage() {
    return Math.round((Date.now() - pageLoadTime) / 1000);
  }

  // ── Exit Intent Detection ────────────────────────────────
  var exitIntentFired = false;

  document.addEventListener('mouseout', function(e) {
    if (exitIntentFired) return;
    if (e.clientY <= 0 && e.relatedTarget === null) {
      exitIntentFired = true;
      recordEvent('exit_intent', {
        timeOnPage: getTimeOnPage(),
        scrollDepth: maxScrollDepth
      });
    }
  });

  // ── Page Visibility (Tab Switch Detection) ───────────────
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      recordEvent('tab_hidden', { timeOnPage: getTimeOnPage() });
    } else {
      recordEvent('tab_visible', { timeOnPage: getTimeOnPage() });
    }
  });

  // ── Before Unload (Session End) ──────────────────────────
  window.addEventListener('beforeunload', function() {
    // Flush remaining mouse data
    flushMouseData();

    // Record page exit with final scroll depth
    var exitData = {
      timeOnPage: getTimeOnPage(),
      maxScrollDepth: maxScrollDepth,
      page: pageContext.url
    };

    // Use sendBeacon for reliable delivery on page exit
    if (db && navigator.sendBeacon) {
      // Update session with final data
      db.collection('sessions').doc(sessionId).update({
        lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'ended'
      }).catch(function() {});
    }

    recordEvent('page_exit', exitData);
  });

  // ── Search Tracking ──────────────────────────────────────
  if (pageContext.pageType === 'search') {
    var searchParams = new URLSearchParams(window.location.search);
    var searchQuery = searchParams.get('q') || searchParams.get('query') || '';
    if (searchQuery) {
      // Wait for Firebase, then record
      var searchWait = setInterval(function() {
        if (isFirebaseReady) {
          clearInterval(searchWait);
          recordEvent('search', {
            query: searchQuery,
            resultsCount: document.querySelectorAll('.search-result, .grid-product, .product-card').length
          });
        }
      }, 200);
    }
  }

  // ── Cross-sell Detection Setup ───────────────────────────
  // Track when adaptive content (injected by the adaptive engine later) is shown/clicked
  function setupCrossSellTracking() {
    // MutationObserver to detect dynamically injected cross-sell elements
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-cnc-crosssell')) {
            recordEvent('crosssell_shown', {
              product: node.getAttribute('data-cnc-crosssell'),
              timeOnPage: getTimeOnPage()
            });

            node.addEventListener('click', function() {
              recordEvent('crosssell_clicked', {
                product: node.getAttribute('data-cnc-crosssell'),
                timeOnPage: getTimeOnPage()
              });
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Initialize Everything ────────────────────────────────
  function init() {
    loadFirebase();
    setupHesitationTracking();
    setupCrossSellTracking();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
