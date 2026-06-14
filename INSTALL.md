# Install & Build Kit — AIRadar

A complete, copy-paste guide to run, build, and publish AIRadar from your laptop.

---

## 0. Requirements

- Any modern browser (see [BROWSERS.md](BROWSERS.md)).
- For building zips: a terminal with `bash` + `zip` (macOS/Linux have these; on Windows use **Git Bash** or **WSL**).
- For Firefox signing / Safari: optional, only if you publish there.
- No Node.js is required to run; it's only used if you choose to minify (optional).

---

## 1. Get the code

```bash
git clone https://github.com/risewithvj/AIRadar.git
cd AIRadar
```

The runnable extension is the **`extension/`** folder. You point your browser at that folder.

---

## 2. Run it locally (Developer mode)

### Chrome / Edge / Brave / Opera / Vivaldi / Arc / any Chromium
1. Go to `chrome://extensions` (or `edge://extensions`, `brave://extensions`, …).
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select the **`extension/`** folder.
5. Open a supported AI chat (e.g. https://claude.ai). The HUD appears bottom-right.

To apply code changes: edit files in `extension/`, then click the **↻ reload** icon on the extension card and refresh the AI tab.

### Firefox / Zen / Floorp / LibreWolf / Waterfox / Mullvad
1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select **`extension/manifest.json`**.
4. Open a supported AI chat.

> Temporary add-ons are removed when the browser restarts. For a permanent install, sign it on [AMO](https://addons.mozilla.org).

### Safari / Orion
```bash
xcrun safari-web-extension-converter ./extension
```
Open the generated Xcode project, run it, then enable the extension in Safari → Settings → Extensions. (macOS + Xcode required.)

---

## 3. Build distributable zips

### Windows (PowerShell) — the simple way
```powershell
# Chromium package (Chrome/Edge/Brave/Opera/Vivaldi/Arc/…) — manifest is at the zip root
Compress-Archive -Path .\extension\* -DestinationPath .\AIRadar-chromium.zip -Force

# Firefox package (Firefox/Zen/Floorp/LibreWolf/Waterfox/…) — swaps in the Firefox manifest
Copy-Item .\extension .\_ff -Recurse -Force
Copy-Item .\manifest.firefox.json .\_ff\manifest.json -Force
Compress-Archive -Path .\_ff\* -DestinationPath .\AIRadar-firefox.zip -Force
Remove-Item .\_ff -Recurse -Force
```

### macOS / Linux / Git Bash — the script
```bash
./build.sh
# → dist/airadar-chromium-v<version>.zip   (Chrome, Edge, Brave, Opera, Vivaldi, Arc, …)
# → dist/airadar-firefox-v<version>.zip    (Firefox, Zen, Floorp, LibreWolf, Waterfox, …)
# → dist/airadar-source-v<version>.zip     (full editable source snapshot)
```

> **Two packages, because** Chrome wants `background.service_worker` and Firefox wants `background.scripts` — putting both in one manifest makes Chrome show a warning. The default `extension/manifest.json` is the **Chromium** one (warning-free); `manifest.firefox.json` is swapped in for the Firefox build.

Use the **extension** zip to upload to stores or share for sideloading. Use the **source** zip to archive/share the editable master.

### Optional: minify for a smaller, harder-to-copy build
Minification is optional and not required. If you want it:
```bash
npm install --no-save terser clean-css-cli
# minify JS
for f in extension/**/*.js; do npx terser "$f" -c -m -o "$f"; done
# minify CSS
for f in extension/**/*.css; do npx cleancss -o "$f" "$f"; done
```
> Keep a clean copy first — minification is one-way. The author banners are marked `/*!` so terser/clean-css **preserve** them by default.

---

## 4. Publish (one-click installs for end users)

| Store | URL | Notes |
|---|---|---|
| Chrome Web Store | https://chrome.google.com/webstore/devconsole | one-time $5 dev fee; upload the extension zip |
| Microsoft Edge Add-ons | https://partner.microsoft.com/dashboard/microsoftedge | free |
| Firefox Add-ons (AMO) | https://addons.mozilla.org/developers/ | free; signs your build |
| Opera Add-ons | https://addons.opera.com/developer/ | free |

Brave, Vivaldi, Arc, etc. install from the Chrome Web Store automatically.

---

## 5. Serve files via jsDelivr (optional)

Once the repo is on GitHub (and you've tagged a release), jsDelivr can serve any file:
```
https://cdn.jsdelivr.net/gh/risewithvj/AIRadar@latest/dist/airadar-extension-v2.2.0.zip
https://cdn.jsdelivr.net/gh/risewithvj/AIRadar@<tag>/extension/manifest.json
```
This is for **hosting the download / source**, not for one-click installing (browsers can't install an extension from a CDN URL).

---

## 6. Common issues

- **HUD doesn't appear:** refresh the AI tab after loading; confirm the site is in the supported list.
- **Firefox won't load:** ensure you selected `manifest.json` (not the folder) via *Load Temporary Add-on*.
- **Numbers show `~`:** that's the estimate marker for non-Claude platforms (expected).
- **Changes not showing:** reload the extension on the extensions page, then hard-refresh the tab.
