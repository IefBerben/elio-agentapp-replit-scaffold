# BACKLOG — [Nom de votre Agent App]

> Un projet VS Code = un use case = un BACKLOG.md
> **`/architect` écrit les features.** `/builder` écrit les User Stories et met à jour les statuts.

---

## Format des stories

Chaque story suit ce format :

```
## Feature N — [Nom]

### US-XX — [Nom de la story]
**Statut :** Confirmed

**Agent ID :** mon-usecase-step-1
**Fichiers :**
- back/agents/mon_usecase/models.py
- back/agents/mon_usecase/step1_nom.py
- front/src/stores/agent-apps/monUsecaseStore.ts
- front/src/pages/MonUsecasePage.tsx

**Contrat SSE (completed) :**
{ "result": { "champ": "type" } }

**Critère de succès :** [en langage métier]

**Statuts possibles :** In discussion → Confirmed → Built
```

---

<!-- Les features et stories sont écrites ici par l'architect et le builder. -->
