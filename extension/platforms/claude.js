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
// platforms/claude.js
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.claudeHandler = {
  /**
   * Called from main.js on every bridge message.
   * Returns a normalized usage object or null.
   */
  handleBridgeMessage(msg) {
    if (!msg?.url) return null;

    // Real usage endpoint — try multiple known URL patterns
    if (msg.type === '__AIR_json') {
      const u = msg.url;
      if (u.includes('/usage') || u.includes('/rate_limit') ||
          u.includes('/message_limit')) {
        const r1 = this._parseUsageEndpoint(msg.data);
        if (r1) return r1;
        const r2 = this._parseMessageLimit(msg.data);
        if (r2) return r2;
      }
    }

    // SSE chunks — try both shapes Claude has used
    if (msg.type === '__AIR_sse_chunk') {
      const d = msg.data;
      // Shape 1: { type: 'message_limit', message_limit: { windows: {...} } }
      if (d?.type === 'message_limit') {
        return this._parseMessageLimit(d.message_limit || d);
      }
      // Shape 2: top-level message_limit object
      if (d?.message_limit) {
        return this._parseMessageLimit(d.message_limit);
      }
      // Shape 3: direct windows object
      if (d?.windows?.['5h'] || d?.windows?.['7d']) {
        return this._parseMessageLimit(d);
      }
      // Shape 4: legacy five_hour/seven_day directly on the chunk
      if (d?.five_hour || d?.seven_day) {
        return this._parseUsageEndpoint(d);
      }
      // Fallback — estimate tokens from assistant text delta
      const text = d?.delta?.text || d?.completion || d?.text || '';
      if (text) {
        return { source: 'estimated', tokensDelta: AIR.estimator.estimate(text) };
      }
    }

    return null;
  },

  _parseUsageEndpoint(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const fiveHour = raw.five_hour;
    const sevenDay = raw.seven_day;
    if (!fiveHour && !sevenDay) return null;

    return {
      source: 'real',
      session: {
        utilization: this._clamp(fiveHour?.utilization ?? 0),
        resetsAt: fiveHour?.resets_at ? Date.parse(fiveHour.resets_at) : null,
        windowHours: 5
      },
      weekly: {
        utilization: this._clamp(sevenDay?.utilization ?? 0),
        resetsAt: sevenDay?.resets_at ? Date.parse(sevenDay.resets_at) : null,
        windowHours: 168
      }
    };
  },

  _parseMessageLimit(raw) {
    if (!raw?.windows) return null;
    const w5h = raw.windows['5h'];
    const w7d = raw.windows['7d'];
    return {
      source: 'real',
      session: {
        utilization: this._clamp((w5h?.utilization ?? 0) * 100),
        resetsAt: w5h?.resets_at ? w5h.resets_at * 1000 : null,
        windowHours: 5
      },
      weekly: {
        utilization: this._clamp((w7d?.utilization ?? 0) * 100),
        resetsAt: w7d?.resets_at ? w7d.resets_at * 1000 : null,
        windowHours: 168
      }
    };
  },

  _clamp(v) { return Math.max(0, Math.min(100, v)); }
};
