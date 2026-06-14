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
// platforms/index.js
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.PLATFORMS = {
  CLAUDE:      { id: 'claude',      name: 'Claude',            domain: 'claude.ai' },
  CHATGPT:     { id: 'chatgpt',     name: 'ChatGPT',           domain: 'chatgpt.com' },
  GEMINI:      { id: 'gemini',      name: 'Gemini',            domain: 'gemini.google.com' },
  COPILOT:     { id: 'copilot',     name: 'Microsoft Copilot', domain: 'copilot.microsoft.com' },
  GROK:        { id: 'grok',        name: 'Grok',              domain: 'grok.com' },
  PERPLEXITY:  { id: 'perplexity',  name: 'Perplexity',        domain: 'perplexity.ai' },
  METAAI:      { id: 'metaai',      name: 'Meta AI',           domain: 'meta.ai' },
  DEEPSEEK:    { id: 'deepseek',    name: 'DeepSeek',          domain: 'chat.deepseek.com' },
};

AIR.detectPlatform = function () {
  const host = location.hostname;
  // Special: Grok is also on x.com (only under /i/grok)
  if (host.includes('x.com')) {
    if (location.pathname.startsWith('/i/grok')) return AIR.PLATFORMS.GROK;
    return null;
  }
  for (const [, platform] of Object.entries(AIR.PLATFORMS)) {
    if (host.includes(platform.domain)) return platform;
  }
  return null;
};

AIR.currentPlatform = AIR.detectPlatform();
