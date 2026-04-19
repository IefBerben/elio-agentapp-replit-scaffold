# Elio Scaffold — Construis ton AgentApp en 30 minutes

Le scaffold officiel pour construire des **AgentApps** destinées à la plateforme **Elio** (Agentic Studio · Onepoint). Tu décris ton app à un agent IA dans Replit, il écrit le code pour toi.

**Ce scaffold est le chaînon 2 d'un parcours en 2 temps :**

1. **AgentApp Elio - Value Office** → transforme ton idée en `product.md` (vision, utilisateurs, valeur).
2. **Ce scaffold** → transforme ton `product.md` en app fonctionnelle grâce à 2 agents : un **Agent PO** qui rédige le backlog avec toi, puis un **Agent Builder** qui écrit le code.

---

## Avant de commencer

**Il te faut :**
- Un compte Replit (gratuit) → [replit.com](https://replit.com)
- Tes credentials Azure OpenAI (endpoint + clé API) → demande-les à [elio@groupeonepoint.com](mailto:elio@groupeonepoint.com) si tu n'en as pas encore
- Un `product.md` produit par l'**AgentApp Elio - Value Office** (optionnel, mais fortement conseillé)

**Pas besoin de savoir** coder, utiliser Git ou configurer un serveur. L'Agent Replit s'occupe de tout.

**Combien de temps ?**
- Setup initial : **5 min**
- De `product.md` à app fonctionnelle : **20 à 30 min**
- Itérations : autant que tu veux

---

## Étape 1 — Récupère le scaffold (2 min)

1. Ouvre la page du scaffold dans ton navigateur (lien fourni par l'équipe Elio).
2. Connecte-toi à Replit.
3. Clique sur **Remix this app**.
4. Donne un nom à ton projet (ex : `cr-reunion-acme`).
5. Confirme.

Tu as maintenant **ta copie privée**. Personne d'autre n'y a accès.

---

## Étape 2 — Configure tes credentials Azure (3 min)

Sans ça, l'IA de ton app ne pourra pas répondre.

### Pas encore de credentials ?

Envoie un mail à [elio@groupeonepoint.com](mailto:elio@groupeonepoint.com) avec ton nom et ton projet — on te renvoie un `AZURE_OPENAI_ENDPOINT` et un `AZURE_OPENAI_API_KEY`.

### Ce qu'il faut renseigner

Le scaffold ship avec **2 valeurs déjà pré-remplies** dans `.replit` :

| Clé | Valeur par défaut |
|-----|-------------------|
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-5-chat` |
| `AZURE_OPENAI_API_VERSION` | `2025-01-01-preview` |

Tu ajoutes seulement les **2 secrets** reçus par mail :

| Clé | Valeur |
|-----|--------|
| `AZURE_OPENAI_ENDPOINT` | l'URL (commence par `https://`) |
| `AZURE_OPENAI_API_KEY` | la clé API |

### Deux façons de les ajouter

**Rapide (un seul projet)** — dans le chat Agent Replit, tape :

> **"I need to enter my Azure credentials"**

L'Agent ouvre un formulaire sécurisé → colle endpoint + clé → Add to Secrets.

**Recommandé si tu vas remixer plusieurs apps** — sauvegarde-les une fois dans tes **Account Secrets** (coffre-fort personnel Replit, réutilisable sur tous tes projets) :

1. Ouvre l'outil **Secrets** : clique sur **+** dans les onglets d'outils → cherche "Secrets" → ouvre.
2. Clique sur **Link Account Secrets** en haut à droite du panneau.
3. S'il n'y a rien, utilise le lien proposé pour ouvrir tes Account Secrets et ajoute `AZURE_OPENAI_ENDPOINT` + `AZURE_OPENAI_API_KEY`.
4. Retour dans le panneau Secrets du projet → **Link Account Secrets** → lie les deux.

Sur chaque futur remix, il te suffira de refaire l'étape 4 : un clic.

> ⚠️ **Redémarre les serveurs** (Stop ▶ puis Run ▶) après avoir ajouté ou modifié des secrets — les env vars ne sont chargées qu'au démarrage.

---

## Étape 3 — Lance l'app (1 min)

1. Clique sur **Run** ▶ en haut de l'écran.
2. Attends que les deux serveurs démarrent (1 à 2 min la première fois).
3. L'onglet **Webview** s'ouvre sur la **Starter Page**.

La Starter Page t'offre **2 chemins** :

| Ta situation | Ce que tu fais |
|--------------|----------------|
| 🤔 Pas encore de `product.md` | Clique sur **Ouvrir l'AgentApp Elio - Value Office** → elle t'aide à formaliser ton cas d'usage. Reviens ensuite avec ton `product.md`. |
| ✅ J'ai un `product.md` | Drop-le dans la zone d'upload (+ une maquette Google AI Studio optionnelle), puis clique **Copy prompt** — tu obtiens l'instruction exacte à coller dans le chat Agent Replit. |

> 💡 Onglets en haut à droite : **Reference** (app de démo consulting qui illustre tous les patterns Elio) et **Components** (galerie des composants UI disponibles).

---

## Étape 4 — L'Agent PO rédige le backlog avec toi (5-10 min)

Dans le chat Agent Replit, colle le prompt généré par la Starter Page. Par exemple :

> *"Invoke the product-owner skill. I dropped my product.md (from the AgentApp Elio - Value Office). Propose a backlog, iterate with me until I say it's OK, then hand off to the Agent Builder."*

### Ce que fait l'Agent PO

- Lit ton `product.md`.
- Te pose des questions pour préciser le scope (critères d'acceptation concrets, out-of-scope, priorisation).
- Propose un backlog (US-01, US-02, …) en 3 à 5 tours de conversation.
- Attend ta validation explicite ("backlog OK") avant de passer à la suite.

### Ce qu'il ne fait PAS

- ❌ Écrire du code.
- ❌ Choisir un framework ou une librairie.
- ❌ Passer au build sans ton feu vert.

Quand tu dis **"backlog OK, lance le build"**, l'Agent Builder prend le relais.

---

## Étape 5 — L'Agent Builder construit l'app (10-20 min)

Le Builder :

- Crée les contrats API (`.agents/docs/api-contracts.md` + `packages/shared-types/`).
- Écrit le backend (`back/agents/{ton_agent}/`) et ses tests.
- Écrit le frontend (`front/src/pages/` + store Zustand + i18n FR/EN).
- Vérifie la conformité Elio (B1–B10, F1–F10, I1–I3) et met à jour `SUBMISSION.md`.
- Te prévient quand c'est prêt : **"Build complete"**.

Clique sur **Run** ▶ à nouveau si nécessaire, puis teste ton app dans la Webview.

---

## Étape 6 — Itère (autant que tu veux)

Dans le chat Agent, parle en langage naturel :

- *"Ajoute un champ optionnel 'date limite' au formulaire"*
- *"Change le ton du prompt pour qu'il soit plus formel"*
- *"La 2ème étape doit générer 5 recommandations au lieu de 3"*

Pour ajouter ou modifier une user story, repasse par l'Agent PO :

> *"Parle au PO. Je veux ajouter une fonctionnalité : ..."*

---

## Étape 7 — Soumets à l'équipe Elio

Quand tu es satisfait :

1. Dans le chat Agent : **"Run the platform integration check and update SUBMISSION.md"**
2. L'Agent vérifie les 23 critères de conformité et corrige les écarts.
3. Dans le chat Agent : **"Package my app"** — l'Agent remplit `manifest.md` puis lance le workflow **Package** (Run ▾ → Package). Le zip apparaît dans `dist/{agent_id}-{version}.zip`.
4. Prends 3 captures d'écran (formulaire, génération en cours, résultat) et envoie `dist/…zip` + le lien de ton Repl à l'équipe Elio (`elio@groupeonepoint.com`).

### Tu n'as plus besoin de la Starter Page ?

Demande à l'Agent : **"Supprime la starter page"**. Elle disparaît, ton app devient la page par défaut.

---

## Bloqué ?

| Symptôme | Solution |
|----------|----------|
| ⚠️ *"Missing Replit Secrets"* | Tu n'as pas ajouté `AZURE_OPENAI_ENDPOINT` ou `AZURE_OPENAI_API_KEY`. Retour à l'Étape 2. |
| ⚠️ *"DeploymentNotFound" (404)* | Ton Azure n'a pas de déploiement `gpt-5-chat`. Ouvre **Secrets → Configurations** et change `AZURE_OPENAI_DEPLOYMENT` par le nom réel sur ton Azure. |
| ⚠️ *"Blocked request. This host is not allowed"* | Demande à l'Agent : *"Update vite.config.ts to allow all hosts"*. |
| ⚠️ Le bouton **Run** ne fait rien | Regarde l'onglet Console en bas. Demande à l'Agent : *"Fix the error in the console"*. |
| ⚠️ Ton app crash mais la démo Reference marche | *"Run the tests and fix any failures"* puis, si ça persiste, *"Compare my agent to the reference agent and fix the differences"*. |
| 🔔 Bannière *"Scaffold update available"* | Dans l'onglet Shell : `git remote add upstream https://github.com/IefBerben/elio-agentapp-replit-scaffold.git && git pull upstream main` |

---

## Astuces pour bien collaborer avec l'Agent

✅ **Sois précis** — *"Le champ 'email' doit être obligatoire"* > *"Améliore le formulaire"*.
✅ **Une demande à la fois** — laisse-le finir avant d'enchaîner.
✅ **Valide ses propositions** — lis le plan avant d'accepter.
✅ **Teste après chaque changement** — ouvre la Webview.

❌ **Ne modifie pas `_reference`** — ce sont des exemples protégés.
❌ **Ne supprime pas `replit.md`** — c'est la mémoire du projet pour l'Agent.

---

## Besoin d'aide ?

- **Questions produit / credentials Azure** → [elio@groupeonepoint.com](mailto:elio@groupeonepoint.com)
- **Bug dans le scaffold** → [ouvre une issue](https://github.com/IefBerben/elio-agentapp-replit-scaffold/issues)
- **Questions Replit** → [docs.replit.com](https://docs.replit.com)

---

<details>
<summary><b>📐 Pour les développeurs — architecture & conventions</b></summary>

### Séquence de build

```
(Agent PO)                    itère product.md → backlog.md
    ↓
intake-from-markdown          lit product.md + backlog.md
    ↓
generate-api-contracts        api-contracts.md + shared-types/
    ↓
build-backend                 back/agents/{name}/ + tests + AGENTS_MAP
    ↓
build-frontend                front/src/pages/ + store + i18n
    ↓
platform-integration-check    valide B1–B10, F1–F10, I1–I3 → SUBMISSION.md
```

### Structure

```
back/                          Backend Python (FastAPI · LangChain · uv)
  agents/_reference/           Exemple protégé — NE PAS MODIFIER
  agents/{ton_agent}/          Ton agent (créé par l'Agent Builder)
  services/llm_config.py       LLM factory — toujours passer par get_llm()
  services/process_files.py    Extraction PDF/DOCX/PPTX/XLSX/audio
  services/generate_files.py   Génération DOCX/PPTX
  main.py                      FastAPI + AGENTS_MAP

front/                         Frontend React (Vite · TS · Zustand · Tailwind)
  src/pages/                   Une page par agent
  src/components/agent-apps/   Bibliothèque de composants Elio
  src/stores/agent-apps/       Zustand — un store par agent
  src/i18n/locales/            fr.json + en.json

packages/shared-types/src/     DTOs TypeScript partagés front/back
.agents/docs/                  Guidelines plateforme Elio (lues par l'Agent)
.agents/skills/                Skills découverts par l'Agent Replit
custom_instruction/            Règles auto-injectées dans l'Agent
replit.md                      Mémoire du projet
product.md                     Vision (produit par le Value Office)
backlog.md                     Backlog (produit par l'Agent PO)
SUBMISSION.md                  Dossier de remise à l'équipe Elio
```

### Skills disponibles

| Skill | Rôle |
|-------|------|
| `product-owner` | Persona **Agent PO** — itère le backlog à partir du `product.md` |
| `intake-from-markdown` | Parse `product.md` + `backlog.md` |
| `generate-api-contracts` | Génère les contrats d'API avant le code |
| `build-backend` | Écrit le backend Python |
| `build-frontend` | Écrit le frontend React |
| `platform-integration-check` | Valide la conformité Elio |
| `remove-starter` | Supprime la starter page quand tu n'en as plus besoin |

### Guidelines plateforme (`.agents/docs/`)

| Document | Contenu |
|----------|---------|
| `CONVENTIONS.md` | Architecture, nommage, modèles LLM autorisés, sécurité |
| `AGENT_APP_GUIDELINES_BACK.md` | Patterns SSE, prompts bilingues, fichiers, génération docs |
| `AGENT_APP_GUIDELINES_FRONT.md` | Composants, Zustand, dark mode, checklist complète |
| `INTEGRATION_GUIDE.md` | Processus d'intégration dans la plateforme Elio |

### Auth Azure (avancé)

| Mode | Comment |
|------|---------|
| **Par défaut** | `AZURE_OPENAI_API_KEY` dans Replit Secrets |
| **Alternatif (local)** | `az login` dans un terminal — requiert le rôle *Cognitive Services OpenAI User* |

</details>

Bon build ! 🚀
