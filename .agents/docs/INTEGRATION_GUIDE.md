# Guide d'intégration dans Neo/Elio

Ce document explique comment votre POC sera intégré dans la plateforme Neo/Elio.

---

## Principe de fonctionnement

La plateforme Neo/Elio est composée de :

- **Frontend React** (TypeScript, Vite, Tailwind, shadcn/ui) — deux cibles : Elio et Neo
- **Backend Python** (FastAPI, LangChain) — framework `DeclarativeAgentApp`
- **Communication** via routes SSE V2 (`POST /agent-apps/execute/{app_id}/{step_id}/stream`)

Votre POC sera intégré comme une **Agent App** dans la plateforme.

---

## Ce que vous développez

### Backend (CRITIQUE)

La partie la plus importante. Votre **logique métier** doit être :

1. **Développée en Python** avec `DeclarativeAgentApp`
2. **Asynchrone** (`async/await`)
3. **Streamée via SSE V2** (helpers `self.in_progress`, `self.completed`, `self.error`)
4. **Avec TabSchema** — tous les champs ont des valeurs par défaut
5. **`@stream_safe` appliqué automatiquement** sur chaque step et action (ne pas ajouter explicitement)

Voir [AGENT_APP_GUIDELINES_BACK.md](AGENT_APP_GUIDELINES_BACK.md) pour la référence complète.

### Frontend (OPTIONNEL mais recommandé)

Le frontend aide à valider l'expérience utilisateur et tester le flux de bout en bout.

**Dual-platform clarification :**
Dans le toolkit, **une seule page frontend** est requise (`front/src/pages/`).
La séparation Elio/Neo se fait lors de l'intégration dans le monorepo cible.
Le composant page doit être générique et sans dépendances à un design system spécifique.

---

## Convention de communication Backend ↔ Frontend

### Routes SSE

```
# V2 — route principale
POST /agent-apps/execute/{app_id}/{step_id}/stream
Content-Type: application/json
Body: { ...flat dict de tous les champs... }

# Action — mutation légère
POST /agent-apps/execute/{app_id}/action/{action_id}/stream
```

### Format des événements SSE

```
data: {"step": "generate", "message": "Initialisation...", "status": "in_progress", "progress": 5}
data: {"step": "generate", "message": "Génération...", "status": "in_progress", "progress": 50}
data: {"step": "generate", "message": "Terminé", "status": "completed", "progress": 100, "data": {...}}
```

### Statuts possibles

| Status        | Description                                         |
| ------------- | --------------------------------------------------- |
| `in_progress` | En cours de traitement                              |
| `completed`   | Terminé avec succès (dernier message, avec données) |
| `error`       | Erreur (dernier message)                            |

---

## Portabilité vers Neo/Elio

### Backend

Pour migrer un agent du toolkit vers la plateforme Neo :

1. Copier `back/agents/mon_usecase/` dans `back/src/neo_back/services/agent_apps/<catégorie>/`
2. Ajouter dans `registered_apps.py` de Neo (avec le vrai driver MongoDB)
3. Le code `app.py` et `schemas.py` est **identique** — seul le storage change
4. Les routes SSE et les events SSE sont **100% compatibles**

### Frontend

Pour migrer le frontend :

1. Extraire la logique partagée (store, hooks, types) dans `front/shared/src/`
2. Garder l'UI Elio dans `front/elio/src/pages/`
3. Créer l'UI Neo dans `front/neo/src/pages/`
4. Partager le store Zustand entre les deux

---

## Processus de soumission

1. **Vous développez** votre POC avec ce toolkit
2. **Vous testez** le flux complet (backend + frontend)
3. **Vous livrez** le code à l'équipe Neo
4. **L'équipe Neo** :
    - Intègre la logique backend dans le routeur d'agents (MongoDB, auth, monitoring)
    - Répartit le frontend entre `front/shared`, `front/elio`, `front/neo`
    - Adapte le rendu aux standards Elio et Neo sans dupliquer la logique commune
    - Configure les métriques et le monitoring
    - Déploie en production
    - Gère les règles de diffusion selon les cas

---

## Bonnes pratiques pour l'intégration

### ✅ À faire

- Docstrings avec Args/Yields sur toutes les fonctions
- Type hints partout
- Code et commentaires en **anglais**
- Communication en **français**
- Tests unitaires avec mocking LLM
- Variables d'environnement pour les secrets
- `@stream_safe` sur chaque step
- Dual-platform (Elio + Neo)

### ❌ À ne pas faire

