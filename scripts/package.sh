#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Elio agent packaging script — full-workspace bundle
#
# Reads manifest.md, validates required fields, and produces a standalone
# runnable zip at dist/{agent_id}-{version}.zip containing the complete
# workspace (no scaffold baseline required on the target).
#
# Uses Python shutil + zipfile throughout — no rsync or zip dependency.
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/manifest.md"

if [ ! -f "$MANIFEST" ]; then
  echo "❌ manifest.md not found at repo root. Run the package-agent skill first." >&2
  exit 1
fi

uv run --project "$ROOT/back" python - "$ROOT" "$MANIFEST" <<'PY'
import sys, re, json, os, shutil, zipfile
from pathlib import Path

try:
    import yaml
except ImportError:
    print("::ERROR::pyyaml not installed — run: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

root = Path(sys.argv[1])
manifest_path = Path(sys.argv[2])

# ── Parse + validate manifest front-matter ────────────────────────────────
raw = manifest_path.read_text(encoding="utf-8")
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

agent_id = data["agent_id"]
version  = data["version"]
bundle_dir = root / "dist" / f"{agent_id}-{version}"
zip_path   = root / "dist" / f"{agent_id}-{version}.zip"

print(f"→ packaging {agent_id} v{version} (full workspace)")

if bundle_dir.exists():
    shutil.rmtree(bundle_dir)
if zip_path.exists():
    zip_path.unlink()
bundle_dir.mkdir(parents=True)

# ── Exclusions ────────────────────────────────────────────────────────────
EXCLUDE_DIRS  = {".git", ".claude", "dist", "node_modules", "__pycache__",
                 ".venv", "tempfiles", ".vite"}
EXCLUDE_FILES = {".env"}
EXCLUDE_EXTS  = {".pyc", ".pyo"}

def ignored(path: Path) -> bool:
    parts = path.relative_to(root).parts
    if any(p in EXCLUDE_DIRS for p in parts):
        return True
    if path.is_file():
        if path.name in EXCLUDE_FILES:
            return True
        if path.suffix in EXCLUDE_EXTS:
            return True
    return False

# ── Copy ──────────────────────────────────────────────────────────────────
for src in root.rglob("*"):
    if ignored(src):
        continue
    rel = src.relative_to(root)
    dst = bundle_dir / rel
    if src.is_dir():
        dst.mkdir(parents=True, exist_ok=True)
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

# ── Zip via Python zipfile ─────────────────────────────────────────────────
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for f in bundle_dir.rglob("*"):
        if f.is_file():
            zf.write(f, f.relative_to(bundle_dir.parent))

size_kb = zip_path.stat().st_size // 1024
print(f"\n✅ {zip_path}  ({size_kb} KB)")
PY
