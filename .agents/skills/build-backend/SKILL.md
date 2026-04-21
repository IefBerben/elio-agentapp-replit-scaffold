# Skill: build-backend

Build the Python backend agent following the Elio platform conventions.

**Your code must pass `back/tests/test_elio_contract.py`.** That file is the concrete rule source — read it before you write any code. It encodes every mechanical B-rule (whitelist, `@stream_safe`, registration, test count, bilingual prompts, `interface_language` parameter, …) as real assertions. Prose guidelines (`.agents/docs/AGENT_APP_GUIDELINES_BACK.md` and `CONVENTIONS.md`) give context; the test file gives the truth.

---

## Prerequisites

- `.agents/docs/api-contracts.md` is approved
- `packages/shared-types/src/index.ts` exists
- `replit.md` "App being built" section is filled
- `backlog.md` exists with at least one Must Have story carrying `**Status:** [ ] not started`

---

## Build scope and the backlog ledger

`backlog.md` is both the plan and the progress ledger. **Default mode: build every unchecked Must Have in one invocation**, ticking each `**Status:**` box as that story's code + tests land. **Stop at the Must Have / Should Have boundary.** Never auto-promote Should or Could items — those require an explicit PO handoff.

The consultant can also invoke this skill in **single-story mode** by saying `iterate US-N` or `only US-N` — in that case build just that story and stop.

Procedure on every invocation:

1. **Read `backlog.md`.** Collect every US-N under `## Must Have` whose `**Status:**` line is `[ ] not started`. If none, stop and tell the consultant all Must Haves are done — they can promote a Should / Could via the PO, or invoke `package-agent`.
2. **For each Must Have, in backlog order:**
   a. Scope the work to that story only. Don't pull fields, routes, or step functions from later stories.
   b. Build through the file-creation order below, limited to what this US-N requires. Earlier stories' files get extended rather than rewritten.
   c. Run the contract suite and the agent's own tests. Both must be green before moving on.
   d. **Tick the box.** Change `**Status:** [ ] not started` to `**Status:** [x] done — {short note}`. The tick IS the ledger — do not rely on git (the scaffold is transferred to consultants as a zip, not a repo). Tick **as soon as that story is green** — not at the end, so a partial run still leaves an honest ledger.
3. **Stop at the Must Have boundary.** Do not touch Should / Could stories. Emit the closing checklist (below) and wait for the consultant to invoke `build-frontend`, promote a Should, or run `verify-generation`.

If any story's tests fail and the 3-strike repair loop is exhausted, leave its box unticked with a `**Status:** [ ] blocked — {reason}` note, continue with the next Must Have that doesn't depend on it, and flag the blocker in the closing report.

---

## File creation order

Build files in this exact order. Each file must be syntactically correct before moving to the next.

**Tests come before implementation.** Step 1.5 writes a `tests/test_step1.py` skeleton with the 5 required test functions as `pytest.skip("TODO")` — B6 is then structurally guaranteed and you can't "forget" to write tests. Step 6 fills the bodies.

### 1. `back/agents/{name}/models.py`

Pydantic v2 models matching `packages/shared-types/src/index.ts` exactly.

```python
"""Pydantic models for the {name} agent app."""

from pydantic import BaseModel, Field


class {Name}Step1Input(BaseModel):
    """Input payload for Step 1."""
    username: str = Field(description="Requester username")
    prompt: str = Field(description="...")
    interface_language: str | None = Field(default=None, description="UI language: 'fr' or 'en'")


class {Name}Step1Result(BaseModel):
    """Result produced by Step 1."""
    # ... fields matching api-contracts.md
```

- Every field needs a `Field(description="...")` with a clear description
- Google-style docstring on every class

### 2. `back/agents/{name}/prompt_fr.py` + `prompt_en.py`

Prompt constants only — no logic.

```python
"""French prompts for the {name} agent."""

STEP1_SYSTEM = """You are a consulting assistant at Onepoint.
User request: {prompt}
{context_block}

[Instructions in French for FR prompts / English for EN prompts]

Return a JSON object with exactly this structure (no markdown, no ```):
{{
  "field": "value"
}}

