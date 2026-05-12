"""Elio coding-contract test suite (v4).

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
REGISTERED_APPS_PY = BACK / "registered_apps.py"
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


def _agent_source_files(agent_dir: Path) -> list[Path]:
    """Return app.py (v4) and any legacy step*.py (v3) for an agent dir."""
    files = []
    app = agent_dir / "app.py"
    if app.is_file():
        files.append(app)
    files.extend(sorted(agent_dir.glob("step*.py")))
    return files


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _is_daa_class(node: ast.ClassDef) -> bool:
    """Return True if the class inherits DeclarativeAgentApp."""
    return any(
        (isinstance(b, ast.Name) and b.id == "DeclarativeAgentApp")
        or (isinstance(b, ast.Attribute) and b.attr == "DeclarativeAgentApp")
        for b in node.bases
    )


def _has_step_decorator(method: ast.AsyncFunctionDef) -> bool:
    """Return True if the method is decorated with @step or @step(...)."""
    return any(
        (isinstance(d, ast.Name) and d.id == "step")
        or (isinstance(d, ast.Call) and (
            (isinstance(d.func, ast.Name) and d.func.id == "step")
            or (isinstance(d.func, ast.Attribute) and d.func.attr == "step")
        ))
        for d in method.decorator_list
    )


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
        for src in _agent_source_files(agent):
            text = _read(src)
            for match in pattern.finditer(text):
                model = match.group(1)
                if model not in allowed_models:
                    line = text[: match.start()].count("\n") + 1
                    violations.append(
                        f"{src.relative_to(REPO_ROOT)}:{line} — get_llm('{model}') not in whitelist {sorted(allowed_models)}"
                    )
    assert not violations, "B1 violations:\n  " + "\n  ".join(violations)


def test_B2_declarative_agent_app_with_step_decorators(agent_dirs):
    """Each agent app.py defines a DeclarativeAgentApp subclass with @step-decorated methods."""
    violations = []
    for agent in agent_dirs:
        app_py = agent / "app.py"
        if not app_py.is_file():
            violations.append(f"{agent.relative_to(REPO_ROOT)}/app.py — missing (required in v4)")
            continue
        text = _read(app_py)
        tree = ast.parse(text)

        daa_classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef) and _is_daa_class(n)]
        if not daa_classes:
            violations.append(
                f"{app_py.relative_to(REPO_ROOT)} — no class inheriting DeclarativeAgentApp found"
            )
            continue

        for cls_node in daa_classes:
            step_methods = [
                n for n in ast.walk(cls_node)
                if isinstance(n, ast.AsyncFunctionDef) and _has_step_decorator(n)
            ]
            if not step_methods:
                violations.append(
                    f"{app_py.relative_to(REPO_ROOT)} — class {cls_node.name} has no @step-decorated methods"
                )
    assert not violations, "B2 violations:\n  " + "\n  ".join(violations)


@pytest.mark.skip(reason=SKIP_B3)
def test_B3_sse_payload_shape():
    """SSE yields use self.in_progress()/self.completed()/self.error() helpers."""


def test_B4_app_registered_in_registered_apps(agent_dirs):
    """Every DeclarativeAgentApp subclass is in registered_apps.py with a kebab-case key."""
    if not REGISTERED_APPS_PY.is_file():
        pytest.skip("back/registered_apps.py missing — backend not initialized.")
    reg_text = _read(REGISTERED_APPS_PY)
    violations = []

    for agent in agent_dirs:
        app_py = agent / "app.py"
        if not app_py.is_file():
            continue
        tree = ast.parse(_read(app_py))
        class_names = [
            n.name for n in ast.walk(tree)
            if isinstance(n, ast.ClassDef) and _is_daa_class(n)
        ]
        for cls_name in class_names:
            if cls_name not in reg_text:
                violations.append(
                    f"{app_py.relative_to(REPO_ROOT)} — class {cls_name} not found in registered_apps.py"
                )

    # All non-reference keys must be kebab-case (hyphens, not underscores)
    key_pattern = re.compile(r'"([a-z][a-z0-9-]*)"\s*:')
    for key in key_pattern.findall(reg_text):
        if key.startswith("_"):
            continue
        if "_" in key:
            violations.append(
                f"registered_apps.py — key '{key}' must be kebab-case (use hyphens, not underscores)"
            )

    assert not violations, "B4 violations:\n  " + "\n  ".join(violations)


def test_B5_no_direct_llm_instantiation(agent_dirs):
    """Only `from services.llm_config import get_llm` — no direct LLM class instantiation."""
    banned = re.compile(r"\b(AzureChatOpenAI|ChatOpenAI|ChatAnthropic|AzureOpenAI)\s*\(")
    violations = []
    for agent in agent_dirs:
        for src in _agent_source_files(agent):
            text = _read(src)
            for match in banned.finditer(text):
                line = text[: match.start()].count("\n") + 1
                violations.append(
                    f"{src.relative_to(REPO_ROOT)}:{line} — direct {match.group(1)}() instantiation banned; use get_llm()"
                )
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
            violations.append(
                f"{agent.relative_to(REPO_ROOT)}/tests/ — only {count} test(s), min 5 required"
            )
    assert not violations, "B6 violations:\n  " + "\n  ".join(violations)


def test_B7_prompts_file_exists_and_no_hardcoded_strings(agent_dirs):
    """prompts.py exists. app.py contains no hardcoded FR/EN user-facing strings."""
    french_chars = re.compile(r"[éèêàâôùûçîï]")
    banned_phrases = re.compile(
        r'["\'](Initialisation|Génération|Terminé|Draft generated|Done!|Terminé !|En cours|Complete)[^"\']*["\']'
    )
    violations = []
    for agent in agent_dirs:
        if not (agent / "prompts.py").is_file():
            violations.append(f"{agent.relative_to(REPO_ROOT)}/prompts.py — missing")

        for src in _agent_source_files(agent):
            text = _read(src)
            stripped = re.sub(r"logger\.\w+\([^)]*\)", "", text)
            for match in banned_phrases.finditer(stripped):
                line = stripped[: match.start()].count("\n") + 1
                violations.append(
                    f"{src.relative_to(REPO_ROOT)}:{line} — hardcoded UI string {match.group(0)}; move to prompts.py"
                )
            for lineno, line in enumerate(stripped.splitlines(), 1):
                if french_chars.search(line) and ('"' in line or "'" in line):
                    if line.strip().startswith("#"):
                        continue
                    if re.search(r'["\'][^"\']*[éèêàâôùûçîï][^"\']*["\']', line):
                        violations.append(
                            f"{src.relative_to(REPO_ROOT)}:{lineno} — French string literal; move to prompts.py"
                        )
    assert not violations, "B7 violations:\n  " + "\n  ".join(violations)


def test_B8_step_methods_handle_lang(agent_dirs):
    """Every @step method reads `lang` from inputs or kwargs (i18n-aware generation)."""
    violations = []
    for agent in agent_dirs:
        app_py = agent / "app.py"
        if not app_py.is_file():
            continue
        text = _read(app_py)
        tree = ast.parse(text)

        for cls_node in ast.walk(tree):
            if not isinstance(cls_node, ast.ClassDef) or not _is_daa_class(cls_node):
                continue
            for method in ast.walk(cls_node):
                if not isinstance(method, ast.AsyncFunctionDef):
                    continue
                if not _has_step_decorator(method):
                    continue
                method_src = ast.get_source_segment(text, method) or ""
                if "lang" not in method_src:
                    violations.append(
                        f"{app_py.relative_to(REPO_ROOT)}:{method.lineno} — @step method "
                        f"'{method.name}' does not read 'lang' "
                        f"(add `lang = inputs.lang or kwargs.get(\"lang\", \"fr\")`)"
                    )
    assert not violations, "B8 violations:\n  " + "\n  ".join(violations)


@pytest.mark.skip(reason=SKIP_B9)
def test_B9_google_style_docstrings():
    """Google-style docstrings with Args and Yields on class and @step methods."""


def test_B10_reference_agent_unmodified():
    """_reference/ v4 files still exist and are non-empty."""
    ref_dir = BACK / "agents" / "_reference"
    if not ref_dir.is_dir():
        pytest.skip("_reference agent not present.")
    required = ["app.py", "schemas.py", "prompts.py", "__init__.py"]
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
        m = re.search(r"partialize\s*:\s*\(?\s*[^)]*\)?\s*=>\s*\(\s*\{([^}]*)\}", text, re.DOTALL)
        if m:
            body = m.group(1)
            for t in transient:
                if re.search(rf"\b{t}\b", body):
                    violations.append(
                        f"{store.relative_to(REPO_ROOT)} — transient field '{t}' must NOT be persisted"
                    )
    assert not violations, "F1 violations:\n  " + "\n  ".join(violations)


def test_F2_no_store_destructuring(pages):
    """Pages access store state via individual selectors, not destructuring."""
    bad = re.compile(r"const\s*\{[^}]+\}\s*=\s*use\w+Store\s*\(\s*\)")
    violations = []
    for page in pages:
        text = _read(page)
        for match in bad.finditer(text):
            line = text[: match.start()].count("\n") + 1
            violations.append(
                f"{page.relative_to(REPO_ROOT)}:{line} — store destructuring banned; use useXStore((s) => s.field)"
            )
    assert not violations, "F2 violations:\n  " + "\n  ".join(violations)


def test_F3_no_hardcoded_user_strings(pages):
    """Pages use t("...") for user-facing strings. Common offenders: title, placeholder, aria-label."""
    violations = []
    pattern = re.compile(
        r'(title|placeholder|aria-label|aria-description)\s*=\s*"([^"]*(?:\s|[éèêàâôùûçîï])[^"]*)"'
    )
    for page in pages:
        text = _read(page)
        for match in pattern.finditer(text):
            line = text[: match.start()].count("\n") + 1
            violations.append(
                f"{page.relative_to(REPO_ROOT)}:{line} — hardcoded {match.group(1)}=\"{match.group(2)}\"; use t(...)"
            )
    assert not violations, "F3 violations:\n  " + "\n  ".join(violations)


def test_F4_no_raw_fetch_in_pages_or_stores(pages, stores):
    """No raw fetch() — use executeAgentStreaming from @/services/agentService."""
    bad = re.compile(r"\bfetch\s*\(")
    violations = []
    for f in list(pages) + list(stores):
        text = _read(f)
        for match in bad.finditer(text):
            line = text[: match.start()].count("\n") + 1
            violations.append(
                f"{f.relative_to(REPO_ROOT)}:{line} — raw fetch() banned; use executeAgentStreaming from @/services/agentService"
            )
    assert not violations, "F4 violations:\n  " + "\n  ".join(violations)


def test_F5_no_raw_form_controls(pages):
    """Pages use FormInput/FormTextarea/FormSelect from @/components/agent-apps, not raw HTML."""
    bad = re.compile(r"<\s*(textarea|input|select)(\s|/?>)")
    violations = []
    for page in pages:
        text = _read(page)
        for match in bad.finditer(text):
            line = text[: match.start()].count("\n") + 1
            violations.append(
                f"{page.relative_to(REPO_ROOT)}:{line} — raw <{match.group(1)}> banned; use Form* components"
            )
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
                violations.append(
                    f"{store.relative_to(REPO_ROOT)}:{line} — interface_language={value}; must be i18n.language"
                )
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


def test_I1_api_contracts_match_registered_apps(main_py_text):
    """App IDs in registered_apps.py appear in api-contracts.md."""
    contracts = REPO_ROOT / ".agents" / "docs" / "api-contracts.md"
    if not contracts.is_file():
        pytest.skip("api-contracts.md missing (no consultant agent scaffolded yet).")
    if not REGISTERED_APPS_PY.is_file():
        pytest.skip("registered_apps.py missing.")

    reg_text = _read(REGISTERED_APPS_PY)
    contracts_text = _read(contracts)

    key_pattern = re.compile(r'"([a-z][a-z0-9-]*)"\s*:')
    registered_ids = {k for k in key_pattern.findall(reg_text) if not k.startswith("_")}

    problems = []
    for app_id in sorted(registered_ids):
        if app_id not in contracts_text:
            problems.append(
                f"app_id '{app_id}' in registered_apps.py not referenced in api-contracts.md"
            )
    assert not problems, "I1 violations:\n  " + "\n  ".join(problems)


def test_I2_shared_types_match_pydantic_models(agent_dirs):
    """Every Pydantic BaseModel in schemas.py / models.py has a matching TS interface in index.ts."""
    if not SHARED_TYPES.is_file():
        pytest.skip("packages/shared-types/src/index.ts missing.")
    ts_text = _read(SHARED_TYPES)
    violations = []
    for agent in agent_dirs:
        # v4: schemas.py; v3 legacy: models.py
        for models_file in [agent / "schemas.py", agent / "models.py"]:
            if not models_file.is_file():
                continue
            tree = ast.parse(_read(models_file))
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
                        violations.append(
                            f"{models_file.relative_to(REPO_ROOT)} — class {cls} has no matching interface in shared-types/src/index.ts"
                        )
                        continue
                    iface_body = iface_match.group(1)
                    py_fields = [
                        sub.target.id
                        for sub in node.body
                        if isinstance(sub, ast.AnnAssign) and isinstance(sub.target, ast.Name)
                    ]
                    for field in py_fields:
                        if not re.search(rf"\b{field}\b\s*[?:]", iface_body):
                            violations.append(
                                f"{SHARED_TYPES.relative_to(REPO_ROOT)} — interface {cls} missing field '{field}'"
                            )
    assert not violations, "I2 violations:\n  " + "\n  ".join(violations)


def test_P1_backlog_stories_have_status_checkbox():
    """Every `### US-N — …` heading in backlog.md is followed by a **Status:** [ ]/[x] line."""
    if not BACKLOG.is_file():
        pytest.skip("backlog.md missing — nothing to check.")
    text = _read(BACKLOG)
    heading_pattern = re.compile(r"^###\s+US-\d+[^\n]*$", re.MULTILINE)
    status_pattern = re.compile(r"\*\*Status:\*\*\s*\[( |x)\]")
    violations = []
    lines = text.splitlines()
    for match in heading_pattern.finditer(text):
        heading_line_idx = text[: match.start()].count("\n")
        window = "\n".join(lines[heading_line_idx : heading_line_idx + 4])
        if not status_pattern.search(window):
            violations.append(
                f"backlog.md:{heading_line_idx + 1} — '{match.group(0)}' missing `**Status:** [ ]` line"
            )
    assert not violations, "P1 violations:\n  " + "\n  ".join(violations)


def test_I3_submission_md_has_real_content():
    """SUBMISSION.md sections 1, 2, 3 contain no `_À compléter` placeholders."""
    if not _consultant_agent_dirs():
        pytest.skip("No consultant agent — SUBMISSION.md placeholders are expected.")
    if not SUBMISSION.is_file():
        pytest.skip("SUBMISSION.md missing.")
    text = _read(SUBMISSION)
    head = "\n".join(text.splitlines()[:120])
    placeholders = re.findall(r"_À compléter[^_]*_", head)
    assert not placeholders, (
        f"I3 violations: SUBMISSION.md still contains placeholder(s): {placeholders[:3]}"
    )
