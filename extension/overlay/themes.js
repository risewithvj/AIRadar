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
// themes.js
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.THEMES = {
  claude: {
    primary:    '#D97B45',
    secondary:  '#F0A875',
    bg:         'rgba(20, 14, 8, 0.92)',
    track:      'rgba(217, 123, 69, 0.2)',
    text:       '#FAF5EF',
    textMuted:  'rgba(250, 245, 239, 0.55)',
    glow:       'rgba(217, 123, 69, 0.35)',
    name:       'Claude'
  },
  chatgpt: {
    primary:    '#10A37F',
    secondary:  '#1FC8A0',
    bg:         'rgba(8, 20, 16, 0.92)',
    track:      'rgba(16, 163, 127, 0.2)',
    text:       '#F0FAF7',
    textMuted:  'rgba(240, 250, 247, 0.55)',
    glow:       'rgba(16, 163, 127, 0.35)',
    name:       'ChatGPT'
  },
  gemini: {
    primary:    '#4285F4',
    secondary:  '#669DF6',
    bg:         'rgba(8, 12, 24, 0.92)',
    track:      'rgba(66, 133, 244, 0.2)',
    text:       '#EEF3FE',
    textMuted:  'rgba(238, 243, 254, 0.55)',
    glow:       'rgba(66, 133, 244, 0.35)',
    name:       'Gemini'
  },
  copilot: {
    primary:    '#0078D4',
    secondary:  '#2B88D8',
    bg:         'rgba(4, 12, 24, 0.92)',
    track:      'rgba(0, 120, 212, 0.2)',
    text:       '#EBF3FB',
    textMuted:  'rgba(235, 243, 251, 0.55)',
    glow:       'rgba(0, 120, 212, 0.35)',
    name:       'Copilot'
  },
  grok: {
    primary:    '#1D9BF0',
    secondary:  '#4DB0F4',
    bg:         'rgba(4, 12, 20, 0.92)',
    track:      'rgba(29, 155, 240, 0.2)',
    text:       '#EAF5FE',
    textMuted:  'rgba(234, 245, 254, 0.55)',
    glow:       'rgba(29, 155, 240, 0.35)',
    name:       'Grok'
  },
  perplexity: {
    primary:    '#6366F1',
    secondary:  '#818CF8',
    bg:         'rgba(8, 8, 20, 0.92)',
    track:      'rgba(99, 102, 241, 0.2)',
    text:       '#EEEFFE',
    textMuted:  'rgba(238, 238, 254, 0.55)',
    glow:       'rgba(99, 102, 241, 0.35)',
    name:       'Perplexity'
  },
  metaai: {
    primary:    '#0866FF',
    secondary:  '#3A85FF',
    bg:         'rgba(4, 8, 24, 0.92)',
    track:      'rgba(8, 102, 255, 0.2)',
    text:       '#EAF0FF',
    textMuted:  'rgba(234, 240, 255, 0.55)',
    glow:       'rgba(8, 102, 255, 0.35)',
    name:       'Meta AI'
  },
  deepseek: {
    primary:    '#3B82F6',
    secondary:  '#60A5FA',
    bg:         'rgba(6, 10, 22, 0.92)',
    track:      'rgba(59, 130, 246, 0.2)',
    text:       '#EBF2FF',
    textMuted:  'rgba(235, 242, 255, 0.55)',
    glow:       'rgba(59, 130, 246, 0.35)',
    name:       'DeepSeek'
  }
};

AIR.getTheme = function () {
  const p = AIR.currentPlatform;
  return p ? (AIR.THEMES[p.id] || AIR.THEMES.claude) : AIR.THEMES.claude;
};
