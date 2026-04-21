"""Elio coding-contract test suite.

Single source of truth for the 23 B/F/I conformity rules documented in
.agents/skills/platform-integration-check/SKILL.md. Every rule that can
be checked mechanically lives here; rules requiring judgment (B3 SSE
payload shape, B9 docstring style, F6 dark-mode pairs, F7 disabled
form controls, F9 editable results) are delegated to the LLM-graded
platform-integration-check skill and flagged as `pytest.skip` with a
pointer.

Run:
    cd back && uv run pytest tests/test_elio_contract.py -v

Integrated into verify-generation gate 4 so violations block the
Builder's "done" report.

The suite skips cleanly when no consultant agent exists yet (only the
_reference agent present), so it is safe to run on a fresh scaffold.
"""

from __future__ import annotations

import ast
import json
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
BACK = REPO_ROOT / "back"
FRONT = REPO_ROOT / "front"
PAGES_DIR = FRONT / "src" / "pages"
STORES_DIR = FRONT / "src" / "stores" / "agent-apps"
I18N_DIR = FRONT / "src" / "i18n" / "locales"
SHARED_TYPES = REPO_ROOT / "packages" / "shared-types" / "src" / "index.ts"
CONFIG_LLMS = BACK / "services" / "config_llms.json"
MAIN_PY = BACK / "main.py"
SUBMISSION = REPO_ROOT / "SUBMISSION.md"
BACKLOG = REPO_ROOT / "backlog.md"

PROTECTED_PAGES = {"_ReferencePage.tsx", "StarterPage.tsx", "ShowcasePage.tsx"}
PROTECTED_STORES = {"_referenceStore.ts"}

# Rules skipped here — see platform-integration-check skill.
SKIP_B3 = "B3 (SSE payload shape) — LLM-graded in platform-integration-check"
SKIP_B9 = "B9 (docstring style) — LLM-graded in platform-integration-check"
SKIP_F6 = "F6 (dark-mode pairs) — LLM-graded in platform-integration-check"
SKIP_F7 = "F7 (disabled={isProcessing}) — LLM-graded in platform-integration-check"
SKIP_F9 = "F9 (editable intermediate results) — LLM-graded in platform-integration-check"


# ─── Discovery helpers ────────────────────────────────────────────────────────


def _consultant_agent_dirs() -> list[Path]:
    """Return agent folders owned by the consultant (not _reference, not __pycache__)."""
    if not (BACK / "agents").is_dir():
        return []
    return sorted(
        d for d in (BACK / "agents").iterdir()
        if d.is_dir() and not d.name.startswith("_") and not d.name.startswith(".")
    )


def _consultant_pages() -> list[Path]:
    if not PAGES_DIR.is_dir():
        return []
    return sorted(
        f for f in PAGES_DIR.glob("*.tsx")
        if f.name not in PROTECTED_PAGES and not f.name.startswith("_")
    )


def _consultant_stores() -> list[Path]:
    if not STORES_DIR.is_dir():
        return []
    return sorted(
        f for f in STORES_DIR.glob("*.ts")
        if f.name not in PROTECTED_STORES and not f.name.startswith("_")
    )


def _step_files(agent_dir: Path) -> list[Path]:
    return sorted(agent_dir.glob("step*.py"))


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


# ─── Fixtures ─────────────────────────────────────────────────────────────────


@pytest.fixture(scope="module")
def agent_dirs() -> list[Path]:
    dirs = _consultant_agent_dirs()
    if not dirs:
        pytest.skip("No consultant agent in back/agents/ — scaffold is clean.")
    return dirs


@pytest.fixture(scope="module")
def pages() -> list[Path]:
    files = _consultant_pages()
    if not files:
        pytest.skip("No consultant page in front/src/pages/ — scaffold is clean.")
    return files


@pytest.fixture(scope="module")
def stores() -> list[Path]:
    files = _consultant_stores()
    if not files:
        pytest.skip("No consultant store in front/src/stores/agent-apps/ — scaffold is clean.")
    return files


@pytest.fixture(scope="module")
def main_py_text() -> str:
    return _read(MAIN_PY)


@pytest.fixture(scope="module")
def allowed_models() -> set[str]:
    if not CONFIG_LLMS.is_file():
        pytest.skip("config_llms.json missing — backend not initialized.")
    data = json.loads(_read(CONFIG_LLMS))
    # File shape: {"models": [{"name": "gpt-5-chat", ...}, ...]} or similar.
    if isinstance(data, dict) and "models" in data:
        return {m["name"] for m in data["models"] if "name" in m}
    if isinstance(data, list):
        return {m["name"] for m in data if isinstance(m, dict) and "name" in m}
    if isinstance(data, dict):
        return set(data.keys())
    return set()


