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
// estimator.js
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.estimator = {
  /**
   * Estimates token count from text.
   * Priority: real tiktoken → char-based heuristic
   */
  estimate(text) {
    if (!text || typeof text !== 'string') return 0;

    // Use tiktoken if available (loaded via vendor/o200k_base.js)
    const tokenizer = globalThis.GPTTokenizer_o200k_base;
    if (tokenizer?.countTokens) {
      try { return tokenizer.countTokens(text); } catch {}
    }
    if (tokenizer?.encode) {
      try { return tokenizer.encode(text).length; } catch {}
    }

    // Heuristic: ~4 chars per token (works within ±15% for English)
    return Math.ceil(text.length / 4);
  },

  /**
   * Estimates tokens for a message array (role/content pairs)
   */
  estimateMessages(messages) {
    if (!Array.isArray(messages)) return 0;
    let total = 0;
    for (const m of messages) {
      total += 4; // per-message overhead
      if (typeof m.content === 'string') total += this.estimate(m.content);
      if (typeof m.role === 'string') total += this.estimate(m.role);
    }
    return total + 2; // conversation overhead
  }
};
