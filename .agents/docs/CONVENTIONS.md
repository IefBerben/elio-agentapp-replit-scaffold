# Conventions de code

Ce document résume les conventions à respecter pour que votre code soit intégrable dans l'application Neo/Elio.

---

## Architecture

### Séparation logique métier / UI

Votre application doit être séparée en 2 couches :

- **Back** : logique métier en Python — LangChain, streaming SSE, traitement de fichiers
- **Front** : UI en React — **aucune logique métier ne doit y figurer**

### Pattern backend obligatoire : `DeclarativeAgentApp`

⚠️ **Tout agent doit utiliser `DeclarativeAgentApp`**. Les fonctions standalone `async def stream_xxx(...)` sont interdites dans le toolkit v3.

```python
# ✅ CORRECT

from framework import DeclarativeAgentApp, TabSchema, StepContext, step

class MyInputTab(TabSchema):
    topic: str = Field("", description="...")   # ← valeur par défaut obligatoire
    lang: str = Field("fr", description="...")

class MyApp(DeclarativeAgentApp):
    class Meta:
        tabs = [MyInputTab, MyOutputTab]

    @step(id="generate", persist_progress=True)  # stream_safe est appliqué automatiquement
    async def generate(self, ctx: StepContext, inputs: MyInputTab, **kwargs):
        yield self.in_progress(step_id="generate", message="...", progress=5)
        yield self.completed(step_id="generate", data={"result": "..."})

# ❌ INTERDIT — fonction standalone
async def my_app_stream(username: str, **kwargs): ...
```

### Règles `TabSchema`

- **Tous les champs ont des valeurs par défaut** (`Field("")`, `Field("fr")`, `Field(default_factory=list)`)
- Les champs `str` non fournis → `""` (jamais `None`)
- Les noms de champs doivent être **uniques** sur tous les tabs d'un même agent (l'état est un flat dict)

### Règle `@stream_safe`

`@stream_safe` est appliqué **automatiquement** par `@step` et `@action`.
Ne pas l'ajouter explicitement.

`@stream_safe` intercepte toute exception et yield automatiquement un message d'erreur compréhensible en français (compatible Azure : credentials, quota, réseau).

### Mutualisation frontend attendue dans le repo cible

Quand votre Agent App est portée dans le monorepo Neo/Elio, la mutualisation frontend suit **deux niveaux distincts** :

1. **Commun à toutes les Agent Apps** → `front/shared`
    - composants génériques : shell, progression, fichiers, stepper, erreurs
    - hooks utilitaires génériques (`useAgentFiles`, etc.)

2. **Commun à une Agent App entre Elio et Neo** → `front/shared`
    - hook de page partagé
    - orchestration des étapes
    - composants d'étapes non spécifiques au design runtime

Exemples de référence dans le monorepo :

- `useDynamicPersonaPage`, `useUserJourneyPage`
- `front/shared/src/components/agent-apps`
- `front/neo/src/components/PageHeader.tsx`

### Dual-platform (clarification)

Dans le toolkit, **une seule page frontend** est requise (`front/src/pages/`).
La séparation Elio/Neo se fait lors de l'intégration dans le monorepo cible.
Le composant page doit être générique et sans dépendances à un design system spécifique.

### Modèle LLM

Le client LLM est toujours `get_llm()` depuis `services/llm_config.py` (héritage LangChain `BaseChatModel`).

Modèles autorisés dans la plateforme Neo/Elio :

**OpenAI :** gpt-5.1, gpt-5, gpt-5-mini, gpt-5-chat, gpt-4.1, gpt-4.1-mini, o3, o4-mini  
**Google :** Gemini 2.5 Pro, Gemini 2.5 Flash  
**Mistral :** Mistral-large-3

---

## Backend

Votre application doit respecter strictement les guidelines back :

→ voir [AGENT_APP_GUIDELINES_BACK.md](AGENT_APP_GUIDELINES_BACK.md)

Points clés :

- `DeclarativeAgentApp` + `@step` + `@stream_safe` obligatoires
- `TabSchema` avec valeurs par défaut sur tous les champs
- Fonctions async, type hints, docstrings Google (Args/Yields)
- Enregistrement dans `registered_apps.py`

> [AGENT_APP_GUIDELINES_BACK.md](AGENT_APP_GUIDELINES_BACK.md) sert aussi de prompt agentique pour guider un assistant IA.

---

## Frontend

Votre application doit respecter strictement les guidelines front :

→ voir [AGENT_APP_GUIDELINES_FRONT.md](AGENT_APP_GUIDELINES_FRONT.md)

Points clés :

- Composants standards fournis dans `front/src/components/agent-apps`
- Store Zustand avec `persist` + `partialize` (exclure isProcessing, etc.)
- `streamStep` pour appeler les routes SSE V2
- Séparation logique partagée / UI Elio / UI Neo
- **Dual-platform obligatoire**

> [AGENT_APP_GUIDELINES_FRONT.md](AGENT_APP_GUIDELINES_FRONT.md) sert aussi de prompt agentique pour guider un assistant IA.

---

## Langue

| Contexte                           | Langue             |
| ---------------------------------- | ------------------ |
| Communication (chat, emails, docs) | **Français**       |
| Code source                        | **Anglais**        |
| Commentaires dans le code          | **Anglais**        |
| Noms de fichiers / composants      | **Anglais**        |
| Messages utilisateur (UI)          | **i18n** (fr + en) |

---

## Sécurité

- **JAMAIS** de secrets dans le code source
- Utiliser les **variables d'environnement** (`.env`)
- Valider tous les inputs côté backend
- Ne jamais logger de données sensibles
