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
// tiktoken.js — thin adapter over the bundled BPE tokenizer (vendor/o200k_base.js)
//
// vendor/o200k_base.js is the UMD build of `gpt-tokenizer` (o200k_base encoding),
// which registers `globalThis.GPTTokenizer_o200k_base`. This adapter exposes a
// stable, namespaced API and never throws so callers can rely on it everywhere.
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.tiktoken = {
  get available() {
    const t = globalThis.GPTTokenizer_o200k_base;
    return !!(t && (t.countTokens || t.encode));
  },

  countTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    const t = globalThis.GPTTokenizer_o200k_base;
    if (t?.countTokens) {
      try { return t.countTokens(text); } catch {}
    }
    if (t?.encode) {
      try { return t.encode(text).length; } catch {}
    }
    return Math.ceil(text.length / 4);
  },

  encode(text) {
    const t = globalThis.GPTTokenizer_o200k_base;
    if (t?.encode) {
      try { return t.encode(text); } catch {}
    }
    return [];
  }
};