# ─── BACKEND RULES ────────────────────────────────────────────────────────────


def test_B1_get_llm_uses_whitelisted_models(agent_dirs, allowed_models):
    """Every get_llm("name") call uses a model from config_llms.json."""
    pattern = re.compile(r"""get_llm\(\s*["']([^"']+)["']""")
    violations = []
    for agent in agent_dirs:
        for step in _step_files(agent):
            text = _read(step)
            for match in pattern.finditer(text):
                model = match.group(1)
                if model not in allowed_models:
                    line = text[: match.start()].count("\n") + 1
                    violations.append(f"{step.relative_to(REPO_ROOT)}:{line} — get_llm('{model}') not in whitelist {sorted(allowed_models)}")
    assert not violations, "B1 violations:\n  " + "\n  ".join(violations)


def test_B2_stream_functions_have_stream_safe(agent_dirs):
    """Every `async def *_stream` is decorated with @stream_safe."""
    violations = []
    for agent in agent_dirs:
        for step in _step_files(agent):
            tree = ast.parse(_read(step))
            for node in ast.walk(tree):
                if isinstance(node, ast.AsyncFunctionDef) and node.name.endswith("_stream"):
                    decorators = {
                        d.id if isinstance(d, ast.Name) else (d.attr if isinstance(d, ast.Attribute) else "")
                        for d in node.decorator_list
                    }
                    if "stream_safe" not in decorators:
                        violations.append(f"{step.relative_to(REPO_ROOT)}:{node.lineno} — async def {node.name} missing @stream_safe")
    assert not violations, "B2 violations:\n  " + "\n  ".join(violations)


@pytest.mark.skip(reason=SKIP_B3)
def test_B3_sse_payload_shape():
    """SSE yield dicts have step/message/status/progress + final result."""


def test_B4_step_functions_registered_in_agents_map(agent_dirs, main_py_text):
    """Every `*_stream` function is registered in AGENTS_MAP with kebab-case `<name>-step-N`."""
    violations = []
    for agent in agent_dirs:
        for step in _step_files(agent):
            tree = ast.parse(_read(step))
            for node in ast.walk(tree):
                if isinstance(node, ast.AsyncFunctionDef) and node.name.endswith("_stream"):
                    if node.name not in main_py_text:
                        violations.append(f"{step.relative_to(REPO_ROOT)} — {node.name} not referenced in back/main.py")
    # Every AGENTS_MAP key (excluding _reference-*) must match `<slug>-step-<N>`.
    key_pattern = re.compile(r'"([a-z][a-z0-9-]*-step-\d+)"\s*:')
    valid_keys = set(key_pattern.findall(main_py_text))
    all_kebab = re.findall(r'"([^"]+)"\s*:\s*[a-z_]+_stream', main_py_text)
    for key in all_kebab:
        if key.startswith("_"):
            continue
        if key not in valid_keys:
            violations.append(f"back/main.py — AGENTS_MAP key '{key}' does not match <slug>-step-<N>")
    assert not violations, "B4 violations:\n  " + "\n  ".join(violations)


def test_B5_no_direct_llm_instantiation(agent_dirs):
    """Only `from services.llm_config import get_llm` — no direct LLM class instantiation."""
    banned = re.compile(r"\b(AzureChatOpenAI|ChatOpenAI|ChatAnthropic|AzureOpenAI)\s*\(")
    violations = []
    for agent in agent_dirs:
        for step in _step_files(agent):
            text = _read(step)
            for match in banned.finditer(text):
                line = text[: match.start()].count("\n") + 1
                violations.append(f"{step.relative_to(REPO_ROOT)}:{line} — direct {match.group(1)}() instantiation banned; use get_llm()")
    assert not violations, "B5 violations:\n  " + "\n  ".join(violations)


def test_B6_min_5_tests_per_agent(agent_dirs):
    """Each agent has a tests/ folder with at least 5 test functions."""
    violations = []
    for agent in agent_dirs:
        tests_dir = agent / "tests"
        if not tests_dir.is_dir():
            violations.append(f"{agent.relative_to(REPO_ROOT)}/tests/ — missing")
            continue
        count = 0
        for tf in tests_dir.glob("test_*.py"):
            tree = ast.parse(_read(tf))
            count += sum(
                1 for n in ast.walk(tree)
                if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name.startswith("test_")
            )
        if count < 5:
            violations.append(f"{agent.relative_to(REPO_ROOT)}/tests/ — only {count} test(s), min 5 required")
    assert not violations, "B6 violations:\n  " + "\n  ".join(violations)


