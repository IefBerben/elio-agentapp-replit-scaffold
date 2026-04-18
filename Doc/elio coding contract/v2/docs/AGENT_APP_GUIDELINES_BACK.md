# Agent App — Backend Guidelines

Ce document décrit les conventions et la structure à respecter pour le développement backend d'une Agent App.

---

## Structure d'un service backend

Chaque Agent App est un dossier dans `back/agents/` contenant :

```
back/agents/
└── your_agent/
    ├── __init__.py          # Exports des fonctions de streaming
    ├── models.py            # Modèles Pydantic
    ├── step1_xxx.py         # Étape 1 (streaming)
    └── step2_xxx.py         # Étape 2 (streaming, optionnel)
```

---

## Pattern de streaming SSE

Chaque étape est une **fonction asynchrone génératrice** qui `yield` des dictionnaires formatés en SSE.

### Signature type

```python
from collections.abc import AsyncGenerator
from typing import Any

async def stream_your_step(
    username: str,
    param_1: str,
    param_2: int | None = None,
    **kwargs: Any,
) -> AsyncGenerator[dict[str, Any], None]:
    """
    Stream results for step N.

    Args:
        username: Username of the requester.
        param_1: Description of param_1.
        param_2: Optional description of param_2.

    Yields:
        Dict with streaming updates containing step, message, status, progress.
    """
```

### Format des messages SSE

Chaque `yield` doit produire un dictionnaire avec ces champs :

| Champ      | Type   | Description                                  |
| ---------- | ------ | -------------------------------------------- |
| `step`     | `str`  | Identifiant de l'étape en cours              |
| `message`  | `str`  | Message affiché à l'utilisateur              |
| `status`   | `str`  | `"in_progress"`, `"completed"`, ou `"error"` |
| `progress` | `int`  | Progression de 0 à 100                       |
| `error`    | `str?` | Détail de l'erreur (si status="error")       |
| `...`      | `Any`  | Données métier supplémentaires               |

### Exemple complet de flux

```python
async def stream_my_agent(
    username: str,
    topic: str,
) -> AsyncGenerator[dict[str, Any], None]:
    # 1. Début
    yield {
        "step": "beginning",
        "message": "Starting analysis...",
        "status": "in_progress",
        "progress": 0,
    }

    # 2. Traitement
    yield {
        "step": "processing",
        "message": "Generating content...",
        "status": "in_progress",
        "progress": 50,
    }

    result = await call_llm(topic)

    # 3. Fin avec données
    yield {
        "step": "completed",
        "message": "Done!",
        "status": "completed",
        "progress": 100,
        "my_data": result,  # Données métier
    }
```

### Gestion des erreurs

```python
try:
    # ... votre logique
    yield {"step": "completed", "status": "completed", "progress": 100}
except Exception as e:
    logger.error(f"Error: {e}")
    yield {
        "step": "error",
        "message": f"Error: {str(e)}",
        "status": "error",
        "progress": 0,
        "error": str(e),
    }
```

---

## Enregistrement dans le routeur

Ajoutez votre agent dans le dictionnaire `AGENTS_MAP` de `main.py` :

```python
AGENTS_MAP = {
    "my-agent-step-1": stream_my_step_1,
    "my-agent-step-2": stream_my_step_2,
}
```

**Convention de nommage des agent_id** : `kebab-case` avec suffixe `-step-N` pour les étapes.

---

## Configuration LLM

Le fichier `llm_config.py` contient la configuration du LLM. Modifiez-le pour pointer vers votre propre endpoint :

```python
from langchain_openai import ChatOpenAI

def get_llm():
    return ChatOpenAI(
        model="gpt-4o-mini",
        openai_api_key="YOUR_API_KEY",
        openai_api_base="https://your-endpoint.com/v1",
        temperature=0.7,
    )
```

---

## Bonnes pratiques

- **Async** : Utilisez toujours `async/await` pour les opérations I/O
- **Type hints** : Obligatoires pour toutes les fonctions
- **Docstrings** : Format Google avec Args/Returns/Yields
- **Logging** : Utilisez le logger Python (`logging.getLogger`)
- **Erreurs** : Encapsulez la logique dans un try/except et yield les erreurs
- **Nommage** : `snake_case` pour fichiers et fonctions, `PascalCase` pour classes

---

## Traitement de documents

Le service `services/process_files.py` fournit une extraction et une condensation de documents locaux. Il est le miroir direct de la fonction `print_or_summarize` du backend Neo principal, sans dépendance Azure Blob Storage.

### Formats supportés

| Extension                             | Librairie                                         | Notes                                       |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| `.pdf`                                | PyMuPDF + Azure Document Intelligence (optionnel) | DI utilisé en fallback si le PDF est scanné |
| `.docx`                               | python-docx                                       |                                             |
| `.pptx`                               | python-pptx                                       | Texte de chaque slide                       |
| `.xlsx`                               | pandas                                            | 200 lignes max par feuille                  |
| `.csv`                                | pandas                                            | 500 lignes max                              |
| `.txt`, `.md`, `.json`, `.html`, etc. | lecture directe UTF-8                             |                                             |

### Fonction principale : `print_or_summarize`

```python
from services.process_files import print_or_summarize

document_context = ""
if file_paths:
    parts = []
    for path in file_paths:
        try:
            content = await print_or_summarize(path, language="FR")
            parts.append(content)
        except Exception as exc:
            logger.warning(f"Could not process {path}: {exc}")
    document_context = "\n\n".join(parts)
```

**Comportement** :

- Si le contenu extrait est **≤ 10 000 caractères** → retourné tel quel (préfixé avec le nom du fichier).
- Si le contenu est **> 10 000 caractères** → résumé automatiquement via le LLM configuré.

**Signature complète :**

```python
await print_or_summarize(
    file_path: str,
    threshold: int = 10_000,   # seuil de résumé en caractères
    language: Literal["FR", "EN"] = "FR",
    model: str = "",           # laisser vide pour utiliser le modèle par défaut
)
```

### Injection dans le prompt

Une fois le contexte construit, l'injecter dans le prompt LLM via le placeholder `{document_context}` :

```python
MY_PROMPT = """
You are an expert analyst.
{document_context}

Based on these documents, do X...
"""

prompt = MY_PROMPT.format(
    document_context=(
        f"The user has provided the following documents:\n{document_context}"
        if document_context
        else "No documents provided."
    ),
    # ... autres variables
)
```

### Signature de l'étape avec support de fichiers

Ajouter `file_paths: list[str] | None = None` comme paramètre optionnel :

```python
async def stream_my_step(
    username: str,
    topic: str,
    file_paths: list[str] | None = None,  # chemins absolus retournés par /files/upload
    **kwargs: Any,
) -> AsyncGenerator[dict[str, Any], None]:
    document_context = ""
    if file_paths:
        parts = []
        for path in file_paths:
            try:
                parts.append(await print_or_summarize(path))
            except Exception as exc:
                logger.warning(f"Could not process {path}: {exc}")
        document_context = "\n\n".join(parts)
    # ... suite du traitement
```

### Azure Document Intelligence (optionnel)

Pour les PDFs scannés (images uniquement, sans couche texte) :

1. Configurer `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` dans `.env`
2. Avoir le rôle RBAC `Cognitive Services User` sur la ressource
3. Le service bascule automatiquement sur Document Intelligence si PyMuPDF extrait < 4 000 caractères

Variables d'environnement :

```bash
# Bascule automatique (recommandé)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/

# Forcer Document Intelligence pour tous les PDFs
FORCE_DOC_INTELLIGENCE=true
```
