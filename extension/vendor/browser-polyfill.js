/*!
 * ============================================================================
 *  AIRadar — Universal AI usage, token & reset-timer tracker
 *  Claude · ChatGPT · Gemini · Copilot · Grok · Perplexity · Meta AI · DeepSeek
 * ----------------------------------------------------------------------------
 *  Author & Developer : Vijaya Kumar L  (Rise With VJ)
 *  GitHub             : https://github.com/risewithvj
 *  Project            : https://github.com/risewithvj/AIRadar
 *  LinkedIn           : https://www.linkedin.com/in/vijayakumarl/
 *  Email              : risewithvj@gmail.com
 * ----------------------------------------------------------------------------
 *  Copyright (c) 2026 Vijaya Kumar L (Rise With VJ). All rights reserved.
 *  Source-available under the AIRadar License — see LICENSE. Attribution to the
 *  original author MUST be retained in all copies and derivative works.
 *  AIRadar is 100% local: it collects no data and contacts no third-party server.
 * ============================================================================
 */
// browser-polyfill.js — minimal cross-engine WebExtension shim.
// Guarantees both the `chrome` (Chromium) and `browser` (Gecko/Firefox) global
// namespaces exist, so the rest of the codebase can call `chrome.*` everywhere
// and still run unmodified on Firefox, Zen, Floorp, LibreWolf, Waterfox, etc.
(function () {
  'use strict';
  var g = (typeof globalThis !== 'undefined') ? globalThis
        : (typeof self !== 'undefined') ? self
        : (typeof window !== 'undefined') ? window : this;
  if (typeof g.chrome === 'undefined' && typeof g.browser !== 'undefined') g.chrome = g.browser;
  if (typeof g.browser === 'undefined' && typeof g.chrome !== 'undefined') g.browser = g.chrome;
})();
