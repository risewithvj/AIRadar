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
// platforms/gemini.js — estimated token model (no public usage API)
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.geminiHandler = {
  handleBridgeMessage(msg) {
    if (!msg?.url) return null;

    // Gemini streams batchexecute / StreamGenerate responses
    if (
      msg.type === '__AIR_sse_chunk' &&
      (msg.url.includes('StreamGenerate') ||
        msg.url.includes('assistant.lamda.BardFrontendService') ||
        msg.url.includes('/api/generate'))
    ) {
      const text = this._extractText(msg.data);
      if (text) {
        return { source: 'estimated', tokensDelta: AIR.estimator.estimate(text) };
      }
    }

    // Full conversation / batchexecute JSON payload
    if (
      msg.type === '__AIR_json' &&
      (msg.url.includes('batchexecute') || msg.url.includes('BardFrontendService'))
    ) {
      const fullText = this._extractConversationText(msg.data);
      if (fullText) {
        return { source: 'estimated', sessionTokensTotal: AIR.estimator.estimate(fullText) };
      }
    }

    return null;
  },

  _extractText(chunk) {
    return this._walkStrings(chunk).join(' ');
  },

  _extractConversationText(data) {
    return this._walkStrings(data).join(' ');
  },

  // Gemini responses are deeply nested arrays; collect the longest free-text strings.
  _walkStrings(node, acc = [], depth = 0) {
    if (depth > 12 || acc.length > 4000) return acc;
    if (typeof node === 'string') {
      // Heuristic: keep human-readable strings (contain a space, reasonable length)
      if (node.length > 12 && /\s/.test(node) && !/^https?:/.test(node)) acc.push(node);
    } else if (Array.isArray(node)) {
      for (const item of node) this._walkStrings(item, acc, depth + 1);
    } else if (node && typeof node === 'object') {
      for (const k in node) this._walkStrings(node[k], acc, depth + 1);
    }
    return acc;
  }
};
