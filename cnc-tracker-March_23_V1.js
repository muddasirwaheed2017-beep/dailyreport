/**
 * CNC Electric Pakistan — Enhanced Tracker
 * cnc-tracker-March_23_V1.js
 * 
 * Writes to Firestore: sessions, events, pageviews
 * Compatible with CNC Intelligence Platform v8 dashboard
 * 
 * CAPABILITIES:
 * - Session tracking with visitor ID (cookie-based)
 * - UTM parameter capture (source, medium, campaign, content, term)
 * - Click ID capture (gclid, fbclid, msclkid, ttclid) + cookie storage
 * - Referrer → GA4-style channel grouping
 * - Page view tracking with timing
 * - Add to cart interception (Shopify AJAX)
 * - Rage click detection (3+ clicks, 100px, 2s)
 * - Dead click detection (non-interactive, no DOM change 500ms)
 * - Scroll depth tracking (25/50/75/90/100%)
 * - JavaScript error capture tied to session
 * - Core Web Vitals (LCP, CLS, INP)
 * - Form field hesitation + abandonment
 * - Idle time monitoring (Page Visibility API)
 * - Tab visible/hidden tracking
 * 
 * FIREBASE: Firestore REST API (no SDK needed — keeps page weight minimal)
 * PROJECT: cnc-website-tracking
 */