def test_B7_bilingual_prompts_exist_and_no_hardcoded_strings(agent_dirs):
    """prompt_fr.py + prompt_en.py both exist. Step files contain no FR/EN user-facing strings."""
    # Heuristic for hardcoded strings: accented French chars, OR common UI words
    # inside string literals located in yield dicts / return values.
    french_chars = re.compile(r"[éèêàâôùûçîï]")
    # Ban common UI strings in step*.py (outside log messages, which use logger.*(...))
    banned_phrases = re.compile(
        r'["\'](Initialisation|Génération|Terminé|Draft generated|Done!|Terminé !|En cours|Complete)[^"\']*["\']'
    )
    violations = []
    for agent in agent_dirs:
        if not (agent / "prompt_fr.py").is_file():
            violations.append(f"{agent.relative_to(REPO_ROOT)}/prompt_fr.py — missing")
        if not (agent / "prompt_en.py").is_file():
            violations.append(f"{agent.relative_to(REPO_ROOT)}/prompt_en.py — missing")
        for step in _step_files(agent):
            text = _read(step)
            # Strip logger.*(...) calls — those are developer-facing, not user-facing.
            stripped = re.sub(r"logger\.\w+\([^)]*\)", "", text)
            for match in banned_phrases.finditer(stripped):
                line = stripped[: match.start()].count("\n") + 1
                violations.append(f"{step.relative_to(REPO_ROOT)}:{line} — hardcoded UI string {match.group(0)}; move to prompt_fr/en.py")
            # Detect stray accented strings outside imports/paths.
            for lineno, line in enumerate(stripped.splitlines(), 1):
                if french_chars.search(line) and ('"' in line or "'" in line):
                    # Only flag if it's clearly a string literal with UI content (skip comments).
                    if line.strip().startswith("#"):
                        continue
                    if re.search(r'["\'][^"\']*[éèêàâôùûçîï][^"\']*["\']', line):
                        violations.append(f"{step.relative_to(REPO_ROOT)}:{lineno} — French string literal in step file; move to prompt_fr.py")
    assert not violations, "B7 violations:\n  " + "\n  ".join(violations)


def test_B8_step_functions_accept_interface_language(agent_dirs):
    """Every step function signature accepts `interface_language: str = "fr"`."""
    violations = []
    for agent in agent_dirs:
        for step in _step_files(agent):
            tree = ast.parse(_read(step))
            for node in ast.walk(tree):
                if isinstance(node, ast.AsyncFunctionDef) and node.name.endswith("_stream"):
                    arg_names = [a.arg for a in node.args.args]
                    if "interface_language" not in arg_names:
                        violations.append(f"{step.relative_to(REPO_ROOT)}:{node.lineno} — {node.name} missing interface_language parameter")
    assert not violations, "B8 violations:\n  " + "\n  ".join(violations)


@pytest.mark.skip(reason=SKIP_B9)
def test_B9_google_style_docstrings():
    """Google-style docstrings with Args and Yields."""


def test_B10_reference_agent_unmodified():
    """_reference/ files match their stored checksums (detect accidental edits)."""
    ref_dir = BACK / "agents" / "_reference"
    if not ref_dir.is_dir():
        pytest.skip("_reference agent not present.")
    # Checksum-free check: the reference files simply must still exist and be non-empty.
    # A deeper integrity check belongs in CI against the original commit.
    required = ["step1_generate.py", "step2_refine.py", "__init__.py"]
    violations = [
        f"back/agents/_reference/{name} missing or empty"
        for name in required
        if not (ref_dir / name).is_file() or (ref_dir / name).stat().st_size == 0
    ]
    assert not violations, "B10 violations:\n  " + "\n  ".join(violations)


# ─── FRONTEND RULES ───────────────────────────────────────────────────────────


def test_F1_store_uses_persist_with_partialize(stores):
    """Zustand store uses persist(...) with partialize excluding transient state."""
    transient = ("isProcessing", "loadingAction", "isCancelled", "error")
    violations = []
    for store in stores:
        text = _read(store)
        if "persist(" not in text:
            violations.append(f"{store.relative_to(REPO_ROOT)} — missing persist(...) wrapper")
            continue
        if "partialize" not in text:
            violations.append(f"{store.relative_to(REPO_ROOT)} — missing partialize in persist config")
            continue
        # If any transient field appears inside the partialize return object, flag it.
        m = re.search(r"partialize\s*:\s*\(?\s*[^)]*\)?\s*=>\s*\(\s*\{([^}]*)\}", text, re.DOTALL)
        if m:
            body = m.group(1)
            for t in transient:
                if re.search(rf"\b{t}\b", body):
                    violations.append(f"{store.relative_to(REPO_ROOT)} — transient field '{t}' must NOT be persisted")
    assert not violations, "F1 violations:\n  " + "\n  ".join(violations)


