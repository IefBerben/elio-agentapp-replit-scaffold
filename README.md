# Elio Scaffold v8 — Replit Edition

Scaffold de prototypage d'Agent Apps pour la plateforme Elio — Agentic Studio · Onepoint.

---

## Prérequis

Avant de commencer, vérifie que tu as :

| Outil | Pourquoi |
|-------|----------|
| Compte Replit | Pour héberger et exécuter le projet |
| Credentials Azure OpenAI | Endpoint, deployment name, API key — demande-les à ton responsable technique |

> Replit installe automatiquement Python 3.12, Node.js 22, `uv`, et l'Azure CLI via le fichier `replit.nix`.

---

## Par où commencer ?

👉 **Lis [VIBE-CODING-GUIDE.md](VIBE-CODING-GUIDE.md)** — tout est là.

---

## Les 4 documents de ton projet

| Document | Rôle |
|----------|------|
| [VIBE-CODING-GUIDE.md](VIBE-CODING-GUIDE.md) | Comment travailler avec les 3 agents |
| [PRODUCT.md](PRODUCT.md) | La vision produit — commence ici |
| [BACKLOG.md](BACKLOG.md) | Les features et stories en cours |
| [SUBMISSION.md](SUBMISSION.md) | Le dossier de remise à l'équipe Neo |

---

## Démarrage rapide

```
1. Fork ce projet sur Replit (bouton "Fork" en haut à droite)
2. Clique sur le bouton Run ▶
   → Le backend (FastAPI) et le frontend (React) démarrent automatiquement
   → back/.env est créé depuis back/.env.example si absent
3. Ouvre back/.env → remplis les 3 champs Azure :
     AZURE_OPENAI_ENDPOINT=https://ton-resource.openai.azure.com/
     AZURE_OPENAI_DEPLOYMENT=gpt-4.1
     AZURE_OPENAI_API_KEY=clé-fournie-par-ton-responsable
4. Dans l'onglet Shell → lance : az login
   (une URL de code apparaît — ouvre-la dans un navigateur pour t'authentifier)
5. Ouvre le panneau de prévisualisation Replit (onglet "Webview")
6. Ouvre l'IA Replit (icône ✨ dans la barre latérale)
   → Attache le fichier .github/prompts/product-manager.prompt.md
   → Tape : "Je veux créer un agent pour [ton idée]"
```

---

## Authentification Azure

Le backend utilise `DefaultAzureCredential` de la bibliothèque Azure. Sur Replit :

- **Développement** : `az login` dans l'onglet Shell (session persistante)
- **Alternative** : remplis directement `AZURE_OPENAI_API_KEY` dans `back/.env`