(function(){
  'use strict';

  // ═══════════════════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════════════════
  var PROJECT = 'cnc-website-tracking';
  var API_KEY = 'AIzaSyB7zR2KAGyygQuZV1R23henUjFq9i6Uvfs';
  var BASE = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents';
  var SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  var COOKIE_DAYS = 365;
  var CLICK_ID_COOKIE_DAYS = 90;
  var DEBUG = false;

  // ═══════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════
  function log(msg) { if (DEBUG) console.log('[CNC]', msg); }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : null;
  }

  function setCookie(name, val, days) {
    var d = new Date();
    d.setTime(d.getTime() + (days * 86400000));
    document.cookie = name + '=' + encodeURIComponent(val) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }

  function uuid() {
    return 'xxxxxxxx'.replace(/x/g, function() { return (Math.random() * 16 | 0).toString(16); });
  }

  function getParam(name) {
    try { return new URLSearchParams(window.location.search).get(name) || ''; }
    catch(e) { return ''; }
  }

  function now() { return new Date().toISOString(); }
  function timestamp() { return Date.now(); }

  // ═══════════════════════════════════════════════════
  // FIRESTORE REST API
  // ═══════════════════════════════════════════════════
  function toVal(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(toVal) } };
    if (typeof v === 'object') {
      var f = {};
      for (var k in v) { if (v.hasOwnProperty(k)) f[k] = toVal(v[k]); }
      return { mapValue: { fields: f } };
    }
    return { stringValue: String(v) };
  }

  function toFields(obj) {
    var f = {};
    for (var k in obj) { if (obj.hasOwnProperty(k) && obj[k] !== undefined) f[k] = toVal(obj[k]); }
    return f;
  }

  function fsWrite(collection, docId, data) {
    var url = BASE + '/' + collection + '/' + docId + '?key=' + API_KEY;
    var body = JSON.stringify({ fields: toFields(data) });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url + '&method=PATCH', new Blob([body], { type: 'application/json' }));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('PATCH', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(body);
    }
    log('Write: ' + collection + '/' + docId);
  }

  function fsCreate(collection, data) {
    var url = BASE + '/' + collection + '?key=' + API_KEY;
    var body = JSON.stringify({ fields: toFields(data) });
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(body);
    log('Create: ' + collection);
  }

  // Batched event queue — flush every 5s or on unload
  var eventQueue = [];
  var flushTimer = null;

  function queueEvent(data) {
    eventQueue.push(data);
    if (!flushTimer) {
      flushTimer = setTimeout(flushEvents, 5000);
    }
  }

  function flushEvents() {
    flushTimer = null;
    var batch = eventQueue.splice(0, eventQueue.length);
    batch.forEach(function(e) { fsCreate('events', e); });
  }

  // ═══════════════════════════════════════════════════
  // VISITOR & SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════
  var visitorId = getCookie('cnc_vid') || uuid();
  setCookie('cnc_vid', visitorId, COOKIE_DAYS);

  var sessionId = getCookie('cnc_sid');
  var sessionStart = getCookie('cnc_sst');
  var lastActivity = getCookie('cnc_la');
  var isNewSession = false;

  // Check if session expired
  if (!sessionId || !lastActivity || (timestamp() - parseInt(lastActivity)) > SESSION_TIMEOUT) {
    sessionId = 'sess_' + timestamp() + '_' + uuid();
    sessionStart = now();
    isNewSession = true;
    log('New session: ' + sessionId);
  } else {
    log('Continuing session: ' + sessionId);
  }

  setCookie('cnc_sid', sessionId, 1); // session cookie = 1 day
  setCookie('cnc_sst', sessionStart, 1);
  setCookie('cnc_la', String(timestamp()), 1);

  // Page counter
  var pageCount = parseInt(getCookie('cnc_pc') || '0') + 1;
  setCookie('cnc_pc', String(pageCount), 1);

  // ═══════════════════════════════════════════════════
  // UTM & CLICK ID CAPTURE
  // ═══════════════════════════════════════════════════
  var utmSource = getParam('utm_source') || getCookie('cnc_utm_source') || '';
  var utmMedium = getParam('utm_medium') || getCookie('cnc_utm_medium') || '';
  var utmCampaign = getParam('utm_campaign') || getCookie('cnc_utm_campaign') || '';
  var utmContent = getParam('utm_content') || getCookie('cnc_utm_content') || '';
  var utmTerm = getParam('utm_term') || getCookie('cnc_utm_term') || '';

  // Persist UTMs in cookies (first-touch: only set if empty)
  if (getParam('utm_source')) {
    setCookie('cnc_utm_source', getParam('utm_source'), CLICK_ID_COOKIE_DAYS);
    setCookie('cnc_utm_medium', getParam('utm_medium'), CLICK_ID_COOKIE_DAYS);
    setCookie('cnc_utm_campaign', getParam('utm_campaign'), CLICK_ID_COOKIE_DAYS);
    setCookie('cnc_utm_content', getParam('utm_content'), CLICK_ID_COOKIE_DAYS);
    setCookie('cnc_utm_term', getParam('utm_term'), CLICK_ID_COOKIE_DAYS);
  }

  // Click IDs
  var clickIds = {
    gclid: getParam('gclid') || getCookie('cnc_gclid') || '',
    fbclid: getParam('fbclid') || getCookie('cnc_fbclid') || '',
    msclkid: getParam('msclkid') || getCookie('cnc_msclkid') || '',
    ttclid: getParam('ttclid') || getCookie('cnc_ttclid') || ''
  };

  // Persist click IDs
  for (var cid in clickIds) {
    if (getParam(cid)) setCookie('cnc_' + cid, getParam(cid), CLICK_ID_COOKIE_DAYS);
  }

  // ═══════════════════════════════════════════════════
  // CHANNEL GROUPING (GA4-style)
  // ═══════════════════════════════════════════════════
  function getChannel() {
    var ref = document.referrer || '';
    var refHost = '';
    try { refHost = new URL(ref).hostname.replace('www.', '').toLowerCase(); } catch(e) {}

    // UTM-based (highest priority)
    if (utmSource && utmMedium) {
      var m = utmMedium.toLowerCase();
      if (m === 'cpc' || m === 'ppc' || m === 'paid' || m === 'paidsearch') return 'Paid Search';
      if (m === 'social' || m === 'paid_social' || m === 'paidsocial') return 'Paid Social';
      if (m === 'email') return 'Email';
      if (m === 'affiliate') return 'Affiliates';
      if (m === 'display' || m === 'banner' || m === 'cpm') return 'Display';
      if (m === 'referral') return 'Referral';
      if (m === 'organic') return 'Organic Social';
      if (m === 'sms') return 'SMS';
      return 'Other (' + utmMedium + ')';
    }

    // Click ID based
    if (clickIds.gclid) return 'Paid Search';
    if (clickIds.msclkid) return 'Paid Search';
    if (clickIds.fbclid) return 'Paid Social';
    if (clickIds.ttclid) return 'Paid Social';

    // Referrer based
    if (!ref || ref === '') return 'Direct';

    // Search engines
    var searchEngines = ['google.', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'baidu.com', 'yandex.'];
    for (var i = 0; i < searchEngines.length; i++) {
      if (refHost.indexOf(searchEngines[i]) >= 0) return 'Organic Search';
    }

    // Social networks
    var socialNets = ['facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com', 'youtube.com', 'pinterest.com', 'reddit.com', 'whatsapp.com', 't.co'];
    for (var j = 0; j < socialNets.length; j++) {
      if (refHost.indexOf(socialNets[j]) >= 0) return 'Organic Social';
    }

    // Own domain
    if (refHost.indexOf('cncelectric') >= 0) return 'Internal';

    return 'Referral';
  }

  var channel = getChannel();

  // Friendly source name
  function getSourceName() {
    if (utmSource) return utmSource;
    var ref = document.referrer || '';
    if (!ref) return 'direct';
    try {
      var h = new URL(ref).hostname.replace('www.', '');
      if (h.indexOf('google') >= 0) return 'google';
      if (h.indexOf('facebook') >= 0 || h.indexOf('fb.') >= 0) return 'facebook';
      if (h.indexOf('instagram') >= 0) return 'instagram';
      if (h.indexOf('tiktok') >= 0) return 'tiktok';
      if (h.indexOf('youtube') >= 0) return 'youtube';
      if (h.indexOf('twitter') >= 0 || h.indexOf('x.com') >= 0) return 'x';
      if (h.indexOf('bing') >= 0) return 'bing';
      return h;
    } catch(e) { return ref.slice(0, 50); }
  }

  // ═══════════════════════════════════════════════════
  // DEVICE DETECTION
  // ═══════════════════════════════════════════════════
  function getDevice() {
    var ua = navigator.userAgent || '';
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
    if (/mobile|iphone|ipod|android(?!.*tablet)|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
    return 'Desktop';
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) return 'Chrome';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'Safari';
    if (ua.indexOf('Edg') > -1) return 'Edge';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    return 'Other';
  }

  // ═══════════════════════════════════════════════════
  // SESSION WRITE
  // ═══════════════════════════════════════════════════
  var sessionData = {
    visitorId: visitorId,
    sessionId: sessionId,
    status: 'active',
    startedAt: sessionStart,
    lastActivity: now(),
    landingPage: isNewSession ? window.location.href : (getCookie('cnc_lp') || window.location.href),
    currentPage: window.location.href,
    pageCount: pageCount,
    referrer: document.referrer || 'direct',
    // UTM
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
    // Click IDs
    gclid: clickIds.gclid,
    fbclid: clickIds.fbclid,
    msclkid: clickIds.msclkid,
    ttclid: clickIds.ttclid,
    // Attribution
    channel: channel,
    source: getSourceName(),
    // Device
    device: getDevice(),
    browser: getBrowser(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language || '',
    userAgent: navigator.userAgent.slice(0, 200),
    // Tracking meta
    trackerVersion: 'March_23_V1',
    isNewSession: isNewSession
  };

  // Store landing page for returning pageviews
  if (isNewSession) setCookie('cnc_lp', window.location.href, 1);

  fsWrite('sessions', sessionId, sessionData);
  log('Session written: ' + sessionId);

  // ═══════════════════════════════════════════════════
  // PAGEVIEW
  // ═══════════════════════════════════════════════════
  var pageLoadTime = timestamp();
  var pageUrl = window.location.href;
  var pagePath = window.location.pathname;

  fsCreate('pageviews', {
    sessionId: sessionId,
    visitorId: visitorId,
    timestamp: now(),
    page_url: pageUrl,
    page_path: pagePath,
    page_title: document.title || '',
    referrer: document.referrer || '',
    pageNumber: pageCount,
    device: getDevice(),
    channel: channel,
    source: getSourceName()
  });

  // ═══════════════════════════════════════════════════
  // SCROLL DEPTH TRACKING
  // ═══════════════════════════════════════════════════
  var scrollFired = {};
  var scrollThresholds = [25, 50, 75, 90, 100];

  function checkScroll() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight
    );
    var winHeight = window.innerHeight;
    var scrollPct = docHeight <= winHeight ? 100 : Math.round((scrollTop + winHeight) / docHeight * 100);

    for (var i = 0; i < scrollThresholds.length; i++) {
      var t = scrollThresholds[i];
      if (scrollPct >= t && !scrollFired[t]) {
        scrollFired[t] = true;
        queueEvent({
          sessionId: sessionId,
          visitorId: visitorId,
          event_name: 'scroll_depth',
          depth: t,
          page_url: pageUrl,
          page_path: pagePath,
          timestamp: now()
        });
        log('Scroll depth: ' + t + '%');
      }
    }
  }

  var scrollDebounce = null;
  window.addEventListener('scroll', function() {
    if (scrollDebounce) clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(checkScroll, 200);
  }, { passive: true });

  // ═══════════════════════════════════════════════════
  // RAGE CLICK DETECTION
  // ═══════════════════════════════════════════════════
  var clickLog = [];
  var rageReported = {};

  document.addEventListener('click', function(e) {
    var t = timestamp();
    var x = e.clientX, y = e.clientY;
    clickLog.push({ x: x, y: y, t: t });

    // Keep only last 2 seconds
    clickLog = clickLog.filter(function(c) { return t - c.t < 2000; });

    // Check for 3+ clicks within 100px
    if (clickLog.length >= 3) {
      var recent = clickLog.slice(-3);
      var allClose = true;
      for (var i = 1; i < recent.length; i++) {
        var dx = recent[i].x - recent[0].x;
        var dy = recent[i].y - recent[0].y;
        if (Math.sqrt(dx * dx + dy * dy) > 100) { allClose = false; break; }
      }
      if (allClose) {
        var key = Math.round(x / 50) + '_' + Math.round(y / 50);
        if (!rageReported[key]) {
          rageReported[key] = true;
          var target = e.target;
          queueEvent({
            sessionId: sessionId,
            visitorId: visitorId,
            event_name: 'rage_click',
            x: x, y: y,
            element_tag: target.tagName,
            element_id: target.id || '',
            element_class: (target.className || '').toString().slice(0, 100),
            element_text: (target.textContent || '').slice(0, 50),
            page_url: pageUrl,
            page_path: pagePath,
            timestamp: now()
          });
          log('Rage click detected at ' + x + ',' + y);
        }
      }
    }
  }, true);

  // ═══════════════════════════════════════════════════
  // DEAD CLICK DETECTION
  // ═══════════════════════════════════════════════════
  var deadClickReported = {};

  document.addEventListener('click', function(e) {
    var target = e.target;
    // Skip actually interactive elements
    var interactive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL', 'SUMMARY'];
    if (interactive.indexOf(target.tagName) >= 0) return;
    if (target.closest('a, button, input, select, textarea, [onclick], [role="button"]')) return;
    if (target.style.cursor === 'pointer' || window.getComputedStyle(target).cursor === 'pointer') return;

    // Watch for DOM changes in next 500ms
    var changed = false;
    var observer = new MutationObserver(function() { changed = true; });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    setTimeout(function() {
      observer.disconnect();
      if (!changed) {
        var key = target.tagName + '_' + (target.id || '') + '_' + Math.round(e.clientX / 50);
        if (!deadClickReported[key]) {
          deadClickReported[key] = true;
          queueEvent({
            sessionId: sessionId,
            visitorId: visitorId,
            event_name: 'dead_click',
            x: e.clientX,
            y: e.clientY,
            element_tag: target.tagName,
            element_id: target.id || '',
            element_class: (target.className || '').toString().slice(0, 100),
            element_text: (target.textContent || '').slice(0, 50),
            page_url: pageUrl,
            page_path: pagePath,
            timestamp: now()
          });
          log('Dead click: ' + target.tagName + '#' + target.id);
        }
      }
    }, 500);
  }, true);

  // ═══════════════════════════════════════════════════
  // JS ERROR CAPTURE
  // ═══════════════════════════════════════════════════
  var errorCount = 0;

  window.addEventListener('error', function(e) {
    if (errorCount >= 10) return; // Cap at 10 per page
    errorCount++;
    queueEvent({
      sessionId: sessionId,
      visitorId: visitorId,
      event_name: 'js_error',
      message: (e.message || '').slice(0, 200),
      source: (e.filename || '').slice(0, 200),
      line: e.lineno || 0,
      col: e.colno || 0,
      page_url: pageUrl,
      page_path: pagePath,
      timestamp: now()
    });
    log('JS Error: ' + e.message);
  });

  window.addEventListener('unhandledrejection', function(e) {
    if (errorCount >= 10) return;
    errorCount++;
    queueEvent({
      sessionId: sessionId,
      visitorId: visitorId,
      event_name: 'js_error',
      message: 'Unhandled Promise: ' + String(e.reason || '').slice(0, 200),
      source: 'promise',
      page_url: pageUrl,
      page_path: pagePath,
      timestamp: now()
    });
  });

  // ═══════════════════════════════════════════════════
  // CORE WEB VITALS
  // ═══════════════════════════════════════════════════
  function observeCWV() {
    if (!('PerformanceObserver' in window)) return;

    // LCP
    try {
      new PerformanceObserver(function(list) {
        var entries = list.getEntries();
        var last = entries[entries.length - 1];
        if (last) {
          queueEvent({
            sessionId: sessionId, visitorId: visitorId,
            event_name: 'web_vital', metric: 'LCP',
            value: Math.round(last.startTime),
            page_url: pageUrl, page_path: pagePath, timestamp: now()
          });
          log('LCP: ' + Math.round(last.startTime) + 'ms');
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch(e) {}

    // CLS
    try {
      var clsValue = 0;
      new PerformanceObserver(function(list) {
        list.getEntries().forEach(function(entry) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        });
      }).observe({ type: 'layout-shift', buffered: true });
      // Report CLS on page hide
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
          queueEvent({
            sessionId: sessionId, visitorId: visitorId,
            event_name: 'web_vital', metric: 'CLS',
            value: Math.round(clsValue * 1000) / 1000,
            page_url: pageUrl, page_path: pagePath, timestamp: now()
          });
        }
      });
    } catch(e) {}

    // INP (Interaction to Next Paint)
    try {
      var inpValue = 0;
      new PerformanceObserver(function(list) {
        list.getEntries().forEach(function(entry) {
          if (entry.duration > inpValue) inpValue = entry.duration;
        });
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden' && inpValue > 0) {
          queueEvent({
            sessionId: sessionId, visitorId: visitorId,
            event_name: 'web_vital', metric: 'INP',
            value: Math.round(inpValue),
            page_url: pageUrl, page_path: pagePath, timestamp: now()
          });
        }
      });
    } catch(e) {}
  }
  observeCWV();

  // ═══════════════════════════════════════════════════
  // IDLE / VISIBILITY TRACKING
  // ═══════════════════════════════════════════════════
  var totalVisibleTime = 0;
  var totalHiddenTime = 0;
  var lastVisChange = timestamp();
  var isVisible = !document.hidden;

  document.addEventListener('visibilitychange', function() {
    var t = timestamp();
    var elapsed = t - lastVisChange;

    if (document.hidden) {
      // Was visible, now hidden
      totalVisibleTime += elapsed;
      isVisible = false;
      queueEvent({
        sessionId: sessionId, visitorId: visitorId,
        event_name: 'tab_hidden',
        visibleTime: Math.round(totalVisibleTime / 1000),
        page_url: pageUrl, page_path: pagePath, timestamp: now()
      });
    } else {
      // Was hidden, now visible
      totalHiddenTime += elapsed;
      isVisible = true;
      queueEvent({
        sessionId: sessionId, visitorId: visitorId,
        event_name: 'tab_visible',
        hiddenDuration: Math.round(elapsed / 1000),
        page_url: pageUrl, page_path: pagePath, timestamp: now()
      });
    }
    lastVisChange = t;
  });

  // Idle detection — no mouse/keyboard for 60s
  var lastInteraction = timestamp();
  var idleReported = false;

  function resetIdle() {
    lastInteraction = timestamp();
    if (idleReported) {
      idleReported = false;
      queueEvent({
        sessionId: sessionId, visitorId: visitorId,
        event_name: 'idle_end',
        page_url: pageUrl, page_path: pagePath, timestamp: now()
      });
    }
  }

  document.addEventListener('mousemove', resetIdle, { passive: true });
  document.addEventListener('keydown', resetIdle, { passive: true });
  document.addEventListener('touchstart', resetIdle, { passive: true });
  document.addEventListener('scroll', resetIdle, { passive: true });

  setInterval(function() {
    if (!idleReported && (timestamp() - lastInteraction) > 60000 && isVisible) {
      idleReported = true;
      queueEvent({
        sessionId: sessionId, visitorId: visitorId,
        event_name: 'idle_start',
        idleAfter: Math.round((timestamp() - pageLoadTime) / 1000),
        page_url: pageUrl, page_path: pagePath, timestamp: now()
      });
      log('User idle on visible page');
    }
  }, 10000);

  // ═══════════════════════════════════════════════════
  // FORM FIELD TRACKING (checkout/contact forms)
  // ═══════════════════════════════════════════════════
  var formTracked = {};

  function trackForms() {
    var forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
      if (formTracked[form.id || form.action]) return;
      formTracked[form.id || form.action || Math.random()] = true;

      var fieldTimes = {};

      form.addEventListener('focusin', function(e) {
        var field = e.target;
        if (field.tagName === 'INPUT' || field.tagName === 'SELECT' || field.tagName === 'TEXTAREA') {
          fieldTimes[field.name || field.id || field.type] = timestamp();
        }
      });

      form.addEventListener('focusout', function(e) {
        var field = e.target;
        var key = field.name || field.id || field.type;
        if (fieldTimes[key]) {
          var duration = timestamp() - fieldTimes[key];
          if (duration > 3000) { // Only log if > 3 seconds (meaningful hesitation)
            queueEvent({
              sessionId: sessionId, visitorId: visitorId,
              event_name: 'form_field_hesitation',
              field_name: key,
              field_type: field.type || field.tagName,
              duration_ms: duration,
              has_value: !!field.value,
              form_id: form.id || '',
              page_url: pageUrl, page_path: pagePath, timestamp: now()
            });
            log('Form hesitation: ' + key + ' (' + Math.round(duration / 1000) + 's)');
          }
          delete fieldTimes[key];
        }
      });

      // Form submission
      form.addEventListener('submit', function() {
        queueEvent({
          sessionId: sessionId, visitorId: visitorId,
          event_name: 'form_submit',
          form_id: form.id || '',
          form_action: (form.action || '').slice(0, 100),
          page_url: pageUrl, page_path: pagePath, timestamp: now()
        });
      });
    });
  }

  // Run on load + observe for dynamically added forms
  if (document.readyState === 'complete') trackForms();
  else window.addEventListener('load', trackForms);
  new MutationObserver(function() { trackForms(); }).observe(document.body || document.documentElement, { childList: true, subtree: true });

  // ═══════════════════════════════════════════════════
  // ADD TO CART INTERCEPTION (Shopify)
  // ═══════════════════════════════════════════════════
  var origFetch = window.fetch;
  window.fetch = function() {
    var url = arguments[0];
    if (typeof url === 'string' && url.indexOf('/cart/add') >= 0) {
      var result = origFetch.apply(this, arguments);
      result.then(function(r) { return r.clone().json(); }).then(function(data) {
        if (data && (data.title || data.product_title)) {
          var price = (data.price || data.final_price || 0) / 100;
          queueEvent({
            sessionId: sessionId, visitorId: visitorId,
            event_name: 'product_added_to_cart',
            product_title: data.title || data.product_title || '',
            product_id: String(data.product_id || data.id || ''),
            variant_id: String(data.variant_id || ''),
            handle: data.handle || '',
            price: price,
            quantity: data.quantity || 1,
            page_url: pageUrl, page_path: pagePath, timestamp: now()
          });

          // Also write to cart_events for faster dashboard pickup
          fsCreate('cart_events', {
            sessionId: sessionId, visitorId: visitorId,
            product_title: data.title || data.product_title || '',
            product_id: String(data.product_id || ''),
            handle: data.handle || '',
            price: price,
            quantity: data.quantity || 1,
            page_url: pageUrl, source: getSourceName(), channel: channel,
            device: getDevice(), timestamp: now()
          });

          log('Cart add: ' + (data.title || ''));
        }
      }).catch(function() {});
      return result;
    }
    return origFetch.apply(this, arguments);
  };

  // Also intercept XMLHttpRequest for older Shopify themes
  var origXHROpen = XMLHttpRequest.prototype.open;
  var origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._cncUrl = url;
    return origXHROpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function(body) {
    if (this._cncUrl && this._cncUrl.indexOf('/cart/add') >= 0) {
      this.addEventListener('load', function() {
        try {
          var data = JSON.parse(this.responseText);
          if (data && data.title) {
            queueEvent({
              sessionId: sessionId, visitorId: visitorId,
              event_name: 'product_added_to_cart',
              product_title: data.title || '',
              handle: data.handle || '',
              price: (data.price || 0) / 100,
              quantity: data.quantity || 1,
              page_url: pageUrl, page_path: pagePath, timestamp: now()
            });
          }
        } catch(e) {}
      });
    }
    return origXHRSend.apply(this, arguments);
  };

  // ═══════════════════════════════════════════════════
  // PRODUCT VIEW TRACKING (Shopify product pages)
  // ═══════════════════════════════════════════════════
  if (pagePath.indexOf('/products/') >= 0) {
    var productMeta = document.querySelector('meta[property="og:title"]');
    var priceMeta = document.querySelector('meta[property="product:price:amount"]');
    if (productMeta) {
      queueEvent({
        sessionId: sessionId, visitorId: visitorId,
        event_name: 'product_viewed',
        product_title: productMeta.content || '',
        product_handle: pagePath.split('/products/')[1] || '',
        price: priceMeta ? parseFloat(priceMeta.content) || 0 : 0,
        page_url: pageUrl, page_path: pagePath, timestamp: now()
      });
    }
  }

  // ═══════════════════════════════════════════════════
  // SITE SEARCH TRACKING
  // ═══════════════════════════════════════════════════
  var searchQuery = getParam('q') || getParam('query') || getParam('search');
  if (searchQuery) {
    var resultCount = document.querySelectorAll('.product-card, .grid-item, .collection-product, [data-product-id]').length;
    queueEvent({
      sessionId: sessionId, visitorId: visitorId,
      event_name: 'site_search',
      search_query: searchQuery,
      results_count: resultCount,
      is_zero_result: resultCount === 0,
      page_url: pageUrl, page_path: pagePath, timestamp: now()
    });
    log('Search: "' + searchQuery + '" → ' + resultCount + ' results');
  }

  // ═══════════════════════════════════════════════════
  // SESSION UPDATE ON UNLOAD
  // ═══════════════════════════════════════════════════
  function onLeave() {
    // Flush pending events
    flushEvents();

    // Calculate time on page
    var timeOnPage = Math.round((timestamp() - pageLoadTime) / 1000);
    var visTime = Math.round((totalVisibleTime + (isVisible ? timestamp() - lastVisChange : 0)) / 1000);

    // Update session
    fsWrite('sessions', sessionId, {
      lastActivity: now(),
      currentPage: pageUrl,
      pageCount: pageCount,
      status: 'ended',
      lastPageTime: timeOnPage,
      totalVisibleTime: visTime
    });

    // Update last activity cookie
    setCookie('cnc_la', String(timestamp()), 1);
  }

  window.addEventListener('beforeunload', onLeave);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      setCookie('cnc_la', String(timestamp()), 1);
      fsWrite('sessions', sessionId, { lastActivity: now(), currentPage: pageUrl, pageCount: pageCount });
    }
  });

  // ═══════════════════════════════════════════════════
  // HEARTBEAT — keep session alive every 30s
  // ═══════════════════════════════════════════════════
  setInterval(function() {
    if (isVisible) {
      setCookie('cnc_la', String(timestamp()), 1);
      fsWrite('sessions', sessionId, { lastActivity: now(), currentPage: pageUrl, pageCount: pageCount, status: 'active' });
    }
  }, 30000);

  // ═══════════════════════════════════════════════════
  // EXPOSE FOR CHATBOT INTEGRATION
  // ═══════════════════════════════════════════════════
  window.__CNC_TRACKER = {
    visitorId: visitorId,
    sessionId: sessionId,
    channel: channel,
    source: getSourceName(),
    device: getDevice(),
    pageCount: pageCount,
    utm: { source: utmSource, medium: utmMedium, campaign: utmCampaign },
    clickIds: clickIds,
    logEvent: function(name, data) {
      data = data || {};
      data.sessionId = sessionId;
      data.visitorId = visitorId;
      data.event_name = name;
      data.page_url = pageUrl;
      data.page_path = pagePath;
      data.timestamp = now();
      queueEvent(data);
    }
  };

  log('CNC Tracker March_23_V1 loaded. Session: ' + sessionId + ' | Visitor: ' + visitorId + ' | Channel: ' + channel);

})();