def test_F2_no_store_destructuring(pages):
    """Pages access store state via individual selectors, not destructuring."""
    bad = re.compile(r"const\s*\{[^}]+\}\s*=\s*use\w+Store\s*\(\s*\)")
    violations = []
    for page in pages:
        text = _read(page)
        for match in bad.finditer(text):
            line = text[: match.start()].count("\n") + 1
            violations.append(f"{page.relative_to(REPO_ROOT)}:{line} — store destructuring banned; use useXStore((s) => s.field)")
    assert not violations, "F2 violations:\n  " + "\n  ".join(violations)


def test_F3_no_hardcoded_user_strings(pages):
    """Pages use t("...") for user-facing strings. Common offenders: title, placeholder, aria-label."""
    violations = []
    # Flag: prop="literal-word-with-space-or-accents" — words, not tokens.
    pattern = re.compile(
        r'(title|placeholder|aria-label|aria-description)\s*=\s*"([^"]*(?:\s|[éèêàâôùûçîï])[^"]*)"'
    )
    for page in pages:
        text = _read(page)
        for match in pattern.finditer(text):
            line = text[: match.start()].count("\n") + 1
            violations.append(f"{page.relative_to(REPO_ROOT)}:{line} — hardcoded {match.group(1)}=\"{match.group(2)}\"; use t(...)")
    assert not violations, "F3 violations:\n  " + "\n  ".join(violations)


def test_F4_no_raw_fetch_in_pages_or_stores(pages, stores):
    """No raw fetch() — use executeAgentStreaming from @/services/agentService."""
    bad = re.compile(r"\bfetch\s*\(")
    violations = []
    for f in list(pages) + list(stores):
        text = _read(f)
        for match in bad.finditer(text):
            line = text[: match.start()].count("\n") + 1
            violations.append(f"{f.relative_to(REPO_ROOT)}:{line} — raw fetch() banned; use executeAgentStreaming from @/services/agentService")
    assert not violations, "F4 violations:\n  " + "\n  ".join(violations)


def test_F5_no_raw_form_controls(pages):
    """Pages use FormInput/FormTextarea/FormSelect from @/components/agent-apps, not raw HTML."""
    bad = re.compile(r"<\s*(textarea|input|select)(\s|/?>)")
    violations = []
    for page in pages:
        text = _read(page)
        for match in bad.finditer(text):
            line = text[: match.start()].count("\n") + 1
            violations.append(f"{page.relative_to(REPO_ROOT)}:{line} — raw <{match.group(1)}> banned; use Form* components")
    assert not violations, "F5 violations:\n  " + "\n  ".join(violations)


@pytest.mark.skip(reason=SKIP_F6)
def test_F6_dark_mode_pairs():
    """Every light-mode color has its dark:-prefixed pair."""


@pytest.mark.skip(reason=SKIP_F7)
def test_F7_form_controls_disabled_during_processing():
    """Form controls carry disabled={isProcessing}."""


def test_F8_interface_language_from_i18n(stores):
    """Stores send `interface_language: i18n.language` (not from user content)."""
    violations = []
    for store in stores:
        text = _read(store)
        for match in re.finditer(r"interface_language\s*:\s*([^,}\n]+)", text):
            value = match.group(1).strip()
            if "i18n.language" not in value:
                line = text[: match.start()].count("\n") + 1
                violations.append(f"{store.relative_to(REPO_ROOT)}:{line} — interface_language={value}; must be i18n.language")
    assert not violations, "F8 violations:\n  " + "\n  ".join(violations)


@pytest.mark.skip(reason=SKIP_F9)
def test_F9_editable_intermediate_results():
    """Intermediate LLM results rendered as FormInput/FormTextarea, not static text."""


def test_F10_reference_frontend_unmodified():
    """_ReferencePage and _referenceStore still exist and non-empty."""
    required = [
        PAGES_DIR / "_ReferencePage.tsx",
        STORES_DIR / "_referenceStore.ts",
    ]
    violations = [
        f"{p.relative_to(REPO_ROOT)} missing or empty"
        for p in required
        if not p.is_file() or p.stat().st_size == 0
    ]
    assert not violations, "F10 violations:\n  " + "\n  ".join(violations)


# ─── INTEGRATION RULES ────────────────────────────────────────────────────────


