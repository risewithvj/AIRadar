#!/usr/bin/env bash
# ============================================================================
#  AIRadar build script — by Vijaya Kumar L (Rise With VJ)
#  Produces:  dist/airadar-extension-v<version>.zip   (loadable/uploadable)
#             dist/airadar-source-v<version>.zip       (full source snapshot)
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

VERSION=$(node -p "require('./extension/manifest.json').version" 2>/dev/null \
  || grep -m1 '"version"' extension/manifest.json | sed -E 's/.*"version":\s*"([^"]+)".*/\1/')

mkdir -p dist
EXT_ZIP="dist/airadar-extension-v${VERSION}.zip"
SRC_ZIP="dist/airadar-source-v${VERSION}.zip"
rm -f "$EXT_ZIP" "$SRC_ZIP"

echo "▶ Packaging extension v${VERSION} …"
( cd extension && zip -r -X "../${EXT_ZIP}" . -x ".*" -x "*/.*" -x "*.zip" >/dev/null )
echo "  ✔ ${EXT_ZIP}"

echo "▶ Packaging full source snapshot …"
zip -r -X "${SRC_ZIP}" \
  extension README.md PRIVACY.md LICENSE NOTICE CREDITS.md \
  INSTALL.md BROWSERS.md CONTRIBUTING.md build.sh .gitignore \
  -x "*/.*" -x "*.zip" -x "dist/*" -x "node_modules/*" >/dev/null
echo "  ✔ ${SRC_ZIP}"

echo "✅ Done. Files in dist/:"
ls -lh dist/
