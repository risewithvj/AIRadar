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
// inlinebar.js — AIRadar usage strip injected below the composer toolbar (v2 redesign)
// Premium, theme-aware (auto light/dark), matched to the HUD radar aesthetic.
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.InlineBar = {
  el: null,
  _tickTimer: null,
  _platformId: null,
  _modeTick: 0,

  _sessionResetMs: null,
  _weeklyResetMs: null,
  _sessionWindowStartMs: null,
  _weeklyWindowStartMs: null,

  // DOM refs
  _sessionPct: null, _weeklyPct: null,
  _sessionFill: null, _weeklyFill: null,
  _sessionMarker: null, _weeklyMarker: null,
  _sessionReset: null, _weeklyReset: null,
  _sessionResetT: null, _weeklyResetT: null,
  _sessionGroup: null, _weeklyGroup: null, _sep: null,

  ANCHOR: {
    claude:     '[data-testid="model-selector-dropdown"]',
    chatgpt:    '[data-testid="send-button"]',
    gemini:     'rich-textarea',
    copilot:    '#sydneyInputContainer',
    grok:       'div[contenteditable="true"]',
    perplexity: 'textarea[placeholder]',
    metaai:     '[aria-label="Message Meta AI"]',
    deepseek:   '#chat-input',
  },

  _RESET_SVG: `<svg class="airbar-reset-ico" width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 6A4.5 4.5 0 1 1 9 2.6"/><polyline points="9,0.5 9,3 6.6,3"/></svg>`,
  _BRAND_SVG: `<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5"/><circle cx="10" cy="10" r="4.5" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.5"/><circle cx="10" cy="10" r="1.8" fill="currentColor"/><line class="airbar-sweep" x1="10" y1="10" x2="10" y2="2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  init(platformId) {
    if (this.el && document.contains(this.el)) return;
    this._platformId = platformId;
    this._build();
    this._inject();
    if (this._tickTimer) clearInterval(this._tickTimer);
    this._tickTimer = setInterval(() => this._tick(), 1000);
  },

  _build() {
    const el = document.createElement('div');
    el.id = 'airador-inline-bar';
    el.dataset.mode = 'dark';
    el.innerHTML = `
      <div class="airbar-inner">
        <span class="airbar-brand" aria-hidden="true">${this._BRAND_SVG}</span>
        <div class="airbar-metric" id="airbar-session-group">
          <span class="airbar-label">Session</span>
          <span class="airbar-pct" id="airbar-session-pct">0%</span>
          <div class="airbar-track" id="airbar-session-track">
            <div class="airbar-fill" id="airbar-session-fill"></div>
            <div class="airbar-marker airbar-hidden" id="airbar-session-marker"></div>
          </div>
          <span class="airbar-reset" id="airbar-session-reset" title="Session resets">
            ${this._RESET_SVG}<span class="airbar-reset-t">–</span>
          </span>
        </div>
        <span class="airbar-sep" id="airbar-sep"></span>
        <div class="airbar-metric" id="airbar-weekly-group">
          <span class="airbar-label">Weekly</span>
          <span class="airbar-pct" id="airbar-weekly-pct">0%</span>
          <div class="airbar-track" id="airbar-weekly-track">
            <div class="airbar-fill" id="airbar-weekly-fill"></div>
            <div class="airbar-marker airbar-hidden" id="airbar-weekly-marker"></div>
          </div>
          <span class="airbar-reset" id="airbar-weekly-reset" title="Weekly resets">
            ${this._RESET_SVG}<span class="airbar-reset-t">–</span>
          </span>
        </div>
      </div>`;
    this.el = el;
    const q = s => el.querySelector(s);
    this._sessionPct   = q('#airbar-session-pct');
    this._weeklyPct    = q('#airbar-weekly-pct');
    this._sessionFill  = q('#airbar-session-fill');
    this._weeklyFill   = q('#airbar-weekly-fill');
    this._sessionMarker= q('#airbar-session-marker');
    this._weeklyMarker = q('#airbar-weekly-marker');
    this._sessionReset = q('#airbar-session-reset');
    this._weeklyReset  = q('#airbar-weekly-reset');
    this._sessionResetT= q('#airbar-session-reset .airbar-reset-t');
    this._weeklyResetT = q('#airbar-weekly-reset .airbar-reset-t');
    this._sessionGroup = q('#airbar-session-group');
    this._weeklyGroup  = q('#airbar-weekly-group');
    this._sep          = q('#airbar-sep');
  },

  _findToolbarRow(anchorEl) {
    let cur = anchorEl;
    while (cur && cur !== document.body) {
      cur = cur.parentElement;
      if (!cur) break;
      const style = window.getComputedStyle(cur);
      if (style.display === 'flex' && style.flexDirection === 'row') {
        if (cur.querySelectorAll('button').length > 0) return cur;
      }
    }
    return anchorEl?.parentElement?.parentElement?.parentElement || null;
  },

  _inject() {
    if (document.getElementById('airador-inline-bar')) return;
    const sel = this.ANCHOR[this._platformId];
    if (!sel) return;

    const tryAttach = () => {
      const anchor = document.querySelector(sel);
      if (!anchor) return false;
      if (document.getElementById('airador-inline-bar')) return true;
      const toolbarRow = this._findToolbarRow(anchor);
      if (!toolbarRow || !toolbarRow.parentNode) return false;
      toolbarRow.after(this.el);
      this._applyAccent();
      this._detectMode();
      return true;
    };

    if (!tryAttach()) {
      const obs = new MutationObserver(() => { if (tryAttach()) obs.disconnect(); });
      obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }
  },

  _applyAccent() {
    if (!this.el) return;
    const accent = (AIR.getTheme && AIR.getTheme()?.primary) || '#888';
    this.el.style.setProperty('--airbar-accent', accent);
  },

  // Auto light/dark by sampling the surrounding background luminance.
  _detectMode() {
    if (!this.el) return 'dark';
    let mode = 'dark';
    try {
      let node = this.el.parentElement || document.body;
      let bg = null;
      for (let i = 0; node && node !== document.documentElement && i < 12; i++) {
        const c = getComputedStyle(node).backgroundColor;
        if (c && c !== 'transparent' && !/rgba?\([^)]*,\s*0\s*\)$/.test(c)) { bg = c; break; }
        node = node.parentElement;
      }
      if (!bg) bg = getComputedStyle(document.body).backgroundColor;
      const m = bg && bg.match(/[\d.]+/g);
      if (m && m.length >= 3) {
        const [r, g, b] = m.map(Number);
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        mode = lum > 0.55 ? 'light' : 'dark';
      } else if (window.matchMedia) {
        mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch {}
    this.el.dataset.mode = mode;
    return mode;
  },

  update(state) {
    if (!state || !this.el) return;
    this._applyAccent();
    this._detectMode();
    const accent = (AIR.getTheme && AIR.getTheme()?.primary) || '#888';

    const sUtil = Math.max(0, Math.min(100, state.sessionUtil ?? 0));
    const wUtil = Math.max(0, Math.min(100, state.weeklyUtil  ?? 0));
    const sReset = state.sessionResetMs || null;
    const wReset = state.weeklyResetMs  || null;

    this._sessionResetMs = sReset;
    this._weeklyResetMs  = wReset;
    this._sessionWindowStartMs = sReset ? sReset - 5 * 60 * 60 * 1000   : null;
    this._weeklyWindowStartMs  = wReset ? wReset - 7 * 24 * 60 * 60 * 1000 : null;

    this._setMetric(this._sessionPct, this._sessionFill, sUtil, accent);
    this._setMetric(this._weeklyPct,  this._weeklyFill,  wUtil, accent);
    this._setReset(this._sessionResetT, this._sessionReset, sReset, 'Session');
    this._setReset(this._weeklyResetT,  this._weeklyReset,  wReset, 'Weekly');

    const hasWeekly = wUtil > 0 || wReset;
    if (this._weeklyGroup) this._weeklyGroup.style.display = hasWeekly ? '' : 'none';
    if (this._sep)         this._sep.style.display         = hasWeekly ? '' : 'none';

    this._updateMarkers();
    this.el.classList.remove('airbar-hidden');
  },

  _setMetric(pctEl, fillEl, util, accent) {
    const hot = util >= 90;
    if (pctEl) {
      pctEl.textContent = (Math.round(util * 10) / 10) + '%';
      pctEl.classList.toggle('airbar-hot', hot);
    }
    if (fillEl) {
      fillEl.style.width = util + '%';
      const color = hot ? '#ef4444' : accent;
      fillEl.style.background = color;
      fillEl.style.boxShadow = `0 0 8px -1px ${color}`;
    }
  },

  _setReset(textEl, wrapEl, resetMs, which) {
    if (!textEl) return;
    if (resetMs) {
      const t = this._fmt(resetMs - Date.now());
      textEl.textContent = t;
      if (wrapEl) { wrapEl.style.display = ''; wrapEl.title = `${which} resets in ${t}`; }
    } else if (wrapEl) {
      wrapEl.style.display = 'none';
    }
  },

  _updateMarkers() {
    const now = Date.now();
    const setMarker = (marker, startMs, resetMs) => {
      if (!marker) return;
      if (startMs && resetMs) {
        const total = resetMs - startMs;
        const elapsed = Math.max(0, Math.min(total, now - startMs));
        const pct = total > 0 ? (elapsed / total) * 100 : 0;
        marker.style.left = Math.max(0, Math.min(100, pct)) + '%';
        marker.classList.remove('airbar-hidden');
      } else {
        marker.classList.add('airbar-hidden');
      }
    };
    setMarker(this._sessionMarker, this._sessionWindowStartMs, this._sessionResetMs);
    setMarker(this._weeklyMarker,  this._weeklyWindowStartMs,  this._weeklyResetMs);
  },

  _tick() {
    if (this.el && !document.contains(this.el)) { this._inject(); return; }
    if (this._sessionResetMs && this._sessionResetT)
      this._setReset(this._sessionResetT, this._sessionReset, this._sessionResetMs, 'Session');
    if (this._weeklyResetMs && this._weeklyResetT)
      this._setReset(this._weeklyResetT, this._weeklyReset, this._weeklyResetMs, 'Weekly');
    if ((this._modeTick = (this._modeTick + 1) % 4) === 0) this._detectMode();
    this._updateMarkers();
  },

  _fmt(ms) {
    if (!ms || ms <= 0) return '0m';
    const totalMin = Math.round(ms / 60000);
    if (totalMin < 60) return `${totalMin}m`;
    const h = Math.floor(totalMin / 60), m = totalMin % 60;
    if (h < 24) return `${h}h ${m}m`;
    const d = Math.floor(h / 24), rh = h % 24;
    return `${d}d ${rh}h`;
  }
};
