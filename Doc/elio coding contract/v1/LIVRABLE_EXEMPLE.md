# Livrable — Agent App "Conversation" (Exemple)

> Ce document est un **exemple de livrable** basé sur l'agent d'exemple inclus dans le toolkit.
> Il illustre comment remplir chaque section définie dans [`EXIGENCES.md`](EXIGENCES.md).

---

## 2. Valeur ajoutée et besoin couvert

### Problème métier

La conception d'études UX, de supports pédagogiques, de jeux de rôle ou de scénarios de formation nécessite souvent de simuler des échanges entre profils distincts. Cette étape est aujourd'hui réalisée à la main par des designers ou des coachs, ce qui est long, coûteux et sujet à des angles morts (oubli de profils atypiques, points de vue non représentés).

### Utilisateurs cibles

- **Designers UX / Product Managers** : pour tester rapidement des personas et leurs interactions autour d'une fonctionnalité produit
- **Formateurs et équipes pédagogiques** : pour générer des dialogues d'illustration dans des supports de formation
- **Équipes marketing / stratégie** : pour simuler des retours consommateurs contrastés sur un sujet donné

**Fréquence d'usage estimée** : ponctuelle à hebdomadaire, sessions de 5-15 minutes.

### Valeur ajoutée mesurable

| Avant (manuel)                             | Après (agent)                                  |
| ------------------------------------------ | ---------------------------------------------- |
| 30-60 min pour créer 2 personas + dialogue | ~1-2 min de génération                         |
| Dépendant de l'inspiration du rédacteur    | Diversité et richesse garanties par le LLM     |
| Risque de biais vers des profils familiers | Contrasted viewpoints systématiquement générés |

**Gain estimé** : réduction de 90 % du temps de production d'un matériau de simulation.

### Justification de l'approche agentique

Une solution classique (formulaire + template texte) produirait des personas génériques et un dialogue artificiel. L'approche LLM permet une **cohérence contextuelle** entre le profil, le style de communication et les opinions générées, et un **streaming naturel** qui rend l'expérience interactive et engageante.

### Périmètre

**L'agent fait :** générer 2 personas contrastés + simuler leur dialogue autour d'un sujet libre.  
**L'agent ne fait pas :** rechercher des sources réelles, garantir la factualité des opinions, gérer plusieurs langues autres que l'anglais dans les personas.

---

## 3. Fonctionnement global

### Workflow en 2 étapes

```
[Utilisateur saisit un sujet + hints optionnels]
         │
         ▼
  ┌──────────────────────┐
  │  ÉTAPE 1 — Personas  │  Agent: conversation-step-1
  │  LLM génère 2 profils│  Streaming JSON + progress
  │  complets en JSON    │
  └──────────┬───────────┘
             │  persona1 + persona2 (dict)
             ▼
  ┌──────────────────────┐
  │ ÉTAPE 2 — Discussion │  Agent: conversation-step-2
  │ LLM génère N échanges│  Streaming JSON Lines (message par message)
  │ alternés entre P1/P2 │
  └──────────────────────┘
         │
         ▼
  [Interface affiche la conversation en temps réel]
```

### Étapes de traitement LLM

| Étape   | Prompt technique                                            | Parsing                                     | Streaming                                 |
| ------- | ----------------------------------------------------------- | ------------------------------------------- | ----------------------------------------- |
| Étape 1 | System prompt + topic + hints → JSON structuré (2 personas) | `json.loads()` sur la réponse complète      | Progress 0→100% sur la génération du JSON |
| Étape 2 | System prompt avec résumés des personas → JSON Lines        | Ligne par ligne, `json.loads()` par message | 1 `yield` par message généré              |

### Données en transit

```
Étape 1 entrée  : { topic, persona1_hint?, persona2_hint? }
Étape 1 sortie  : { persona1: Persona, persona2: Persona }

Étape 2 entrée  : { topic, persona1: dict, persona2: dict, num_exchanges?: int }
Étape 2 sortie  : stream de { speaker, message, tone } × N
```

### Dépendances externes

- **LLM** : OpenAI GPT-4.1 (via LangChain) — mocké dans les tests unitaires avec `langchain_core.runnables.fake`
- Aucune base de données, aucune API tierce

### Choix techniques

- **Modèle** : `gpt-4.1-mini` — bon équilibre vitesse / qualité pour la génération créative
- **num_exchanges** : paramétrable (défaut : 8), permet de calibrer la longueur selon le cas d'usage
- **JSON Lines** en étape 2 : permet un streaming granulaire message par message, meilleure UX que le JSON array

---

## 4. Critères d'acceptation

### 4.1 Format d'entrée

#### Étape 1 — Génération des personas

