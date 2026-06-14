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
// platforms/metaai.js — Meta AI (meta.ai), estimated tokens
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.metaaiHandler = {
  handleBridgeMessage(msg) {
    if (!msg?.url) return null;

    // Meta AI streams GraphQL responses
    if (msg.type === '__AIR_sse_chunk' && msg.url.includes('/api/graphql')) {
      const text = this._extractText(msg.data);
      if (text) return { source: 'estimated', tokensDelta: AIR.estimator.estimate(text) };
    }

    // Full GraphQL JSON response
    if (msg.type === '__AIR_json' && msg.url.includes('/api/graphql')) {
      const text = this._extractText(msg.data);
      if (text) return { source: 'estimated', tokensDelta: AIR.estimator.estimate(text) };
    }

    return null;
  },

  _extractText(data) {
    // Target: response.data.node.bot_response_message.snippet / text
    const node = data?.data?.node || data?.data?.message;
    const resp =
      node?.bot_response_message ||
      data?.bot_response_message ||
      node;
    if (resp) {
      if (typeof resp.snippet === 'string') return resp.snippet;
      if (typeof resp.text === 'string') return resp.text;
      if (typeof resp.composed_text?.content === 'string') return resp.composed_text.content;
    }
    // Fallback: shallow walk for a 'snippet' or 'text' field
    return this._findText(data);
  },

  _findText(node, depth = 0) {
    if (depth > 8 || node == null) return '';
    if (typeof node === 'object') {
      if (typeof node.snippet === 'string') return node.snippet;
      if (typeof node.text === 'string' && node.text.length > 8) return node.text;
      for (const k in node) {
        const found = this._findText(node[k], depth + 1);
        if (found) return found;
      }
    }
    return '';
  }
};
