#!/usr/bin/env bash
# ============================================================================
#  AIRadar build script — by Vijaya Kumar L (Rise With VJ)
#  Produces, in dist/:
#    airadar-chromium-v<version>.zip   ← Chrome, Edge, Brave, Opera, Vivaldi, Arc, …
#    airadar-firefox-v<version>.zip    ← Firefox, Zen, Floorp, LibreWolf, Waterfox, …
#    airadar-source-v<version>.zip     ← full editable source snapshot
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

VERSION=$(node -p "require('./extension/manifest.json').version" 2>/dev/null \
  || grep -m1 '"version"' extension/manifest.json | sed -E 's/.*"version":\s*"([^"]+)".*/\1/')

mkdir -p dist
CHROME_ZIP="dist/airadar-chromium-v${VERSION}.zip"
FF_ZIP="dist/airadar-firefox-v${VERSION}.zip"
SRC_ZIP="dist/airadar-source-v${VERSION}.zip"
rm -f "$CHROME_ZIP" "$FF_ZIP" "$SRC_ZIP"

echo "▶ Chromium package v${VERSION} …"
( cd extension && zip -r -X "../${CHROME_ZIP}" . -x ".*" -x "*/.*" -x "*.zip" >/dev/null )
echo "  ✔ ${CHROME_ZIP}"

echo "▶ Firefox package v${VERSION} (swapping in manifest.firefox.json) …"
rm -rf .ff_build && cp -r extension .ff_build
cp manifest.firefox.json .ff_build/manifest.json
( cd .ff_build && zip -r -X "../${FF_ZIP}" . -x ".*" -x "*/.*" -x "*.zip" >/dev/null )
rm -rf .ff_build
echo "  ✔ ${FF_ZIP}"

echo "▶ Source snapshot …"
zip -r -X "${SRC_ZIP}" \
  extension manifest.firefox.json README.md PRIVACY.md LICENSE NOTICE CREDITS.md \
  INSTALL.md BROWSERS.md CONTRIBUTING.md build.sh .gitignore docs \
  -x "*/.*" -x "*.zip" -x "dist/*" -x "node_modules/*" >/dev/null
echo "  ✔ ${SRC_ZIP}"

echo "✅ Done. Files in dist/:"
ls -lh dist/
