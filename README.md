# Elio Scaffold v9 — Construis ton app en 30 minutes

Scaffold pour construire des **Agent Apps** pour la plateforme Elio (Agentic Studio · Onepoint),
sans avoir besoin de coder. Tu décris ton idée à un agent IA, qui écrit le code pour toi.

---

## Avant de commencer

**Ce qu'il te faut :**
- Un compte Replit (gratuit) → [replit.com](https://replit.com)
- Tes credentials Azure OpenAI → demande à ton référent Onepoint
- Une idée d'application

**Combien de temps ?**
- Setup initial : **5 minutes**
- Premier prototype fonctionnel : **20 à 30 minutes**
- Itérations : autant que tu veux

**Pas besoin de savoir** coder, utiliser Git, ou configurer un serveur. L'agent IA s'occupe de tout.

---

## Étape 1 — Récupère le scaffold (2 min)

1. Ouvre la page du scaffold dans ton navigateur (ton référent te donne le lien)
2. Connecte-toi à Replit
3. Clique sur le bouton bleu **Remix this app**
4. Donne un nom à ton projet (ex : `assistant-juridique-acme`)
5. Confirme

Tu as maintenant **ta propre copie privée** du scaffold. Personne ne peut la voir sauf toi.

---

## Étape 2 — Configure tes credentials Azure (3 min)

Sans cette étape, l'IA ne pourra pas répondre aux requêtes de ton app.

**Le plus simple : demande à l'Agent.** Dans le chat Agent, tape :

> **"I need to enter my Azure credentials"**

L'Agent ouvre un formulaire sécurisé directement dans le chat. Renseigne les 4 valeurs :

| Clé | Valeur |
|-----|--------|
| `AZURE_OPENAI_ENDPOINT` | l'URL fournie par ton référent (commence par `https://`) |
| `AZURE_OPENAI_API_KEY` | ta clé API |
| `AZURE_OPENAI_DEPLOYMENT` | le nom du déploiement (souvent `gpt-4.1` ou `gpt-5-chat`) |
| `AZURE_OPENAI_API_VERSION` | `2025-01-01-preview` |

Les secrets sont chiffrés et sauvegardés automatiquement.

> 💡 Ces secrets restent dans **ta** copie. Personne d'autre n'y a accès.
> ⚠️ Après avoir ajouté/modifié les secrets, **redémarre les serveurs** (Stop ▶ puis Run ▶) — les variables d'environnement ne sont chargées qu'au démarrage.

---

## Étape 3 — Lance l'app de démonstration (1 min)

1. En haut de l'écran, clique sur le gros bouton **Run** ▶
2. Attends que les deux serveurs démarrent (1 à 2 minutes la première fois)
3. L'onglet **Webview** s'ouvre automatiquement → tu vois l'app de démo

**Teste-la maintenant** :
- Dans le formulaire, tape une question (ex : *"Comment améliorer l'engagement client ?"*)
- Clique **Générer**
- Regarde la réponse arriver progressivement (streaming)
- Modifie un point clé, clique sur l'étape 2

C'est l'app de référence. Elle te montre **ce que tu peux construire**.

---

## Étape 4 — Décris ton app à l'Agent (15 min)

C'est ici que la magie opère.

> 💡 **Pas sûr de ce que tu veux construire ?** Demande **"Talk to the PM"** dans le chat.
> Tu parleras à un Product Manager IA qui te pose les bonnes questions avant qu'une ligne de code soit écrite.
> Il rédige `product.md` et `backlog.md` à ta place, puis passe la main au Builder.

1. Ouvre l'onglet **Agent** :
   - Souvent visible en haut de l'écran ou dans le dock
   - Sinon : `Ctrl+K` (ou `Cmd+K`) → tape `Agent` → ouvre
2. Dans la zone de chat, tape simplement :

   > **"Build my app"**

3. L'Agent va te poser **5 questions** :
   - Quel problème métier ton app résout ?
   - Qui sont les utilisateurs ?
   - Quelles sont les étapes du workflow ?
   - Quelles données entrent et sortent ?
   - Combien d'étapes (1 ou 2) ?

4. Réponds en français, naturellement, comme à un collègue

L'Agent va ensuite :
- Écrire les specs dans `product.md` et `backlog.md`
- Te montrer un résumé pour validation
- Construire le backend, le frontend, les tests
- Vérifier que tout est conforme aux standards Elio
- Mettre à jour `SUBMISSION.md` (le dossier de remise)

> ⏱️ Compte 10 à 20 minutes selon la complexité de ton app.

### Tu as déjà une spec écrite ?

Si tu as déjà rédigé `product.md` et `backlog.md`, tape simplement :

> **"Build my app from the existing product.md and backlog.md"**

### Tu as un prototype Google AI Studio ?

1. Dépose ton export `.tsx` ou `.zip` dans le dossier `Input/`
2. Tape : **"Build my app from the Google AI Studio prototype in Input/"**

L'Agent reprendra l'idée et la transformera en app conforme Elio.

---

## Étape 5 — Teste et itère (autant que tu veux)

Quand l'Agent te dit **"Build complete"** :

1. Si l'app n'est pas déjà rechargée, clique **Run** ▶ à nouveau
2. Va dans l'onglet **Webview** → ton app est là
3. Teste-la avec des cas réels

**Pour ajuster quelque chose**, retourne dans le chat Agent et demande :
- *"Ajoute un champ optionnel 'date limite' au formulaire"*
- *"Change le ton du prompt pour qu'il soit plus formel"*
- *"La 2ème étape doit générer 5 recommandations au lieu de 3"*

L'Agent comprend le langage naturel. Tu n'as pas besoin de toucher au code.

---

## Étape 6 — Soumets à l'équipe Elio

Quand tu es satisfait :

1. Demande à l'Agent : **"Run the platform integration check and update SUBMISSION.md"**
2. L'Agent vérifie 23 critères de conformité (B1–B10, F1–F10, I1–I3)
3. Il corrige automatiquement ce qui ne passe pas

Quand tout est ✅ :
- Ouvre `SUBMISSION.md` → c'est le dossier complet pour l'équipe Elio
- Prends 3 captures d'écran (formulaire, génération en cours, résultat)
- Partage le lien de ton Repl avec l'équipe Elio

---

## Bloqué ? Solutions aux erreurs courantes

### ⚠️ "Missing Replit Secrets"
Tu n'as pas configuré tes credentials Azure. **Étape 2** ci-dessus.

### ⚠️ "Blocked request. This host is not allowed"
Bug connu déjà corrigé. Si tu le vois, demande à l'Agent : *"Update vite.config.ts to allow all hosts"*

### ⚠️ Le bouton "Run" ne fait rien
- Vérifie l'onglet **Console** en bas — souvent une erreur de syntaxe
- Demande à l'Agent : *"Fix the error in the console"*

### ⚠️ L'app de démo fonctionne mais la mienne crash
- Demande à l'Agent : *"Run the tests and fix any failures"*
- Si ça persiste : *"Compare my agent to the reference agent and fix the differences"*

### ⚠️ Bannière "Scaffold update available"
Tape dans l'onglet **Shell** :
```bash
git remote add upstream https://github.com/IefBerben/elio-agentapp-replit-scaffold.git
git pull upstream main
```

---

## Astuces pour bien collaborer avec l'Agent

✅ **Sois précis** : *"Le champ 'email' doit être obligatoire"* > *"Améliore le formulaire"*
✅ **Une demande à la fois** : laisse l'Agent finir avant d'enchaîner
✅ **Lis ses propositions** : avant de valider, regarde ce qu'il s'apprête à faire
✅ **Teste après chaque changement** : ouvre la Webview, vérifie que ça marche

❌ **N'édite pas les fichiers `_reference`** : ce sont des exemples protégés
❌ **N'efface pas `replit.md`** : c'est la mémoire du projet pour l'Agent

---

## Besoin d'aide ?

- **Question technique** : ton référent Onepoint
- **Bug dans le scaffold** : [signale ici](https://github.com/IefBerben/elio-agentapp-replit-scaffold/issues)
- **Question Replit** : [docs.replit.com](https://docs.replit.com)

---

<details>
<summary><b>📐 Pour les développeurs — architecture & conventions</b></summary>

### Séquence de build de l'Agent

```
intake-from-markdown       → analyse product.md + backlog.md (ou interview)
       ↓
generate-api-contracts     → .agents/docs/api-contracts.md + packages/shared-types/src/index.ts
       ↓
build-backend              → back/agents/{name}/ + tests + AGENTS_MAP
       ↓
build-frontend             → front/src/pages/ + store Zustand + i18n
       ↓
platform-integration-check → valide B1–B10, F1–F10, I1–I3 · met à jour SUBMISSION.md
```

### Structure du projet

```
back/                          Backend Python (FastAPI · LangChain · uv)
  agents/_reference/           Exemple de référence — NE PAS MODIFIER
  agents/{ton_agent}/          Ton agent (créé par Agent)
  services/llm_config.py       LLM factory — toujours utiliser get_llm()
  services/process_files.py    Extraction PDF/DOCX/PPTX/XLSX/audio
  services/generate_files.py   Génération DOCX/PPTX
  main.py                      FastAPI + AGENTS_MAP

front/                         Frontend React (Vite · TS · Zustand · Tailwind)
  src/pages/                   Une page par agent app
  src/components/agent-apps/   Bibliothèque de composants Elio
  src/stores/agent-apps/       Zustand — un store par agent
  src/i18n/locales/            fr.json + en.json

packages/shared-types/src/     Interfaces TypeScript partagées (DTOs)
.agents/docs/                  Guidelines plateforme Elio v3 (lues par l'Agent)
custom_instruction/            Règles auto-injectées dans l'Agent
.agents/skills/                5 skills Replit Agent (auto-découverts)
replit.md                      Mémoire projet
product.md / backlog.md        Décris ton app ici
SUBMISSION.md                  Dossier de remise à l'équipe Elio
```

### App de référence

Assistant consulting fonctionnel en 2 étapes — illustre tous les patterns Elio :
`@stream_safe` · `get_llm()` · Zustand + `persist` + `partialize` · prompts bilingues · SSE streaming · `AgentAppPageShell` · `StepIndicator` · `LanguageToggle`

**Ne jamais modifier** `back/agents/_reference/` ni `front/src/pages/_ReferencePage.tsx`.

### Guidelines plateforme (`.agents/docs/`)

| Document | Contenu |
|----------|---------|
| `CONVENTIONS.md` | Architecture, nommage, modèles LLM autorisés, sécurité |
| `AGENT_APP_GUIDELINES_BACK.md` | Patterns SSE, prompts bilingues, fichiers, génération docs |
| `AGENT_APP_GUIDELINES_FRONT.md` | Composants, Zustand, dark mode, checklist complète |
| `INTEGRATION_GUIDE.md` | Processus d'intégration dans la plateforme Elio |

L'Agent les lit automatiquement avant d'écrire du code.

### Authentification Azure (avancé)

| Mode | Comment |
|------|---------|
| **Recommandé** | `AZURE_OPENAI_API_KEY` dans Replit Secrets |
| **Alternatif** | `az login` dans l'onglet Shell (session persistante) |

</details>

Bon build ! 🚀
