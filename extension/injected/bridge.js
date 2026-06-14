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
// bridge.js — injected into PAGE context (not extension context)
// Modelled directly on Claude Counter's bridge approach.
(() => {
  'use strict';
  if (window.__AIRadarBridgeLoaded) return;
  window.__AIRadarBridgeLoaded = true;

  const MARKER = 'AIRadar';
  const ORIGIN = window.location.origin;

  // Hosts where AIRadar listens for usage signals.
  const AI_HOSTS = [
    'claude.ai', 'chatgpt.com', 'gemini.google.com', 'copilot.microsoft.com',
    'grok.com', 'x.com', 'perplexity.ai', 'meta.ai', 'deepseek.com'
  ];
  function isSupportedAIOrigin() {
    try { return AI_HOSTS.some(h => location.hostname.endsWith(h)); } catch { return false; }
  }

  // ── CRITICAL: capture originalFetch BEFORE any framework wraps it ─
  const originalFetch = window.fetch;

  // ── Helper: post event to content script (same-origin only) ──────
  function post(type, payload) {
    window.postMessage({ air: MARKER, type, payload }, ORIGIN);
  }

  function postResponse(requestId, ok, payload, error) {
    window.postMessage({ air: MARKER, type: 'air:response', requestId, ok, payload, error }, ORIGIN);
  }

  // ── Wrap fetch to intercept SSE streams ──────────────────────────
  window.fetch = async function (...args) {
    const url = toAbsoluteUrl(args[0]);
    const opts = args[1] || {};

    // Detect generation start
    if (url && opts.method === 'POST' &&
        (url.includes('/completion') || url.includes('/retry_completion'))) {
      post('air:generation_start', {});
    }

    const response = await originalFetch.apply(window, args);

    // Tap streaming responses on supported AI origins to estimate usage.
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('event-stream') && isSupportedAIOrigin()) {
      handleSSE(response.clone(), url);
    }

    return response;
  };

  // ── SSE parser: look for message_limit events ────────────────────
  async function handleSSE(response, url) {
    try {
      const reader = response.body?.getReader?.();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r\n|\r|\n/);
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          try {
            const json = JSON.parse(raw);
            // Claude SSE: { type: 'message_limit', message_limit: { windows: {...} } }
            if (json?.type === 'message_limit' && json.message_limit) {
              post('air:message_limit', json.message_limit);
            }
            // Generic stream chunk for non-Claude platforms (token estimation).
            if (!location.hostname.endsWith('claude.ai')) {
              post('__AIR_sse_chunk', { url, data: json });
            }
          } catch {
            // Non-JSON data line (e.g. OpenAI "[DONE]") — emit raw text for estimation.
            if (!location.hostname.endsWith('claude.ai') && raw && raw !== '[DONE]') {
              post('__AIR_sse_chunk', { url, data: { text: raw } });
            }
          }
        }
      }
    } catch {}
  }

  // ── History patching for SPA navigation ─────────────────────────
  const origPush    = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);
  history.pushState = function (...args) {
    const r = origPush(...args);
    window.dispatchEvent(new CustomEvent('air:urlchange'));
    return r;
  };
  history.replaceState = function (...args) {
    const r = origReplace(...args);
    window.dispatchEvent(new CustomEvent('air:urlchange'));
    return r;
  };

  // ── Respond to content script requests ──────────────────────────
  // Content script sends air:request with kind = 'usage' | 'orgid'
  // Bridge fetches with credentials and posts the result back.
  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (event.origin && event.origin !== ORIGIN) return;
    const data = event.data;
    if (!data || data.air !== MARKER || data.type !== 'air:request') return;

    const { requestId, kind, payload } = data;
    try {
      if (kind === 'usage') {
        const orgId = payload?.orgId;
        if (!orgId) throw new Error('Missing orgId');
        const res = await originalFetch(
          `https://claude.ai/api/organizations/${orgId}/usage`,
          { method: 'GET', credentials: 'include' }
        );
        const json = await res.json();
        postResponse(requestId, true, json, null);
        return;
      }

      if (kind === 'orgid') {
        // Read lastActiveOrg cookie from page context
        const cookie = document.cookie
          .split('; ')
          .find(r => r.startsWith('lastActiveOrg='))
          ?.split('=')[1] || null;
        postResponse(requestId, true, { orgId: cookie }, null);
        return;
      }

      throw new Error(`Unknown kind: ${kind}`);
    } catch (e) {
      postResponse(requestId, false, null, e?.message || String(e));
    }
  });

  // ── Utility ───────────────────────────────────────────────────────
  function toAbsoluteUrl(input) {
    if (typeof input === 'string') {
      if (input.startsWith('/')) return `https://${location.hostname}${input}`;
      return input;
    }
    if (input instanceof URL) return input.href;
    if (input instanceof Request) return input.url;
    return '';
  }
})();