- Hardcoder des clés API ou secrets
- Utiliser des bibliothèques non-standard sans justification
- Bloquer l'event loop avec des opérations synchrones longues
- Ignorer les erreurs silencieusement
- Créer des fonctions standalone `async def stream_xxx(...)` (utiliser `DeclarativeAgentApp`)
- Livrer un agent avec une seule plateforme frontend

---

## Contact et support

- **Email** : Neo@groupeonepoint.com
- **Objet** : `[Toolkit Neo v3] Nom de votre use case`

L'équipe Neo peut fournir :

- **Accès API à des modèles de langage** (GPT et autres)
- **Support technique** pour l'architecture
- **Review de code** avant intégration

---

## Principe de fonctionnement

L'application Elio est une plateforme extensible composée de :

- **Frontend React** (TypeScript, Vite, Tailwind, shadcn/ui)
- **Backend Python** (FastAPI, LangChain)
- **Communication** via API REST et SSE (Server-Sent Events)

Votre POC sera intégré comme une **Agent App** dans la plateforme.

---

## Ce que vous développez

### Backend (CRITIQUE)

C'est la partie la plus importante. Votre **logique métier** doit être :

1. **Développée en Python** (3.14)
2. **Asynchrone** (`async/await`)
3. **Streamée via SSE** (`AsyncGenerator[dict, None]`)
4. **Autonome** : une fonction par étape, chaque fonction prend des inputs et yield des résultats

### Frontend (OPTIONNEL)

Le frontend est **indicatif**. L'équipe Elio recodera l'interface pour s'intégrer dans la plateforme. Cependant, un frontend fonctionnel aide à :

- Valider l'expérience utilisateur
- Tester le flux de bout en bout
- Communiquer votre vision du produit

Dans le repo cible, l'intégration frontend suit un pattern de mutualisation explicite :

- **socle commun à toutes les Agent Apps** dans `front/shared`
- **logique commune d'une Agent App entre Elio et Neo** dans `front/shared`
- **UI Elio** dans `front/elio`
- **UI Neo** dans `front/neo`

Autrement dit, le frontend du toolkit sert à démontrer le flux, mais la version intégrée doit être découpée entre logique partagée et UI runtime.

---

## Convention de communication Backend ↔ Frontend

### Route SSE

```
POST /agent-apps/execute/{agent_id}/stream
Content-Type: application/json
Body: { ...vos inputs... }
```

### Format des événements SSE

```
data: {"step": "beginning", "message": "Démarrage...", "status": "in_progress", "progress": 0}

data: {"step": "processing", "message": "En cours...", "status": "in_progress", "progress": 50}

data: {"step": "completed", "message": "Terminé", "status": "completed", "progress": 100, "result_data": {...}}
```

### Statuts possibles

| Status        | Description                           |
| ------------- | ------------------------------------- |
| `in_progress` | En cours de traitement                |
| `completed`   | Terminé avec succès (dernier message) |
| `error`       | Erreur (dernier message)              |

---

## Processus d'intégration

1. **Vous développez** votre POC avec ce toolkit
2. **Vous testez** le flux complet (backend + frontend)
3. **Vous livrez** le code à l'équipe Elio
4. **L'équipe Néo** vous fait des retours sur les adaptations à faire
5. **Vous adaptez** les changements à faire
6. **L'équipe Elio** :
    - Intègre votre logique backend dans le routeur d'agents
    - répartit le frontend entre `front/shared`, `front/elio` et `front/neo` selon le niveau de mutualisation pertinent
    - adapte le rendu aux standards Elio et Neo sans dupliquer la logique commune
    - Configure les métriques et le monitoring
    - Déploie dans l'environnement de production
    - Gère les règles de diffusions selons les cas

---

## Bonnes pratiques pour l'intégration

### ✅ À faire

- Docstrings avec Args/Returns sur toutes les fonctions
- Type hints partout
- Code et commentaires en **anglais**
- Communication en **français**
- Gestion d'erreurs robuste avec messages clairs
- Tests unitaires
- Variables d'environnement pour les secrets

### ❌ À ne pas faire

- Hardcoder des clés API ou secrets
- Utiliser des bibliothèques non-standard sans justification
- Bloquer l'event loop avec des opérations synchrones longues
- Ignorer les erreurs silencieusement

---

## Contact et support

- **Email** : Elio@groupeonepoint.com
- **Objet** : `[Toolkit Elio] Nom de votre use case`

L'équipe Elio peut fournir :

- **Accès API à des modèles de langage** (GPT et autres)
- **Support technique** pour l'architecture
- **Review de code** avant intégration