| Champ           | Type     | Obligatoire | Contraintes                                  |
| --------------- | -------- | ----------- | -------------------------------------------- |
| `topic`         | `string` | ✅ Oui      | Non vide, max 500 caractères                 |
| `persona1_hint` | `string` | ❌ Non      | Max 300 caractères, valeur par défaut : `""` |
| `persona2_hint` | `string` | ❌ Non      | Max 300 caractères, valeur par défaut : `""` |

**Cas limites gérés :**

- `topic` vide → HTTP 422 avec message explicite
- `topic` > 500 caractères → troncature silencieuse côté prompt (pas d'erreur utilisateur)
- Hints non fournis → personas générés librement par le LLM

#### Étape 2 — Génération de la discussion

| Champ           | Type     | Obligatoire | Contraintes                                     |
| --------------- | -------- | ----------- | ----------------------------------------------- |
| `topic`         | `string` | ✅ Oui      | Identique à l'étape 1                           |
| `persona1`      | `dict`   | ✅ Oui      | Structure `Persona` complète issue de l'étape 1 |
| `persona2`      | `dict`   | ✅ Oui      | Structure `Persona` complète issue de l'étape 1 |
| `num_exchanges` | `int`    | ❌ Non      | Entre 2 et 20, défaut : 8                       |

### 4.2 Sortie attendue

#### Étape 1

```json
{
  "step": "conversation-step-1",
  "status": "completed",
  "progress": 100,
  "message": "Personas generated",
  "personas": {
    "persona1": { "name": "...", "age": 42, "profession": "...", ... },
    "persona2": { "name": "...", "age": 31, "profession": "...", ... }
  }
}
```

**Contraintes** : tous les champs du modèle `Persona` sont présents, `interests` est une liste d'au moins 2 éléments.

#### Étape 2

Chaque chunk streamé :

```json
{
    "step": "conversation-step-2",
    "status": "in_progress",
    "progress": 25,
    "message": "Generating message 2/8",
    "conversation_message": {
        "speaker": "Alice Martin",
        "message": "...",
        "tone": "curious"
    }
}
```

Chunk final :

```json
{
    "step": "conversation-step-2",
    "status": "completed",
    "progress": 100,
    "message": "Discussion complete"
}
```

**Contraintes streaming** : intervalle entre chunks < 2 secondes sur `gpt-4.1-mini`, `speaker` toujours l'un des deux noms générés en étape 1, alternance respectée.

### 4.3 Exigences cognitives de la sortie

| Critère               | Attendu                                                                     | Exemple de non-conformité                                      |
| --------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Pertinence**        | Chaque réplique porte sur le sujet saisi                                    | Un persona parle d'un sujet hors-contexte                      |
| **Cohérence interne** | Le style de communication du persona respecte son `communication_style`     | Un "pragmatic engineer" qui utilise un langage très émotionnel |
| **Diversité**         | Les 2 personas ont des opinions clairement distinctes sur le sujet          | Les 2 personas sont d'accord dès le début                      |
| **Niveau de langage** | Adapté à la `profession` du persona                                         | Un professeur d'université qui s'exprime comme un adolescent   |
| **Neutralité**        | Pas de biais discriminatoires, pas de contenu offensant                     | Persona stéréotypé selon un genre ou une nationalité           |
| **Reproductibilité**  | 3 générations sur le même sujet donnent des résultats de qualité comparable | Une génération sur 3 produit un dialogue incohérent            |

---

## 5. Exemples d'entrées et de sorties

### Exemple 1 — Cas standard : Intelligence artificielle dans l'éducation

**Payload d'entrée (Étape 1) :**

```json
{
    "topic": "L'intelligence artificielle va-t-elle remplacer les enseignants ?",
    "persona1_hint": "",
    "persona2_hint": ""
}
```

**Sortie Étape 1 :**

```json
{
    "personas": {
        "persona1": {
            "name": "Claire Fontaine",
            "age": 52,
            "profession": "Professeure de lycée en philosophie",
            "education": "Agrégée de philosophie, Université Paris IV",
            "personality_type": "Humaniste",
            "description": "Enseignante passionnée depuis 25 ans, Claire croit fermement que l'éducation est avant tout une relation humaine. Elle est sceptique face aux nouvelles technologies mais ouverte au dialogue.",
            "interests": [
                "pédagogie critique",
                "littérature",
                "éthique du numérique"
            ],
            "communication_style": "Réfléchie, prend le temps d'argumenter, utilise des références culturelles",
            "opinion_on_topic": "L'IA peut être un outil, mais jamais un substitut. L'enseignement est une vocation qui exige empathie et jugement moral."
        },
        "persona2": {
            "name": "Rayan Benali",
            "age": 29,
            "profession": "EdTech entrepreneur, fondateur d'une startup de tutorat IA",
            "education": "Master en Sciences de l'Éducation + Formation Data Science, École 42",
            "personality_type": "Pragmatique visionnaire",
            "description": "Rayan a créé sa propre plateforme d'apprentissage adaptatif après avoir vécu les limites du système scolaire classique. Il voit l'IA comme un levier d'équité éducative.",
            "interests": [
                "innovation pédagogique",
                "accessibilité éducative",
                "IA générative"
            ],
            "communication_style": "Direct, chiffres et données à l'appui, optimiste sur la technologie",
            "opinion_on_topic": "L'IA peut personnaliser l'apprentissage à une échelle impossible pour un humain. Le vrai enjeu est de redistribuer le rôle de l'enseignant."
        }
    }
}
```

**Payload d'entrée (Étape 2) :**

```json
{
    "topic": "L'intelligence artificielle va-t-elle remplacer les enseignants ?",
    "persona1": {
        /* persona1 ci-dessus */
    },
    "persona2": {
        /* persona2 ci-dessus */
    },
    "num_exchanges": 4
}
```

**Sortie Étape 2 (extrait des 4 exchanges) :**

Message 1 :

```json
{
    "speaker": "Rayan Benali",
    "message": "Claire, je comprends ton attachement à la relation pédagogique, mais si une IA peut adapter chaque exercice au niveau exact de chaque élève en temps réel, est-ce qu'on ne lui rend pas service ?",
    "tone": "curious"
}
```

Message 2 :

```json
{
    "speaker": "Claire Fontaine",
    "message": "C'est précisément là où je t'arrête : l'éducation n'est pas que la transmission d'un contenu. C'est aussi apprendre à douter, à résister, à se construire face à une autre conscience. Une machine ne peut pas témoigner de ça.",
    "tone": "passionate"
}
```

Message 3 :

```json
{
    "speaker": "Rayan Benali",
    "message": "Je suis d'accord que la dimension existentielle est irremplaçable. Mais aujourd'hui, dans des classes de 35 élèves, combien reçoivent vraiment cette attention individuelle ? L'IA n'est pas l'ennemi de cette vision, elle peut en libérer le temps.",
    "tone": "pragmatic"
}
```

Message 4 :

```json
{
    "speaker": "Claire Fontaine",
    "message": "C'est un argument que je ne peux pas ignorer. Si l'IA prend en charge la mécanique pour me laisser la philosophie du métier... alors peut-être qu'on parle d'un outil et non d'un remplaçant. Mais je reste vigilante sur qui contrôle ces systèmes.",
    "tone": "thoughtful"
}
```

**Pourquoi cette sortie est satisfaisante :**

- Les styles de communication sont fidèles aux profils (Claire : références culturelles, Rayan : données pratiques)
- Les opinions évoluent : départ en tension, convergence partielle en fin de conversation
- Le sujet est traité avec nuance, sans caricature
- Les 4 exchanges alternent bien entre les deux speakers

---

### Exemple 2 — Variante : Sujet avec hints utilisateur

**Payload d'entrée (Étape 1) :**

```json
{
    "topic": "Faut-il instaurer une semaine de 4 jours de travail en France ?",
    "persona1_hint": "dirigeant de PME industrielle dans le Nord",
    "persona2_hint": "sociologue du travail spécialisée en qualité de vie"
}
```

**Sortie Étape 1 (extrait) :**

```json
{
  "personas": {
    "persona1": {
      "name": "Bruno Deschamps",
      "age": 58,
      "profession": "Dirigeant de PME, secteur métallurgie",
      "personality_type": "Pragmatique conservateur",
      "opinion_on_topic": "La semaine de 4 jours est un luxe inaccessible pour les entreprises industrielles qui tournent en flux tendu.",
      ...
    },
    "persona2": {
      "name": "Leila Oussedik",
      "age": 41,
      "profession": "Sociologue du travail, chercheuse CNRS",
      "personality_type": "Analytique progressiste",
      "opinion_on_topic": "Les études dans les pays nordiques montrent une hausse de productivité et une réduction de l'absentéisme. Les freins sont culturels, pas économiques.",
      ...
    }
  }
}
```

**Pourquoi cette sortie est satisfaisante :**

- Les hints sont bien intégrés : Bruno est ancré dans une réalité industrielle concrète
- Les profils sont contrastés de façon crédible (praticien vs chercheur)
- Les opinions s'opposent sans caricature

---

## 6. Screenshots du POC en fonctionnement

à venir

## 7. (Optionnel) Vidéo de fonctionnement

> Déposer ici un lien vers la vidéo de démonstration (Loom, MP4, etc.). ou joindre à votre demande

**Contenu recommandé :**

1. Saisie d'un sujet + lancement de la génération (0:00 – 0:30)
2. Affichage des personas générés + commentaire oral (0:30 – 1:00)
3. Démarrage du streaming de la discussion en temps réel (1:00 – 2:00)
4. Mise en avant d'un échange particulièrement qualitatif (2:00 – 2:30)

_Lien vidéo : [à compléter]_
