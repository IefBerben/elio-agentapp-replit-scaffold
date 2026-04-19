# Backlog — _À compléter_

<!--
How to structure this file:
- One Epic per step of your agent (typically Step 1, Step 2).
- Each Epic contains Features written as user stories.
- Each Feature has acceptance criteria — the concrete, testable rules the Builder agent will implement.
- End with an MVP slice (what's in V1) and non-functional requirements.

Tip: replace every `_À compléter_` below with your own content.
The Product Manager agent in `.agents/prompts/` can generate this for you from `product.md`.
-->

## Epic 1 — Step 1: _À compléter_

### Feature: _À compléter_ (e.g. Input form)

**As a** _À compléter_ (who)
**I want to** _À compléter_ (action)
**So that** _À compléter_ (outcome)

Acceptance criteria:
- _À compléter_ (e.g. required fields, validation rules)
- _À compléter_ (e.g. button states — enabled / disabled / loading)
- _À compléter_ (e.g. error handling)

### Feature: _À compléter_ (e.g. Streaming generation)

**As a** _À compléter_
**I want to** _À compléter_
**So that** _À compléter_

Acceptance criteria:
- _À compléter_ (e.g. progress banner visible during generation)
- _À compléter_ (e.g. stop button cancels in-flight request)
- _À compléter_ (e.g. results displayed on success, error banner on failure)

---

## Epic 2 — Step 2: _À compléter_

### Feature: _À compléter_

**As a** _À compléter_
**I want to** _À compléter_
**So that** _À compléter_

Acceptance criteria:
- _À compléter_
- _À compléter_

### Feature: Reset

**As a** consultant
**I want to** reset the app to its initial state
**So that** I can start a new analysis without refreshing the page

Acceptance criteria:
- Reset button always visible in the page header
- Clears all results, inputs, and step state
- Returns to Step 1
- Button is disabled while processing

---

## Non-functional requirements

- **Bilingual:** all UI text in `fr.json` + `en.json` — zero hardcoded strings
- **Streaming:** all agents return progress updates (0 → 100%) and support stop
- **Persistence:** user inputs and results survive page refresh (Zustand + persist)
- _À compléter_ (add project-specific constraints)
