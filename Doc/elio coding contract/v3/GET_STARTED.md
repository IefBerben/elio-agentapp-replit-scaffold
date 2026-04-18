# Démarrage rapide — Toolkit Neo

---

## Prérequis

- **Python 3.11+** — [python.org/downloads](https://www.python.org/downloads/)
- **Node.js LTS** — [nodejs.org](https://nodejs.org/)
- **Azure CLI** — [learn.microsoft.com/cli/azure/install-azure-cli](https://learn.microsoft.com/cli/azure/install-azure-cli)

---

## 1. Se connecter à Azure

Les modèles LLM utilisent votre identité Azure — aucune clé API n'est nécessaire.

```bash
az login
```

> **Droits manquants ?** Envoyer une demande à **elio@groupeonepoint.com** en précisant votre email Azure AD.

---

## 2. Lancer le backend

```bash
cd toolkit_agent_apps/back

# Installer uv (gestionnaire de paquets Python rapide)
pip install uv

# Installer les dépendances du projet
uv sync

# Lancer le serveur
uv run uvicorn main:app --reload --port 8000
```

Le serveur est prêt quand vous voyez :

```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

- API : `http://localhost:8000`
- Documentation interactive : `http://localhost:8000/docs`

---

## 3. Lancer le frontend

Dans un **second terminal** :

```bash
cd toolkit_agent_apps/front

npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

---

## 4. Tester

Ouvrir `http://localhost:5173`, entrer un sujet de conversation et cliquer sur **Générer**.

---

## Structure des fichiers

```
toolkit_agent_apps/
├── back/
│   ├── main.py                  ← Serveur FastAPI + routes upload
│   ├── agents/your_usecase/     ← Votre logique métier (à modifier)
│   └── services/
│       ├── llm_config.py        ← Configuration LLM Azure
│       └── process_files.py     ← Extraction et résumé de fichiers
└── front/
    └── src/
        ├── pages/               ← Pages de l'application (à modifier)
        └── i18n/                ← Traductions (fr.json, en.json)
```

---

## Dépannage

| Problème                          | Solution                                         |
| --------------------------------- | ------------------------------------------------ |
| `DefaultAzureCredential` failed   | Lancer `az login` et réessayer                   |
| Droits insuffisants sur l'API LLM | Contacter **elio@groupeonepoint.com**            |
| Frontend "Erreur connexion"       | Vérifier que le backend tourne sur le port 8000  |
| `ModuleNotFoundError`             | Vérifier que `uv sync` s'est terminé sans erreur |
