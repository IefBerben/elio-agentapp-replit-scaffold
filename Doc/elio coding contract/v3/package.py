"""Build script for packaging the toolkit into a distributable ZIP.

Usage:
    python package.py

Output:
    dist/toolkit_agent_apps_v<version>.zip

The version is read from front/package.json.
Excludes everything that can be reinstalled or is generated at runtime.
"""

import json
import zipfile
from pathlib import Path

# ─── Configuration ────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent

# Folders/files excluded from the ZIP (checked against each path component)
EXCLUDED_DIRS = {
    ".venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".git",
    "dist",
}

EXCLUDED_SUFFIXES = {".pyc", ".pyo", ".zip"}

# Individual files excluded by name
EXCLUDED_FILES = {
    ".env",
    "log_python.log",
}

# Paths relative to ROOT that are excluded (glob-style via startswith)
EXCLUDED_REL_PREFIXES = (
    "back/tempfiles/",
    "front/dist/",
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def read_version() -> str:
    """Read the current version from front/package.json.

    Returns:
        Version string (e.g. ``"1.2.0"``).
    """
    pkg = ROOT / "front" / "package.json"
    with open(pkg, encoding="utf-8") as f:
        return json.load(f)["version"]


def should_exclude(path: Path) -> bool:
    """Determine whether a file or directory should be excluded from the ZIP.

    Args:
        path: Absolute path to check.

    Returns:
        True if the path should be excluded.
    """
    parts = path.relative_to(ROOT).parts

    # Exclude if any component matches an excluded directory name
    if any(part in EXCLUDED_DIRS for part in parts):
        return True

    # Exclude by file suffix
    if path.suffix in EXCLUDED_SUFFIXES:
        return True

    # Exclude by exact file name
    if path.name in EXCLUDED_FILES:
        return True

    # Exclude by relative path prefix (e.g. back/tempfiles/*)
    rel = path.relative_to(ROOT).as_posix()
    if any(rel.startswith(prefix) for prefix in EXCLUDED_REL_PREFIXES):
        return True

    return False


def collect_files() -> list[Path]:
    """Collect all files to include in the ZIP.

    Returns:
        Sorted list of absolute file paths.
    """
    files = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if should_exclude(path):
            continue
        files.append(path)
    return sorted(files)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    version = read_version()
    dist_dir = ROOT / "dist"
    dist_dir.mkdir(exist_ok=True)

    zip_name = f"toolkit_agent_apps_v{version}.zip"
    zip_path = dist_dir / zip_name

    # Remove a previous ZIP with the same name if it exists
    if zip_path.exists():
        zip_path.unlink()
        print(f"Removed existing {zip_path.name}")

    files = collect_files()

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for file in files:
            # Arc name: toolkit_agent_apps/<relative path>
            arc = Path("toolkit_agent_apps") / file.relative_to(ROOT)
            zf.write(file, arc)

    size_mb = zip_path.stat().st_size / 1_048_576
    print(f"✓ {len(files)} files packaged")
    print(f"✓ {zip_path.relative_to(ROOT.parent)}  ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
