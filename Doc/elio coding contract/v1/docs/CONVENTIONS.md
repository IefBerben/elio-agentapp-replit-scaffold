# Conventions de code

Ce document résume les conventions à respecter pour que votre code soit intégrable dans l'application Ellio.

---

## Architecture

### Séparation logique mêtier / UI

Comme l'exemple donnée dans ce toolkit, votre application doit être séparé en 2:

- le back: pour la logique mêtier (en python)
- le front: pour l'UI de l'application (en React) - CELUI-CI NE DOIT CONTENIR AUCUNE LOGIQUE MÊTIER -

### Modèle LLM

Votre définition du client LLM doit être fait avec Langchain, et être une héritance de **BaseChatModel**,
vous devez définir votre appel dans [llm_config.py](../back/llm_config.py) où un exemple pour openAI est donné.

Pour permettre la reproducibilité de vos résultats, vous devez utilisez uniquement les modèles qui sont inclus dans Ellio. Soit:

OpenAI:

- gpt-5.1
- gpt-5
- gpt-5-mini
- gpt-5-chat
- gpt-4.1
- gpt-4.1-mini
- o3
- o4-mini

Google:

- Gemini 2.5 pro
- Gemini 2.5 flash

Mistral:

- Mistral-large-3

## Backend

Votre application doit respecter strictement les guidelines back :

-> voir [AGENT_APP_GUIDELINES_BACK.md](AGENT_APP_GUIDELINES_BACK.md)

Dans les grandes lignes:

- l'utilisation de fonction asynchrones,
- Utilisation d'un naming correct et compréhensible
- Respect de la structure globale d'exemple
- Présence des docstring

Remarque: [AGENT_APP_GUIDELINES_BACK.md](AGENT_APP_GUIDELINES_BACK.md) sert aussi de prompt agentique pour guider un assistant Ia au code ou une technologie de vibe-coding

## Frontend

Votre application doit respecter strictement les guidelines front :

-> voir [AGENT_APP_GUIDELINES_FRONT.md](AGENT_APP_GUIDELINES_FRONT.md)

Globalement:

- utilisation strict des composants mise à disposition décrits dans [AGENT_APP_GUIDELINES_FRONT.md](AGENT_APP_GUIDELINES_FRONT.md)
- structure en 1 page + 1 page de

Remarque: [AGENT_APP_GUIDELINES_FRONT.md](AGENT_APP_GUIDELINES_FRONT.md) sert aussi de prompt agentique pour guider un assistant Ia au code ou une technologie de vibe-coding

## Langue

| Contexte                           | Langue             |
| ---------------------------------- | ------------------ |
| Communication (chat, emails, docs) | **Français**       |
| Code source                        | **Anglais**        |
| Commentaires dans le code          | **Anglais**        |
| Noms de fichiers / composants      | **Anglais**        |
| Messages utilisateur (UI)          | **i18n** (fr + gb) |

## Sécurité

- **JAMAIS** de secrets dans le code source
- Utiliser les **variables d'environnement** (`.env`)
- Valider tous les inputs côté backend
- Ne jamais logger de données sensibles
