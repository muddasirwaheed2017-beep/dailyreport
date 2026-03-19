// CNC Electric — Shopify Custom Web Pixel
// Tracks checkout + purchase events → Firebase Firestore

const FP = 'cnc-website-tracking';
const FK = 'AIzaSyB7zR2KAGyygQuZV1R23henUjFq9i6Uvfs';

function fsUrl(col) {
  return 'https://firestore.googleapis.com/v1/projects/' + FP + '/databases/(default)/documents/' + col + '?key=' + FK;
}

function toFV(val) {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFV) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    const keys = Object.keys(val);
    for (let i = 0; i < keys.length; i++) {
      fields[keys[i]] = toFV(val[keys[i]]);
    }
    return { mapValue: { fields: fields } };
  }
  return { stringValue: String(val) };
}

function sendFS(collection, data) {
  const fields = {};
  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    fields[keys[i]] = toFV(data[keys[i]]);
  }
  fetch(fsUrl(collection), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: fields }),
    keepalive: true
  }).catch(function(err) {});
}

async function getIds() {
  let sid = '';
  let vid = '';
  let src = '';
  let med = '';
  let cmp = '';
  try {
    sid = await browser.sessionStorage.getItem('_cnc_sid');
    vid = await browser.localStorage.getItem('_cnc_vid');
    src = await browser.localStorage.getItem('_cnc_utm_source');
    med = await browser.localStorage.getItem('_cnc_utm_medium');
    cmp = await browser.localStorage.getItem('_cnc_utm_campaign');
  } catch(e) {}
  if (!vid) {
    try { vid = await browser.cookie.get('_cnc_vid'); } catch(e) {}
  }
  if (!sid) {
    try { sid = await browser.cookie.get('_cnc_sid'); } catch(e) {}
  }
  return {
    sid: sid || '',
    vid: vid || '',
    src: src || '',
    med: med || '',
    cmp: cmp || ''
  };
}

function safePrice(obj) {
  if (!obj || !obj.amount) { return 0; }
  return parseFloat(obj.amount);
}

function mapItems(items) {
  if (!items) { return []; }
  var result = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var v = it.variant || {};
    var p = v.product || {};
    result.push({
      title: it.title || '',
      quantity: it.quantity || 1,
      sku: v.sku || '',
      price: safePrice(v.price),
      product_id: p.id || '',
      variant_id: v.id || ''
    });
  }
  return result;
}

// CHECKOUT STARTED
analytics.subscribe('checkout_started', async function(event) {
  var c = event.data.checkout;
  var ids = await getIds();
  sendFS('checkout_events', {
    event_name: 'checkout_started',
    event_id: event.id || '',
    timestamp: event.timestamp || '',
    client_id: event.clientId || '',
    session_id: ids.sid,
    visitor_id: ids.vid,
    utm_source: ids.src,
    utm_medium: ids.med,
    utm_campaign: ids.cmp,
    checkout_token: c ? (c.token || '') : '',
    email: c ? (c.email || '') : '',
    phone: c ? (c.phone || '') : '',
    total_price: c ? safePrice(c.totalPrice) : 0,
    currency: c ? (c.currencyCode || 'PKR') : 'PKR',
    item_count: c && c.lineItems ? c.lineItems.length : 0,
    line_items: c ? mapItems(c.lineItems) : []
  });
  sendFS('events', {
    type: 'checkout_started',
    visitorId: ids.vid,
    sessionId: ids.sid,
    page: '/checkout',
    pageType: 'checkout',
    channel: ids.src ? ids.src + ' / ' + ids.med : 'Direct',
    timestamp: event.timestamp || '',
    data: {
      total_price: c ? safePrice(c.totalPrice) : 0,
      item_count: c && c.lineItems ? c.lineItems.length : 0
    }
  });
});

// CONTACT INFO
analytics.subscribe('checkout_contact_info_submitted', async function(event) {
  var c = event.data.checkout;
  var ids = await getIds();
  sendFS('checkout_events', {
    event_name: 'contact_info_submitted',
    event_id: event.id || '',
    timestamp: event.timestamp || '',
    client_id: event.clientId || '',
    session_id: ids.sid,
    visitor_id: ids.vid,
    email: c ? (c.email || '') : '',
    phone: c ? (c.phone || '') : '',
    checkout_token: c ? (c.token || '') : ''
  });
});

// SHIPPING INFO
analytics.subscribe('checkout_shipping_info_submitted', async function(event) {
  var c = event.data.checkout;
  var ids = await getIds();
  sendFS('checkout_events', {
    event_name: 'shipping_info_submitted',
    event_id: event.id || '',
    timestamp: event.timestamp || '',
    session_id: ids.sid,
    visitor_id: ids.vid,
    checkout_token: c ? (c.token || '') : ''
  });
});

