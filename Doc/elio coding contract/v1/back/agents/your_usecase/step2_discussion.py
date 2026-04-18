"""Step 2 — Generate a streamed conversation between two personas.

This is the core business logic for Step 2.
The discussion is streamed message-by-message via SSE.
"""

import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from llm_config import get_llm

logger = logging.getLogger(__name__)

# ─── Prompt ───────────────────────────────────────────────
DISCUSSION_SYSTEM_PROMPT = """You are a conversation simulator.
You will generate a realistic, engaging discussion between two people.

Persona 1: {persona1_summary}
Persona 2: {persona2_summary}

Topic: {topic}

Rules:
- Alternate between the two speakers naturally.
- Each message should be 1-3 sentences.
- Show personality through word choice and tone.
- The conversation should evolve: start casual, go deeper, maybe disagree, then find common ground.
- Generate exactly {num_exchanges} exchanges (each exchange = 1 message from each person).

Return each message as a JSON object on a separate line (JSON Lines format):
{{"speaker": "<name>", "message": "<text>", "tone": "<emotion>"}}

One message per line. No wrapping array. No markdown fences. No extra text."""


def _summarize_persona(persona: dict) -> str:
    """Build a concise summary string from a persona dict.

    Args:
        persona: Persona dictionary with name, age, profession, etc.

    Returns:
        A single-line human-readable summary.
    """
    name = persona.get("name", "Unknown")
    age = persona.get("age", "?")
    profession = persona.get("profession", "")
    personality = persona.get("personality_type", "")
    opinion = persona.get("opinion_on_topic", "")
    return f"{name}, {age}yo, {profession}, {personality}. Opinion: {opinion}"


async def conversation_step_2_stream(
    username: str,
    topic: str,
    persona1: dict,
    persona2: dict,
    num_exchanges: int = 8,
    **kwargs: Any,
) -> AsyncGenerator[dict[str, Any], None]:
    """Stream a discussion between two personas on a topic.

    Each message is yielded individually for real-time display via SSE.

    Args:
        username: Username of the requester.
        topic: The conversation subject.
        persona1: Full persona 1 data dict.
        persona2: Full persona 2 data dict.
        num_exchanges: Number of exchanges to generate (default 8).
        **kwargs: Additional parameters (ignored).

    Yields:
        Dict with SSE streaming updates:
            - step: Current step identifier
            - message: User-facing progress message
            - status: "in_progress", "completed", or "error"
            - progress: 0-100
            - conversation_message: (during streaming) individual message dict
            - conversation: (on completed) full conversation list
    """
    logger.info(f"[Step 2] Generating discussion for user={username}")

    try:
        # ── Beginning ─────────────────────────────────────
        yield {
            "step": "beginning",
            "message": "Preparing discussion...",
            "status": "in_progress",
            "progress": 0,
        }

        # ── Build prompt ──────────────────────────────────
        prompt = DISCUSSION_SYSTEM_PROMPT.format(
            persona1_summary=_summarize_persona(persona1),
            persona2_summary=_summarize_persona(persona2),
            topic=topic,
            num_exchanges=num_exchanges,
        )

        yield {
            "step": "generating",
            "message": "Generating discussion...",
            "status": "in_progress",
            "progress": 10,
        }

        # ── Stream LLM response ──────────────────────────
        llm = get_llm()
        messages = [SystemMessage(content=prompt)]

        conversation: list[dict[str, str]] = []
        total_expected = num_exchanges * 2
        buffer = ""

        # Use streaming to get tokens in real-time
        async for chunk in llm.astream(messages):
            token = chunk.content if hasattr(chunk, "content") else str(chunk)
            buffer += token

            # Try to parse complete JSON lines from buffer
            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                line = line.strip()
                if not line:
                    continue

                # Clean potential markdown artifacts
                line = (
                    line.removeprefix("```json")
                    .removeprefix("```")
                    .removesuffix("```")
                    .strip()
                )
                if not line:
                    continue

                try:
                    msg_data = json.loads(line)
                    if "speaker" in msg_data and "message" in msg_data:
                        conversation.append(msg_data)
                        progress = min(
                            95,
                            10 + int(85 * len(conversation) / total_expected),
                        )

                        yield {
                            "step": "streaming",
                            "message": f"Message {len(conversation)}/{total_expected}",
                            "status": "in_progress",
                            "progress": progress,
                            "conversation_message": msg_data,
                        }
                except json.JSONDecodeError:
                    # Partial JSON or non-JSON line, skip
                    continue

        # Try to parse any remaining content in buffer
        remaining = buffer.strip()
        if remaining:
            remaining = (
                remaining.removeprefix("```json")
                .removeprefix("```")
                .removesuffix("```")
                .strip()
            )
            for line in remaining.split("\n"):
                line = line.strip()
                if not line:
                    continue
                try:
                    msg_data = json.loads(line)
                    if "speaker" in msg_data and "message" in msg_data:
                        conversation.append(msg_data)
                        yield {
                            "step": "streaming",
                            "message": f"Message {len(conversation)}/{total_expected}",
                            "status": "in_progress",
                            "progress": min(
                                95,
                                10
                                + int(85 * len(conversation) / total_expected),
                            ),
                            "conversation_message": msg_data,
                        }
                except json.JSONDecodeError:
                    continue

        # ── Completed ─────────────────────────────────────
        yield {
            "step": "completed",
            "message": "Discussion generated successfully!",
            "status": "completed",
            "progress": 100,
            "conversation": conversation,
        }

        logger.info(
            f"[Step 2] Completed {len(conversation)} messages for user={username}"
        )

    except Exception as e:
        logger.error(f"[Step 2] Error: {e}", exc_info=True)
        yield {
            "step": "error",
            "message": f"Error generating discussion: {e}",
            "status": "error",
            "progress": 0,
            "error": str(e),
        }
