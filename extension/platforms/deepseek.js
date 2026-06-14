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
// platforms/deepseek.js
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.deepseekHandler = {
  handleBridgeMessage(msg) {
    if (!msg?.url) return null;

    if (msg.type === '__AIR_sse_chunk' && msg.url.includes('/api/v0/chat/completion')) {
      const chunk = msg.data;

      // Thinking tokens in <think> blocks (R1 reasoning_content)
      if (chunk?.choices?.[0]?.delta?.reasoning_content) {
        const thinkingText = chunk.choices[0].delta.reasoning_content;
        const thinkingTokens = AIR.estimator.estimate(thinkingText);
        return { source: 'estimated', thinkingTokensDelta: thinkingTokens };
      }

      // Regular streamed output text
      if (chunk?.choices?.[0]?.delta?.content) {
        const tokens = AIR.estimator.estimate(chunk.choices[0].delta.content);
        return { source: 'estimated', tokensDelta: tokens };
      }

      // Final usage block (authoritative)
      if (chunk?.usage) {
        return {
          source: 'real',
          promptTokens: chunk.usage.prompt_tokens || 0,
          completionTokens: chunk.usage.completion_tokens || 0,
          tokensDelta: (chunk.usage.completion_tokens || 0),
          thinkingTokens: chunk.usage.reasoning_tokens || 0
        };
      }
    }

    return null;
  }
};
