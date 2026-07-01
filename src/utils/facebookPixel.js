/**
 * Utility to dynamically initialize and interact with Facebook Pixel.
 * Loads VITE_FACEBOOK_PIXEL_ID from environment variables.
 */

export function initFacebookPixel() {
  const pixelId = localStorage.getItem('facebook_pixel_id') || import.meta.env.VITE_FACEBOOK_PIXEL_ID;
  if (!pixelId) {
    console.warn("[Facebook Pixel] Missing Pixel ID in localStorage or VITE_FACEBOOK_PIXEL_ID in environment variables. Tracking is disabled.");
    return;
  }

  if (window.fbq) return; // Already initialized

  // Standard Facebook Pixel Initialization Code
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', pixelId);
  console.log(`[Facebook Pixel] Initialized successfully with ID: ${pixelId}`);
}

/**
 * Tracks a standard Facebook Pixel event
 * @param {string} eventName - e.g., 'PageView', 'Lead', 'CompleteRegistration', 'InitiateCheckout'
 * @param {Object} [properties] - Custom properties
 */
export function trackPixelEvent(eventName, properties = {}) {
  if (window.fbq) {
    window.fbq('track', eventName, properties);
  }
}

/**
 * Tracks a custom Facebook Pixel event
 * @param {string} eventName - Custom event name
 * @param {Object} [properties] - Custom properties
 */
export function trackPixelCustomEvent(eventName, properties = {}) {
  if (window.fbq) {
    window.fbq('trackCustom', eventName, properties);
  }
}
