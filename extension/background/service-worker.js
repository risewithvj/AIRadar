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
// service-worker.js
// Works as an MV3 module service worker (Chrome/Edge/Brave) and as an MV2
// non-persistent background script (Firefox). `action` is MV3; fall back to
// `browserAction` on MV2.
const action = (typeof chrome !== 'undefined' && (chrome.action || chrome.browserAction)) || null;

function setBadge(pct) {
  if (!action) return;
  const text = pct > 0 ? pct + '%' : '';
  try { action.setBadgeText({ text }); } catch {}
  try {
    action.setBadgeBackgroundColor({
      color: pct >= 85 ? '#FF4B4B' : pct >= 60 ? '#F59E0B' : '#10B981'
    });
  } catch {}
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'usage_update') {
    // Update extension badge with session utilization %
    setBadge(Math.round(msg.sessionUtil || 0));

    // Schedule a reset alarm if a reset timestamp was provided
    if (msg.platformId && msg.sessionResetMs) {
      try {
        chrome.alarms.create('airador_reset_' + msg.platformId, { when: msg.sessionResetMs });
      } catch {}
    }
  }

  if (msg.type === 'open_popup') {
    try { action?.openPopup?.(); } catch {}
  }
});

// Alarm for scheduled resets — re-check usage after a window expires
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name.startsWith('airador_reset_')) {
    const platformId = alarm.name.replace('airador_reset_', '');
    setBadge(0);
    // Notify all tabs on this platform to refresh their usage
    chrome.tabs.query({}, tabs => {
      for (const tab of tabs) {
        try {
          chrome.tabs.sendMessage(tab.id, { type: 'airador_force_refresh', platformId })
            .catch?.(() => {});
        } catch {}
      }
    });
  }
});