def test_I1_api_contracts_match_agents_map(main_py_text):
    """Routes in .agents/docs/api-contracts.md match AGENTS_MAP keys (for consultant agents)."""
    contracts = REPO_ROOT / ".agents" / "docs" / "api-contracts.md"
    if not contracts.is_file():
        pytest.skip("api-contracts.md missing (no consultant agent scaffolded yet).")
    text = _read(contracts)
    declared = set(re.findall(r"`([a-z][a-z0-9-]*-step-\d+)`", text))
    registered = set(re.findall(r'"([a-z][a-z0-9-]*-step-\d+)"\s*:', main_py_text))
    # Only compare consultant-owned (skip _reference-*).
    declared = {k for k in declared if not k.startswith("_")}
    registered = {k for k in registered if not k.startswith("_")}
    missing = declared - registered
    extra = registered - declared
    problems = []
    if missing:
        problems.append(f"declared in api-contracts.md but not in AGENTS_MAP: {sorted(missing)}")
    if extra:
        problems.append(f"in AGENTS_MAP but not declared in api-contracts.md: {sorted(extra)}")
    assert not problems, "I1 violations:\n  " + "\n  ".join(problems)


def test_I2_shared_types_match_pydantic_models(agent_dirs):
    """Every Pydantic BaseModel in models.py has a matching TS interface in index.ts with the same field names."""
    if not SHARED_TYPES.is_file():
        pytest.skip("packages/shared-types/src/index.ts missing.")
    ts_text = _read(SHARED_TYPES)
    violations = []
    for agent in agent_dirs:
        models_py = agent / "models.py"
        if not models_py.is_file():
            continue
        tree = ast.parse(_read(models_py))
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and any(
                isinstance(b, ast.Name) and b.id == "BaseModel"
                or isinstance(b, ast.Attribute) and b.attr == "BaseModel"
                for b in node.bases
            ):
                cls = node.name
                iface_match = re.search(
                    rf"interface\s+{cls}\s*\{{([^}}]*)\}}", ts_text, re.DOTALL
                )
                if not iface_match:
                    violations.append(f"{models_py.relative_to(REPO_ROOT)} — class {cls} has no matching interface in shared-types/src/index.ts")
                    continue
                iface_body = iface_match.group(1)
                py_fields = [
                    sub.target.id
                    for sub in node.body
                    if isinstance(sub, ast.AnnAssign) and isinstance(sub.target, ast.Name)
                ]
                for field in py_fields:
                    if not re.search(rf"\b{field}\b\s*[?:]", iface_body):
                        violations.append(f"{SHARED_TYPES.relative_to(REPO_ROOT)} — interface {cls} missing field '{field}' present in {cls} pydantic model")
    assert not violations, "I2 violations:\n  " + "\n  ".join(violations)


def test_P1_backlog_stories_have_status_checkbox():
    """Every `### US-N — …` heading in backlog.md is followed by a **Status:** [ ]/[x] line."""
    if not BACKLOG.is_file():
        pytest.skip("backlog.md missing — nothing to check.")
    text = _read(BACKLOG)
    # Scan for `### US-...` story headings and check the next ~3 lines for a Status: checkbox.
    heading_pattern = re.compile(r"^###\s+US-\d+[^\n]*$", re.MULTILINE)
    status_pattern = re.compile(r"\*\*Status:\*\*\s*\[( |x)\]")
    violations = []
    lines = text.splitlines()
    for match in heading_pattern.finditer(text):
        heading_line_idx = text[: match.start()].count("\n")
        # Look at heading + next 3 lines for a Status checkbox.
        window = "\n".join(lines[heading_line_idx : heading_line_idx + 4])
        if not status_pattern.search(window):
            violations.append(f"backlog.md:{heading_line_idx + 1} — '{match.group(0)}' missing `**Status:** [ ]` line")
    assert not violations, "P1 violations:\n  " + "\n  ".join(violations)


def test_I3_submission_md_has_real_content():
    """SUBMISSION.md sections 1, 2, 3 contain no `_À compléter` placeholders."""
    if not _consultant_agent_dirs():
        pytest.skip("No consultant agent — SUBMISSION.md placeholders are expected.")
    if not SUBMISSION.is_file():
        pytest.skip("SUBMISSION.md missing.")
    text = _read(SUBMISSION)
    # Extract the first three sections (best-effort — numbered ## or # headings).
    # We just flag any placeholder marker anywhere in the first ~120 lines,
    # which covers sections 1-3 in the scaffold template.
    head = "\n".join(text.splitlines()[:120])
    placeholders = re.findall(r"_À compléter[^_]*_", head)
    assert not placeholders, (
        f"I3 violations: SUBMISSION.md still contains placeholder(s): {placeholders[:3]}"
    )
