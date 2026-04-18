"""Step 2 — Refine and expand the Step 1 output (optional step).

HOW TO USE:
    This file is the REFERENCE EXAMPLE — do not modify.
    This step is optional. Remove it if your use case only needs one step.
    Update AGENTS_MAP in main.py accordingly.
    Always decorate your step function with @stream_safe.

INTEGRATION:
    Registered in back/main.py AGENTS_MAP as "_reference-step-2"
    Called by the frontend via executeAgentStreaming("_reference-step-2", ...)
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
        from agents._reference import prompt_en as prompts
    else:
        from agents._reference import prompt_fr as prompts
    return prompts


@stream_safe
async def reference_step_2_stream(
    username: str,
    prompt: str,
    step1_result: dict,
    language: str = "fr",
    interface_language: str | None = None,
    **kwargs: Any,
) -> AsyncGenerator[dict[str, Any], None]:
    """Stream Step 2 — refine and expand Step 1 output.

    Args:
        username: Username of the requester.
        prompt: Original user request.
        step1_result: Result dict from Step 1.
        language: Output language, 'fr' or 'en' (default 'fr').
        interface_language: UI language for progress messages (defaults to language).
        **kwargs: Additional parameters (ignored).

    Yields:
        Dict with SSE streaming updates.
    """
    ui_lang = interface_language or language
    prompts = _get_prompts(ui_lang)

    logger.info(f"[Step 2] Starting for user={username}")

    yield {
        "step": "beginning",
        "message": prompts.MSG_PREPARING,
        "status": "in_progress",
        "progress": 0,
    }

    filled_prompt = prompts.STEP2_SYSTEM.format(
        prompt=prompt,
        step1_result=json.dumps(step1_result, ensure_ascii=False),
    )

    yield {
        "step": "generating",
        "message": prompts.MSG_RECOMMENDATIONS,
        "status": "in_progress",
        "progress": 20,
    }

    llm = get_llm()
    messages = [SystemMessage(content=filled_prompt)]

    # Stream token by token
    buffer = ""
    async for chunk in llm.astream(messages):
        token = chunk.content if hasattr(chunk, "content") else str(chunk)
        buffer += token
        yield {
            "step": "streaming",
            "message": prompts.MSG_GENERATING,
            "status": "in_progress",
            "progress": 60,
        }

    # Strip markdown fences
    cleaned = (
        buffer.strip()
        .removeprefix("```json")
        .removeprefix("```")
        .removesuffix("```")
        .strip()
    )
    result_data = json.loads(cleaned)

    yield {
        "step": "completed",
        "message": "Analyse terminée !" if language == "fr" else "Analysis complete!",
        "status": "completed",
        "progress": 100,
        "result": result_data,
    }

    logger.info(f"[Step 2] Completed for user={username}")
