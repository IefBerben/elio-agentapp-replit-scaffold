# Backlog — Consulting Assistant

## Epic 1 — Step 1: Generate analysis

### Feature: Input form

**As a** consultant
**I want to** enter a topic or question and optional context
**So that** the agent knows what to analyze

Acceptance criteria:
- Text input for the main prompt (required, minimum 10 characters)
- Textarea for optional context
- Language toggle (FR / EN) visible in the header
- Generate button is disabled until the prompt field has valid content
- All inputs are disabled while the agent is processing
- Error banner appears if generation fails, inputs re-enable

### Feature: Streaming generation

**As a** consultant
**I want to** see the analysis appear progressively with a progress indicator
**So that** I know the agent is working and roughly how long it will take

Acceptance criteria:
- Progress banner visible during generation (0 → 100%)
- Stop button cancels the in-flight request immediately
- On success: summary card and editable key points list appear
- On error: ErrorBanner shows the message

### Feature: Editable key points

**As a** consultant
**I want to** edit the generated key points before triggering Step 2
**So that** I can correct or focus the analysis before expanding it

Acceptance criteria:
- Each key point is displayed in an editable FormInput field
- Edits are persisted in the Zustand store (survive page navigation and refresh)
- "Generate recommendations" button appears only after Step 1 completes
- Edited key points are sent to Step 2, not the original LLM output

---

## Epic 2 — Step 2: Expand into recommendations

### Feature: Recommendation generation

**As a** consultant
**I want to** expand the edited key points into concrete recommendations and next steps
**So that** I have a presentation-ready output I can share with a client

Acceptance criteria:
- Sends the edited step1_result to the backend (not the raw LLM output)
- Streams recommendations list, next steps list, and a conclusion paragraph
- Progress visible during generation, stop button active
- Results displayed in structured, readable cards

### Feature: Reset

**As a** consultant
**I want to** reset the app to its initial state
**So that** I can start a new analysis without refreshing the page

Acceptance criteria:
- Reset button is always visible in the page header
- Clears all results, inputs, and step state
- Returns to Step 1
- Button is disabled while processing

---

## MVP slice

Epic 1 complete + Epic 2 complete = MVP.
No file upload, no document export, no download in V1.

## Non-functional requirements

- **Bilingual:** all UI text in `fr.json` + `en.json` — zero hardcoded strings
- **Dark mode:** every Tailwind color class must have its `dark:` pair
- **Responsive:** minimum 375px viewport width
- **Tests:** minimum 5 unit tests per backend step function
- **Performance:** Step 1 < 15s, Step 2 < 20s on standard Azure OpenAI deployment
