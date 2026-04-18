"""English prompts for the conversation agent app.

Each constant is a prompt template with ``{placeholders}`` that are filled
at runtime by the corresponding step function.

This file is selected when ``interface_language`` starts with ``"en"``.
"""

PERSONA_GENERATION_PROMPT = """You are a creative character designer.
Given a conversation topic and optional hints, generate TWO distinct personas
who would have an interesting and nuanced discussion about this topic.

Topic: {topic}
{document_context}{persona_hints}

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
