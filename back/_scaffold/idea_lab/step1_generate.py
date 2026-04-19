"""Step 1 — Generate 3 Agent App ideas tailored to the consultant's role.

Wired by the StarterPage on first Run. Disposable: removed by the
`remove-starter` skill once the consultant picks a path.
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
        from agents.idea_lab import prompt_en as prompts
    else:
        from agents.idea_lab import prompt_fr as prompts
    return prompts


@stream_safe
async def idea_lab_step_1_stream(
    username: str,
    role: str,
    pain: str,
    language: str = "fr",
    interface_language: str | None = None,
    **kwargs: Any,
) -> AsyncGenerator[dict[str, Any], None]:
    """Stream 3 Agent App ideas tailored to the consultant.

    Args:
        username: Username of the requester.
        role: Consultant's role / job title.
        pain: A weekly task that takes too much time today.
        language: Output language, 'fr' or 'en'.
        interface_language: UI language for progress messages.
        **kwargs: Additional parameters (ignored).

    Yields:
        SSE updates with `step`, `message`, `status`, `progress`. The
        completed yield includes a `result` key with `{ideas: [...]}`.
    """
    ui_lang = interface_language or language
    prompts = _get_prompts(ui_lang)

    logger.info(f"[idea_lab] Starting for user={username}, role='{role[:40]}...'")

    yield {
        "step": "beginning",
        "message": prompts.MSG_INIT,
        "status": "in_progress",
        "progress": 0,
    }

    filled_prompt = prompts.STEP1_SYSTEM.format(role=role, pain=pain)

    yield {
        "step": "generating",
        "message": prompts.MSG_THINKING,
        "status": "in_progress",
        "progress": 30,
    }

    llm = get_llm()
    response = await llm.ainvoke([SystemMessage(content=filled_prompt)])

    yield {
        "step": "parsing",
        "message": prompts.MSG_PARSING,
        "status": "in_progress",
        "progress": 80,
    }

    response_text = (
        response.content.strip()
        .removeprefix("```json")
        .removeprefix("```")
        .removesuffix("```")
        .strip()
    )

    result_data = json.loads(response_text)

    yield {
        "step": "completed",
        "message": "Terminé !" if language == "fr" else "Done!",
        "status": "completed",
        "progress": 100,
        "result": result_data,
    }

    logger.info(f"[idea_lab] Completed for user={username}")
