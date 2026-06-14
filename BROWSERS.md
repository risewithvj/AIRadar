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

## Gecko engine — 🟡 Use the Firefox package / manifest
Firefox · Firefox Developer Edition · Firefox Nightly · Zen Browser · Floorp · LibreWolf · Waterfox ·
Mullvad Browser · Tor Browser*

> *Tor disables many web APIs for anti-fingerprinting; AIRadar will load but functionality is reduced.

Chrome and Firefox disagree on the background entry (`service_worker` vs `scripts`), so AIRadar ships a
**separate Firefox manifest** (`manifest.firefox.json` at the repo root). Use it one of two ways:

**A) Ready-made zip:** run `./build.sh` → load `dist/airadar-firefox-v<version>.zip`.

**B) Quick load:** make a Firefox copy, then load it:
```powershell
# PowerShell — non-destructive Firefox build (keeps your Chrome manifest intact)
Copy-Item .\extension .\_ff -Recurse -Force
Copy-Item .\manifest.firefox.json .\_ff\manifest.json -Force
# then in Firefox: about:debugging#/runtime/this-firefox → Load Temporary Add-on… → select .\_ff\manifest.json
```
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

### Two packages, one codebase
- **MV3** is the shared standard across Chromium and (recent) Gecko, so the code is identical.
- The **only** per-engine difference is the background entry, so AIRadar keeps two manifests:
  - `extension/manifest.json` — `background.service_worker` (Chromium). **This is the default** and loads warning-free in Chrome/Edge/Brave/etc.
  - `manifest.firefox.json` — `background.scripts` + `browser_specific_settings.gecko` (Firefox). Swapped in only for the Firefox build (see above).
- The JS uses `chrome.*`, which exists on both engines, so no polyfill is needed.

> Why not one manifest with both keys? Chrome shows a "`background.scripts` requires manifest v2" warning if `scripts` is present, and Firefox can't use `service_worker`. Two manifests keep **both** engines warning-free.
