# Architecture — Toolkit Agent Apps v3

Ce document décrit l'architecture du toolkit standalone pour le développement d'Agent Apps Neo.

---

## Vue d'ensemble

Le toolkit reproduit fidèlement l'architecture "Agent App" de la plateforme Neo/Elio, sans dépendance à MongoDB ni aux services cloud de production. Le code produit ici est directement portable dans Neo/Elio sans modification de la logique métier.

```
┌─────────────────────────────────────────────────────────────────┐
│                         TOOLKIT v3                              │
│                                                                 │
│  ┌──────────────┐    SSE V2    ┌──────────────────────────┐    │
│  │   Front/Elio  │ ──────────► │  FastAPI + framework/    │    │
│  │   Front/Neo   │ ◄────────── │  DeclarativeAgentApp     │    │
│  └──────────────┘    streams   └──────────────────────────┘    │
│         │                                │                      │
│   Zustand store                   in-memory state               │
│   ThemeWrappers                   (remplace MongoDB)            │
│   i18n fr + en                    registered_apps.py           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend

### Pattern central : `DeclarativeAgentApp`

Tous les agents utilisent la classe `DeclarativeAgentApp` du module `framework/`. C'est la seule façon valide de créer un agent dans ce toolkit.

```python

from framework import DeclarativeAgentApp, TabSchema, StepContext, step, action

class MyInputTab(TabSchema):
    topic: str = Field("", description="User input")
    lang: str = Field("fr", description="Output language")

class MyOutputTab(TabSchema):
    result: str = Field("", description="Generated result")

class MyApp(DeclarativeAgentApp):
    class Meta:
        tabs = [MyInputTab, MyOutputTab]

    @step(id="generate", persist_progress=True)  # stream_safe est appliqué automatiquement
    async def generate(self, ctx: StepContext, inputs: MyInputTab, **kwargs):
        yield self.in_progress(step_id="generate", message="Démarrage...", progress=5)
        # ... logique LLM ...
        yield self.completed(step_id="generate", data={"result": "..."})
```

### Composants du framework

| Composant             | Rôle                                                                              |
| --------------------- | --------------------------------------------------------------------------------- |
| `DeclarativeAgentApp` | Classe de base — gestion d'état, routing des tabs, dispatch des steps             |
| `TabSchema`           | Base des tabs Pydantic — tous les champs **doivent** avoir des valeurs par défaut |
| `StepContext`         | Contexte injecté dans chaque step (username, language)                            |
| `@step(id=...)`       | Déclare un step SSE. `persist_progress=True` pour persister l'état en BDD         |
| `@action(id=...)`     | Déclare une action légère (mutation ciblée d'un champ)                            |
| `@stream_safe`        | Appliqué automatiquement par @step/@action — ne pas ajouter explicitement         |
| `SSEEvent`            | Dictionnaire typé des événements streamés                                         |

### Helpers SSE (`self.in_progress`, `self.completed`, `self.error`)

```python
# Progression intermédiaire
yield self.in_progress(
    step_id="generate",      # identifiant du step
    message="En cours...",   # message affiché à l'utilisateur
    progress=50,             # 0-100
    data=None,               # données intermédiaires optionnelles
)

# Fin avec succès + données métier
yield self.completed(
    step_id="generate",
    message="Terminé !",
    data={"result": "...", "items": [...]},  # persisté dans l'état
)

# Erreur
yield self.error(
    step_id="generate",
    message="Une erreur est survenue. Veuillez réessayer.",
)
```

### État et persistance

L'état est stocké dans le fichier `back/data/state.json` (JSON file simulant MongoDB). Chaque step peut enrichir l'état via `completed(data=...)` — les données sont mergées dans le flat state et disponibles pour les steps suivants via `**kwargs`.

La structure de l'état est un "flat dict" : tous les champs de tous les tabs sont à la même profondeur, sans namespace. **Les noms de champs doivent donc être uniques sur l'ensemble des tabs d'un même agent.**

### Routes SSE

```
# V2 — route principale (à utiliser)
POST /agent-apps/execute/{app_id}/{step_id}/stream
Content-Type: application/json
Body: { ...tous les champs des tabs... }

# Action — pour mutations légères
POST /agent-apps/execute/{app_id}/action/{action_id}/stream

