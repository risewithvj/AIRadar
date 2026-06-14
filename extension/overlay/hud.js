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
// hud.js — AIRadar floating HUD (v2 — unified gauge, consistent buttons)
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.HUD = {
  el: null,
  pillEl: null,
  panelEl: null,
  isPanelOpen: false,
  dragOffset: { x: 0, y: 0 },
  _tickTimer: null,
  _domWatcher: null,
  _resizeHandler: null,
  _burnWindow: [],
  _prevTokens: undefined,
  _lastTokenMs: 0,

  state: {
    sessionUtil: 0,
    weeklyUtil: 0,
    sessionTokens: 0,
    weeklyTokens: 0,
    tokensEstimated: false,
    thinkingTokens: 0,
    sessionResetMs: null,
    weeklyResetMs: null,
    sessionStartMs: null,
    weeklyStartMs: null,
    burnRate: 0,
    queryCount: 0,
    queryLimit: 0,
    isQueryModel: false,
    dataSource: 'estimated',
    budgetTokens: null,
    platform: null
  },

  // ── SVG icons (stroke-based, inherit currentColor) ────────────
  _svg: {
    // One unified radar gauge that lives inside the pill: rings + sweep + core.
    gauge: `<svg class="air-gauge-svg" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="15" class="air-gauge-track" fill="none" stroke-width="3"/>
      <circle cx="18" cy="18" r="15" class="air-gauge-fill" fill="none" stroke-width="3"
        stroke-dasharray="94.25" stroke-dashoffset="94.25"
        stroke-linecap="round" transform="rotate(-90 18 18)"/>
      <g class="air-gauge-core">
        <circle cx="18" cy="18" r="2" fill="currentColor" opacity="0.85"/>
        <line class="air-sweep-arm" x1="18" y1="18" x2="18" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </g>
    </svg>`,

    logo: `<svg class="air-panel-logo" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.5"/>
      <circle cx="10" cy="10" r="4.5" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.5"/>
      <circle cx="10" cy="10" r="1.8" fill="currentColor"/>
      <line class="air-sweep-arm" x1="10" y1="10" x2="10" y2="2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,

    chevronUp: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,10 8,6 12,10"/></svg>`,
    chevronDown: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,6 8,10 12,6"/></svg>`,
    reset: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9"/><polyline points="12,1.5 12,4.5 9,4.5"/></svg>`,
    budget: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5L1.5 13.5h13L8 1.5z"/><line x1="8" y1="6" x2="8" y2="9.5"/><circle cx="8" cy="11.6" r="0.5" fill="currentColor" stroke="none"/></svg>`,
    external: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2.5H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V7"/><polyline points="10.5,2 14,2 14,5.5"/><line x1="14" y1="2" x2="7.5" y2="8.5"/></svg>`
  },

  // ── Init & build ──────────────────────────────────────────────
  init() {
    if (document.getElementById('airador-hud')) return;
    this._buildDOM();
    this._applyTheme();
    this._restorePosition();
    this._attachDrag();
    this._attachButtons();
    document.body.appendChild(this.el);

    if (this._domWatcher) this._domWatcher.disconnect();
    this._domWatcher = new MutationObserver(() => {
      if (!document.getElementById('airador-hud') && document.body) {
        document.body.appendChild(this.el);
        this._applyTheme();
      }
    });
    this._domWatcher.observe(document.body, { childList: true });

    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    this._resizeHandler = () => this._clampIntoView();
    window.addEventListener('resize', this._resizeHandler);

    this.isPanelOpen = false;
    this.pillEl.style.display = '';
    this.panelEl.classList.remove('visible');

    if (this._tickTimer) clearInterval(this._tickTimer);
    this._tickTimer = setInterval(() => this._tick(), 1000);
    this._renderAll();
  },

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.id = 'airador-hud';

    // ── Pill (collapsed) ──────────────────────────────────────
    this.pillEl = document.createElement('div');
    this.pillEl.id = 'airador-pill';
    this.pillEl.innerHTML = `
      <span class="air-pill-gauge">${this._svg.gauge}</span>
      <span class="air-pill-meta">
        <span class="air-pill-platform" id="air-pill-platform">–</span>
        <span class="air-pill-pct" id="air-pill-pct">0%</span>
      </span>
      <span class="air-pill-time" id="air-pill-time"></span>
      <button class="air-iconbtn air-pill-expand" id="air-pill-expand" type="button" aria-label="Expand AIRadar" title="Expand">${this._svg.chevronUp}</button>
    `;

    // ── Panel (expanded) ──────────────────────────────────────
    this.panelEl = document.createElement('div');
    this.panelEl.id = 'airador-panel';
    this.panelEl.innerHTML = `
      <div class="air-panel-header">
        <div class="air-panel-header-left">
          ${this._svg.logo}
          <span class="air-panel-title-text">AIRadar</span>
          <span class="air-platform-chip" id="air-platform-chip">–</span>
        </div>
        <div class="air-panel-header-right">
          <span class="air-live-dot" id="air-live-dot"></span>
          <button class="air-iconbtn" id="air-panel-collapse" type="button" aria-label="Collapse" title="Collapse">${this._svg.chevronDown}</button>
        </div>
      </div>

      <div class="air-panel-body">
        <div class="air-rings-row" id="air-rings-row">
          <div class="air-ring-card">
            <div class="air-ring-wrap">
              <svg class="air-ring-svg" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="28" fill="none" stroke-width="5" class="air-ring-track"/>
                <circle cx="36" cy="36" r="28" fill="none" stroke-width="5" class="air-ring-fill"
                  id="air-ring-session" stroke-dasharray="175.93" stroke-dashoffset="175.93"
                  stroke-linecap="round" transform="rotate(-90 36 36)"/>
              </svg>
              <div class="air-ring-center">
                <span class="air-ring-pct" id="air-ring-session-pct">0%</span>
              </div>
            </div>
            <span class="air-ring-label">Session</span>
          </div>

          <div class="air-ring-card">
            <div class="air-ring-wrap">
              <svg class="air-ring-svg" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="28" fill="none" stroke-width="5" class="air-ring-track"/>
                <circle cx="36" cy="36" r="28" fill="none" stroke-width="5" class="air-ring-fill"
                  id="air-ring-weekly" stroke-dasharray="175.93" stroke-dashoffset="175.93"
                  stroke-linecap="round" transform="rotate(-90 36 36)"/>
              </svg>
              <div class="air-ring-center">
                <span class="air-ring-pct" id="air-ring-weekly-pct">0%</span>
              </div>
            </div>
            <span class="air-ring-label">Weekly</span>
          </div>
        </div>

        <div class="air-query-display air-hidden" id="air-query-display">
          <div class="air-query-num"><span id="air-query-used">0</span> / <span id="air-query-limit">–</span></div>
          <div class="air-query-lbl">Queries used today</div>
        </div>

        <div class="air-timers-block">
          <div class="air-timer-row">
            <span class="air-timer-label">Session resets in</span>
            <div class="air-timer-right">
              <span class="air-timer-countdown" id="air-session-countdown">–</span>
              <span class="air-timer-elapsed" id="air-session-elapsed"></span>
            </div>
          </div>
          <div class="air-timer-row">
            <span class="air-timer-label">Weekly resets in</span>
            <div class="air-timer-right">
              <span class="air-timer-countdown" id="air-weekly-countdown">–</span>
              <span class="air-timer-elapsed" id="air-weekly-elapsed"></span>
            </div>
          </div>
        </div>

        <div class="air-stats-row">
          <div class="air-stat-cell">
            <span class="air-stat-num" id="air-stat-session">0</span>
            <span class="air-stat-lbl">Session tokens</span>
          </div>
          <div class="air-stat-cell">
            <span class="air-stat-num" id="air-stat-weekly">0</span>
            <span class="air-stat-lbl">Weekly tokens</span>
          </div>
        </div>

        <div class="air-think-row air-hidden" id="air-think-row">
          <span class="air-think-label">Thinking tokens</span>
          <span class="air-think-val" id="air-think-val">0</span>
        </div>

        <div class="air-burn-row">
          <span class="air-burn-dot" id="air-burn-dot"></span>
          <span class="air-burn-label">Live burn rate</span>
          <span class="air-burn-value"><span id="air-burn-val">0</span><span class="air-burn-unit">tk/min</span></span>
        </div>

        <div class="air-budget-bar" id="air-budget-bar">
          ${this._svg.budget.replace('width="13" height="13"', 'width="13" height="13" class="air-budget-icon"')}
          <span id="air-budget-msg">Budget limit approaching</span>
        </div>
      </div>

      <div class="air-panel-footer">
        <button class="air-btn" id="air-btn-reset" type="button">${this._svg.reset}<span>Reset</span></button>
        <button class="air-btn" id="air-btn-budget" type="button">${this._svg.budget}<span>Budget</span></button>
        <button class="air-btn" id="air-btn-popup" type="button">${this._svg.external}<span>All AIs</span></button>
      </div>
    `;

    this.el.appendChild(this.pillEl);
    this.el.appendChild(this.panelEl);
  },

  // ── Theme ─────────────────────────────────────────────────────
  _applyTheme() {
    const t = AIR.getTheme ? AIR.getTheme() : { primary:'#d97b45', track:'rgba(217,123,69,0.18)', text:'#faf5ef', glow:'rgba(217,123,69,0.3)', name:'AI' };
    if (!this.el) return;

    this.el.style.setProperty('--air-primary', t.primary);
    this.el.style.setProperty('--air-track', t.track || 'rgba(255,255,255,0.1)');
    this.el.style.setProperty('--air-glow', t.glow || 'rgba(0,0,0,0)');
    this.el.style.color = t.text || '#fff';

    const chip = this.el.querySelector('#air-platform-chip');
    if (chip) chip.textContent = t.name || '–';
    const pillPlat = this.el.querySelector('#air-pill-platform');
    if (pillPlat) pillPlat.textContent = t.name || '–';
  },

  // ── Drag ──────────────────────────────────────────────────────
  _attachDrag() {
    let _dragging = false, _moved = false, _sx = 0, _sy = 0;

    this.el.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      const onPill   = e.target.closest('#airador-pill');
      const onHeader = e.target.closest('.air-panel-header');
      if (!onPill && !onHeader) return;
      _dragging = true; _moved = false;
      _sx = e.clientX; _sy = e.clientY;
      const r = this.el.getBoundingClientRect();
      this.dragOffset.x = e.clientX - r.left;
      this.dragOffset.y = e.clientY - r.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!_dragging) return;
      if (Math.abs(e.clientX - _sx) > 3 || Math.abs(e.clientY - _sy) > 3) _moved = true;
      if (!_moved) return;
      const r = this.el.getBoundingClientRect();
      const x = Math.max(8, Math.min(window.innerWidth  - r.width  - 8, e.clientX - this.dragOffset.x));
      const y = Math.max(8, Math.min(window.innerHeight - r.height - 8, e.clientY - this.dragOffset.y));
      this.el.style.left = x + 'px';
      this.el.style.top  = y + 'px';
      this.el.style.right = 'auto';
      this.el.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!_dragging) return;
      if (_moved) this._savePosition();
      _dragging = false; _moved = false;
    });

    this.pillEl.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      this.openPanel();
    });
  },

  _savePosition() {
    const r = this.el.getBoundingClientRect();
    if (AIR.store) AIR.store.set(`air_pos_${AIR.currentPlatform?.id}`, { x: r.left, y: r.top });
  },

  async _restorePosition() {
    try {
      const pos = AIR.store ? await AIR.store.get(`air_pos_${AIR.currentPlatform?.id}`) : null;
      if (pos && pos.x != null) {
        const mx = Math.max(8, window.innerWidth  - 300);
        const my = Math.max(8, window.innerHeight - 80);
        this.el.style.left = Math.min(pos.x, mx) + 'px';
        this.el.style.top  = Math.min(pos.y, my) + 'px';
        this.el.style.right = 'auto';
        this.el.style.bottom = 'auto';
        return;
      }
    } catch {}
    this.el.style.right = '20px';
    this.el.style.bottom = '84px';
    this.el.style.left = 'auto';
    this.el.style.top = 'auto';
  },

  // Keep the whole widget inside the viewport (used on open + resize).
  _clampIntoView() {
    if (!this.el) return;
    const usingLeft = this.el.style.left && this.el.style.left !== 'auto';
    requestAnimationFrame(() => {
      const r = this.el.getBoundingClientRect();
      if (usingLeft) {
        let x = parseFloat(this.el.style.left) || r.left;
        let y = parseFloat(this.el.style.top)  || r.top;
        x = Math.max(8, Math.min(window.innerWidth  - r.width  - 8, x));
        y = Math.max(8, Math.min(window.innerHeight - r.height - 8, y));
        this.el.style.left = x + 'px';
        this.el.style.top  = y + 'px';
      } else if (r.right > window.innerWidth - 6 || r.bottom > window.innerHeight - 6) {
        // anchored bottom-right but overflowing (e.g. panel taller than offset)
        this.el.style.bottom = Math.max(8, window.innerHeight - r.height - 8 - (window.innerHeight - r.bottom)) + 'px';
      }
    });
  },

  // ── Buttons ───────────────────────────────────────────────────
  _attachButtons() {
    this.el.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      e.stopPropagation();
      const id = btn.id;
      if (id === 'air-pill-expand')    { this.openPanel();  return; }
      if (id === 'air-panel-collapse') { this.closePanel(); return; }
      if (id === 'air-btn-budget')     { this._showBudgetModal(); return; }
      if (id === 'air-btn-popup') {
        try { chrome.runtime.sendMessage({ type: 'open_popup' }); } catch {}
        return;
      }
      if (id === 'air-btn-reset') {
        this.state.sessionTokens  = 0;
        this.state.sessionStartMs = Date.now();
        this.state.burnRate       = 0;
        this._burnWindow          = [];
        this._prevTokens          = undefined;
        this._renderAll();
        return;
      }
    });
  },

  openPanel() {
    this.isPanelOpen = true;
    this.pillEl.style.display = 'none';
    this.panelEl.classList.add('visible');
    this._clampIntoView();
  },

  closePanel() {
    this.isPanelOpen = false;
    this.pillEl.style.display = '';
    this.panelEl.classList.remove('visible');
    this._clampIntoView();
  },

  // ── Budget modal ──────────────────────────────────────────────
  _showBudgetModal() {
    document.getElementById('airador-budget-modal')?.remove();
    const cur = this.state.budgetTokens || '';
    const t = AIR.getTheme ? AIR.getTheme() : { primary: '#d97b45' };
    const modal = document.createElement('div');
    modal.id = 'airador-budget-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';
    modal.innerHTML = `
      <div style="background:#16130f;border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:22px;width:290px;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
        <div style="font-size:15px;font-weight:600;color:#f4f1ec;margin-bottom:5px;">Set token budget</div>
        <div style="font-size:12px;color:rgba(244,241,236,0.45);margin-bottom:16px;line-height:1.5;">You'll be warned at 90% of this limit. Enter 0 to turn off.</div>
        <input id="airador-budget-input" type="number" min="0" placeholder="e.g. 50000" value="${cur}"
          style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#f4f1ec;font-size:14px;outline:none;margin-bottom:16px;font-family:inherit;"/>
        <div style="display:flex;gap:8px;">
          <button id="airador-budget-cancel" style="flex:1;height:38px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:rgba(244,241,236,0.6);cursor:pointer;font-size:13px;font-weight:500;font-family:inherit;">Cancel</button>
          <button id="airador-budget-save" style="flex:1;height:38px;border-radius:10px;border:none;background:${t.primary};color:#fff;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;">Save</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const input = modal.querySelector('#airador-budget-input');
    input.focus(); input.select();
    const close = () => modal.remove();
    modal.querySelector('#airador-budget-cancel').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    modal.querySelector('#airador-budget-save').addEventListener('click', () => {
      const n = parseInt(input.value, 10);
      this.state.budgetTokens = isNaN(n) || n <= 0 ? null : n;
      if (AIR.store) AIR.store.set(`air_budget_${AIR.currentPlatform?.id}`, this.state.budgetTokens);
      this._renderBudgetBar();
      close();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  modal.querySelector('#airador-budget-save').click();
      if (e.key === 'Escape') close();
    });
  },

  // ── State update (from main.js) ──────────────────────────────
  update(data) {
    if (!data) return;
    const s = this.state;
    const now = Date.now();

    if (data.source === 'real') {
      if (data.session) {
        if (data.session.utilization != null) s.sessionUtil    = data.session.utilization;
        if (data.session.resetsAt    != null) s.sessionResetMs = data.session.resetsAt;
        if (!s.sessionStartMs && data.session.resetsAt)
          s.sessionStartMs = data.session.resetsAt - (data.session.windowHours || 5) * 3600000;
      }
      if (data.weekly) {
        if (data.weekly.utilization != null) s.weeklyUtil    = data.weekly.utilization;
        if (data.weekly.resetsAt    != null) s.weeklyResetMs = data.weekly.resetsAt;
        if (!s.weeklyStartMs && data.weekly.resetsAt)
          s.weeklyStartMs = data.weekly.resetsAt - (data.weekly.windowHours || 168) * 3600000;
      }
      s.dataSource = 'real';
    }

    if (data.tokensDelta != null) {
      s.sessionTokens += data.tokensDelta;
      s.weeklyTokens  += data.tokensDelta;
      this._addBurnSample(data.tokensDelta);
    }
    if (data.sessionTokensTotal != null) s.sessionTokens = data.sessionTokensTotal;
    if (data.thinkingTokensDelta != null) s.thinkingTokens += data.thinkingTokensDelta;
    if (data.queryDelta != null) s.queryCount += data.queryDelta;
    if (data.queryModel) {
      s.isQueryModel = true;
      s.queryCount   = data.dailyUsed  ?? s.queryCount;
      s.queryLimit   = data.dailyLimit ?? s.queryLimit;
    }
    if (!s.sessionStartMs) s.sessionStartMs = now;

    this._renderAll();
    if (AIR.InlineBar?.update) AIR.InlineBar.update(s);
  },

  _addBurnSample(delta) {
    this._burnWindow.push({ ms: Date.now(), tokens: delta });
    this._lastTokenMs = Date.now();
  },

  // ── 1s tick ───────────────────────────────────────────────────
  _tick() {
    const now = Date.now();
    const s   = this.state;

    if (s.sessionTokens > 0 && this._prevTokens !== undefined && s.sessionTokens > this._prevTokens) {
      this._addBurnSample(s.sessionTokens - this._prevTokens);
    }
    this._prevTokens = s.sessionTokens;

    this._burnWindow = this._burnWindow.filter(e => now - e.ms < 120000);
    if (this._burnWindow.length > 1) {
      const total = this._burnWindow.reduce((a, e) => a + e.tokens, 0);
      const span  = now - this._burnWindow[0].ms;
      s.burnRate  = Math.round((total / Math.max(1, span)) * 60000);
    } else if (now - this._lastTokenMs > 300000) {
      s.burnRate = 0;
    }

    this._renderTimers();
    this._renderPill();
    this._renderBurnRow();
  },

  // ── Render ────────────────────────────────────────────────────
  _renderAll() {
    this._renderRings();
    this._renderTimers();
    this._renderStats();
    this._renderPill();
    this._renderBurnRow();
    this._renderThinking();
    this._renderBudgetBar();
    this._renderQueryMode();
    this._applyTheme();
  },

  _renderRings() {
    const CIRC = 175.93;
    this._setRing('air-ring-session', 'air-ring-session-pct', this.state.sessionUtil, CIRC);
    this._setRing('air-ring-weekly',  'air-ring-weekly-pct',  this.state.weeklyUtil,  CIRC);
  },

  _setRing(ringId, pctId, util, circ) {
    const ring = this.el?.querySelector('#' + ringId);
    const pct  = this.el?.querySelector('#' + pctId);
    if (!ring || !pct) return;
    const clamped = Math.max(0, Math.min(100, util));
    ring.style.strokeDashoffset = (circ * (1 - clamped / 100)).toFixed(2);
    const t = AIR.getTheme ? AIR.getTheme() : { primary: '#d97b45' };
    ring.style.stroke = clamped >= 85 ? '#ef4444' : t.primary;
    pct.textContent   = Math.round(clamped) + '%';
    pct.style.color   = clamped >= 85 ? '#f87171' : '';
  },

  _renderTimers() {
    const s   = this.state;
    const now = Date.now();
    this._setText('air-session-countdown', s.sessionResetMs ? this._fmtCountdown(s.sessionResetMs - now) : '–');
    this._setText('air-weekly-countdown',  s.weeklyResetMs  ? this._fmtCountdown(s.weeklyResetMs  - now) : '–');
    this._setText('air-session-elapsed',   s.sessionStartMs ? 'elapsed ' + this._fmtElapsed(now - s.sessionStartMs) : '');
    this._setText('air-weekly-elapsed',    s.weeklyStartMs  ? 'elapsed ' + this._fmtElapsed(now - s.weeklyStartMs)  : '');
    this._setText('air-pill-time', s.sessionResetMs ? this._fmtCountdown(s.sessionResetMs - now) : '');
  },

  _renderStats() {
    const s = this.state;
    const pre = s.tokensEstimated ? '~' : '';
    this._setText('air-stat-session', pre + this._fmtTokens(s.sessionTokens));
    this._setText('air-stat-weekly',  pre + this._fmtTokens(s.weeklyTokens));
  },

  _renderPill() {
    const s    = this.state;
    const CIRC = 94.25;
    const fill = this.el?.querySelector('.air-gauge-fill');
    const t = AIR.getTheme ? AIR.getTheme() : { primary: '#d97b45' };
    if (fill) {
      fill.style.strokeDashoffset = (CIRC * (1 - Math.min(100, s.sessionUtil) / 100)).toFixed(2);
      fill.style.stroke = s.sessionUtil >= 85 ? '#ef4444' : t.primary;
    }
    const pct = this.el?.querySelector('#air-pill-pct');
    if (pct) {
      pct.textContent = Math.round(s.sessionUtil) + '%';
      pct.style.color = s.sessionUtil >= 85 ? '#f87171' : '';
    }
  },

  _renderBurnRow() {
    this._setText('air-burn-val', this.state.burnRate || 0);
    const dot = this.el?.querySelector('#air-burn-dot');
    if (dot) dot.classList.toggle('air-burn-idle', !this.state.burnRate);
  },

  _renderThinking() {
    const row = this.el?.querySelector('#air-think-row');
    if (!row) return;
    const show = (this.state.thinkingTokens || 0) > 0;
    row.classList.toggle('air-hidden', !show);
    if (show) this._setText('air-think-val', this._fmtTokens(this.state.thinkingTokens));
  },

  _renderQueryMode() {
    const rings = this.el?.querySelector('#air-rings-row');
    const qdisp = this.el?.querySelector('#air-query-display');
    if (!rings || !qdisp) return;
    const isQ = this.state.isQueryModel;
    rings.classList.toggle('air-hidden', isQ);
    qdisp.classList.toggle('air-hidden', !isQ);
    if (isQ) {
      this._setText('air-query-used',  this.state.queryCount);
      this._setText('air-query-limit', this.state.queryLimit || '∞');
    }
  },

  _renderBudgetBar() {
    const bar = this.el?.querySelector('#air-budget-bar');
    const msg = this.el?.querySelector('#air-budget-msg');
    if (!bar) return;
    const s = this.state;
    if (s.budgetTokens && s.sessionTokens >= s.budgetTokens * 0.9) {
      bar.classList.add('warn');
      const pct = Math.round((s.sessionTokens / s.budgetTokens) * 100);
      if (msg) msg.textContent = `${pct}% of ${this._fmtTokens(s.budgetTokens)} budget used`;
    } else {
      bar.classList.remove('warn');
    }
  },

  // ── Helpers ───────────────────────────────────────────────────
  _setText(id, val) {
    const el = this.el?.querySelector('#' + id);
    if (el) el.textContent = String(val ?? '');
  },

  _fmtTokens(n) {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
    return String(Math.round(n));
  },

  _fmtCountdown(ms) {
    if (ms <= 0) return '0m';
    const s   = Math.floor(ms / 1000);
    const d   = Math.floor(s / 86400);
    const h   = Math.floor((s % 86400) / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  },

  _fmtElapsed(ms) {
    if (ms <= 0) return '0m';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
};
