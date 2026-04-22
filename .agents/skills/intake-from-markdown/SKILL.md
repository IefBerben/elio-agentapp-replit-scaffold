# Skill: intake-from-markdown

Analyze the product and backlog inputs. Derive the full scope, data model, and API surface.
Update `replit.md`. Get user confirmation before any code is written.

> **Scope boundary.** `product-owner` owns *product* scope (`backlog.md` —
> user stories, acceptance criteria, MoSCoW). This skill owns *technical*
> scope (data model, step decomposition, API surface) derived from that
> locked backlog. Invoked by the PO once scope is locked, chains into
> `generate-api-contracts`. Never re-opens product scope — if the consultant
> wants to change a story, route them back to the PO.

---

## Detect which input mode applies

### Mode A — Conversational (from scratch)

**Trigger:** `product.md` and `backlog.md` contain only template stubs (sections with `—` or empty content).

Ask the user these questions **one at a time**. Wait for each answer before asking the next.

1. "Décris ton app en une phrase — qu'est-ce qu'elle fait et pour qui ?"
2. "Quel est le workflow principal — qu'est-ce que l'utilisateur saisit, et qu'est-ce qu'il obtient en retour ?"
3. "De combien d'étapes a besoin l'agent ? (1 étape = générer, 2 étapes = générer puis affiner/enrichir)"
4. "Quel format pour le résultat — texte à afficher, fichier à télécharger, liste structurée ?"
5. "Des contraintes ? (langue, sensibilité des données, intégrations spécifiques)"

After all 5 answers:
- Write `product.md` using the template structure below, filled in from the answers
- Write `backlog.md` in MoSCoW format (Must Have / Should Have / Could Have / Won't Have) with US-N user stories, each carrying `**Status:** [ ] not started`
- Confirm with the user: "Voici product.md et backlog.md. C'est bien ce que tu voulais ?"
- Then proceed as Mode B

### Mode B — From files

**Trigger:** `product.md` and `backlog.md` have real content.

Read both files. Extract:

```
use_case_name:    (kebab-case identifier for folder + route naming)
display_name:     (human-readable name)
actors:           (list of user types)
user_context:     (when/why they use the app — from product.md Users section)
user_frequency:   (how often — from product.md Users section)
core_workflow:    (numbered steps from user's perspective)
steps:            (list of backend steps with input/output per step)
data_model:
  per step:
    inputs:  [field_name: type, ...]
    outputs: [field_name: type, ...]
output_format:    (what the result looks like: cards, list, downloadable file, etc.)
constraints:      (language, data sensitivity, integrations, performance — from product.md)
success_criteria: (measurable criteria — from product.md)
bilingual:        yes/no
file_upload:      yes/no
document_generation: yes/no
risks:            (list)
assumptions:      (list)
```

### Mode C — From Google AI Studio export

**Trigger:** A `.tsx` or `.zip` file exists in `Input/`.

- If `.zip`: extract it and read the `.tsx` files inside
- Read component structure, props, state, and data shapes
- Derive the same output as Mode B
- Tell the user what was inferred from the export

---

## After analysis (all modes)

**1. Update `replit.md`** — fill the "App being built" section with the extracted data.

**2. Present a confirmation summary:**

```
Voici ce que j'ai compris :

App : [display_name]
Acteurs : [actors] — [user_context], [user_frequency]
Workflow :
  1. [step 1]
  2. [step 2]
Étapes agent : [N step(s)]
  Step 1 — inputs: [...] → outputs: [...]
  Step 2 — inputs: [...] → outputs: [...] (if applicable)
Format de sortie : [output_format]
Contraintes : [constraints]
Critères de succès : [success_criteria]
Upload de fichiers : oui/non
Génération de documents : oui/non
Bilingue : oui/non
Risques : [risks]
Hypothèses : [assumptions]

C'est correct ? Je génère les contrats API et je commence à coder.
```

**3. Wait for "oui" / "go" / confirmation before invoking `generate-api-contracts`.**

If the user corrects something, update `product.md` / `backlog.md` / `replit.md` and re-present.

---

## product.md template structure

```markdown
# Product — [App Name]

## Vision
[One paragraph: what the app does, for whom, the core value]

## Users
**Primary:** [user type]
**Context:** [when/why they use it]
**Frequency:** [how often]

## Problem solved
[What takes too long or is too hard today, and by how much]

## Core workflow
1. [User does X]
2. [Agent does Y]
3. [User gets Z]

## Output format
[What the result looks like: cards, lists, downloadable file, etc.]

## Constraints
[Language, data sensitivity, integrations, performance]

## Platform fit
[Standalone Agent App / integrates with X]

## Success criteria
- [Measurable criterion 1]
- [Measurable criterion 2]
```

---

## backlog.md template structure

```markdown
# Backlog — [App Name]

## Must Have — ship first

### US-01 — [Short title]
**Status:** [ ] not started
**Priority:** Must Have
**As a** [actor]
**I want** [capability]
**So that** [outcome]
**Acceptance criteria:**
- [Concrete, testable]
- [Concrete, testable]
**Out of scope:**
- [What this story explicitly does NOT cover]

### US-02 — [Short title]
**Status:** [ ] not started
**Priority:** Must Have
...

---

## Should Have — next, if time allows

### US-03 — [Short title]
**Status:** [ ] not started
**Priority:** Should Have
**As a** [actor]
**I want** [capability]
**So that** [outcome]
**Hint on acceptance criteria:**
- [The PO will tighten this when the story is promoted]

---

## Could Have — nice if easy

### US-04 — [Short title]
**Status:** [ ] not started
**Priority:** Could Have
**As a** [actor]
**I want** [capability]
**So that** [outcome]

---

## Won't Have (this version) — explicitly out

- **[Idea]** — [reason: platform envelope / deferred to v2]
```
