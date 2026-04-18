"""Step 1 — Generate initial output from user prompt.

HOW TO USE:
    This file is the REFERENCE EXAMPLE — do not modify.
    Copy this folder and rename it for your own use case.
    To adapt for your use case:
    - Edit prompt_fr.py and prompt_en.py with your own prompts
    - Update the JSON output structure in the prompts
    - Update the corresponding pydantic model in models.py
    - The SSE pattern (yield dicts) must be preserved as-is
    - Always decorate your step function with @stream_safe

INTEGRATION:
    Registered in back/main.py AGENTS_MAP as "_reference-step-1"
    Called by the frontend via executeAgentStreaming("_reference-step-1", ...)
"""

import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

from langchain_core.messages import SystemMessage

from llm_config import get_llm
from utils.stream_error_handler import stream_safe

logger = logging.getLogger(__name__)


def _get_prompts(interface_language: str):
    """Return the prompt module matching the interface language."""
    if interface_language == "en":
        from agents._reference import prompt_en as prompts
    else:
        from agents._reference import prompt_fr as prompts
    return prompts


@stream_safe
async def reference_step_1_stream(
    username: str,
    prompt: str,
    context: str = "",
    language: str = "fr",
    interface_language: str | None = None,
    **kwargs: Any,
) -> AsyncGenerator[dict[str, Any], None]:
    """Stream Step 1 — generate initial output from user prompt.

    Args:
        username: Username of the requester.
        prompt: Main user request (required).
        context: Optional additional context.
        language: Output language, 'fr' or 'en' (default 'fr').
        interface_language: UI language for progress messages (defaults to language).
        **kwargs: Additional parameters (ignored).

    Yields:
        Dict with SSE streaming updates.
    """
    ui_lang = interface_language or language
    prompts = _get_prompts(ui_lang)

    logger.info(f"[Step 1] Starting for user={username}, prompt='{prompt[:60]}...'")

    yield {
        "step": "beginning",
        "message": prompts.MSG_INIT,
        "status": "in_progress",
        "progress": 0,
    }

    # ── Build prompt ──────────────────────────────────────────────────────────
    context_block = f"Additional context:\n{context}" if context.strip() else ""

    filled_prompt = prompts.STEP1_SYSTEM.format(
        prompt=prompt,
        context_block=context_block,
    )

    yield {
        "step": "generating",
        "message": prompts.MSG_GENERATING,
        "status": "in_progress",
        "progress": 30,
    }

    # ── Call LLM ──────────────────────────────────────────────────────────────
    llm = get_llm()
    messages = [SystemMessage(content=filled_prompt)]
    response = await llm.ainvoke(messages)

    yield {
        "step": "parsing",
        "message": prompts.MSG_PARSING,
        "status": "in_progress",
        "progress": 80,
    }

    # ── Parse response ────────────────────────────────────────────────────────
    response_text = (
        response.content.strip()
        .removeprefix("```json")
        .removeprefix("```")
        .removesuffix("```")
        .strip()
    )

    result_data = json.loads(response_text)

    # ── Completed ─────────────────────────────────────────────────────────────
    yield {
        "step": "completed",
        "message": "Terminé !" if language == "fr" else "Done!",
        "status": "completed",
        "progress": 100,
        "result": result_data,
    }

    logger.info(f"[Step 1] Completed for user={username}")
