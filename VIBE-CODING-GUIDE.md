# Guide de Vibe-Coding — Elio Scaffold v8
*Pour les Product Owners et consultants non-techniques*

---

## C'est quoi le vibe-coding ?

Le vibe-coding, c'est l'art de **construire une application en parlant** — sans écrire de code toi-même.
Tu décris ce que tu veux, un assistant IA comprend, code, et te montre le résultat.

Ce scaffold est conçu pour que ce processus soit **guidé, structuré, et conforme** aux standards de la plateforme Elio. Tu ne pars pas d'une page blanche — tu suis un workflow pensé pour toi.

---

## Avant de commencer — prérequis

| Outil | Pourquoi |
|-------|----------|
| Compte Replit | Pour héberger et exécuter le projet |
| Credentials Azure OpenAI | Endpoint, deployment name, API key — demande-les à ton responsable technique avant de commencer |

> Replit installe automatiquement Python 3.12, Node.js 22, `uv` et l'Azure CLI via `replit.nix`.

---

## Démarrer un nouveau projet

### Tu pars d'une idée (voie classique)
```
1. Fork ce projet sur Replit (bouton "Fork" en haut à droite)
2. Renomme le projet avec le nom de ton application
3. Clique sur Run ▶
   → Le backend et le frontend démarrent automatiquement
   → back/.env est créé depuis back/.env.example
4. Ouvre back/.env → remplis les 3 champs Azure
   (demande les valeurs à ton responsable si ce n'est pas déjà fait)
5. Dans l'onglet Shell → lance : az login
   (une URL apparaît — ouvre-la dans un navigateur pour t'authentifier)
6. Ouvre l'IA Replit (icône ✨ dans la barre latérale)
   → Attache le fichier : .github/prompts/product-manager.prompt.md
   → Envoie : "Je veux créer un agent pour [ton idée]"
7. Suis le guide
```

### Tu as déjà un prototype Google AI Studio (voie rapide)
```
1. Fork ce projet sur Replit et renomme-le
2. Clique sur Run ▶ → remplis back/.env → az login dans Shell
3. Dépose ton export Google AI Studio dans le dossier "Input/AI Studio/"
   (.zip ou .tsx — le générateur extrait les .zip automatiquement)
4. Ouvre l'IA Replit (icône ✨)
   → Attache le fichier : .github/prompts/generate-from-google-ai-studio.prompt.md
   → Envoie : "Lance la génération"
5. Réponds aux ≤3 questions, puis laisse le générateur travailler
```

### Tu as un ticket JIRA (voie JIRA)
```
1. Fork ce projet sur Replit et renomme-le
2. Clique sur Run ▶ → remplis back/.env → az login dans Shell
3. Exporte ton ticket JIRA en Word (.doc) et dépose-le dans "Input/JIRA/"
   (un epic seul OU un export complet du board avec les stories)
4. Ouvre l'IA Replit (icône ✨)
   → Attache le fichier : .github/prompts/generate-from-jira.prompt.md
   → Envoie : "Lance la génération"
5. Réponds aux ≤3 questions, puis laisse le générateur travailler
```

### Tu as un prototype ET un ticket JIRA (voie combinée)
```
1. Fork ce projet sur Replit et renomme-le
2. Clique sur Run ▶ → remplis back/.env → az login dans Shell
3. Dépose le prototype dans "Input/AI Studio/" et le ticket JIRA dans "Input/JIRA/"
4. Ouvre l'IA Replit (icône ✨)
   → Attache le fichier : .github/prompts/generate-from-jira-and-ai-studio.prompt.md
   → Envoie : "Lance la génération"
5. Le générateur compare les deux sources et te montre les différences
6. Valide, puis laisse-le travailler
```

### Quelle commande choisir ?

| Tu as… | Fichier à attacher dans l'IA Replit |
|--------|-------------------------------------|
| Un prototype Google AI Studio (code .tsx/.zip) | `generate-from-google-ai-studio.prompt.md` |
| Un ticket JIRA (spec métier .doc/.htm/.md) | `generate-from-jira.prompt.md` |
| Les deux | `generate-from-jira-and-ai-studio.prompt.md` |
| Rien — tu pars d'une idée | `product-manager.prompt.md` → `architect.prompt.md` → `builder.prompt.md` |

---

## Les 3 principes fondamentaux

### 1. Penser avant de builder
La tentation est de commencer à coder tout de suite. C'est le chemin le plus rapide vers un prototype qui ne répond pas au bon problème. **Prends le temps de définir la vision avant de toucher au backlog.**

