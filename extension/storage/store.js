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
// store.js — unified chrome.storage.local wrapper
globalThis.AIRadar = globalThis.AIRadar || {}; var AIR = globalThis.AIRadar;

AIR.store = {
  async get(key) {
    return new Promise(resolve => {
      chrome.storage.local.get(key, result => resolve(result[key] ?? null));
    });
  },
  async set(key, value) {
    return new Promise(resolve => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },
  async getAll(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, resolve);
    });
  },
  async remove(key) {
    return new Promise(resolve => {
      chrome.storage.local.remove(key, resolve);
    });
  }
};

// Per-platform state shape:
// {
//   platformId: string,
//   sessionTokensUsed: number,
//   sessionStartMs: number,
//   sessionResetMs: number | null,       // when the session window resets
//   weeklyTokensUsed: number,
//   weeklyStartMs: number,
//   weeklyResetMs: number | null,
//   sessionUtilization: number,          // 0–100
//   weeklyUtilization: number,           // 0–100
//   queryCount: number,                  // for Perplexity
//   thinkingTokensUsed: number,          // for DeepSeek, Claude extended thinking
//   lastUpdatedMs: number,
//   hudPosition: { x: number, y: number } | null,
//   budgetTokens: number | null,         // user-set budget
//   budgetWarned: boolean
// }