// PAYMENT INFO
analytics.subscribe('payment_info_submitted', async function(event) {
  var c = event.data.checkout;
  var ids = await getIds();
  sendFS('checkout_events', {
    event_name: 'payment_info_submitted',
    event_id: event.id || '',
    timestamp: event.timestamp || '',
    session_id: ids.sid,
    visitor_id: ids.vid,
    checkout_token: c ? (c.token || '') : ''
  });
  sendFS('events', {
    type: 'payment_info_submitted',
    visitorId: ids.vid,
    sessionId: ids.sid,
    page: '/checkout',
    pageType: 'checkout',
    channel: ids.src ? ids.src + ' / ' + ids.med : 'Direct',
    timestamp: event.timestamp || ''
  });
});

// PURCHASE (checkout_completed)
analytics.subscribe('checkout_completed', async function(event) {
  var c = event.data.checkout;
  var ids = await getIds();
  var orderId = '';
  var customerId = '';
  if (c && c.order) {
    orderId = c.order.id || '';
    if (c.order.customer) {
      customerId = c.order.customer.id || '';
    }
  }
  var purchaseData = {
    event_name: 'purchase',
    event_id: event.id || '',
    timestamp: event.timestamp || '',
    client_id: event.clientId || '',
    session_id: ids.sid,
    visitor_id: ids.vid,
    utm_source: ids.src,
    utm_medium: ids.med,
    utm_campaign: ids.cmp,
    order_id: orderId,
    checkout_token: c ? (c.token || '') : '',
    email: c ? (c.email || '') : '',
    phone: c ? (c.phone || '') : '',
    customer_id: customerId,
    currency: c ? (c.currencyCode || 'PKR') : 'PKR',
    total_price: c ? safePrice(c.totalPrice) : 0,
    subtotal: c ? safePrice(c.subtotalPrice) : 0,
    total_tax: c ? safePrice(c.totalTax) : 0,
    line_items: c ? mapItems(c.lineItems) : [],
    item_count: c && c.lineItems ? c.lineItems.length : 0
  };
  sendFS('purchases', purchaseData);
  sendFS('checkout_events', purchaseData);
  sendFS('events', {
    type: 'purchase',
    visitorId: ids.vid,
    sessionId: ids.sid,
    page: '/checkout/completed',
    pageType: 'checkout',
    channel: ids.src ? ids.src + ' / ' + ids.med : 'Direct',
    timestamp: event.timestamp || '',
    data: {
      order_id: orderId,
      total_price: c ? safePrice(c.totalPrice) : 0,
      item_count: c && c.lineItems ? c.lineItems.length : 0,
      email: c ? (c.email || '') : ''
    }
  });
});

// CART ADD (backup from pixel)
analytics.subscribe('product_added_to_cart', async function(event) {
  var line = event.data.cartLine;
  var ids = await getIds();
  var merch = line ? (line.merchandise || {}) : {};
  var prod = merch.product || {};
  sendFS('cart_events', {
    visitorId: ids.vid,
    sessionId: ids.sid,
    action: 'add',
    source: 'pixel',
    product: prod.title || '',
    productId: prod.id || '',
    variantId: merch.id || '',
    price: safePrice(merch.price),
    quantity: line ? (line.quantity || 1) : 1,
    channel: ids.src ? ids.src + ' / ' + ids.med : 'Direct',
    timestamp: event.timestamp || ''
  });
});

// CART REMOVE
analytics.subscribe('product_removed_from_cart', async function(event) {
  var line = event.data.cartLine;
  var ids = await getIds();
  var merch = line ? (line.merchandise || {}) : {};
  var prod = merch.product || {};
  sendFS('cart_events', {
    visitorId: ids.vid,
    sessionId: ids.sid,
    action: 'remove',
    source: 'pixel',
    product: prod.title || '',
    quantity: line ? (line.quantity || 1) : 1,
    channel: ids.src ? ids.src + ' / ' + ids.med : 'Direct',
    timestamp: event.timestamp || ''
  });
});

// SEARCH
analytics.subscribe('search_submitted', async function(event) {
  var ids = await getIds();
  var query = '';
  if (event.data && event.data.searchResult) {
    query = event.data.searchResult.query || '';
  }
  sendFS('events', {
    type: 'search_pixel',
    visitorId: ids.vid,
    sessionId: ids.sid,
    page: '/search',
    pageType: 'search',
    channel: ids.src ? ids.src + ' / ' + ids.med : 'Direct',
    timestamp: event.timestamp || '',
    data: { query: query }
  });
});
