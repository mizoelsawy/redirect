/*!
 * app-link.js — "open the app if it's installed, otherwise go to the store"
 *
 * USAGE
 *   <a href="#" data-app-link>Download the app</a>
 *   <script src="app-link.js"></script>
 *
 * Any element with data-app-link gets wired up automatically.
 * You can also call it yourself:  AppLink.open()
 *
 * Works on a plain HTML page, WordPress, Webflow, React — anywhere you can
 * add a script tag. No dependencies.
 */
(function (global) {
  "use strict";

  /* ==================================================================
     CONFIG — the only part you edit
  ================================================================== */
  var CONFIG = {
    // Android package name (from your Play Store URL)
    androidPackage: "com.getstenix_front",

    // Store fallbacks, used whenever the app isn't installed
    androidStore: "https://play.google.com/store/apps/details?id=com.getstenix_front&hl=en&pli=1",
    iosStore: "https://apps.apple.com/app/id6741886235",

    // --- How we try to reach the app ---------------------------------
    // Best option: a Universal Link / App Link on YOUR domain, e.g.
    // "https://getstenix.com/open". Needs apple-app-site-association +
    // assetlinks.json hosted on that domain. If set, it's used first and
    // everything below becomes a backup.
    universalLink: "",

    // Fallback option: your app's custom URL scheme, WITHOUT "://"
    // e.g. "getstenix"  ->  getstenix://
    // Leave empty if the app doesn't have one; we'll go straight to the store.
    scheme: "",

    // Optional screen to land on inside the app, e.g. "home" or "offers/12"
    path: "",

    // What desktop visitors get: "stay" leaves the page alone (show your own
    // two store buttons), or put a URL here to send them somewhere.
    desktop: "stay",

    // How long to wait for the app to take over before giving up (ms).
    // Too short = store opens while the app is still launching.
    timeout: 1500
  };
  /* ================================================================== */

  function detectPlatform() {
    var ua = navigator.userAgent || "";

    var uad = navigator.userAgentData;
    if (uad && typeof uad.platform === "string") {
      var p = uad.platform.toLowerCase();
      if (p === "android") return "android";
      if (p === "ios") return "ios";
    }

    if (/android/i.test(ua)) return "android";
    if (/iphone|ipad|ipod/i.test(ua)) return "ios";

    // iPadOS 13+ reports a desktop Safari UA — touch points give it away
    if (/macintosh|mac os x/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";

    return "desktop";
  }

  // In-app browsers (Instagram, Facebook, TikTok, LinkedIn...) sandbox
  // custom schemes and intent:// URLs, so deep links silently do nothing.
  // In those, we skip straight to the store — a working store link beats a
  // dead button.
  function isInAppBrowser(ua) {
    ua = ua || navigator.userAgent || "";
    return /FBAN|FBAV|Instagram|Line\/|TikTok|LinkedInApp|Snapchat|Twitter|Pinterest|GSA\//i.test(ua);
  }

  function schemeUrl() {
    if (!CONFIG.scheme) return "";
    return CONFIG.scheme + "://" + (CONFIG.path || "");
  }

  // Android's intent: URL does the whole job in one hop — Chrome opens the
  // app if present, and follows browser_fallback_url if not. No timers.
  function intentUrl() {
    var fallback = encodeURIComponent(CONFIG.androidStore);
    var head = CONFIG.scheme
      ? "intent://" + (CONFIG.path || "") + "#Intent;scheme=" + CONFIG.scheme + ";"
      : "intent://#Intent;";
    return head +
      "package=" + CONFIG.androidPackage + ";" +
      "S.browser_fallback_url=" + fallback + ";end";
  }

  // Try the app, and if we're still sitting here after `timeout`, go to the
  // store. If the app DID open, the page gets hidden/backgrounded first and
  // we cancel — otherwise the store is waiting when they come back.
  function tryAppThenStore(appUrl, storeUrl) {
    var cancelled = false;

    function cancel() {
      if (document.hidden || document.visibilityState === "hidden") cancelled = true;
    }

    document.addEventListener("visibilitychange", cancel);
    window.addEventListener("pagehide", function () { cancelled = true; });
    window.addEventListener("blur", function () { cancelled = true; });

    var timer = setTimeout(function () {
      document.removeEventListener("visibilitychange", cancel);
      if (!cancelled && !document.hidden) window.location.replace(storeUrl);
    }, CONFIG.timeout);

    try {
      window.location.href = appUrl;
    } catch (e) {
      clearTimeout(timer);
      window.location.replace(storeUrl);
    }
  }

  // Works out where this click should go, without going there. Keeping the
  // decision separate from the navigation makes it testable — and the
  // strategy name tells you which path you're on when debugging.
  function resolve(platform, ua) {
    platform = platform || detectPlatform();

    if (platform === "desktop") {
      return CONFIG.desktop && CONFIG.desktop !== "stay"
        ? { platform: platform, strategy: "desktop-redirect", url: CONFIG.desktop }
        : { platform: platform, strategy: "desktop-stay", url: "" };
    }

    var store = platform === "ios" ? CONFIG.iosStore : CONFIG.androidStore;

    if (isInAppBrowser(ua)) {
      return { platform: platform, strategy: "in-app-browser", url: store, store: store };
    }

    // A Universal Link handles both cases by itself: the OS opens the app if
    // it's installed, and loads the web page if it isn't. Nothing to time.
    if (CONFIG.universalLink) {
      return { platform: platform, strategy: "universal-link", url: CONFIG.universalLink, store: store };
    }

    if (platform === "android") {
      return { platform: platform, strategy: "intent", url: intentUrl(), store: store };
    }

    var app = schemeUrl();
    if (app) return { platform: platform, strategy: "scheme-then-store", url: app, store: store };

    return { platform: platform, strategy: "store-only", url: store, store: store };
  }

  function open() {
    var target = resolve();

    if (!target.url) return target;

    if (target.strategy === "scheme-then-store") tryAppThenStore(target.url, target.store);
    else window.location.href = target.url;

    return target;
  }

  function wire(el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      open();
    });

    // Keep the href honest for right-click / "copy link" / no-JS visitors
    if (el.tagName === "A" && (!el.getAttribute("href") || el.getAttribute("href") === "#")) {
      var p = detectPlatform();
      el.setAttribute("href", p === "ios" ? CONFIG.iosStore : CONFIG.androidStore);
    }
  }

  function init() {
    var nodes = document.querySelectorAll("[data-app-link]");
    for (var i = 0; i < nodes.length; i++) wire(nodes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.AppLink = {
    open: open,
    resolve: resolve,
    wire: wire,
    detect: detectPlatform,
    isInAppBrowser: isInAppBrowser,
    config: CONFIG
  };
})(window);