### 2. Un agent à la fois
Tu as 3 assistants IA spécialisés. Chacun a un rôle précis. Quand tu travailles avec l'un, les deux autres dorment.

### 3. Les livrables guident la conversation
Trois documents structurent tout le projet : `PRODUCT.md`, `BACKLOG.md`, `SUBMISSION.md`. Tu sais toujours où en est ton projet en lisant ces fichiers.

---

## Tes 3 assistants — et comment les reconnaître

> **Comment invoquer un assistant dans Replit :**
> Ouvre l'IA Replit (icône ✨ dans la barre latérale) → clique sur l'icône trombone pour attacher un fichier → sélectionne le fichier `.github/prompts/[nom-de-l-agent].prompt.md` → envoie ton message.

### 🎯 Conversation 1 — `product-manager.prompt.md`
**Son rôle :** définir et faire évoluer la vision produit.
**Tu lui parles de :** ton métier, tes utilisateurs, ta douleur, la valeur que tu veux créer.
**Son document :** `PRODUCT.md`

**Comment le reconnaître :**
- Il commence toujours par "Je comprends que..." ou "Tu me dis que..."
- Il pose UNE seule question à la fois — jamais deux
- Il termine toujours par une action claire :
  - "✅ La vision est validée. Ouvre une nouvelle conversation et attache `/architect`."
  - "✅ La vision est mise à jour. Voici l'impact — apporte ce rapport à `/architect`."
  - "Ce que tu décris est une évolution de feature. Retourne à `/architect`."

**Ce qu'il ne fait pas :** il ne crée pas de features, il ne touche pas au code.

---

### 🗂️ Conversation 2 — `architect.prompt.md`
**Son rôle :** décomposer la vision en features buildables, valider la cohérence avec PRODUCT.md, et challenger le découpage par force de proposition.
**Tu lui parles de :** si les features proposées correspondent à ta vision, si quelque chose manque ou ne correspond pas.
**Son document :** `BACKLOG.md` (features uniquement — les stories sont ajoutées par le builder)

**Comment le reconnaître :**
- Il présente toujours les features sous forme de **liste numérotée** avec une phrase métier
- Il ajoute toujours **trois observations** après la liste : ⚠️ une hypothèse, 💡 un angle alternatif, 🎯 un risque de complexité
- Il termine toujours la présentation par "Ces fonctionnalités couvrent-elles bien ce que tu veux construire ?"
- Il écrit **toutes les features confirmées** directement dans `BACKLOG.md` — **pas les stories**
- En cas de refus de cohérence vision : commence par "🚫 Cette feature sort du cadre de la vision —"
- Termine toujours par "✅ [N] features écrites dans BACKLOG.md." ou "Retourne à `/product-manager`."

**Ce qu'il ne fait pas :** il ne définit pas les User Stories (c'est le builder), il ne code pas, il ne modifie pas `PRODUCT.md`, il ne décide pas de l'ordre de construction.

---

### 🔨 Conversation 3 — `builder.prompt.md` + `quality.prompt.md`
**Son rôle :** lire le backlog complet, décomposer toutes les features en User Stories, proposer un plan d'implémentation, construire, vérifier la conformité, te dire comment tester.
**Tu lui parles de :** ce que tu vois sur l'écran, ce qui marche ou pas.
**Ses documents :** le code + `BACKLOG.md` (stories + statuts) + `SUBMISSION.md` sections 5-6

**Comment le reconnaître :**
- Il commence TOUJOURS par confirmer ce qu'il va construire :
  "Je vais construire : [nom]. Ce que tu verras : [liste]. Je te préviens quand c'est prêt."
- Il termine TOUJOURS avec le rapport structuré "✅ [Story] est terminée."
- En cas de blocage : commence par "🚫 Je ne peux pas faire ça —"
- En cas de correction qualité : commence par "🔧 Je dois corriger avant de continuer —"

**Ce qu'il ne fait pas :** il ne modifie pas `PRODUCT.md`, il n'ajoute pas de features (il ajoute des stories sous les features existantes et met à jour leur statut).
**Ce qu'il ne touche JAMAIS :** le dossier `_reference` — c'est l'exemple de référence protégé.

---

### 📊 Utilitaire — `status.prompt.md`
**Son rôle :** afficher l'état du projet en un coup d'œil — vision, features, stories, prochaine action.
**Quand l'utiliser :** quand tu reviens après une pause et ne sais plus où tu en es.
**Son document :** lit PRODUCT.md + BACKLOG.md — **ne modifie rien**.

