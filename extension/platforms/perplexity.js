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
// platforms/perplexity.js
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.perplexityHandler = {
  handleBridgeMessage(msg) {
    if (!msg?.url) return null;

    // Perplexity SSE for Pro searches
    if (msg.type === '__AIR_sse_chunk' && msg.url.includes('/rest/sse')) {
      if (msg.data?.type === 'completed' || msg.data?.final === true) {
        // Each completed SSE = 1 Pro query used
        return { source: 'query_count', queryDelta: 1 };
      }
    }

    // Profile/subscription endpoint for daily limit
    if (msg.type === '__AIR_json' && msg.url.includes('/rest/user')) {
      const sub = msg.data?.subscription || msg.data;
      const dailyLimit = sub?.daily_limit ?? sub?.gpt4_limit;
      const dailyUsed = sub?.daily_usage ?? sub?.gpt4_used;
      if (dailyLimit != null) {
        return {
          source: 'real',
          queryModel: true,
          dailyLimit,
          dailyUsed: dailyUsed ?? 0,
          utilization: Math.min(100, ((dailyUsed ?? 0) / dailyLimit) * 100)
        };
      }
    }

    return null;
  }
};
