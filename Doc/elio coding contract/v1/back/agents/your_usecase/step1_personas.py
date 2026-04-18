"""Step 1 — Generate two personas from a conversation topic.

This is the core business logic for Step 1.
Modify the prompt and parsing to fit your use case.
"""

import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

from langchain_core.messages import SystemMessage

from llm_config import get_llm

logger = logging.getLogger(__name__)

# ─── Prompt ───────────────────────────────────────────────
PERSONA_GENERATION_PROMPT = """You are a creative character designer.
Given a conversation topic and optional hints, generate TWO distinct personas
who would have an interesting and nuanced discussion about this topic.

Topic: {topic}
{persona_hints}

Return a JSON object with exactly this structure (no markdown, no ```):
{{
  "persona1": {{
    "name": "<full name>",
    "age": <integer>,
    "profession": "<job title>",
    "education": "<education background>",
    "personality_type": "<e.g. Analytical, Creative, Pragmatic>",
    "description": "<2-3 sentence bio>",
    "interests": ["<interest1>", "<interest2>", "<interest3>"],
    "communication_style": "<how they communicate>",
    "opinion_on_topic": "<their initial stance on the topic>"
  }},
  "persona2": {{
    "name": "<full name>",
    "age": <integer>,
    "profession": "<job title>",
    "education": "<education background>",
    "personality_type": "<e.g. Analytical, Creative, Pragmatic>",
    "description": "<2-3 sentence bio>",
    "interests": ["<interest1>", "<interest2>", "<interest3>"],
    "communication_style": "<how they communicate>",
    "opinion_on_topic": "<their initial stance on the topic>"
  }}
}}

Make the personas diverse, realistic, and with contrasting viewpoints.
Respond ONLY with valid JSON, no extra text."""


async def conversation_step_1_stream(
    username: str,
    topic: str,
    persona1_hint: str = "",
    persona2_hint: str = "",
    **kwargs: Any,
) -> AsyncGenerator[dict[str, Any], None]:
    """Stream persona generation for a given conversation topic.

    Args:
        username: Username of the requester.
        topic: The conversation subject (required).
        persona1_hint: Optional description hint for persona 1.
        persona2_hint: Optional description hint for persona 2.
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

        # ── Build prompt ──────────────────────────────────
        hints_parts = []
        if persona1_hint:
            hints_parts.append(f"Hint for persona 1: {persona1_hint}")
        if persona2_hint:
            hints_parts.append(f"Hint for persona 2: {persona2_hint}")
        persona_hints = "\n".join(hints_parts) if hints_parts else ""

        prompt = PERSONA_GENERATION_PROMPT.format(
            topic=topic,
            persona_hints=persona_hints,
        )

        yield {
            "step": "generating",
            "message": "Generating personas with LLM...",
            "status": "in_progress",
            "progress": 30,
        }

        # ── Call LLM ──────────────────────────────────────
        llm = get_llm()
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
