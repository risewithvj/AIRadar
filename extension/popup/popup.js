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
// popup.js
const PLATFORM_MAP = [
  { id: 'claude',     name: 'Claude',     color: '#D97B45', domain: 'claude.ai' },
  { id: 'chatgpt',    name: 'ChatGPT',    color: '#10A37F', domain: 'chatgpt.com' },
  { id: 'gemini',     name: 'Gemini',     color: '#4285F4', domain: 'gemini.google.com' },
  { id: 'copilot',    name: 'Copilot',    color: '#0078D4', domain: 'copilot.microsoft.com' },
  { id: 'grok',       name: 'Grok',       color: '#1D9BF0', domain: 'grok.com' },
  { id: 'perplexity', name: 'Perplexity', color: '#6366F1', domain: 'perplexity.ai' },
  { id: 'metaai',     name: 'Meta AI',    color: '#0866FF', domain: 'meta.ai' },
  { id: 'deepseek',   name: 'DeepSeek',   color: '#3B82F6', domain: 'chat.deepseek.com' },
];

function fmtTokens(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function fmtCountdown(ms) {
  if (!ms) return '–';
  const diff = ms - Date.now();
  if (diff <= 0) return 'now';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h/24)}d ${h%24}h`;
  if (h > 0)   return `${h}h ${m}m`;
  return `${m}m`;
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Works whether tabs.query uses callbacks (Chromium) or returns a promise (Gecko)
function queryActiveTab() {
  return new Promise((resolve) => {
    try {
      const res = chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs && tabs[0]));
      if (res && typeof res.then === 'function') res.then(t => resolve(t && t[0])).catch(() => resolve(null));
    } catch { resolve(null); }
  });
}

// ── View switching ────────────────────────────────────────────────
function showView(id) {
  document.getElementById('view-main').style.display    = id === 'main'     ? '' : 'none';
  document.getElementById('view-settings').style.display = id === 'settings' ? '' : 'none';
}

document.getElementById('popup-settings-btn')?.addEventListener('click', () => showView('settings'));
document.getElementById('popup-back-btn')?.addEventListener('click',     () => showView('main'));

const clearFn = () => {
  if (confirm('Clear all AIRadar data?')) {
    chrome.storage.local.clear(() => render());
  }
};
document.getElementById('popup-clear-all')?.addEventListener('click', clearFn);
document.getElementById('popup-clear-settings')?.addEventListener('click', clearFn);

// ── Main render ───────────────────────────────────────────────────
async function render() {
  const container = document.getElementById('popup-platforms');
  const chipEl = document.getElementById('popup-chip');
  const liveEl = document.getElementById('popup-live');
  const root   = document.querySelector('.popup-root');

  let tab = null;
  try {
    tab = await queryActiveTab();
  } catch {}
  const url = tab?.url || '';

  let platform = PLATFORM_MAP.find(p => url.includes(p.domain));
  if (!platform && url.includes('x.com') && url.includes('/grok')) {
    platform = PLATFORM_MAP.find(p => p.id === 'grok');
  }

  if (!platform) {
    if (chipEl) chipEl.hidden = true;
    if (liveEl) liveEl.hidden = true;
    if (root) root.style.removeProperty('--popup-accent');
    container.innerHTML = `
      <div class="popup-empty">
        <svg class="popup-empty-icon" width="40" height="40" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.3"/>
          <circle cx="10" cy="10" r="5" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.3"/>
          <circle cx="10" cy="10" r="1.8" fill="currentColor"/>
          <line x1="10" y1="10" x2="10" y2="2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        <div class="popup-empty-title">No AI chat detected</div>
        <div class="popup-empty-sub">Open one of these to see live stats:</div>
        <div class="popup-supported-list">
          ${PLATFORM_MAP.map(p =>
            `<span class="popup-supported-chip" style="border-color:${p.color}33;color:${p.color}">
              ${escHtml(p.name)}
            </span>`
          ).join('')}
        </div>
      </div>
    `;
    return;
  }

  const key = `airador_state_${platform.id}`;
  const state = await new Promise(resolve =>
    chrome.storage.local.get(key, r => resolve(r[key] || null))
  );

  const util   = state?.sessionUtilization ?? 0;
  const wUtil  = state?.weeklyUtilization  ?? 0;
  const tokens = state?.sessionTokensUsed  ?? 0;
  const wTok   = state?.weeklyTokensUsed   ?? 0;
  const estim  = state?.tokensEstimated && !state?.tokensReal;
  const tpre   = estim ? '~' : '';
  const reset  = state?.sessionResetMs;
  const wReset = state?.weeklyResetMs;
  const query  = state?.queryCount ?? 0;
  const isQuery = platform.id === 'perplexity';

  const CIRC = 175.93;
  const sOff = (CIRC * (1 - Math.min(100, util)  / 100)).toFixed(2);
  const wOff = (CIRC * (1 - Math.min(100, wUtil) / 100)).toFixed(2);
  const col  = platform.color;

  // Header chip + live dot + accent (mirrors the HUD header)
  if (root)   root.style.setProperty('--popup-accent', col);
  if (chipEl) { chipEl.hidden = false; chipEl.textContent = platform.name; }
  if (liveEl) liveEl.hidden = false;

  // Match the HUD: ring turns red and the centered % turns red at >=85%.
  const hot  = util  >= 85, wHot = wUtil >= 85;
  const sRingCol = hot  ? '#ef4444' : col;
  const wRingCol = wHot ? '#ef4444' : col;
  const sPctCol  = hot  ? '#f87171' : '#ffffff';
  const wPctCol  = wHot ? '#f87171' : '#ffffff';

  const ringCard = (ringCol, off, pctCol, pct, label) => `
    <div class="popup-ring-card">
      <div class="popup-ring-wrap">
        <svg viewBox="0 0 72 72" class="popup-ring-svg">
          <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="5"/>
          <circle cx="36" cy="36" r="28" fill="none" stroke="${ringCol}" stroke-width="5"
            stroke-dasharray="${CIRC}" stroke-dashoffset="${off}"
            stroke-linecap="round" transform="rotate(-90 36 36)"/>
        </svg>
        <div class="popup-ring-center"><span class="popup-ring-pct" style="color:${pctCol}">${pct}%</span></div>
      </div>
      <span class="popup-ring-label">${label}</span>
    </div>`;

  container.innerHTML = `
    <div class="popup-single-platform">
      ${isQuery ? `
        <div class="popup-query-card">
          <span class="popup-query-num">${query}</span>
          <span class="popup-query-lbl">queries used today</span>
        </div>
      ` : `
        <div class="popup-rings-row">
          ${ringCard(sRingCol, sOff, sPctCol, Math.round(util),  'Session')}
          ${ringCard(wRingCol, wOff, wPctCol, Math.round(wUtil), 'Weekly')}
        </div>

        <div class="popup-stat-grid">
          <div class="popup-stat">
            <div class="popup-stat-val">${tpre}${fmtTokens(tokens)}</div>
            <div class="popup-stat-lbl">Session tokens</div>
          </div>
          <div class="popup-stat">
            <div class="popup-stat-val">${tpre}${fmtTokens(wTok)}</div>
            <div class="popup-stat-lbl">Weekly tokens</div>
          </div>
        </div>
      `}

      <div class="popup-timers">
        <div class="popup-timer-row">
          <span class="popup-timer-lbl">Session resets in</span>
          <span class="popup-timer-val">${fmtCountdown(reset)}</span>
        </div>
        <div class="popup-timer-row">
          <span class="popup-timer-lbl">Weekly resets in</span>
          <span class="popup-timer-val">${fmtCountdown(wReset)}</span>
        </div>
      </div>
    </div>
  `;
}

// Auto-refresh popup every 5s so timers update
render();
setInterval(render, 5000);
