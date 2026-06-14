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
// platforms/grok.js — Grok (grok.com + x.com/i/grok), estimated tokens
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.grokHandler = {
  handleBridgeMessage(msg) {
    if (!msg?.url) return null;

    // Grok streams responses via add_response / responses endpoints
    if (
      msg.type === '__AIR_sse_chunk' &&
      (msg.url.includes('/grok/add_response') ||
        msg.url.includes('/responses') ||
        msg.url.includes('/conversations'))
    ) {
      const text = this._extractText(msg.data);
      if (text) return { source: 'estimated', tokensDelta: AIR.estimator.estimate(text) };
    }

    // x.com legacy JSON path: /i/api/grok/add_response.json
    if (msg.type === '__AIR_json' && msg.url.includes('grok/add_response')) {
      const text = this._extractText(msg.data);
      if (text) return { source: 'estimated', tokensDelta: AIR.estimator.estimate(text) };
    }

    return null;
  },

  _extractText(chunk) {
    // Common Grok shapes: { result: { message } } / { token } / { response: { token } }
    if (typeof chunk?.result?.message === 'string') return chunk.result.message;
    if (typeof chunk?.result?.token === 'string') return chunk.result.token;
    if (typeof chunk?.token === 'string') return chunk.token;
    if (typeof chunk?.response?.token === 'string') return chunk.response.token;
    if (typeof chunk?.message === 'string') return chunk.message;
    return '';
  }
};
