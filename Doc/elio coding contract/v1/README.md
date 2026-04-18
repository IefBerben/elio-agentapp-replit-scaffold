# Toolkit Elio — Agent App Starter Kit

IMPORTANT: _ceci est une pré-version du toolkit, elle n'est pas encore complète ni validé et ne sert pas encore de contrat d'échange avec l'équipe Elio, une version plus précise et complête est en construction._

Bienvenue sur le **Toolkit Elio** ! Ce répertoire est un mini-répo fonctionnel conçu pour permettre à des équipes externes de développer des **Proof of Concept (POC)** d'Agent Apps, intégrables dans l'application Elio.

---

## Table des matières

Dans ce document:

- [Présentation](#-présentation)
- [Démarrage rapide](#-démarrage-rapide)
- [Agent App d'exemple : Conversation](#-agent-app-dexemple--conversation)
- [Créer votre propre Agent App](#-créer-votre-propre-agent-app)
- [Architecture](#-architecture)
- [Contact](#-contact)

### Autre documentation:

| Document                                                            | Description                                               |
| ------------------------------------------------------------------- | --------------------------------------------------------- |
| [AGENT_APP_GUIDELINES_BACK.md](docs/AGENT_APP_GUIDELINES_BACK.md)   | Conventions backend, structure des services, SSE          |
| [AGENT_APP_GUIDELINES_FRONT.md](docs/AGENT_APP_GUIDELINES_FRONT.md) | Composants partagés, store, i18n, layout                  |
| [INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md)                   | Guide complet d'intégration dans Elio                     |
| [CONVENTIONS.md](docs/CONVENTIONS.md)                               | Conventions de code, nommage, documentation               |
| [EXIGENCES.md](EXIGENCES.md)                                        | Contraintes et livrables attendus pour un POC             |
| [LIVRABLE_EXEMPLE.md](LIVRABLE_EXEMPLE.md)                          | Exemple complet de livrable basé sur l'agent Conversation |

## Présentation

Le Toolkit Elio fournit une mini application fonctionnelle incluant:

- Un **backend FastAPI** minimal avec streaming SSE
- Un **frontend React** avec les composants partagés Elio (shadcn/ui + Tailwind)
- Un **exemple complet** d'Agent App multi-étapes ("Conversation")
- Des **guidelines** pour respecter les conventions Elio

Cette application vous servira de base et d'exemple pour construire votre cas d'usage,
elle définit en particulier le format attendu par l'équipe Néo pour l'intégration.

Merci de respecter les consignes données dans [CONVENTIONS.md](docs/CONVENTIONS.md) avant
de soumettre votre POC à l'équipe Neo.

## Démarrage rapide

**[Voir le guide complet : GET_STARTED.md](GET_STARTED.md)**

Pour lancer l'application pour la première fois :

1. Installer les prérequis (Python 3.14, Node.js)
2. Lancer le backend : `cd toolkit_Elio/back && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload`
3. Lancer le frontend : `cd toolkit_Elio/front && npm install && npm run dev`
4. Accéder à `http://localhost:5173`

**Lire [GET_STARTED.md](GET_STARTED.md) pour les instructions détaillées et le dépannage.**

## Agent App d'exemple : Conversation

L'agent **Conversation** simule une discussion entre deux personnes sur un sujet donné.

### Workflow en 3 onglets

| Onglet            | Étape      | Description                                                                  |
| ----------------- | ---------- | ---------------------------------------------------------------------------- |
| **1. Entrée**     | Saisie     | Sujet de conversation + descriptions optionnelles des personas               |
| **2. Personas**   | Génération | Le LLM génère 2 personas complets (âge, description, formation, intérêts...) |
| **3. Discussion** | Streaming  | Le LLM génère une discussion en temps réel entre les 2 personas via SSE      |

### Agent IDs

| ID                    | Étape                       |
| --------------------- | --------------------------- |
| `conversation-step-1` | Génération des personas     |
| `conversation-step-2` | Génération de la discussion |

---

## 🛠️ Créer votre propre Agent App

Transformez l'exemple pour votre use case :

1. **Backend** : Adaptez `back/agents/your_usecase/` avec votre logique mêtier
2. **Enregistrez** Mettez à jour vos étapes dans `back/main.py` (dictionnaire `AGENTS_MAP`)
3. **Frontend** : Adaptez `front/src/pages/`
4. **Cache frontend** : Créez un store Zustand dans `front/src/stores/`
5. **Traductions** : Ajoutez vos clés i18n dans `front/src/i18n/`

Consultez les [guidelines détaillées](docs/) pour plus d'informations.

## Vibecoding

Ce **toolkit Elio** est aussi avant tout un outil de support et de cadrage pour le vibecoding de vos usecases.

Quel que soit votre outil de vibecoding, merci d'inclue dans le contexte de votre agent (ou dans le prompt) les fichiers suivants,
qui sont autant un guide pour l'humain que pour l'agent:

Pour le back:

- [AGENT_APP_GUIDELINES_BACK.md](docs/AGENT_APP_GUIDELINES_BACK.md)
- [INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md)
- [CONVENTIONS.md](docs/CONVENTIONS.md)

Pour le front:

- [AGENT_APP_GUIDELINES_FRONT.md](docs/AGENT_APP_GUIDELINES_FRONT.md)
- [INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md)
- [CONVENTIONS.md](docs/CONVENTIONS.md)

## Architecture

```
toolkit_Elio/
├── README.md                  ← Ce fichier
├── docs/                      ← Documentation / Guidelines pour les agents de code
│   ├── AGENT_APP_GUIDELINES_BACK.md
│   ├── AGENT_APP_GUIDELINES_FRONT.md
│   ├── INTEGRATION_GUIDE.md
│   └── CONVENTIONS.md
├── back/                      ← Backend FastAPI
│   ├── requirements.txt
│   ├── main.py                ← Point d'entrée du serveur
│   ├── llm_config.py          ← Configuration LLM (à personnaliser)
│   └── agents/
│       └── conversation/      ← 🔧 Votre logique métier ici
│           ├── __init__.py
│           ├── models.py
│           ├── step1_personas.py
│           └── step2_discussion.py
└── front/                     ← Frontend React
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── components/
        │   └── agent-apps/    ← Composants partagés (NE PAS MODIFIER)
        ├── services/
        │   └── sseStreamService.ts
        ├── stores/
        │   └── conversationStore.ts  <- Store de l'application
        ├── pages/
        │   └── ConversationAgentPage.tsx  ← 🔧 Page principale
        └── i18n/
            ├── index.ts
            ├── fr.json   <- dictionnaires des textes du front dans les 2 langues
            └── en.json
```

### Fichiers à modifier (votre logique métier)

| Fichier                                        | Description                           |
| ---------------------------------------------- | ------------------------------------- |
| `back/llm_config.py`                           | Configuration de votre endpoint LLM   |
| `back/agents/conversation/step1_personas.py`   | Étape 1 : génération des personas     |
| `back/agents/conversation/step2_discussion.py` | Étape 2 : génération de la discussion |
| `back/agents/conversation/models.py`           | Modèles de données Pydantic           |
| `front/src/pages/ConversationAgentPage.tsx`    | Page frontend de l'agent              |
| `front/src/stores/conversationStore.ts`        | Store Zustand                         |
| `front/src/i18n/fr.json` / `en.json`           | Traductions                           |

## 📞 Contact

Pour toute question ou assistance :

- **Email** : neo@groupeonepoint.com
- **Objet** : `[Toolkit Elio] Nom de votre use case`

---

**Note** : Ce toolkit est maintenu par l'équipe Elio. Dernière mise à jour : Mars 2026.

**Version**: 0.0.1
