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
// platforms/chatgpt.js
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.chatgptHandler = {
  sessionTokensThisConversation: 0,

  handleBridgeMessage(msg) {
    if (!msg?.url) return null;

    // ChatGPT SSE chunk — look for usage field in final chunk
    if (msg.type === '__AIR_sse_chunk' && msg.url.includes('/backend-api/conversation')) {
      const usage = msg.data?.usage || msg.data?.message?.metadata?.usage;
      if (usage) {
        // ChatGPT provides prompt_tokens + completion_tokens
        const total = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
        this.sessionTokensThisConversation = total;

        // ChatGPT doesn't expose utilization % directly — derive an estimate
        // from the token count. Plus is roughly 40 msgs (~2000 tk each =
        // ~80,000 tk) per 3-hour window.
        const CHATGPT_SESSION_TOKEN_LIMIT = 80000;
        const estimatedUtil = Math.min(100, (total / CHATGPT_SESSION_TOKEN_LIMIT) * 100);

        return {
          source: 'real',
          tokensThisConversation: total,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          session: {
            utilization: estimatedUtil,
            resetsAt: null,
            windowHours: 3
          }
        };
      }

      // Always estimate from delta text even if no usage field — so the token
      // count accumulates in real time while the response streams.
      const piece = this._extractDeltaText(msg.data);
      if (piece) {
        return { source: 'estimated', tokensDelta: AIR.estimator.estimate(piece) };
      }
    }

    // Account/subscription endpoint may expose limits
    if (msg.type === '__AIR_json' && msg.url.includes('/accounts/check')) {
      // Extract plan type if available
      if (msg.data?.account_plan?.is_paid_subscription_active) {
        return { source: 'meta', isPro: true };
      }
    }

    return null;
  },

  _extractDeltaText(chunk) {
    // Newer ChatGPT delta encoding (v: "...") or message append operations
    if (typeof chunk?.v === 'string') return chunk.v;
    const parts = chunk?.message?.content?.parts;
    if (Array.isArray(parts)) return parts.filter(p => typeof p === 'string').join('');
    return '';
  }
};
