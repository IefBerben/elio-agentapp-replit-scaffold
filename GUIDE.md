# Guide de démarrage — Construis ton app en 30 minutes

Ce guide est pour toi si tu veux **construire une app sans savoir coder**.
Tu vas décrire ton idée à un agent IA, qui écrit le code pour toi.

> Tu cherches la doc technique ? Lis [README.md](README.md).

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

**Pas besoin de savoir :**
- Coder en Python ou en JavaScript
- Utiliser Git
- Configurer un serveur

L'agent IA s'occupe de tout ça. Tu décris, il construit.

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

1. Ouvre le panneau **Secrets** :
   - Cherche un onglet **Secrets** dans le dock du bas, **ou**
   - Clique sur le bouton **+** (nouvelle vue) en haut → tape `Secrets` → ouvre
   - Si tu ne trouves pas : `Ctrl+K` (ou `Cmd+K` sur Mac) → tape `Secrets`
2. Ajoute ces 4 entrées une par une (clique **+ New Secret** à chaque fois) :

   | Clé | Valeur |
   |-----|--------|
   | `AZURE_OPENAI_ENDPOINT` | l'URL fournie par ton référent (commence par `https://`) |
   | `AZURE_OPENAI_API_KEY` | ta clé API |
   | `AZURE_OPENAI_DEPLOYMENT` | le nom du déploiement (souvent `gpt-4.1` ou `gpt-5-chat`) |
   | `AZURE_OPENAI_API_VERSION` | `2025-01-01-preview` |

3. Les secrets sont sauvegardés automatiquement

> 💡 Ces secrets restent dans **ta** copie. Personne d'autre n'y a accès.

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

---

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

## Étape 6 — Soumets à l'équipe Neo

Quand tu es satisfait :

1. Demande à l'Agent : **"Run the platform integration check and update SUBMISSION.md"**
2. L'Agent vérifie 23 critères de conformité (B1–B10, F1–F10, I1–I3)
3. Il corrige automatiquement ce qui ne passe pas

Quand tout est ✅ :
- Ouvre `SUBMISSION.md` → c'est le dossier complet pour Neo
- Prends 3 captures d'écran (formulaire, génération en cours, résultat)
- Partage le lien de ton Repl avec l'équipe Neo

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

✅ **Utilise les "skills"** : tape `/` dans le chat pour voir les compétences disponibles
   - `intake-from-markdown` : analyser ton idée
   - `generate-api-contracts` : définir les types
   - `build-backend` : construire le backend
   - `build-frontend` : construire le frontend
   - `platform-integration-check` : vérifier la conformité

❌ **N'édite pas les fichiers `_reference`** : ce sont des exemples protégés

❌ **N'efface pas `replit.md`** : c'est la mémoire du projet pour l'Agent

---

## Tu veux aller plus loin ?

- **Comprendre l'architecture** → [README.md](README.md)
- **Standards de code Elio** → `docs/CONVENTIONS.md`
- **Patterns backend** → `docs/AGENT_APP_GUIDELINES_BACK.md`
- **Patterns frontend** → `docs/AGENT_APP_GUIDELINES_FRONT.md`
- **Processus d'intégration plateforme** → `docs/INTEGRATION_GUIDE.md`

---

## Besoin d'aide ?

- **Question technique** : ton référent Onepoint
- **Bug dans le scaffold** : [signale ici](https://github.com/IefBerben/elio-agentapp-replit-scaffold/issues)
- **Question Replit** : [docs.replit.com](https://docs.replit.com)

Bon build ! 🚀
