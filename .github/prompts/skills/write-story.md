# Skill: write-story

## Inputs
- `feature_n` — feature number (must match existing feature in BACKLOG.md)
- `feature_name` — feature name (must match existing feature in BACKLOG.md)
- `story_id` — US-XX
- `story_name` — story name in French
- `agent_id` — kebab-case-step-N
- `usecase` — snake_case folder name
- `step_n` — step number
- `step_name` — step file name suffix
- `sse_contract` — provisional JSON shape of the completed yield result (will be finalized after models.py is written)
- `acceptance_criteria` — one or more acceptance criteria in Gherkin format (GIVEN/WHEN/THEN)
- `must_be_true` — 1-3 observable truths about the system state when the story is done
- `depends_on` — optional, list of US-XX that must be Built before this story (or "aucune")

## Process

Append the story block under the correct feature section in BACKLOG.md.
The feature section must already exist (created by the architect).
Never show the block in chat — the builder reads BACKLOG.md directly.

## Output

Append exactly this format under the matching feature in BACKLOG.md:

```markdown
### {story_id} — {story_name}
**Statut :** Confirmed

**Agent ID :** {agent_id}
**Fichiers :**
- back/agents/{usecase}/__init__.py
- back/agents/{usecase}/models.py
- back/agents/{usecase}/prompt_fr.py
- back/agents/{usecase}/prompt_en.py
- back/agents/{usecase}/step{step_n}_{step_name}.py
- back/agents/{usecase}/tests/test_step{step_n}.py
- back/main.py (AGENTS_MAP)
- front/src/stores/agent-apps/{usecase}Store.ts
- front/src/pages/{Usecase}AgentAppPage.tsx
- front/src/i18n/locales/fr.json
- front/src/i18n/locales/en.json
- front/src/App.tsx (route)

**Contrat SSE (completed) :** ⚠️ provisional — à finaliser après models.py
```json
{sse_contract}
```

**Critères d'acceptation :**
- GIVEN {context}, WHEN {action}, THEN {expected result}
- GIVEN {context}, WHEN {action}, THEN {expected result}

**Ce qui doit être VRAI :**
- {truth_1}
- {truth_2}

**Dépend de :** {depends_on or "aucune"}
```

Each acceptance criterion follows the **GIVEN / WHEN / THEN** format. Write as many as needed to fully describe the expected behavior.

**"Ce qui doit être VRAI"** are observable truths about the system state — they complement the AC by describing what must hold true when the story is done (e.g., "L'agent est enregistré dans AGENTS_MAP", "Le formulaire est désactivé pendant la génération").
