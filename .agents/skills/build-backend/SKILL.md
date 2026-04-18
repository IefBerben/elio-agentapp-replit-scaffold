# Skill: build-backend

Build the Python backend agent following the Elio platform conventions.
Read `.agents/docs/AGENT_APP_GUIDELINES_BACK.md` and `.agents/docs/CONVENTIONS.md` before writing any code.

---

## Prerequisites

- `.agents/docs/api-contracts.md` is approved
- `packages/shared-types/src/index.ts` exists
- `replit.md` "App being built" section is filled

---

## File creation order

Build files in this exact order. Each file must be syntactically correct before moving to the next.

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

### 6. `back/agents/{name}/tests/__init__.py` + `tests/test_step1.py`

Minimum 5 tests using `pytest` + `unittest.mock`:

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

## After build

Run tests:
```bash
cd back && uv run pytest agents/{name}/tests/ -v
```

If any test fails: fix it before reporting done. Apply fix-retry cap: max 2 attempts per failure, then escalate.

Update `replit.md` — set Backend status to ✅.

Report to user:
```
Backend construit :
- back/agents/{name}/ créé avec [N] step(s)
- [N] tests passants
- Enregistré dans AGENTS_MAP : {kebab-name}-step-1

Je commence le frontend ?
```
