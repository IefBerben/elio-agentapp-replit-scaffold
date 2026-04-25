#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Elio agent packaging script — full-workspace bundle
#
# Reads manifest.md, validates required fields, and produces a standalone
# runnable zip at dist/{agent_id}-{version}.zip containing the complete
# workspace (no scaffold baseline required on the target).
#
# Deliberately dependency-light: bash + rsync + python3 for YAML parsing
# (python3 and rsync are in the Replit Nix env already).
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/manifest.md"

if [ ! -f "$MANIFEST" ]; then
  echo "❌ manifest.md not found at repo root. Run the package-agent skill first." >&2
  exit 1
fi

# ─── Parse YAML front-matter with python (pyyaml comes from back/ deps) ──
PY_RUN=(uv run --project "$ROOT/back" python)

read_manifest() {
"${PY_RUN[@]}" - "$MANIFEST" <<'PY'
import sys, re, json
try:
    import yaml
except ImportError:
    print("::ERROR::pyyaml not installed — run: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

raw = open(sys.argv[1], encoding="utf-8").read()
m = re.match(r"^---\n(.*?)\n---", raw, re.S)
if not m:
    print("::ERROR::no YAML front-matter in manifest.md", file=sys.stderr)
    sys.exit(2)
data = yaml.safe_load(m.group(1))

required = ["agent_id", "version", "display_name", "description",
            "author", "endpoints", "frontend"]
missing = [k for k in required if not data.get(k)]
if missing:
    print(f"::ERROR::missing required fields: {', '.join(missing)}", file=sys.stderr)
    sys.exit(2)

print(json.dumps(data))
PY
}

META="$(read_manifest)"
AGENT_ID=$(echo "$META" | python3 -c "import json,sys;print(json.load(sys.stdin)['agent_id'])" 2>/dev/null || "${PY_RUN[@]}" -c "import json,sys;print(json.load(sys.stdin)['agent_id'])" <<<"$META")
VERSION=$(echo "$META"  | python3 -c "import json,sys;print(json.load(sys.stdin)['version'])"  2>/dev/null || "${PY_RUN[@]}" -c "import json,sys;print(json.load(sys.stdin)['version'])"  <<<"$META")

if [ -z "$AGENT_ID" ] || [ -z "$VERSION" ]; then
  echo "❌ agent_id or version empty in manifest.md" >&2
  exit 1
fi

BUNDLE_DIR="$ROOT/dist/${AGENT_ID}-${VERSION}"
ZIP_PATH="$ROOT/dist/${AGENT_ID}-${VERSION}.zip"

echo "→ packaging ${AGENT_ID} v${VERSION} (full workspace)"
rm -rf "$BUNDLE_DIR" "$ZIP_PATH"
mkdir -p "$BUNDLE_DIR"

# ─── Copy full workspace, excluding build artifacts and secrets ────────────
rsync -a \
  --exclude='.git/' \
  --exclude='.claude/' \
  --exclude='dist/' \
  --exclude='node_modules/' \
  --exclude='front/dist/' \
  --exclude='front/.vite/' \
  --exclude='back/.venv/' \
  --exclude='back/tempfiles/' \
  --exclude='back/.env' \
  --exclude='__pycache__/' \
  --exclude='*.pyc' \
  --exclude='*.pyo' \
  --exclude='.env' \
  "$ROOT/" "$BUNDLE_DIR/"

# ─── Zip ──────────────────────────────────────────────────────────────────
(cd "$ROOT/dist" && zip -rq "${AGENT_ID}-${VERSION}.zip" "${AGENT_ID}-${VERSION}")

echo ""
echo "✅ $ZIP_PATH"
echo "   ($(du -h "$ZIP_PATH" | cut -f1))"
