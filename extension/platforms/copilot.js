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
// platforms/copilot.js — Microsoft Copilot (WebSocket transport), estimated tokens
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.copilotHandler = {
  _lastLen: 0,

  handleBridgeMessage(msg) {
    if (!msg?.url) return null;

    // Copilot streams over WebSocket (SignalR / Sydney ChatHub)
    if (msg.type === '__AIR_ws_message') {
      const text = this._extractWsText(msg.data);
      if (text) {
        // Streamed messages are cumulative; only count the newly appended slice.
        let delta = text;
        if (text.length >= this._lastLen) {
          delta = text.slice(this._lastLen);
          this._lastLen = text.length;
        } else {
          this._lastLen = text.length; // new turn started
        }
        if (delta) return { source: 'estimated', tokensDelta: AIR.estimator.estimate(delta) };
      }
      // Detect end of a turn → reset cumulative tracker
      if (msg.data?.type === 2 || msg.data?.type === 3) this._lastLen = 0;
    }

    // Some Copilot variants use HTTP JSON (/c/api/chat)
    if (msg.type === '__AIR_json' && msg.url.includes('/c/api/chat')) {
      const text = this._extractJsonText(msg.data);
      if (text) return { source: 'estimated', sessionTokensTotal: AIR.estimator.estimate(text) };
    }

    return null;
  },

  _extractWsText(data) {
    // SignalR frame: { type, target, arguments: [ { messages: [ { text, author } ] } ] }
    const args = data?.arguments;
    if (Array.isArray(args)) {
      let out = '';
      for (const a of args) {
        const messages = a?.messages;
        if (Array.isArray(messages)) {
          for (const m of messages) {
            if (m?.author === 'bot' && typeof m.text === 'string') out += m.text;
          }
        }
      }
      if (out) return out;
    }
    return '';
  },

  _extractJsonText(data) {
    if (typeof data?.text === 'string') return data.text;
    if (Array.isArray(data?.messages)) {
      return data.messages.map(m => m?.text || '').join(' ');
    }
    return '';
  }
};
