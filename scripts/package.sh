#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Elio agent packaging script — proposal / v0
#
# Reads manifest.md, validates required fields, and produces a deployable
# zip at dist/{agent_id}-{version}.zip containing the consultant's delta
# on top of the scaffold baseline.
#
# Deliberately dependency-light: bash + standard unix tools + python3 for
# YAML parsing (python3 is in the Replit Nix env already).
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
VERSION=$(echo "$META" | python3 -c "import json,sys;print(json.load(sys.stdin)['version'])" 2>/dev/null || "${PY_RUN[@]}" -c "import json,sys;print(json.load(sys.stdin)['version'])" <<<"$META")

if [ -z "$AGENT_ID" ] || [ -z "$VERSION" ]; then
  echo "❌ agent_id or version empty in manifest.md" >&2
  exit 1
fi

BUNDLE_DIR="$ROOT/dist/${AGENT_ID}-${VERSION}"
ZIP_PATH="$ROOT/dist/${AGENT_ID}-${VERSION}.zip"

echo "→ packaging ${AGENT_ID} v${VERSION}"
rm -rf "$BUNDLE_DIR" "$ZIP_PATH"
mkdir -p "$BUNDLE_DIR/patches"

# ─── Copy files listed in manifest.package_includes ───────────────────────
# Globs with {agent_id_snake} etc. must be resolved by the skill before
# running this script; this script treats them as literal paths.
"${PY_RUN[@]}" - "$MANIFEST" "$BUNDLE_DIR" "$ROOT" <<'PY'
import sys, re, yaml, shutil, glob, os
manifest, bundle, root = sys.argv[1], sys.argv[2], sys.argv[3]
data = yaml.safe_load(re.match(r"^---\n(.*?)\n---", open(manifest, encoding="utf-8").read(), re.S).group(1))
for pattern in data.get("package_includes", []):
    if "{" in pattern:
        print(f"  ⚠ unresolved placeholder, skipping: {pattern}")
        continue
    for src in glob.glob(os.path.join(root, pattern), recursive=True):
        if not os.path.isfile(src):
            continue
        rel = os.path.relpath(src, root)
        dst = os.path.join(bundle, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print(f"  + {rel}")
PY

# ─── Copy manifest + SUBMISSION.md into bundle root ───────────────────────
cp "$MANIFEST" "$BUNDLE_DIR/manifest.md"
if [ -f "$ROOT/SUBMISSION.md" ]; then
  cp "$ROOT/SUBMISSION.md" "$BUNDLE_DIR/SUBMISSION.md"
fi

# ─── Zip ──────────────────────────────────────────────────────────────────
(cd "$ROOT/dist" && zip -rq "${AGENT_ID}-${VERSION}.zip" "${AGENT_ID}-${VERSION}")

echo ""
echo "✅ $ZIP_PATH"
echo "   ($(du -h "$ZIP_PATH" | cut -f1))"
