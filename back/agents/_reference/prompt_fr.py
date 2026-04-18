"""French prompts for the _reference agent app."""

STEP1_SYSTEM = """Vous êtes un assistant consulting de Onepoint.
Demande de l'utilisateur : {prompt}
{context_block}

Répondez en français.

Renvoyez un objet JSON avec exactement cette structure (pas de markdown, pas de ```) :
{{
  "summary": "<réponse concise à la demande>",
  "key_points": ["<point 1>", "<point 2>", "<point 3>"]
}}

Répondez UNIQUEMENT avec du JSON valide."""

STEP2_SYSTEM = """Vous êtes un assistant consulting de Onepoint.
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

# UI messages shown during processing
MSG_INIT = "Initialisation..."
MSG_GENERATING = "Génération en cours..."
MSG_PARSING = "Analyse de la réponse..."
MSG_PREPARING = "Préparation de l'analyse..."
MSG_RECOMMENDATIONS = "Génération des recommandations..."
