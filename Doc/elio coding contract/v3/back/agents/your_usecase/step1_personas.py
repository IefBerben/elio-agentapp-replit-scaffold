"""Step 1 — Generate two personas from a conversation topic.

This is the core business logic for Step 1.
Modify the prompt and parsing to fit your use case.
"""

import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

from langchain_core.messages import SystemMessage

from agents.your_usecase import prompt_en, prompt_fr
from services.llm_config import get_llm
from services.process_files import print_or_summarize

logger = logging.getLogger(__name__)


def _get_prompts(interface_language: str):
    """Select the prompt module matching the requested language.

    Args:
        interface_language: Language code (e.g. "fr", "en").

    Returns:
        The prompt module (prompt_fr or prompt_en).
    """
    if interface_language.startswith("fr"):
        return prompt_fr
    return prompt_en


async def conversation_step_1_stream(
    username: str,
    topic: str,
    persona1_hint: str = "",
    persona2_hint: str = "",
    file_paths: list[str] | None = None,
    interface_language: str = "fr",
    **kwargs: Any,
) -> AsyncGenerator[dict[str, Any], None]:
    """Stream persona generation for a given conversation topic.

    When file_paths are provided, their content is extracted (and summarized if
    too long) and injected into the prompt so the LLM can ground the personas in
    the actual documents.

    Args:
        username: Username of the requester.
        topic: The conversation subject (required).
        persona1_hint: Optional description hint for persona 1.
        persona2_hint: Optional description hint for persona 2.
        file_paths: Optional list of local file paths to include as context.
        **kwargs: Additional parameters (ignored).

    Yields:
        Dict with SSE streaming updates:
            - step: Current step identifier
            - message: User-facing progress message
            - status: "in_progress", "completed", or "error"
            - progress: 0-100
            - personas: (on completed) dict with persona1 and persona2
    """
    logger.info(f"[Step 1] Generating personas for topic='{topic}' user={username}")

    try:
        # ── Beginning ─────────────────────────────────────
        yield {
            "step": "beginning",
            "message": "Initializing persona generation...",
            "status": "in_progress",
            "progress": 0,
        }

        # ── Extract file content if provided ──────────────
        document_context = ""
        if file_paths:
            yield {
                "step": "extracting_files",
                "message": f"Extracting content from {len(file_paths)} file(s)...",
                "status": "in_progress",
                "progress": 15,
            }

            content_parts = []
            for file_path in file_paths:
                try:
                    content = await print_or_summarize(
                        file_path=file_path,
                        threshold=8_000,
                        language="FR",
                    )
                    content_parts.append(content)
                except Exception as e:
                    logger.warning(f"[Step 1] Could not process file {file_path}: {e}")

            if content_parts:
                document_context = (
                    "\n\nDocument context (use this to ground the discussion topic):\n"
                    + "\n\n".join(content_parts)
                    + "\n"
                )

        # ── Build prompt ──────────────────────────────────
        hints_parts = []
        if persona1_hint:
            hints_parts.append(f"Hint for persona 1: {persona1_hint}")
        if persona2_hint:
            hints_parts.append(f"Hint for persona 2: {persona2_hint}")
        persona_hints = "\n".join(hints_parts) if hints_parts else ""

        prompts = _get_prompts(interface_language)
        prompt = prompts.PERSONA_GENERATION_PROMPT.format(
            topic=topic,
            document_context=document_context,
            persona_hints=persona_hints,
        )

        yield {
            "step": "generating",
            "message": "Generating personas with LLM...",
            "status": "in_progress",
            "progress": 30,
        }

        # ── Call LLM ──────────────────────────────────────
        llm = get_llm("")
        messages = [SystemMessage(content=prompt)]
        response = await llm.ainvoke(messages)

        yield {
            "step": "parsing",
            "message": "Parsing personas...",
            "status": "in_progress",
            "progress": 80,
        }

        # ── Parse response ────────────────────────────────
        response_text = response.content.strip()
        # Remove markdown code fences if present
        response_text = (
            response_text.removeprefix("```json")
            .removeprefix("```")
            .removesuffix("```")
            .strip()
        )

        personas_data = json.loads(response_text)

        # ── Completed ─────────────────────────────────────
        yield {
            "step": "completed",
            "message": "Personas generated successfully!",
            "status": "completed",
            "progress": 100,
            "personas": personas_data,
        }

        logger.info(f"[Step 1] Completed for user={username}")

    except json.JSONDecodeError as e:
        logger.error(f"[Step 1] JSON parse error: {e}")
        yield {
            "step": "error",
            "message": f"Failed to parse LLM response: {e}",
            "status": "error",
            "progress": 0,
            "error": str(e),
        }
    except Exception as e:
        logger.error(f"[Step 1] Error: {e}", exc_info=True)
        yield {
            "step": "error",
            "message": f"Error generating personas: {e}",
            "status": "error",
            "progress": 0,
            "error": str(e),
        }
