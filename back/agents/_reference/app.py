"""Reference AgentApp — two-step pattern example.

This is the REFERENCE EXAMPLE — DO NOT MODIFY.
Copy the entire _reference/ folder and rename it for your use case.

Steps:
  1. generate  — reads input tab, summarises the request and extracts key points
  2. refine    — reads output from step 1, adds recommendations + conclusion

The app demonstrates:
  - @step decorator with persist_progress=True (step 1) / False (step 2)
  - stream_safe is applied automatically by @step (no explicit decorator needed)
  - Structured LLM output with JSON parsing + fallback
  - in_progress / completed / error SSEEvent helpers
  - StepContext usage (username, language)
"""

import json
import logging

from framework import DeclarativeAgentApp, SSEEvent, StepContext, TabSchema, step
from services.llm_config import get_llm

from .prompts import get_step1_prompt, get_step2_prompt, get_ui_message
from .schemas import (
    ReferenceInputTab,
    ReferenceOutputTab,
    Step1Output,
    Step2Output,
)

logger = logging.getLogger(__name__)


class ReferenceApp(DeclarativeAgentApp):
    """Two-step reference agent app.

    Demonstrates the full DeclarativeAgentApp pattern with structured LLM output,
    error handling, and state persistence.

    Tabs:
        ReferenceInputTab: User inputs (prompt, context, lang).
        ReferenceOutputTab: Step results written progressively.
    """

    class Meta:
        tabs = [ReferenceInputTab, ReferenceOutputTab]

    # ─── Step 1 — Generate ────────────────────────────────────────────────────

    @step(id="generate", persist_progress=True)
    async def generate(self, ctx: StepContext, inputs: ReferenceInputTab, **kwargs):
        """Summarise the user's request and extract key points.

        Args:
            ctx: StepContext with username and language.
            inputs: Validated input tab with prompt, context, lang.
            **kwargs: Remaining flat state fields.

        Yields:
            SSEEvent dicts as text/event-stream data.
        """
        lang = inputs.lang or kwargs.get("lang", "fr")
        prompt = inputs.prompt or kwargs.get("prompt", "")
        context = inputs.context or kwargs.get("context", "")

        if not prompt.strip():
            yield self.error(
                step_id="generate",
                message=(
                    "Veuillez saisir une demande avant de lancer la génération."
                    if lang.startswith("fr")
                    else "Please enter a request before starting."
                ),
            )
            return

        # ── Init ──────────────────────────────────────────────────────────────
        yield self.in_progress(
            step_id="generate",
            message=get_ui_message(lang, "init"),
            progress=5,
        )

        llm = get_llm()
        system_prompt = get_step1_prompt(lang=lang, prompt=prompt, context=context)

        # ── Call LLM ─────────────────────────────────────────────────────────
        yield self.in_progress(
            step_id="generate",
            message=get_ui_message(lang, "generating"),
            progress=30,
        )

        response = await llm.ainvoke([("system", system_prompt)])
        raw = (
            response.content.strip() if hasattr(response, "content") else str(response)
        )

        # ── Parse JSON ────────────────────────────────────────────────────────
        yield self.in_progress(
            step_id="generate",
            message=get_ui_message(lang, "parsing"),
            progress=80,
        )

        result = _parse_step1(raw, lang)

        # ── Complete ──────────────────────────────────────────────────────────
        yield self.completed(
            step_id="generate",
            message=get_ui_message(lang, "completed"),
            data=result.model_dump(),
        )

    # ─── Step 2 — Refine ──────────────────────────────────────────────────────

    @step(id="refine", persist_progress=False)
    async def refine(self, ctx: StepContext, inputs: ReferenceOutputTab, **kwargs):
        """Generate recommendations and conclusion based on Step 1 output.

        Args:
            ctx: StepContext with username and language.
            inputs: Validated output tab with summary, key_points.
            **kwargs: Remaining flat state fields (includes prompt, lang from input tab).

        Yields:
            SSEEvent dicts as text/event-stream data.
        """
        lang = kwargs.get("lang", "fr")
        prompt = kwargs.get("prompt", "")
        summary = inputs.summary or kwargs.get("summary", "")
        key_points = inputs.key_points or kwargs.get("key_points", [])

        if not summary:
            yield self.error(
                step_id="refine",
                message=(
                    "Lancez d'abord l'étape 1 (generate) avant de raffiner."
                    if lang.startswith("fr")
                    else "Please run Step 1 (generate) first."
                ),
            )
            return

        # ── Init ──────────────────────────────────────────────────────────────
        yield self.in_progress(
            step_id="refine",
            message=get_ui_message(lang, "preparing"),
            progress=10,
        )

        llm = get_llm()
        step1_result = json.dumps(
            {"summary": summary, "key_points": key_points}, ensure_ascii=False
        )
        system_prompt = get_step2_prompt(
            lang=lang, prompt=prompt, step1_result=step1_result
        )

        # ── Call LLM ─────────────────────────────────────────────────────────
        yield self.in_progress(
            step_id="refine",
            message=get_ui_message(lang, "recommendations"),
            progress=40,
        )

        response = await llm.ainvoke([("system", system_prompt)])
        raw = (
            response.content.strip() if hasattr(response, "content") else str(response)
        )

        # ── Parse JSON ────────────────────────────────────────────────────────
        yield self.in_progress(
            step_id="refine",
            message=get_ui_message(lang, "parsing"),
            progress=80,
        )

        result = _parse_step2(raw, lang)

        # ── Complete ──────────────────────────────────────────────────────────
        yield self.completed(
            step_id="refine",
            message=get_ui_message(lang, "completed"),
            data=result.model_dump(),
        )


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _clean_json(raw: str) -> str:
    """Strip markdown fences if present.

    Args:
        raw: Raw LLM response string.

    Returns:
        Cleaned string with markdown code fences removed.
    """
    stripped = raw.strip()
    if stripped.startswith("```"):
        lines = stripped.split("\n")
        # Remove opening and closing ``` lines
        inner = lines[1:] if lines[0].startswith("```") else lines
        if inner and inner[-1].strip() == "```":
            inner = inner[:-1]
        return "\n".join(inner).strip()
    return stripped


def _parse_step1(raw: str, lang: str) -> Step1Output:
    """Parse LLM output for Step 1 with fallback.

    Args:
        raw: Raw LLM response string.
        lang: Language code for fallback messages.

    Returns:
        Step1Output with parsed or fallback values.
    """
    try:
        data = json.loads(_clean_json(raw))
        return Step1Output(**data)
    except Exception:
        logger.warning("Step 1 JSON parse failed — using raw response as summary")
        return Step1Output(
            summary=raw[:500],
            key_points=[],
        )


def _parse_step2(raw: str, lang: str) -> Step2Output:
    """Parse LLM output for Step 2 with fallback.

    Args:
        raw: Raw LLM response string.
        lang: Language code for fallback messages.

    Returns:
        Step2Output with parsed or fallback values.
    """
    try:
        data = json.loads(_clean_json(raw))
        return Step2Output(**data)
    except Exception:
        logger.warning("Step 2 JSON parse failed — using raw response as conclusion")
        return Step2Output(
            recommendations=[],
            next_steps=[],
            conclusion=raw[:500],
        )
