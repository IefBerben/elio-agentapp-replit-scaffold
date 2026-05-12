"""LLM prompts for the _reference agent app.

This is the REFERENCE EXAMPLE — DO NOT MODIFY.
Copy the entire _reference/ folder and rename it for your use case.

Bilingual prompts — use get_*_prompt(lang) to select the right language.
All prompts are plain strings (no business logic here).
"""

# ─── Step 1 — Generate ────────────────────────────────────────────────────────

_STEP1_SYSTEM_FR = """Vous êtes un assistant consulting de Onepoint.
Demande de l'utilisateur : {prompt}
{context_block}

Répondez en français.

Renvoyez un objet JSON avec exactement cette structure (pas de markdown, pas de ```) :
{{
  "summary": "<réponse concise à la demande>",
  "key_points": ["<point 1>", "<point 2>", "<point 3>"]
}}

Répondez UNIQUEMENT avec du JSON valide."""

_STEP1_SYSTEM_EN = """You are a helpful consulting assistant at Onepoint.
The user's request: {prompt}
{context_block}

Respond in English.

Return a JSON object with exactly this structure (no markdown, no ```):
{{
  "summary": "<concise response to the request>",
  "key_points": ["<point 1>", "<point 2>", "<point 3>"]
}}

Respond ONLY with valid JSON."""


# ─── Step 2 — Refine ──────────────────────────────────────────────────────────

_STEP2_SYSTEM_FR = """Vous êtes un assistant consulting de Onepoint.
Demande initiale : {prompt}
Résultat de l'étape 1 : {step1_result}

Répondez en français.

Développez les points clés avec des recommandations concrètes et des prochaines étapes.
Renvoyez un objet JSON :
{{
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"],
  "next_steps": ["<étape 1>", "<étape 2>"],
  "conclusion": "<un paragraphe de conclusion>"
}}

Répondez UNIQUEMENT avec du JSON valide, pas de markdown."""

_STEP2_SYSTEM_EN = """You are a helpful consulting assistant at Onepoint.
Original request: {prompt}
Step 1 output: {step1_result}

Respond in English.

Expand on the key points with concrete recommendations and next steps.
Return a JSON object:
{{
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"],
  "next_steps": ["<step 1>", "<step 2>"],
  "conclusion": "<one paragraph conclusion>"
}}

Respond ONLY with valid JSON, no markdown."""


# ─── UI progress messages ─────────────────────────────────────────────────────

_UI_MESSAGES = {
    "fr": {
        "init": "Initialisation...",
        "generating": "Génération en cours...",
        "parsing": "Analyse de la réponse...",
        "preparing": "Préparation de l'analyse...",
        "recommendations": "Génération des recommandations...",
        "completed": "Terminé !",
    },
    "en": {
        "init": "Initializing...",
        "generating": "Generating...",
        "parsing": "Parsing response...",
        "preparing": "Preparing analysis...",
        "recommendations": "Generating recommendations...",
        "completed": "Done!",
    },
}


# ─── Public accessors ─────────────────────────────────────────────────────────

def get_step1_prompt(lang: str, prompt: str, context: str = "") -> str:
    """Build the Step 1 LLM prompt.

    Args:
        lang: Language code ('fr' or 'en').
        prompt: Main user request.
        context: Optional additional context.

    Returns:
        Formatted system prompt string.
    """
    context_block = f"\nAdditional context:\n{context}" if context.strip() else ""
    template = _STEP1_SYSTEM_FR if lang.startswith("fr") else _STEP1_SYSTEM_EN
    return template.format(prompt=prompt, context_block=context_block)


def get_step2_prompt(lang: str, prompt: str, step1_result: str) -> str:
    """Build the Step 2 LLM prompt.

    Args:
        lang: Language code ('fr' or 'en').
        prompt: Original user request.
        step1_result: JSON string of Step 1 result.

    Returns:
        Formatted system prompt string.
    """
    template = _STEP2_SYSTEM_FR if lang.startswith("fr") else _STEP2_SYSTEM_EN
    return template.format(prompt=prompt, step1_result=step1_result)


def get_ui_message(lang: str, key: str) -> str:
    """Return a UI progress message for the given language.

    Args:
        lang: Language code ('fr' or 'en').
        key: Message key (e.g. 'init', 'generating').

    Returns:
        Localised UI message string.
    """
    messages = _UI_MESSAGES.get("fr" if lang.startswith("fr") else "en", _UI_MESSAGES["fr"])
    return messages.get(key, "...")
