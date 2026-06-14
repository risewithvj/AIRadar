# Browser Support & Install Matrix — AIRadar

AIRadar is a **Manifest V3** WebExtension with a cross-engine shim (`vendor/browser-polyfill.js`)
and both Chromium and Firefox manifest keys, so one package targets the widest possible range.

Legend: ✅ loads as-is · 🟡 loads with the bundled Firefox keys · 🔧 needs a one-time conversion · ❌ cannot run WebExtensions

## Chromium engine — ✅ Load unpacked / sideload `extension/`
Chrome · Microsoft Edge · Brave · Opera · Opera GX · Vivaldi · Arc · Chromium · Ungoogled Chromium ·
Yandex Browser · Coc Coc · SRWare Iron · Slimjet · Comodo Dragon · Epic Privacy Browser · Ghost Browser ·
Avast Secure Browser · AVG Secure Browser · Maxthon* · Sleipnir* · Wavebox · Sidekick · SigmaOS* · Dia ·
Comet* · Mercury* · Naver Whale · Horse Browser · Soul Browser · Kiwi Browser (Android) ·
Samsung Internet (partial — uses its own add-on flow) · Chrome Canary · Edge Canary · Opera Developer ·
Brave Nightly · Vivaldi Snapshot

> *Some niche/older Chromium forks lag on MV3 features; if loading fails, update the browser.

**Steps:** open the browser's `…/extensions` page → enable **Developer mode** → **Load unpacked** → pick `extension/`.

## Gecko engine — 🟡 Load `extension/manifest.json` (Firefox keys are bundled)
Firefox · Firefox Developer Edition · Firefox Nightly · Zen Browser · Floorp · LibreWolf · Waterfox ·
Mullvad Browser · Tor Browser*

> *Tor disables many web APIs for anti-fingerprinting; AIRadar will load but functionality is reduced.

**Steps:** `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → select `extension/manifest.json`.
Temporary add-ons vanish on restart; sign via **addons.mozilla.org** for a permanent install.

## WebKit — 🔧 One-time conversion required
Safari · Orion Browser

Convert with Apple's tool, then build/sign in Xcode:
```bash
xcrun safari-web-extension-converter ./extension
```
Requires macOS + Xcode (and an Apple Developer account for distribution). Orion can also import many
Chrome/Firefox extensions directly — try that first.

## Mobile (varies)
- **Kiwi (Android):** ✅ Chrome-extension compatible — load unpacked from the zip.
- **Samsung Internet:** 🟡 supports add-ons but through its own submission flow.
- **Firefox for Android:** 🟡 supports a curated add-on set; sideloading needs a custom collection.
- **Orion (iOS):** 🔧 imports some extensions; subject to iOS limits.
- **UC, Puffin, Aloha, Via, Dolphin, Phoenix, Soul:** mostly ❌ — no general extension support.

## ❌ Cannot run WebExtensions (out of scope for any extension)
Pale Moon · Basilisk · SeaMonkey · K-Meleon — legacy Goanna/XUL add-ons only, not MV3.
qutebrowser · Min Browser · Falkon · Otter Browser — limited/no WebExtension support.
Lynx · Links · w3m — text-mode browsers; they render no extension UI at all.

---

### Why a single package works almost everywhere
- **MV3** is the shared standard across Chromium and (recent) Gecko.
- The manifest declares **both** `background.service_worker` (Chromium) **and** `background.scripts` (Firefox) — each engine uses the one it understands.
- `browser_specific_settings.gecko` gives Firefox an extension ID + minimum version.
- `vendor/browser-polyfill.js` aliases the `chrome` and `browser` globals so the code is engine-agnostic.
