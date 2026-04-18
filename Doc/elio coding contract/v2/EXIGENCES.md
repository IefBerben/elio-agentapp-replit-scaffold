# Exigences pour les équipes de développement — Toolkit Elio

Ce document liste les **contraintes et livrables attendus** pour soumettre un POC d'Agent App à l'équipe Neo via ce toolkit.

> **Note** : Ce toolkit est une pré-version. Pour toute question d'interprétation, se référer à l'équipe Neo avant de commencer.

---

## 1. Respect des conventions de code

Vos développements doivent impérativement respecter les conventions définies dans :

- **Conventions générales** → [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)
- **Guidelines backend** → [`docs/AGENT_APP_GUIDELINES_BACK.md`](docs/AGENT_APP_GUIDELINES_BACK.md)
- **Guidelines frontend** → [`docs/AGENT_APP_GUIDELINES_FRONT.md`](docs/AGENT_APP_GUIDELINES_FRONT.md)
- **Guide d'intégration** → [`docs/INTEGRATION_GUIDE.md`](docs/INTEGRATION_GUIDE.md)

Points clés non négociables :

- Séparation stricte logique métier (back Python) / UI (front React) — aucune logique métier dans le front
- Utilisation obligatoire de **LangChain** (`BaseChatModel`) avec uniquement les modèles LLM listés dans [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)
- Pattern SSE obligatoire : fonctions `async generator` conformes au format défini dans les guidelines back
- Composants partagés Elio obligatoires côté front (pas de librairie UI externe non référencée)
- Nommage et langue : code et commentaires en anglais, communication en français, textes UI en i18n (fr + en)
- Présence des docstrings avec `Args` et `Returns` sur toutes les fonctions

---

## 2. Définition de la valeur ajoutée et du besoin couvert

Le livrable doit contenir une section explicitant :

- **Le problème métier concret** résolu par l'agent (éviter les formulations abstraites)
- **Les utilisateurs cibles** : qui va utiliser cet agent, dans quel contexte, à quelle fréquence
- **La valeur ajoutée mesurable** : gain de temps estimé, réduction d'une charge cognitive, amélioration d'une décision, etc.
- **Positionnement** : en quoi cette approche agentique est justifiée vs une solution classique (formulaire, script, dashboard…)
- **Périmètre** : ce que l'agent fait, et ce qu'il ne fait pas (limites explicites)

---

## 3. Description du fonctionnement global

Le livrable doit décrire de façon claire et synthétique :

- **Le workflow complet** de l'agent, étape par étape (minimum un schéma ou tableau récapitulatif)
- **Les étapes de traitement** : ce qui se passe côté LLM à chaque étape (prompt, parsing, streaming…)
- **Les données en transit** : quelles données circulent entre les étapes, sous quel format
- **Les dépendances externes** : API tierces, bases de données, fichiers, etc. (et comment elles sont mockées pour le POC)
- **Les choix techniques structurants** : modèle LLM sélectionné et justification, nombre d'échanges configurables, etc.

---

## 4. Critères d'acceptation

### 4.1 Format d'entrée

Décrire avec précision :

- Les **champs obligatoires et optionnels** avec leur type, leurs contraintes (longueur, valeurs autorisées…)
- Les **cas limites** gérés : champ vide, texte trop long, langue autre que le français, caractères spéciaux
- Le **comportement attendu en cas d'entrée invalide** : message d'erreur, valeur par défaut, refus

### 4.2 Sortie attendue

Décrire avec précision :

- La **structure de la sortie** (JSON, texte, tableau, etc.) avec les champs et leurs types
- Les **contraintes de format** : longueur des champs, structure imposée, ordre des éléments
- Le **comportement du streaming** : granularité des chunks, délai acceptable entre chunks, indicateurs de progression

### 4.3 Exigences cognitives de la sortie

Définir les critères de qualité du contenu généré par le LLM :

- **Pertinence** : la sortie répond-elle directement au sujet/à l'entrée fournie ?
- **Cohérence interne** : les éléments générés sont-ils logiquement consistants entre eux ?
- **Diversité / richesse** : éviter la répétition, assurer une variété dans le vocabulaire, les points de vue, les exemples
- **Niveau de langage** : registre attendu (professionnel, accessible, technique…) adapté aux utilisateurs cibles
- **Neutralité / biais** : la sortie ne doit pas introduire de biais discriminatoires, politiques ou culturels non désirés
- **Reproductibilité** : à entrée identique, la sortie doit rester dans un périmètre de qualité constant (tolérance acceptable)

---

## 5. Exemples d'entrées et de sorties

Le livrable doit inclure **au minimum 2 exemples complets** :

- **Exemple standard** : cas d'usage principal, entrée "bien formée"
- **Exemple avec variante** : entrée différente démontrant la généricité de l'agent (autre sujet, autres paramètres…)

Pour chaque exemple :

- Fournir le **payload d'entrée exact** (JSON ou formulaire reproduit)
- Fournir la **sortie complète générée** (toutes les étapes si multi-step)
- Commenter brièvement **pourquoi cette sortie est satisfaisante** au regard des critères d'acceptation

---

## 6. Screenshots du POC en fonctionnement

Fournir **au minimum 3 screenshots** de l'interface :

- L'**écran de saisie** (étape 1) avec un exemple rempli
- L'**écran de résultat intermédiaire** (si multi-step : ex. personas générés)
- L'**écran de sortie finale** (résultat complet affiché)

Exigences sur les screenshots :

- Résolution suffisante pour être lisible (min. 1280×720)
- Données d'exemple visibles (pas de captures vides ou de placeholders)
- Pas de données personnelles réelles

---

## 7. (Optionnel) Vidéo de fonctionnement

Une courte vidéo de démonstration est fortement recommandée :

- **Durée** : 1 à 3 minutes maximum
- **Contenu** : saisie → génération en streaming → résultat final, commenté à l'oral ou avec sous-titres
- **Format** : MP4 ou lien vers une démo hébergée (Loom, etc.)
- **Valeur** : particulièrement utile pour montrer la fluidité du streaming et l'expérience utilisateur réelle

---

## Récapitulatif des livrables attendus

| #   | Livrable                                            | Obligatoire  |
| --- | --------------------------------------------------- | ------------ |
| 1   | Code respectant les conventions                     | ✅ Oui       |
| 2   | Section valeur ajoutée / besoin couvert             | ✅ Oui       |
| 3   | Description du fonctionnement global                | ✅ Oui       |
| 4   | Critères d'acceptation (entrée / sortie / cognitif) | ✅ Oui       |
| 5   | Exemples d'entrées et de sorties                    | ✅ Oui       |
| 6   | Screenshots du POC                                  | ✅ Oui       |
| 7   | Vidéo de fonctionnement                             | ⬜ Optionnel |
