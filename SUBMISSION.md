# SUBMISSION — Dossier de soumission à l'équipe Elio

> Ce document est mis à jour automatiquement par les skills Agent au fil du build.
> Il est remis à l'équipe Elio avec le code pour validation et intégration dans la plateforme.

---

## Section 1 — Problème métier et utilisateurs cibles
*À compléter depuis `product.md` — skill `intake-from-markdown`*

### Problème métier concret
<!-- Quelle situation douloureuse cet agent résout-il ?
     Eviter les formulations abstraites. -->

_À compléter depuis product.md_

### Utilisateurs cibles
<!-- Qui, dans quel contexte, à quelle fréquence -->

_À compléter depuis product.md_

### Situation actuelle (sans l'agent)
<!-- Comment l'utilisateur résout ce problème aujourd'hui ? Combien de temps ? -->

_À compléter depuis product.md_

---

## Section 2 — Valeur ajoutée mesurable
*À compléter depuis `product.md`*

### Valeur apportée
<!-- Gain de temps, réduction d'erreurs, amélioration d'une décision... -->

_À compléter depuis product.md_

### Positionnement agentique
<!-- Pourquoi un agent IA plutôt qu'un formulaire, script ou dashboard ? -->

_À compléter depuis product.md_

### Périmètre
**Ce que l'agent fait :**
-

**Ce que l'agent ne fait pas :**
-

---

## Section 3 — Fonctionnement global
*À compléter depuis `product.md` + `backlog.md`*

### Workflow complet
<!-- Étape par étape, du point de vue utilisateur -->

_À compléter depuis product.md_

### Dépendances externes
<!-- APIs tierces, fichiers, bases de données, et comment elles sont mockées pour le POC -->

_À compléter depuis product.md_

---

## Section 4 — Critères d'acceptation
*Généré par le skill `platform-integration-check` depuis `backlog.md`*

### Format d'entrée

| Champ | Type | Obligatoire | Contraintes |
|-------|------|-------------|-------------|
| _à compléter_ | | | |

### Format de sortie

| Champ | Type | Description |
|-------|------|-------------|
| _à compléter_ | | |

### Comportement du streaming
<!-- Granularité des chunks, progression 0-100, indicateurs d'état -->

_Généré par le skill `platform-integration-check`_

### Choix techniques structurants
<!-- Modèle LLM sélectionné et justification, nombre d'étapes, données en transit -->

_Généré par le skill `platform-integration-check`_

### Gestion des cas limites
<!-- Champ vide, texte trop long, entrée invalide -->

_Généré par le skill `platform-integration-check`_

---

## Section 5 — Exemples d'entrées et de sorties
*À enrichir après chaque build — skill `build-backend`*

### Exemple 1 — Cas standard
*À ajouter après US-XX Built*

**Entrée :**
```json
// À compléter par le skill `build-backend` après la première story livrée
```

**Sortie :**
```json
// À compléter par le skill `build-backend`
```

**Pourquoi cette sortie est satisfaisante :**
_Généré par le skill `build-backend` / `build-frontend`_

---

### Exemple 2 — Variante
*À ajouter après la deuxième story Built ou test*

**Entrée :**
```json
// À compléter par le skill `build-backend`
```

**Sortie :**
```json
// À compléter par le skill `build-backend`
```

**Pourquoi cette sortie est satisfaisante :**
_Généré par le skill `build-backend` / `build-frontend`_

---

## Section 6 — Screenshots et conformité
*Screenshots pris par le consultant — conformité générée par le skill `platform-integration-check`*

### Screenshots attendus (minimum 3)

**Screenshot 1 — Écran de saisie**
_Description : formulaire visible avec un exemple rempli_

**Screenshot 2 — Génération en cours**
_Description : progress banner SSE visible_

**Screenshot 3 — Résultat final**
_Description : résultat complet affiché_

### Résultats de conformité
*Généré par le skill `platform-integration-check`*

> **Légende :** ✅ conforme · ❌ non conforme
> B = Backend · F = Frontend · I = Intégration

| Check | Résultat | Détail |
|-------|----------|--------|
| B1 — Modèles LLM autorisés | ⬜ | |
| B2 — @stream_safe | ⬜ | |
| B3 — Contrat SSE | ⬜ | |
| B4 — AGENTS_MAP | ⬜ | |
| B5 — get_llm() | ⬜ | |
| B6 — Tests | ⬜ | |
| B7 — Prompts bilingues | ⬜ | |
| B8 — interface_language | ⬜ | |
| B9 — Docstrings | ⬜ | |
| B10 — Fichiers protégés | ⬜ | |
| F1 — Zustand + partialize | ⬜ | |
| F2 — Sélecteurs individuels | ⬜ | |
| F3 — i18n complet | ⬜ | |
| F4 — executeAgentStreaming | ⬜ | |
| F5 — Composants Elio | ⬜ | |
| F6 — Dark mode | ⬜ | |
| F7 — Inputs disabled | ⬜ | |
| F8 — interface_language payload | ⬜ | |
| F9 — Résultats éditables | ⬜ | |
| F10 — Fichiers protégés | ⬜ | |
| I1 — API contracts match | ⬜ | |
| I2 — Types TypeScript match | ⬜ | |
| I3 — SUBMISSION.md rempli | ⬜ | |

---

## Section 7 — Vidéo de démonstration (optionnelle)
*Fortement recommandée — particulièrement utile pour montrer la fluidité du streaming*

- **Durée :** 1 à 3 minutes maximum
- **Contenu :** saisie → génération en streaming → résultat final (commenté ou sous-titré)
- **Format :** MP4 ou lien Loom / démo hébergée

_Lien ou fichier à ajouter ici_

---

*Document initié le : [date]*
*Dernière mise à jour : [date]*
