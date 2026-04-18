# 🚀 Démarrage rapide - Toolkit Neo

Guide étape par étape pour lancer l'application **Toolkit Neo** pour la première fois.

---

## 📋 Prérequis

Avant de commencer, installer les éléments suivants :

### 1. Python 3.14

- **Télécharger** : [python.org/downloads](https://www.python.org/downloads/)
- **Vérifier l'installation** :
    ```bash
    python --version
    ```

### 2. Node.js (inclut npm)

- **Télécharger** : [nodejs.org](https://nodejs.org/)
    - Sélectionner la version **LTS** (Long Term Support)
    - npm est inclus automatiquement
- **Vérifier l'installation** :
    ```bash
    node --version
    npm --version
    ```

### 3. Git (optionnel, pour cloner le projet)

- **Télécharger** : [git-scm.com](https://git-scm.com/)

---

## ✅ Vérifier les prérequis

Exécuter ces commandes pour vérifier que tout est installé :

```bash
python --version     # Doit afficher 3.14.x
node --version       # Doit afficher v20.x ou plus
npm --version        # Doit afficher 10.x ou plus
```

---

## 🏃 Lancer l'application

L'application est composée d'un **backend** et d'un **frontend**. Vous devez les lancer **dans 2 terminaux séparés**.

### Terminal 1 : Backend (Python)

```bash
# 1. Naviguer vers le dossier backend
cd toolkit_neo/back

# 2. Créer un environnement virtuel
python -m venv .venv

# 3. Activer l'environnement
# Sur Windows :
.venv\Scripts\activate

# Sur Linux/Mac :
source .venv/bin/activate

# 4. Installer les dépendances
pip install -r requirements.txt

# 5. Lancer le serveur (port 8000)
uvicorn main:app --reload --port 8000
```

✅ **Le serveur est prêt** quand vous voyez :

```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Accédez à** :

- API : `http://localhost:8000`
- Documentation interactive : `http://localhost:8000/docs`

---

### Terminal 2 : Frontend (React)

```bash
# 1. Naviguer vers le dossier frontend
cd toolkit_neo/front

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement (port 5173)
npm run dev
```

✅ **Le frontend est prêt** quand vous voyez :

```
Local:      http://localhost:5173/
```

**Accédez à** :

- Application : `http://localhost:5173`

---

## 🧪 Tester l'application

### Méthode 1 : Via l'interface web

1. Ouvrir `http://localhost:5173` dans votre navigateur
2. Aller à l'onglet "Conversation"
3. Entrer un sujet (ex: "Intelligence Artificielle")
4. Cliquer sur "Générer"

### Méthode 2 : Via cURL (test API backend)

```bash
curl -X POST http://localhost:8000/agent-apps/execute/conversation-step-1/stream \
  -H "Content-Type: application/json" \
  -d '{"topic": "Intelligence Artificielle"}'
```

### Méthode 3 : Swagger UI

Ouvrir `http://localhost:8000/docs` et utiliser l'interface interactive.

---

## 📁 Structure des fichiers importants

```
toolkit_neo/
├── back/                      ← Backend (à lancer en premier)
│   ├── main.py                ← Point d'entrée du serveur
│   ├── requirements.txt        ← Dépendances Python
│   ├── llm_config.py           ← Configuration (à personnaliser *)
│   └── agents/conversation/    ← Votre logique métier *
├── front/                     ← Frontend (à lancer en second)
│   ├── package.json           ← Dépendances npm
│   ├── src/pages/             ← Pages de l'application
│   └── src/i18n/              ← Traductions (fr.json, en.json)
└── docs/                      ← Documentation
    ├── CONVENTIONS.md         ← Conventions de code
    ├── INTEGRATION_GUIDE.md    ← Guide d'intégration Neo
    └── AGENT_APP_GUIDELINES_*  ← Guidelines détaillées

* À modifier selon votre use case
```

---

## 🐛 Dépannage

### Le backend n'a pas d'accès à Internet / API LLM

👉 Vérifier que votre configuration `back/llm_config.py` est correcte et que l'endpoint LLM est accessible.

### Le frontend dit "Erreur connexion"

👉 Vérifier que :

- Le backend tourne sur `http://localhost:8000` ✅
- Le frontend tourne sur `http://localhost:5173` ✅
- Les deux terminaux sont ouverts

### `ModuleNotFoundError` ou `command not found: npm`

👉 Vérifier que :

- L'environnement virtuel Python est activé (Terminal 1)
- `npm --version` fonctionne dans un terminal frais
- Relancer le terminal après installation de Node.js

### La page frontend est vide ou plante

👉 Vérifier la console du navigateur (F12) pour les erreurs et les logs du terminal 2 (npm).

---

## 📚 Prochaines étapes

Une fois l'application lancée :

1. 📖 Lire [CONVENTIONS.md](docs/CONVENTIONS.md) pour les conventions de code
2. 🛠️ Modifier `back/llm_config.py` pour votre endpoint LLM
3. 💻 Creser votre logique métier dans `back/agents/`
4. 🎨 Adapter le frontend dans `front/src/pages/`
5. 📚 Consulter [INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md) pour intégrer dans Neo

---

## 💡 Tips utiles

### Recharger le backend sans redémarrer

Le flag `--reload` dans uvicorn permet de recharger auto lors des modifications.

### Recharger le frontend sans redémarrer

Vite fait le hot reload automatiquement. Juste sauvegarder vos fichiers.

### Arrêter les serveurs proprement

- **Terminal 1 (backend)** : `Ctrl+C`
- **Terminal 2 (frontend)** : `Ctrl+C`

---

## 📞 Besoin d'aide ?

Consulter la [documentation](docs/) ou contactez : **neo@groupeonepoint.com**

---

**Note** : Ce guide est maintenu par l'équipe Neo. Dernière mise à jour : Mars 2026.
