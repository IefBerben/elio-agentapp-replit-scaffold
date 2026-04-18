# Skill: enrich-submission

## Inputs
- `story_id` — US-XX
- `story_name` — story name
- `test_input` — exact input used during internal test
- `test_output` — complete output generated
- `acceptance_criterion` — from BACKLOG.md

## Process

Before writing, read SUBMISSION.md sections 1-4 to ensure consistency with the PM's
value proposition and the architect's technical decisions.

### Section 5 — Real example
Add under the existing section 5 content:

```markdown
#### {story_id} — {story_name}

**Input utilisé :**
{test_input}

**Output généré :**
{test_output}

**Pourquoi c'est conforme :** {one sentence linking output to acceptance_criterion}
```

### Section 6 — Screenshots and quality
Add screenshot descriptions:

```markdown
#### {story_id} — {story_name}

📸 Screenshot 1 : {precise description of what the PO must capture — e.g., "La page avec le formulaire rempli et le bouton Générer actif"}
📸 Screenshot 2 : {e.g., "L'overlay de génération avec la barre de progression à 50%"}
📸 Screenshot 3 : {e.g., "Le résultat affiché après génération complète"}
```

Add a row to the quality conformity table:

| Story | B1 | B2 | B3 | B4 | B5 | B6 | F1 | F2 | F3 | F4 | F5 | F6 | V1 | S1 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| {story_id} {story_name} | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Output

Confirm in the closing report:
```
SUBMISSION.md : ✅ enrichi (section 5 + section 6 + tableau qualité)
```
