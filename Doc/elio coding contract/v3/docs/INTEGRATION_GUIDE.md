# Guide d'intégration dans Elio

Ce document explique comment votre POC sera intégré dans l'application Elio.

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