# V1 Legacy — compatibilité seulement
POST /agent-apps/execute/{agent_id}/stream
```

### Structure d'un agent

```
back/agents/
└── mon_usecase/          ← snake_case (obligatoire — Python ne supporte pas les tirets)
    ├── __init__.py       ← export de la classe App
    ├── app.py            ← class MonUsecaseApp(DeclarativeAgentApp)
    ├── schemas.py        ← TabSchema subclasses + typed output models
    ├── prompts.py        ← prompts LLM, messages UI (pas de logique)
    └── tests/
        ├── __init__.py
        └── test_mon_usecase.py
```

### Enregistrement dans `registered_apps.py`

```python
from agents.mon_usecase import MonUsecaseApp

REGISTERED_APPS: dict[str, type[DeclarativeAgentApp]] = {
    "_reference": ReferenceApp,
    "mon-usecase": MonUsecaseApp,   # ← app_id = kebab-case
}
```

Le `app_id` (kebab-case) est la clé HTTP : `/agent-apps/execute/mon-usecase/{step_id}/stream`.

---

## Frontend

### Dual-platform (clarification)

Dans le toolkit, **une seule page frontend** est requise (`front/src/pages/`).
La séparation Elio/Neo se fait lors de l'intégration dans le monorepo cible.
Le composant page doit être générique et sans dépendances à un design system spécifique.

### Store Zustand

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MonUsecaseState {
    // --- Données persistées ---
    topic: string;
    result: string;
    currentStep: number;
    // --- État volatile (non persisté) ---
    isProcessing: boolean;
    loadingMessage: string;
    isCancelled: boolean;
    error: string | null;
}

export const useMonUsecaseStore = create<MonUsecaseState>()(
    persist(
        (set) => ({
            topic: "",
            result: "",
            currentStep: 1,
            isProcessing: false,
            loadingMessage: "",
            isCancelled: false,
            error: null,
        }),
        {
            name: "mon-usecase-store-v3",
            partialize: (state) => ({
                topic: state.topic,
                result: state.result,
                currentStep: state.currentStep,
                // ← NE PAS persister : isProcessing, loadingMessage, isCancelled, error
            }),
        },
    ),
);
```

### Communication SSE avec `streamStep`

```typescript
import { streamStep } from "@/services/sseStreamService";

await streamStep(
    "mon-usecase", // app_id (kebab-case)
    "generate", // step_id (snake_case)
    payload, // flat dict des champs
    (event) => {
        // callback SSE
        if (store.isCancelled) return;
        if (event.status === "in_progress") {
            store.setLoadingMessage(event.message ?? "");
        }
        if (event.status === "completed") {
            store.setResult(event.data?.result ?? "");
        }
        if (event.status === "error") {
            store.setError(event.message ?? "Erreur inconnue");
        }
    },
    abortSignal, // AbortController.signal pour Stop
);
```

### ThemeWrappers

Les pages utilisent les composants de `ThemeWrappers.tsx` :

| Composant      | Rôle                                                |
| -------------- | --------------------------------------------------- |
| `PageWrapper`  | Wrapper principal — adapte le layout selon Elio/Neo |
| `ThemeCard`    | Carte standardisée avec dark mode                   |
| `ThemeSection` | Section avec titre                                  |
| `ThemeButton`  | Bouton primaire adaptatif (Neo bleu, Elio indigo)   |

---

## Flux complet (exemple 2 steps)

```
PO remplit le formulaire
        │
        ▼
[Step 1 button] ─► streamStep("mon-usecase", "generate", payload)
        │                   │
        │         POST /agent-apps/execute/mon-usecase/generate/stream
        │                   │
        │         framework charge l'état, extrait MyInputTab
        │                   │
        │         app.generate(ctx, inputs=MyInputTab(...), **kwargs)
        │                   │
        │         yield in_progress(5) ──► store.loadingMessage = "..."
        │         yield in_progress(50) ─► store.loadingMessage = "..."
        │         yield completed(data)  ─► store.setResult(data)
        │
[Step 2 button] ─► streamStep("mon-usecase", "refine", payload)
        │         framework charge l'état (inclut données step 1)
        │         app.refine(ctx, inputs=MyOutputTab(...), **kwargs)
        │         ...
        ▼
Résultat affiché
```

---

## Portabilité vers Neo/Elio

Pour migrer un agent du toolkit vers la plateforme Neo :

1. Copier `back/agents/mon_usecase/` dans `back/src/neo_back/services/agent_apps/<catégorie>/`
2. Ajouter dans `registered_apps.py` de Neo (avec le vrai driver MongoDB)
3. Le code `app.py` et `schemas.py` est identique — seul le storage change
4. Pour le frontend, extraire la logique partagée dans `front/shared/src/`

L'API est 100% identique entre le toolkit et Neo : les routes, les événements SSE, le store Zustand — rien ne change.
