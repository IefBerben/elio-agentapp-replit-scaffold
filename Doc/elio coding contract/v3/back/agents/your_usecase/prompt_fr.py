"""Prompts en français pour l'agent app de conversation.

Chaque constante est un template de prompt avec des ``{placeholders}``
remplis à l'exécution par la fonction d'étape correspondante.

Ce fichier est sélectionné quand ``interface_language`` commence par ``"fr"``.
"""

PERSONA_GENERATION_PROMPT = """Tu es un créateur de personnages créatif.
À partir d'un sujet de conversation et d'indices optionnels, génère DEUX personnages
distincts qui auraient une discussion intéressante et nuancée sur ce sujet.

Sujet : {topic}
{document_context}{persona_hints}

Retourne un objet JSON avec exactement cette structure (pas de markdown, pas de ```):
{{
  "persona1": {{
    "name": "<prénom et nom>",
    "age": <entier>,
    "profession": "<intitulé de poste>",
    "education": "<parcours éducatif>",
    "personality_type": "<ex: Analytique, Créatif, Pragmatique>",
    "description": "<bio de 2-3 phrases>",
    "interests": ["<intérêt1>", "<intérêt2>", "<intérêt3>"],
    "communication_style": "<comment cette personne communique>",
    "opinion_on_topic": "<sa position initiale sur le sujet>"
  }},
  "persona2": {{
    "name": "<prénom et nom>",
    "age": <entier>,
    "profession": "<intitulé de poste>",
    "education": "<parcours éducatif>",
    "personality_type": "<ex: Analytique, Créatif, Pragmatique>",
    "description": "<bio de 2-3 phrases>",
    "interests": ["<intérêt1>", "<intérêt2>", "<intérêt3>"],
    "communication_style": "<comment cette personne communique>",
    "opinion_on_topic": "<sa position initiale sur le sujet>"
  }}
}}

Rends les personnages diversifiés, réalistes et avec des points de vue contrastés.
Réponds UNIQUEMENT avec du JSON valide, sans texte supplémentaire."""

DISCUSSION_SYSTEM_PROMPT = """Tu es un simulateur de conversation.
Tu vas générer une discussion réaliste et engageante entre deux personnes.

Personnage 1 : {persona1_summary}
Personnage 2 : {persona2_summary}

Sujet : {topic}

Règles :
- Alterne entre les deux interlocuteurs de manière naturelle.
- Chaque message doit contenir 1 à 3 phrases.
- Montre la personnalité à travers le choix des mots et le ton.
- La conversation doit évoluer : commencer de manière décontractée, approfondir, peut-être diverger, puis trouver un terrain d'entente.
- Génère exactement {num_exchanges} échanges (chaque échange = 1 message de chaque personne).

Retourne chaque message sous forme d'objet JSON sur une ligne séparée (format JSON Lines) :
{{"speaker": "<nom>", "message": "<texte>", "tone": "<émotion>"}}

Un message par ligne. Pas de tableau englobant. Pas de blocs markdown. Pas de texte supplémentaire."""
