# Elio Scaffold v9 — Replit Edition

Scaffold pour construire des **Agent Apps** pour la plateforme Elio — Agentic Studio · Onepoint.

Un template Replit avec un agent de référence fonctionnel, les guidelines plateforme intégrées,
et un Agent Replit configuré pour construire des apps conformes depuis une description en Markdown.

> 👉 **Première fois ici ? Tu n'es pas développeur ?**
> Va lire **[GUIDE.md](GUIDE.md)** — un guide pas-à-pas en français, sans jargon, qui te fait construire ta première app en 30 minutes.
>
> Le README ci-dessous est la doc technique de référence (architecture, structure, conventions).

---

## Démarrage en 4 étapes

### 1. Fork ce projet sur Replit

Bouton **Fork** en haut à droite → renomme avec le nom de ton app.

### 2. Configure tes credentials Azure

Dans Replit, ouvre le panneau **Secrets** (icône cadenas dans la barre latérale) :

| Clé | Valeur |
|-----|--------|
| `AZURE_OPENAI_ENDPOINT` | `https://ton-resource.cognitiveservices.azure.com/` |
| `AZURE_OPENAI_API_KEY` | ta clé API |
| `AZURE_OPENAI_DEPLOYMENT` | nom du déploiement (ex: `gpt-4.1`) |
| `AZURE_OPENAI_API_VERSION` | `2025-01-01-preview` |

### 3. Clique sur Run ▶

Les deux serveurs démarrent automatiquement :
- **Backend** — FastAPI sur le port 8000
- **Frontend** — React sur le port 5173 (visible dans l'onglet **Webview**)

L'app de démonstration fonctionne immédiatement — teste-la avant de construire la tienne.

### 4. Décris ton app et laisse l'Agent construire

Ouvre l'**onglet Agent** dans Replit.

Les instructions plateforme (`custom_instruction/instructions.md`) et la mémoire projet (`replit.md`)
sont automatiquement injectées. Les skills (`.agents/skills/`) sont auto-découverts.

**Si tu pars d'une idée :**
> "Build my app"
> L'Agent te pose 5 questions, écrit `product.md` + `backlog.md`, puis construit.

**Si tu as déjà une spec :**
Édite `product.md` et `backlog.md` avec ta description, puis :
> "Build my app"

**Si tu as un prototype Google AI Studio :**
Dépose ton export `.tsx` / `.zip` dans `Input/`, puis :
> "Build my app"

---

## Séquence de build Agent

```
intake-from-markdown       → analyse product.md + backlog.md (ou interview)
       ↓
generate-api-contracts     → docs/api-contracts.md + packages/shared-types/src/index.ts
       ↓
build-backend              → back/agents/{name}/ + tests + AGENTS_MAP
       ↓
build-frontend             → front/src/pages/ + store Zustand + i18n
       ↓
platform-integration-check → valide B1–B10, F1–F10, I1–I3 · met à jour SUBMISSION.md
```

---

## Structure du projet

```
back/                          Backend Python (FastAPI · LangChain · uv)
  agents/
    _reference/                Exemple de référence — NE PAS MODIFIER
    {ton_agent}/               Ton agent (créé par Agent)
  services/
    llm_config.py              LLM factory — toujours utiliser get_llm()
    process_files.py           Extraction PDF/DOCX/PPTX/XLSX/audio
    generate_files.py          Génération DOCX/PPTX
  main.py                      FastAPI + AGENTS_MAP

front/                         Frontend React (Vite · TypeScript · Zustand · Tailwind)
  src/
    pages/                     Une page par agent app
    components/agent-apps/     Bibliothèque de composants Elio
    stores/agent-apps/         Zustand — un store par agent
    i18n/locales/              fr.json + en.json

packages/shared-types/         Interfaces TypeScript partagées (DTOs)
  src/index.ts                 Types générés par generate-api-contracts

docs/                          Guidelines plateforme Elio v3 (référence Agent)
  CONVENTIONS.md
  AGENT_APP_GUIDELINES_BACK.md
  AGENT_APP_GUIDELINES_FRONT.md
  INTEGRATION_GUIDE.md
  api-contracts.md             Généré par generate-api-contracts

custom_instruction/
  instructions.md              Règles plateforme auto-injectées dans l'Agent

.agents/skills/                Skills Replit Agent
  intake-from-markdown/        Analyse les inputs ou interview conversationnel
  generate-api-contracts/      Génère les contrats API + types TypeScript
  build-backend/               Construit l'agent Python conforme Elio
  build-frontend/              Construit la page React + store Zustand
  platform-integration-check/  Valide et met à jour SUBMISSION.md

replit.md                      Mémoire projet — l'Agent lit et met à jour
product.md                     Décris ton app ici
backlog.md                     Décris tes features ici
SUBMISSION.md                  Dossier de remise à l'équipe Neo
```

---

## L'app de référence

Le scaffold inclut un **assistant consulting** fonctionnel en 2 étapes :

| | |
|---|---|
| **Step 1** | Prompt → analyse JSON (summary + key points éditables) |
| **Step 2** | Key points édités → recommandations + next steps + conclusion |

Elle illustre tous les patterns Elio :
`@stream_safe` · `get_llm()` · Zustand + `persist` + `partialize` · prompts bilingues · SSE streaming · `AgentAppPageShell` · `StepIndicator` · `LanguageToggle`

**Ne jamais modifier** `back/agents/_reference/` ni `front/src/pages/_ReferencePage.tsx`.
Copie-les et renomme-les pour ton propre use case.

---

## Guidelines plateforme

Les 4 docs dans `docs/` définissent les standards d'intégration Elio.
L'Agent les lit automatiquement avant d'écrire du code.

| Document | Contenu |
|----------|---------|
| `CONVENTIONS.md` | Architecture, nommage, modèles LLM autorisés, sécurité |
| `AGENT_APP_GUIDELINES_BACK.md` | Patterns SSE, prompts bilingues, fichiers, génération docs |
| `AGENT_APP_GUIDELINES_FRONT.md` | Composants, Zustand, dark mode, checklist complète |
| `INTEGRATION_GUIDE.md` | Processus d'intégration dans la plateforme Elio |

---

## Authentification Azure

| Mode | Comment |
|------|---------|
| **Recommandé** | Remplis `AZURE_OPENAI_API_KEY` dans les Secrets Replit |
| **Alternatif** | `az login` dans l'onglet Shell (session persistante) |