Respond ONLY with valid JSON."""

# UI progress messages
MSG_INIT = "Initialisation..."
MSG_GENERATING = "Génération en cours..."
MSG_PARSING = "Analyse de la réponse..."
```

Rules:
- Use `{placeholder}` for all dynamic values
- Every prompt returns **only valid JSON** — include that instruction
- French prompts respond in French; English prompts respond in English

### 2.5. `back/agents/{name}/tests/__init__.py` + `tests/test_step1.py` (skeleton — bodies filled in step 6)

Write the test file **before** the step implementation. Empty bodies, `pytest.skip` markers. This makes B6 ("minimum 5 tests per step") structurally impossible to miss.

```python
"""Tests for {name} Step 1."""

import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_step1_happy_path():
    """Happy path — returns summary and key points."""
    pytest.skip("TODO — fill in step 6 of build-backend")


@pytest.mark.asyncio
async def test_step1_empty_prompt():
    """Empty prompt handled gracefully."""
    pytest.skip("TODO")


@pytest.mark.asyncio
async def test_step1_language_fr():
    """French interface language uses French prompts."""
    pytest.skip("TODO")


@pytest.mark.asyncio
async def test_step1_language_en():
    """English interface language uses English prompts."""
    pytest.skip("TODO")


@pytest.mark.asyncio
async def test_step1_llm_error():
    """LLM error is caught and yields error event."""
    pytest.skip("TODO")
```

Repeat for `test_step2.py` if the agent has a step 2.

### 3. `back/agents/{name}/step1_{name}.py`

```python
"""Step 1 — [description].

