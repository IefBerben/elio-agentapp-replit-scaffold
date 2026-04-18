# _reference — Agent de référence

Ce dossier est un exemple de référence. **NE PAS MODIFIER.**

Il sert de modèle pour comprendre le pattern SSE.
Pour créer un nouvel agent, copier ce dossier et le renommer.

Les skills `build-backend` / `build-frontend` ne doivent jamais toucher à ce dossier.

---

## Structure

```
_reference/
├── models.py          — Modèles Pydantic (inputs/outputs)
├── step1_generate.py  — Step 1 : AsyncGenerator SSE avec @stream_safe
├── step2_refine.py    — Step 2 : AsyncGenerator SSE avec @stream_safe (optionnel)
├── __init__.py        — Exports des fonctions stream
└── tests/
    ├── __init__.py
    └── test_step1.py  — 7 tests de référence
```

## Patterns à reproduire

1. **@stream_safe** — décorer chaque step function (gestion d'erreur globale)
2. **Yields SSE** — chaque yield contient `step`, `message`, `status`, `progress`
3. **Résultat métier** — uniquement dans le yield `status: "completed"` sous la clé `result`
4. **Docstring Google-style** — obligatoire pour l'intégration Neo

## Lancer les tests

```bash
cd back && uv run pytest agents/_reference/tests/ -v
```
