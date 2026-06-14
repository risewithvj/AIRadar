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
// main.js — AIRadar content script bootstrap
(() => {
  'use strict';
  const AIR = (globalThis.AIRadar = globalThis.AIRadar || {});
  if (AIR.__started) return;
  AIR.__started = true;

  if (!AIR.currentPlatform) return;

  const MARKER = 'AIRadar';
  let _bridgeReady = false;
  let _bridgeReadyPromise = null;
  const _pending = new Map();

  // ── Inject bridge into PAGE context ──────────────────────────────
  function injectBridge() {
    return new Promise((resolve) => {
      if (document.getElementById('airador-bridge')) { resolve(true); return; }
      const s = document.createElement('script');
      s.id = 'airador-bridge';
      s.src = chrome.runtime.getURL('injected/bridge.js');
      s.onload = () => { _bridgeReady = true; resolve(true); };
      s.onerror = () => resolve(false);
      (document.head || document.documentElement).appendChild(s);
    });
  }

  _bridgeReadyPromise = injectBridge();

  // ── Bridge request/response system ───────────────────────────────
  function makeId() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

  function bridgeRequest(kind, payload, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const requestId = makeId();
      const tid = setTimeout(() => {
        _pending.delete(requestId);
        reject(new Error(`Timeout: ${kind}`));
      }, timeoutMs);
      _pending.set(requestId, { resolve, reject, tid });
      window.postMessage({ air: MARKER, type: 'air:request', requestId, kind, payload }, window.location.origin);
    });
  }

  // Listen for bridge responses AND events
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    if (e.origin && e.origin !== window.location.origin) return;
    const d = e.data;
    if (!d || d.air !== MARKER) return;

    // Response to a pending request
    if (d.type === 'air:response') {
      const pending = _pending.get(d.requestId);
      if (!pending) return;
      _pending.delete(d.requestId);
      clearTimeout(pending.tid);
      if (d.ok) pending.resolve(d.payload);
      else pending.reject(new Error(d.error || 'Bridge error'));
      return;
    }

    // SSE event: message_limit fired during a stream
    if (d.type === 'air:message_limit') {
      handleMessageLimit(d.payload);
      return;
    }

    // Generation started — could refresh usage after a delay
    if (d.type === 'air:generation_start') {
      setTimeout(() => refreshClaudeUsage(), 3000);
      return;
    }

    // SPA navigation
    if (d.type === 'air:urlchange' || d.type === '__AIR_urlchange') {
      if (AIR.HUD?._applyTheme) AIR.HUD._applyTheme();
    }
  });

  window.addEventListener('air:urlchange', () => {
    if (AIR.HUD?._applyTheme) AIR.HUD._applyTheme();
    setTimeout(() => refreshClaudeUsage(), 500);
  });

  // ── Get orgId from cookie via bridge ─────────────────────────────
  let _orgId = null;
  async function getOrgId() {
    if (_orgId) return _orgId;
    try {
      await _bridgeReadyPromise;
      const res = await bridgeRequest('orgid', {}, 5000);
      _orgId = res?.orgId || null;
    } catch {}
    // Fallback: read directly if bridge fails (works in some contexts)
    if (!_orgId) {
      try {
        _orgId = document.cookie
          .split('; ')
          .find(r => r.startsWith('lastActiveOrg='))
          ?.split('=')[1] || null;
      } catch {}
    }
    return _orgId;
  }

  // ── Claude: actively fetch usage API ─────────────────────────────
  let _usageFetchInFlight = false;
  async function refreshClaudeUsage() {
    if (AIR.currentPlatform?.id !== 'claude') return;
    if (_usageFetchInFlight) return;
    _usageFetchInFlight = true;
    try {
      await _bridgeReadyPromise;
      const orgId = await getOrgId();
      if (!orgId) return;
      const raw = await bridgeRequest('usage', { orgId }, 15000);
      applyClaudeUsage(raw);
    } catch (e) {
      console.warn('[AIRadar] Usage fetch failed:', e.message);
    } finally {
      _usageFetchInFlight = false;
    }
  }

  function applyClaudeUsage(raw) {
    if (!raw) return;

    // Shape 1: { five_hour: { utilization, resets_at }, seven_day: {...} }
    const fiveHour = raw.five_hour;
    const sevenDay = raw.seven_day;

    if (!fiveHour && !sevenDay) return;

    const clamp = v => Math.max(0, Math.min(100, v ?? 0));

    const result = {
      source: 'real',
      session: fiveHour ? {
        utilization: clamp(fiveHour.utilization),
        resetsAt: fiveHour.resets_at ? Date.parse(fiveHour.resets_at) : null,
        windowHours: 5
      } : null,
      weekly: sevenDay ? {
        utilization: clamp(sevenDay.utilization),
        resetsAt: sevenDay.resets_at ? Date.parse(sevenDay.resets_at) : null,
        windowHours: 168
      } : null
    };

    persistAndUpdate(result);
  }

  // ── Handle SSE message_limit events ──────────────────────────────
  function handleMessageLimit(raw) {
    if (!raw) return;

    // Shape: { windows: { '5h': { utilization, resets_at }, '7d': {...} } }
    const w5h = raw.windows?.['5h'];
    const w7d = raw.windows?.['7d'];

    if (!w5h && !w7d) {
      // Maybe it's the usage endpoint shape directly
      applyClaudeUsage(raw);
      return;
    }

    const clamp = v => Math.max(0, Math.min(100, (v ?? 0) * 100));

    const result = {
      source: 'real',
      session: w5h ? {
        utilization: clamp(w5h.utilization),
        resetsAt: w5h.resets_at ? w5h.resets_at * 1000 : null,
        windowHours: 5
      } : null,
      weekly: w7d ? {
        utilization: clamp(w7d.utilization),
        resetsAt: w7d.resets_at ? w7d.resets_at * 1000 : null,
        windowHours: 168
      } : null
    };

    persistAndUpdate(result);
  }

  // ── Estimated platforms (Gemini, Grok, etc) ──────────────────────
  // For non-Claude platforms, we still intercept via the old passive bridge
  // messages since they don't have a usage API
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    if (e.origin && e.origin !== window.location.origin) return;
    const d = e.data;
    if (!d?.type?.startsWith('__AIR_')) return;
    const pid = AIR.currentPlatform?.id;
    if (pid === 'claude') return; // Claude handled above

    const handlers = {
      chatgpt:    AIR.chatgptHandler,
      gemini:     AIR.geminiHandler,
      copilot:    AIR.copilotHandler,
      grok:       AIR.grokHandler,
      perplexity: AIR.perplexityHandler,
      metaai:     AIR.metaaiHandler,
      deepseek:   AIR.deepseekHandler,
    };
    const handler = handlers[pid];
    let result = null;
    if (handler) {
      try { result = handler.handleBridgeMessage(d); } catch { result = null; }
    }
    // Universal fallback: estimate tokens from any assistant text in the stream.
    // Lets ChatGPT/Gemini/Grok/Perplexity/Meta/Copilot/DeepSeek show estimated
    // usage even though they don't expose a usage API like Claude does.
    if (!result && d.type === '__AIR_sse_chunk') {
      const txt = extractAssistantText(d.data);
      if (txt) {
        const est = (AIR.estimator && AIR.estimator.estimate) ? AIR.estimator.estimate(txt) : Math.ceil(txt.length / 4);
        if (est > 0) result = { source: 'estimated', tokensDelta: est };
      }
    }
    if (!result) return;
    persistAndUpdate(result);
  });

  // Pull assistant text out of the many provider-specific stream shapes.
  function extractAssistantText(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;
    const c = [
      data.delta?.text,
      data.choices?.[0]?.delta?.content,
      data.choices?.[0]?.message?.content,
      data.message?.content,
      data.candidates?.[0]?.content?.parts?.[0]?.text,
      data.completion, data.text, data.response, data.token
    ];
    for (const v of c) if (typeof v === 'string' && v) return v;
    return '';
  }

  // ── Persist state + update HUD ───────────────────────────────────
  async function persistAndUpdate(result) {
    const pid = AIR.currentPlatform?.id;
    if (!pid) return;

    const key = `airador_state_${pid}`;
    const saved = (await AIR.store.get(key)) || {};
    const merged = { ...saved, platformId: pid, lastUpdatedMs: Date.now() };

    if (result.session?.utilization != null) merged.sessionUtilization = result.session.utilization;
    if (result.session?.resetsAt    != null) merged.sessionResetMs     = result.session.resetsAt;
    if (result.weekly?.utilization  != null) merged.weeklyUtilization  = result.weekly.utilization;
    if (result.weekly?.resetsAt     != null) merged.weeklyResetMs      = result.weekly.resetsAt;
    if (result.tokensDelta)      { merged.sessionTokensUsed = (merged.sessionTokensUsed || 0) + result.tokensDelta; merged.tokensReal = true; }
    if (result.sessionTokensTotal != null) { merged.sessionTokensUsed = result.sessionTokensTotal; merged.tokensReal = true; }
    if (result.thinkingTokensDelta) merged.thinkingTokensUsed = (merged.thinkingTokensUsed || 0) + result.thinkingTokensDelta;
    if (result.queryDelta)       merged.queryCount = (merged.queryCount || 0) + result.queryDelta;
    if (result.queryModel)       merged.queryCount = result.dailyUsed ?? merged.queryCount;

    // When a platform gives us utilization% but no real token counts (e.g. Claude's
    // usage API), derive a live estimate and PERSIST it so the popup shows it too.
    // Recomputed each update so it tracks utilization; never overwrites real telemetry.
    if (!merged.tokensReal) {
      const SESSION_APPROX = 90000;     // ~tokens in a Claude 5h window
      const WEEKLY_APPROX  = 1260000;   // ~tokens in a 7d window
      if (merged.sessionUtilization > 0)
        merged.sessionTokensUsed = Math.round((merged.sessionUtilization / 100) * SESSION_APPROX);
      if (merged.weeklyUtilization > 0)
        merged.weeklyTokensUsed = Math.round((merged.weeklyUtilization / 100) * WEEKLY_APPROX);
      merged.tokensEstimated = true;
    }

    await AIR.store.set(key, merged);

    // Sync badge
    try {
      chrome.runtime.sendMessage({
        type: 'usage_update',
        platformId: pid,
        sessionUtil: merged.sessionUtilization ?? 0,
        sessionResetMs: merged.sessionResetMs ?? null
      });
    } catch {}

    // Update HUD state from merged
    if (AIR.HUD) {
      const s = AIR.HUD.state;
      if (merged.sessionUtilization != null) s.sessionUtil    = merged.sessionUtilization;
      if (merged.weeklyUtilization  != null) s.weeklyUtil     = merged.weeklyUtilization;
      if (merged.sessionResetMs     != null) s.sessionResetMs = merged.sessionResetMs;
      if (merged.weeklyResetMs      != null) s.weeklyResetMs  = merged.weeklyResetMs;
      if (merged.sessionTokensUsed  != null) s.sessionTokens  = merged.sessionTokensUsed;
      if (merged.weeklyTokensUsed   != null) s.weeklyTokens   = merged.weeklyTokensUsed;
      s.tokensEstimated = !!merged.tokensEstimated && !merged.tokensReal;

      // Derive sessionStartMs from resetMs so elapsed timer works
      if (merged.sessionResetMs && !s.sessionStartMs) {
        s.sessionStartMs = merged.sessionResetMs - (5 * 60 * 60 * 1000);
      }
      if (merged.weeklyResetMs && !s.weeklyStartMs) {
        s.weeklyStartMs = merged.weeklyResetMs - (7 * 24 * 60 * 60 * 1000);
      }

      AIR.HUD._renderAll();
    }

    // Update inline bar
    if (AIR.InlineBar?.update && AIR.HUD?.state) {
      AIR.InlineBar.update(AIR.HUD.state);
    }
  }

  // ── Init ─────────────────────────────────────────────────────────
  function init() {
    if (AIR.HUD) {
      AIR.HUD.init();
      AIR.InlineBar?.init(AIR.currentPlatform.id);
      restoreState();
    }
    // For Claude: fetch usage immediately on load
    if (AIR.currentPlatform?.id === 'claude') {
      _bridgeReadyPromise.then(() => {
        setTimeout(() => refreshClaudeUsage(), 800);
      });
    }
  }

  async function restoreState() {
    const key = `airador_state_${AIR.currentPlatform.id}`;
    const saved = await AIR.store.get(key);
    if (saved && AIR.HUD) {
      AIR.HUD.state.sessionUtil    = saved.sessionUtilization || 0;
      AIR.HUD.state.weeklyUtil     = saved.weeklyUtilization  || 0;
      AIR.HUD.state.sessionTokens  = saved.sessionTokensUsed  || 0;
      AIR.HUD.state.weeklyTokens   = saved.weeklyTokensUsed   || 0;
      AIR.HUD.state.tokensEstimated = !!saved.tokensEstimated && !saved.tokensReal;
      AIR.HUD.state.sessionResetMs = saved.sessionResetMs     || null;
      AIR.HUD.state.weeklyResetMs  = saved.weeklyResetMs      || null;
      AIR.HUD.state.queryCount     = saved.queryCount         || 0;
    }
    const budgetKey = `airador_budget_${AIR.currentPlatform.id}`;
    if (AIR.HUD) AIR.HUD.state.budgetTokens = await AIR.store.get(budgetKey);
    if (AIR.HUD) AIR.HUD._renderAll();
    if (AIR.InlineBar?.update && AIR.HUD?.state) AIR.InlineBar.update(AIR.HUD.state);
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