Follow the pattern in back/agents/_reference/step1_generate.py.
"""

import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

from langchain_core.messages import SystemMessage

from services.llm_config import get_llm
from utils.stream_error_handler import stream_safe

logger = logging.getLogger(__name__)


def _get_prompts(interface_language: str):
    """Return the prompt module matching the interface language."""
    if interface_language == "en":
        from agents.{name} import prompt_en as prompts
    else:
        from agents.{name} import prompt_fr as prompts
    return prompts


@stream_safe
async def {name}_step_1_stream(
    username: str,
    prompt: str,
    interface_language: str = "fr",
    **kwargs: Any,
) -> AsyncGenerator[dict[str, Any], None]:
    """Stream Step 1 — [description].

    Args:
        username: Username of the requester.
        prompt: [Description].
        interface_language: UI language for progress messages ('fr' or 'en').
        **kwargs: Additional parameters (ignored).

    Yields:
        Dict with SSE streaming updates.
    """
    prompts = _get_prompts(interface_language or "fr")

    yield {"step": "beginning", "message": prompts.MSG_INIT, "status": "in_progress", "progress": 0}

    # Build prompt
    filled_prompt = prompts.STEP1_SYSTEM.format(prompt=prompt, ...)

    yield {"step": "generating", "message": prompts.MSG_GENERATING, "status": "in_progress", "progress": 30}

    # Call LLM
    llm = get_llm()
    messages = [SystemMessage(content=filled_prompt)]
    response = await llm.ainvoke(messages)

    yield {"step": "parsing", "message": prompts.MSG_PARSING, "status": "in_progress", "progress": 80}

    # Parse JSON response
    text = response.content.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    result_data = json.loads(text)

    yield {
        "step": "completed",
        "message": "Terminé !" if (interface_language or "fr") == "fr" else "Done!",
        "status": "completed",
        "progress": 100,
        "result": result_data,
    }
```

Rules:
- `@stream_safe` decorator is mandatory — never omit
- `from services.llm_config import get_llm` — never instantiate LLM directly
- Wrap everything in try/except inside `@stream_safe` context (the decorator handles the outer error)
- Only `"result"` key in the completed yield — no other payload keys at the top level

### 4. `back/agents/{name}/step2_{name}.py` (if multi-step)

Same pattern as Step 1. Receives `step1_result: dict` as input parameter.
For streaming text responses, use `llm.astream()` and yield progress events during streaming.

### 5. `back/agents/{name}/__init__.py`

```python
"""Exports for the {name} agent."""

from agents.{name}.step1_{name} import {name}_step_1_stream

__all__ = ["{name}_step_1_stream"]
```

### 6. Fill the test bodies in `back/agents/{name}/tests/test_step*.py`

Replace every `pytest.skip("TODO")` placeholder from step 2.5 with a real assertion. Minimum 5 tests per step using `pytest` + `unittest.mock`:

```python
"""Tests for {name} Step 1."""

import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_step1_happy_path():
    """Happy path — returns summary and key points."""

@pytest.mark.asyncio
async def test_step1_empty_prompt():
    """Empty prompt handled gracefully."""

@pytest.mark.asyncio
async def test_step1_language_fr():
    """French interface language uses French prompts."""

@pytest.mark.asyncio
async def test_step1_language_en():
    """English interface language uses English prompts."""

@pytest.mark.asyncio
async def test_step1_llm_error():
    """LLM error is caught and yields error event."""
```

### 7. Register in `back/main.py`

Add import and AGENTS_MAP entry:

```python
from agents.{name} import {name}_step_1_stream

AGENTS_MAP["{kebab-name}-step-1"] = {name}_step_1_stream
```

Naming rules:
- Python folder: `snake_case` — `back/agents/my_usecase/`
- AGENTS_MAP key: `kebab-case` — `"my-usecase-step-1"`

---

---

## Banned patterns — learn from the last generation's mistakes

Each of these has been caught in a real consultant app. They are blocked by `back/tests/test_elio_contract.py`; avoiding them up front saves a repair loop.

### ❌ Direct LLM instantiation (B5)
```python
from langchain_openai import AzureChatOpenAI
llm = AzureChatOpenAI(model="gpt-4", ...)
```
### ✅ Use the scaffold helper
```python
from services.llm_config import get_llm
llm = get_llm()  # or get_llm("gpt-5-chat") for an explicit whitelisted model
```

### ❌ Non-whitelisted model name (B1)
```python
llm = get_llm("gpt-4-turbo")  # not in back/services/config_llms.json
```
### ✅ Pick from the whitelist
```python
llm = get_llm("gpt-5-chat")
```

### ❌ Hardcoded user-facing strings in step files (B7)
```python
yield {"step": "completed", "message": "Terminé !" if lang == "fr" else "Done!", ...}
```
### ✅ Centralize in prompt_fr.py / prompt_en.py
```python
# prompt_fr.py
MSG_COMPLETED = "Terminé !"
# step1_{name}.py
yield {"step": "completed", "message": prompts.MSG_COMPLETED, ...}
```

### ❌ Missing `@stream_safe` or `interface_language` (B2, B8)
```python
async def my_step_1_stream(username: str, prompt: str) -> AsyncGenerator[...]:
    ...
```
### ✅
```python
@stream_safe
async def my_step_1_stream(
    username: str, prompt: str, interface_language: str = "fr", **kwargs
) -> AsyncGenerator[dict[str, Any], None]:
    ...
```

---

## After build

Run tests:
```bash
cd back && uv run pytest agents/{name}/tests/ -v
cd back && uv run pytest tests/test_elio_contract.py -v
```

If any test fails: fix it before reporting done. Apply fix-retry cap: max 2 attempts per failure, then escalate.

Update `replit.md` — set Backend status to ✅.

Report to user **with this exact checklist** — do not replace with prose. A missing tick is a visible omission, not a silent one:

```
Backend construit :
- back/agents/{name}/ créé avec [N] step(s) registered as {kebab-name}-step-N
- [N] tests passants (fichiers tests/test_step*.py)

Contrat Elio — cases cochées au moment de remettre la main :
[ ] B1 — modèles utilisés : {liste}, tous dans config_llms.json
[ ] B2 — @stream_safe présent sur chaque fonction *_stream
[ ] B4 — clés AGENTS_MAP conformes au pattern <slug>-step-<N>
[ ] B5 — aucun AzureChatOpenAI()/ChatOpenAI() direct, seul get_llm() utilisé
[ ] B6 — ≥5 tests par step, bodies remplis (plus aucun pytest.skip("TODO"))
[ ] B7 — prompt_fr.py + prompt_en.py présents, zéro string FR/EN dans step*.py
[ ] B8 — interface_language: str = "fr" présent dans chaque signature *_stream
[ ] B10 — aucun fichier de back/agents/_reference/ touché

Je commence le frontend ?
```

> **Never report the overall app as done from this skill alone.** The full
> generation is declared complete only after `verify-generation` runs green.
> Frontend + verification come next.