**Ce qu'il affiche :**
```
📊 Statut — [nom de l'app]

Vision       ✅ Validée   (ou ⚠️ Non définie)
Features     ✅ Built : N   🔨 Confirmed : N
Stories      ✅ Built : N   🔨 Confirmed : N

Prochaine action : [une phrase claire — quoi faire maintenant]
```

---

## Voie rapide — les générateurs

Si tu as une spec existante (maquette Google AI Studio et/ou ticket JIRA), tu n'as pas besoin de démarrer les conversations PM → Architect → Builder. Utilise une des trois commandes de génération à la place.

> **Quand l'utiliser :** tu as une maquette ou une spec métier et tu veux rendre le tout conforme à la plateforme Elio en une seule étape.

### Ce que le générateur produit

Il joue tous les rôles à la fois (PM, Architect, Builder) et produit :
- `PRODUCT.md` — vision produit inférée depuis ta spec
- `BACKLOG.md` — **toutes les features** de ta spec, classées en 3 catégories :
  - ✅ **Feature buildable** → construite immédiatement
  - ⚠️ **Feature avec dépendance** → documentée dans le backlog (bibliothèque hors contrat — à valider avec l'équipe technique)
  - 🔒 **Feature hors contrat V1** → documentée dans le backlog avec l'avertissement pour l'équipe Neo (base de données, SMTP, système de fichiers...)
- Tout le code conforme au scaffold Elio pour les features ✅ uniquement

**Règle fondamentale : rien n'est supprimé.** Toutes les features restent dans le backlog.

### Comment reconnaître le générateur
Il commence TOUJOURS par un inventaire des features avec leur catégorie :
```
J'ai analysé ta spécification. Voici le backlog complet que je propose :
✅ Feature 1 — ... → à construire maintenant
⚠️ Feature 2 — ... → backlog (bibliothèque X hors contrat — à valider avec l'équipe technique)
🔒 Feature 3 — ... → backlog (base de données non disponible en V1)
```
Puis il pose ≤3 questions métier si nécessaire, et génère sans interruption.

### Ce que tu fais après la génération
- **`PRODUCT.md` à valider** → ouvre `product-manager.prompt.md` pour affiner la vision
- **Features à ajuster** → ouvre `architect.prompt.md` pour modifier le backlog
- **Stories 🔒 à débloquer** → quand l'équipe Neo active la fonctionnalité, ouvre `builder.prompt.md`

---

## Le flux complet

```
PHASE 1 — VISION
════════════════
Ouvre l'IA Replit (icône ✨)
Attache .github/prompts/product-manager.prompt.md
    ↓
"Je veux créer un agent pour [ton idée]"
    ↓
Il pose des questions simples, une par une (3 à 10 selon le sujet)
Tu parles de ton métier et de tes utilisateurs
    ↓
Il rédige PRODUCT.md — tu valides
    ↓
"✅ La vision est validée."
Ferme ou garde la conversation


PHASE 2 — FEATURES
══════════════════
Ouvre une nouvelle conversation IA Replit
Attache .github/prompts/architect.prompt.md
    ↓
Il propose les features en liste numérotée + trois observations (⚠️/💡/🎯)
"Ces fonctionnalités couvrent-elles bien ce que tu veux construire ?"
    ↓
Tu confirmes (ou demandes des ajustements)
Il écrit TOUTES les features dans BACKLOG.md
    ↓
"✅ [N] features écrites dans BACKLOG.md."
Ferme ou garde la conversation


PHASE 3 — BUILD
═══════════════
Ouvre une nouvelle conversation IA Replit
Attache .github/prompts/builder.prompt.md
    ↓
Dis juste "go"
    ↓
Il lit BACKLOG.md, découpe TOUTES les features en User Stories
    ↓
"Voici mon plan d'implémentation :
 US-01 — [...], US-02 — [...], US-03 — [...] — go ?"
    ↓
Tu dis "go" — il écrit les US dans BACKLOG.md et commence
    ↓
Il construit chaque US en séquence (toutes les features)
    ↓
"🔍 Vérification qualité..." après chaque US
    ↓
"✅ [Story] est terminée. Comment tester : [étapes]"
    ↓
Tu testes dans le panneau de prévisualisation Replit (onglet Webview)
    ↓
Il enchaîne sur la story suivante — sans retour à /architect

REVENIR EN PHASE 2 SI NÉCESSAIRE
══════════════════════════════════
Si tu veux ajouter ou ajuster des features après le build
→ Retourne à architect.prompt.md — le builder s'adaptera automatiquement
    ↓
SUBMISSION.md est complet — remise à l'équipe Neo
```

---

## Quand la vision évolue

**Cas A — Tu veux ajouter ou ajuster une feature**
→ Retourne à `architect.prompt.md` — pas besoin de toucher `PRODUCT.md`

**Cas B — Le problème métier ou les utilisateurs changent**
→ Retourne à `product-manager.prompt.md`
→ Il met à jour `PRODUCT.md` avec un numéro de version
→ Il produit un rapport d'impact sur le backlog
→ Tu apportes ce rapport à `architect.prompt.md`
→ L'architect traite l'impact : "⚠️ La vision a évolué —"

**Si tu ne sais pas dans quel cas tu es :**
→ Pose la question à `product-manager.prompt.md` — il classifera pour toi.

---

## Ce que tu valides — et ce que tu ne valides pas

| | Tu valides | Tu ne valides pas |
|---|---|---|
| **`product-manager`** | La vision, le problème, les utilisateurs | Les choix techniques |
| **`architect`** | La liste des features, le découpage | Les stories, le code, l'ordre de construction |
| **`builder`** | Le plan d'implémentation en US ("go ?"), ce que tu vois à l'écran | La qualité technique — c'est `quality` |

**Règle simple :** si tu ne comprends pas ce qu'on te demande, dis-le. Les agents doivent t'expliquer en termes métier — jamais en jargon technique.

---

## Reconnaître les signaux importants

| Signal | Ce que ça veut dire | Quoi faire |
|--------|---------------------|------------|
| "✅ La vision est validée." | PRODUCT.md est prêt | Passe à architect.prompt.md |
| "✅ [N] features écrites dans BACKLOG.md." | Backlog prêt | Ouvre builder.prompt.md → dis "go" |
| "📊 Statut —" | Dashboard projet | Lis la prochaine action recommandée |
| "Voici mon plan d'implémentation complet :" | Builder — plan US + ordre | Lis le plan → dis "go" |
| "✅ [Story] est terminée." | Story Built, qualité OK | Teste dans le Webview Replit |
| "⚠️ La vision a évolué —" | Impact sur le backlog en cours | Attends le rapport complet |
| "🚫 Je ne peux pas faire ça —" | Violation du contrat Elio | Retourne à l'architect |
| "🔧 Je dois corriger avant —" | Qualité non conforme, correction en cours | Attends la correction |
| "🔍 Vérification qualité —" | 14 checks en cours | Attends le résultat |
| "J'ai analysé ta spécification..." | Générateur — inventaire des features | Lis les catégories ✅/⚠️/🔒 |
| "J'ai analysé ta spécification JIRA..." | Générateur JIRA — inventaire des features | Lis les catégories ✅/⚠️/🔒 |
| "Cohérence :" | Générateur combiné — comparaison JIRA ↔ prototype | Vérifie les écarts détectés |
| "Décisions d'architecture :" | Générateur JIRA — résumé des choix techniques | Vérifie les décisions |
| "Je génère maintenant — sans interruption" | Générateur — build lancé | Attends le rapport final |
| "✅ Application générée depuis la spec" | Générateur terminé | Teste + valide avec product-manager |

---

## Les pièges à éviter

**❌ Sauter la phase de vision**
→ Tu vas builder vite... la mauvaise chose.

**❌ Demander à l'architect de décider l'ordre de construction**
→ L'architect définit les features, pas leur ordre de build. C'est le builder qui décompose en User Stories et propose le plan d'implémentation.

**❌ Retourner à l'architect entre chaque feature pendant le build**
→ Une fois le builder lancé avec "go", il construit toutes les features du backlog sans interruption. Reviens à l'architect seulement si la vision change.

**❌ Demander au builder d'ajouter des features**
→ Les features viennent toujours de l'architect.

**❌ Ignorer un "🚫 Je ne peux pas faire ça"**
→ Les refus protègent la compatibilité avec la plateforme Elio. Écoute-les.

**❌ Utiliser la mauvaise commande de génération**
→ `generate-from-google-ai-studio` attend du CODE (export Google AI Studio).
→ `generate-from-jira` attend du TEXTE (spec JIRA).
→ Si tu as les deux, utilise `generate-from-jira-and-ai-studio`.
→ Si tu donnes un fichier .doc à `generate-from-google-ai-studio`, il ne trouvera pas de code source.

**❌ L'IA a perdu le fil après une longue opération**
→ C'est normal — l'IA peut perdre le contexte après un long build.
→ **Solution :** ouvre une **nouvelle conversation** IA Replit (bouton `+`). Attache de nouveau le fichier prompt et dis "go".

**❌ Marquer Built sans tester toi-même**
→ Ouvre le panneau Webview Replit et teste avec les étapes du rapport.

**❌ Modifier PRODUCT.md ou BACKLOG.md toi-même**
→ Ces documents appartiennent aux agents. Laisse-les les gérer.

**❌ Toucher au dossier `_reference`**
→ C'est l'exemple de référence. Le builder ne doit jamais le modifier.

**❌ Les serveurs ne démarrent pas**
→ Un processus précédent tourne peut-être encore. Dans l'onglet Shell, tape : `pkill -f uvicorn; pkill -f vite`
→ Puis reclique sur Run ▶.

**❌ Demander au générateur de supprimer une feature**
→ Le générateur capture toute la vision de ta spec. S'il met une feature en 🔒, c'est une contrainte plateforme — pas un choix. La feature reste dans le backlog pour V2.

**❌ Attendre que le builder prenne les screenshots pour SUBMISSION.md**
→ Les screenshots, c'est toi qui les prends. Le builder prépare le texte de `SUBMISSION.md` et te dit quoi capturer — mais il ne peut pas voir ton écran.
→ **Comment faire :** ouvre le Webview Replit, navigue vers la feature, fais un screenshot (`Windows + Shift + S` ou `Cmd + Shift + 4`), et colle l'image dans `SUBMISSION.md`.

---

## Les documents de ton projet

| Document | Propriétaire | Ce qu'il contient |
|----------|-------------|-------------------|
| `PRODUCT.md` | `product-manager` (ou générateur) | Vision, problème, utilisateurs, valeur |
| `BACKLOG.md` | `architect` + `builder` (ou générateur) | Features confirmées + stories (✅ Built, ⚠️ backlog V2, 🔒 contrainte plateforme) |
| `SUBMISSION.md` | Les 3 agents (ou générateur) | Dossier complet pour l'équipe Neo |

---

## Glossaire

| Terme technique | En clair |
|----------------|----------|
| Backend | Le serveur — la partie qui appelle l'IA |
| Frontend | L'interface — ce que l'utilisateur voit |
| SSE / Streaming | L'agent affiche sa réponse progressivement, comme ChatGPT |
| Store Zustand | L'application mémorise les données entre les pages |
| i18n | L'interface en français ET en anglais |
| Dark mode | Mode sombre — obligatoire sur Elio |
| Story Confirmed | User Story dans le backlog — prête à être construite par le builder |
| Story Built | User Story construite et vérifiée |
| Conformité toolkit | Le code respecte les standards de la plateforme Elio |
| `_reference` | Dossier exemple protégé — ne jamais modifier |
| ✅ Feature buildable | Feature de la spec que le générateur construit immédiatement |
| ⚠️ Feature avec dépendance | Feature qui nécessite une bibliothèque hors contrat Elio — à valider avec l'équipe technique |
| 🔒 Feature hors contrat V1 | Feature qui nécessite une capacité non disponible sur Elio V1 (base de données, SMTP, etc.) |
| Contrainte plateforme | Ce qu'il manque côté Neo pour débloquer une feature 🔒 |
| Webview | Panneau de prévisualisation intégré à Replit — affiche l'application en direct |

---

## Aide-mémoire rapide

| Je veux… | Fichier à attacher dans l'IA Replit |
|----------|--------------------------------------|
| Démarrer un nouveau projet | `product-manager.prompt.md` |
| Voir / affiner les features | `architect.prompt.md` |
| Construire mes features | `builder.prompt.md` → "go" |
| Savoir où j'en suis | `status.prompt.md` |
| Vérifier la conformité | `quality.prompt.md` |
| Générer depuis une spec AI Studio | `generate-from-google-ai-studio.prompt.md` |
| Générer depuis un ticket JIRA | `generate-from-jira.prompt.md` |
| Générer depuis les deux | `generate-from-jira-and-ai-studio.prompt.md` |
| Mettre à jour SUBMISSION.md | (le builder le fait) |
| Relancer après contexte plein | `builder.prompt.md` → "go" |

**Actions Replit utiles :**
- **Run ▶** — démarre le backend (8000) + frontend (5173) en parallèle
- **Webview** — ouvre l'application en prévisualisation
- **Shell** — terminal pour `az login`, tests manuels, etc.
- Shell : `cd back && uv run pytest agents/ -v` — lance les tests backend
- Shell : `cd front && npm test` — lance les tests frontend

---

*Scaffold v8 — Agentic Studio · Onepoint · Avril 2026*
