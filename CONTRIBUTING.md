# Contributing & Rebuilding AIRadar

> This project is source-available under the [LICENSE](LICENSE). You're welcome to study and
> personally modify it; redistribution / publishing requires the author's written permission,
> and **author attribution and license headers must be retained**.

## Dev workflow

1. Edit files in `extension/`.
2. Reload the extension (extensions page → ↻) and refresh the AI tab.
3. Run a quick sanity check before committing:
   ```bash
   # syntax-check every JS file
   for f in $(find extension -name '*.js'); do node --check "$f" || echo "BAD $f"; done
   # validate the manifest
   node -e "JSON.parse(require('fs').readFileSync('extension/manifest.json'));console.log('manifest ok')"
   ```
4. Build with `./build.sh`.

## Adding / improving a platform

Each provider has an adapter in `extension/platforms/<name>.js` exposing a `handleBridgeMessage(msg)`
that returns a normalized object (`{ source, session, weekly, tokensDelta, … }`) or `null`.

- **Real usage** (like Claude) requires the provider to expose a usage signal; wire it in the adapter.
- **Estimated usage** is automatic: `content/main.js` falls back to counting tokens from the
  assistant's streamed text via `tokenizer/`. To improve accuracy, parse that platform's specific
  stream shape in its adapter and return precise `tokensDelta` values.

## What to commit to GitHub

✅ **Commit these** (the editable master):
```
extension/            (all source: manifest, background, content, overlay, platforms, popup, storage, tokenizer, vendor, injected, icons)
README.md  PRIVACY.md  LICENSE  NOTICE  CREDITS.md
INSTALL.md  BROWSERS.md  CONTRIBUTING.md
build.sh
.gitignore
```

🚫 **Do NOT commit these** (generated / local / secret) — they're in `.gitignore`:
```
dist/                 (built zips — attach to a GitHub Release instead)
node_modules/         (only if you use the optional minifier)
*.zip
*.pem  *.crx          (signing keys / packed builds — NEVER commit private keys)
.DS_Store  Thumbs.db
.vscode/  .idea/      (editor settings)
*.log
.env  *.local         (any local secrets/config)
```

> 🔐 **Never commit a signing key** (`.pem`) or store API token. If you ever publish a `.crx`, keep its `.pem` private and out of git — anyone with it can ship updates as you.

## Releasing

1. Bump `version` in `extension/manifest.json` (and the strings in `popup/popup.html` + the credit line).
2. `./build.sh`
3. Create a **GitHub Release** and attach `dist/airadar-extension-v<version>.zip`.
4. Upload the same zip to the stores you target (see [INSTALL.md](INSTALL.md) §4).

## Code style

- Vanilla JS, no framework, no remote dependencies (privacy requirement — keep it that way).
- Keep the `/*! … */` author banner at the top of every JS/CSS file.
- No `eval`, no remote script loading, no analytics. Ever.
