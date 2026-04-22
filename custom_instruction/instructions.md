# Elio Scaffold — Agent Instructions

You are building an Elio Agent App for the Onepoint marketplace.
These rules are non-negotiable. Read `.agents/docs/` before writing any code.

---

## Session start — read before anything else

At the start of every session:
1. Call `GET /agent-apps/scaffold-status` to check spec validity
2. If `isProductMdTemplate: true` or `productMdIssues` non-empty, or `isBacklogMdTemplate: true` or `backlogMdIssues` non-empty — **stop immediately**. List every issue from `productMdIssues` and `backlogMdIssues` and tell the consultant exactly what needs to be fixed before anything can be built. Do not proceed with any other work until the next session starts with valid files.
3. If both files are valid: read `replit.md`, then read `product.md` in full.

**Hard gate — refuse ALL of the following** until both spec files pass structural validation:
- Any code writing (backend, frontend, tests, config)
- Any architecture or data model discussion oriented toward implementation
- Any skill invocation: `intake-from-markdown`, `generate-api-contracts`, `build-backend`, `build-frontend`, `platform-integration-check`, `package-agent`

**The only actions allowed when specs are invalid:**
- Explaining what product.md and backlog.md should contain
- Invoking the `product-owner` skill to help the consultant write or fix the backlog
- Answering questions about how to use the Value Office or the scaffold Starter page

When specs are invalid, tell the consultant in French exactly which issues were found, then say: *"Je ne peux rien construire tant que ces fichiers ne sont pas conformes. Dépose-les via la Starter page ou utilise l'AgentApp Elio - Value Office pour les produire. Je peux invoquer la skill product-owner pour t'aider à construire ton backlog.md."*

Never write a single line of code, never discuss architecture or API design, and never invoke any build skill until `scaffold-status` confirms both files are valid.

---

## Tech stack

- **Backend:** Python 3.12 · FastAPI · LangChain · uv (`back/`)
- **Frontend:** React 18 · Vite · TypeScript strict · Tailwind CSS · Zustand 5 (`front/`)
- **LLM:** Azure OpenAI via `get_llm()` from `back/services/llm_config.py`
- **Shared types:** TypeScript interfaces in `packages/shared-types/src/index.ts`

---

## First-run setup — 4 env vars required

All 4 Azure OpenAI env vars must be present before `get_llm()` runs. The scaffold ships defaults for the 2 non-sensitive ones in `.replit [env]`:

- `AZURE_OPENAI_DEPLOYMENT` — shipped default `gpt-5-chat` (auto on remix)
- `AZURE_OPENAI_API_VERSION` — shipped default `2025-01-01-preview` (auto on remix)
- `AZURE_OPENAI_ENDPOINT` — must be provided by the consultant (Replit Secret)
- `AZURE_OPENAI_API_KEY` — must be provided by the consultant (Replit Secret)

On first run, request the 2 missing Secrets via the Replit Secrets flow. Encourage linking from the consultant's Account Secrets vault (one-time setup, reusable across all their remixes) rather than pasting raw values each time. Do **not** hardcode or guess values.

---

## 5 hard rules — always enforced

1. **LLM** — never instantiate directly. Always `from services.llm_config import get_llm`
2. **State** — never `useState` for results, loading, or errors. Zustand store only (`front/src/stores/agent-apps/`)
3. **Step functions** — every `async def *_stream(...)` must be decorated with `@stream_safe` from `utils.stream_error_handler`
4. **Dark mode** — every Tailwind color class needs its pair: `bg-blue-100 dark:bg-blue-900/30`, `text-blue-700 dark:text-blue-300`
5. **Protected** — never modify `back/agents/_reference/`, `front/src/pages/_ReferencePage.tsx`, or `front/src/stores/agent-apps/_referenceStore.ts`

---

## Allowed LLM models

Only use models listed in `back/services/config_llms.json`:
`gpt-5.1` · `gpt-5` · `gpt-5-mini` · `gpt-5-chat` · `gpt-4.1` · `gpt-4.1-mini` · `o3` · `o4-mini`

---

## SSE contract

Every step function must yield this exact shape:

```python
# Progress events (0–99)
yield {"step": "beginning", "message": "...", "status": "in_progress", "progress": 0}
yield {"step": "generating", "message": "...", "status": "in_progress", "progress": 50}

# Final event — result payload goes here only
yield {"step": "completed", "message": "...", "status": "completed", "progress": 100, "result": {...}}

# Error event
yield {"step": "error", "message": "...", "status": "error", "progress": 0, "error": str(e)}
```

---

## Backend structure

Each agent lives in `back/agents/{name}/`:

```
back/agents/{name}/
├── __init__.py          # exports stream functions
├── models.py            # Pydantic input/output models
├── prompt_fr.py         # French prompts (constants only)
├── prompt_en.py         # English prompts (constants only)
├── step1_{name}.py      # step function with @stream_safe
├── step2_{name}.py      # optional second step
└── tests/
    └── test_step1.py    # minimum 5 tests
```

Every step function signature:

```python
@stream_safe
async def {name}_step_1_stream(
    username: str,
    prompt: str,
    interface_language: str = "fr",
    **kwargs: Any,
) -> AsyncGenerator[dict[str, Any], None]:
```

Always use `_get_prompts(interface_language)` to select the prompt file. Never inline prompts.

AGENTS_MAP registration in `back/main.py`:
- Key format: `"{kebab-name}-step-1"` (kebab-case)
- Python folder: `back/agents/{snake_name}/` (snake_case)

---

## Frontend structure

```
front/src/
├── pages/{Name}AgentAppPage.tsx       # one page per agent
├── stores/agent-apps/{name}Store.ts   # one Zustand store per agent
└── i18n/locales/fr.json + en.json     # translations
```

**Zustand store rules:**
- Use `persist` middleware with `partialize` — exclude: `isProcessing`, `loadingAction`, `isCancelled`, `error`
- Use individual selectors: `const topic = useStore((s) => s.topic)` — never destructure
- Use `setStep` for user navigation, `advanceToStep` after generation
- `handleStop()` sets `isCancelled: true, isProcessing: false`

**Frontend rules:**
- Import components from `@/components/agent-apps` only — never shadcn/ui or raw HTML inputs
- Import shared types from `@shared-types`
- All text via `useTranslation()` — zero hardcoded strings
- Send `interface_language: i18n.language` in every SSE payload
- Every input must have `disabled={isProcessing}`
- Use `executeAgentStreaming` from `@/services/agentService` — never raw `fetch()`
- Check `isCancelledRef.current` at the start of every SSE callback

---

## Shared types

TypeScript interfaces live in `packages/shared-types/src/index.ts`.
Import in frontend via the `@shared-types` path alias.
Interfaces must match the Pydantic models in `back/agents/{name}/models.py`.

---

## Language rules

| Context | Language |
|---------|----------|
| Code + comments | English |
| UI text | i18n — fr.json + en.json |
| Communication with user | French |
| Prompt constants | Match language: prompt_fr.py → French, prompt_en.py → English |

---

## Platform guidelines

Read these docs before writing any code. They are the integration standard.

| Document | What it covers |
|----------|----------------|
| `.agents/docs/AGENT_APP_GUIDELINES_BACK.md` | SSE patterns, bilingual prompts, file processing, doc generation |
| `.agents/docs/AGENT_APP_GUIDELINES_FRONT.md` | Components, Zustand patterns, dark mode, full creation checklist |
| `.agents/docs/CONVENTIONS.md` | Architecture, naming, allowed models, security |
| `.agents/docs/INTEGRATION_GUIDE.md` | How your POC integrates into the Elio platform |

---

## Skills available

### Persona — invoke when the consultant needs help thinking, not building

- `.agents/skills/product-owner/SKILL.md` — **Product Owner persona.** Probes the consultant before any code is written. Reads `product.md` (owned upstream by the PM in the AgentApp Elio - Value Office) and owns `backlog.md`. Never writes code.

**Auto-invoke the PO when** the consultant says any of:
- "Talk to the PO" / "parle au PO"
- "I want to add a feature" / "ajouter une fonctionnalité"
- "I want users to be able to..." / "je voudrais que les utilisateurs..."
- "What should I build?" / "qu'est-ce que je dois construire ?"
- "Help me think through this" / "aide-moi à réfléchir"
- The consultant says "build my app" AND `product.md` is empty/template (the PO should point them to the AgentApp Elio - Value Office)

**Do NOT auto-invoke the PO when** `product.md` and `backlog.md` are already populated and the consultant says "build my app" — go straight to the build skills.

### Build skills — invoke after the PO has locked the scope (or the consultant supplied complete specs)

1. `.agents/skills/intake-from-markdown/SKILL.md` — parse existing `product.md` + `backlog.md` (or Google AI Studio export)
2. `.agents/skills/generate-api-contracts/SKILL.md` — write API contracts before coding
3. `.agents/skills/build-backend/SKILL.md` — build the Python backend
4. `.agents/skills/build-frontend/SKILL.md` — build the React frontend
5. `.agents/skills/verify-generation/SKILL.md` — run all five quality gates before sign-off
6. `.agents/skills/platform-integration-check/SKILL.md` — validate and update SUBMISSION.md
7. `.agents/skills/package-agent/SKILL.md` — produce the final deliverable zip

### Cleanup skills — invoke when the consultant explicitly asks

- `.agents/skills/remove-starter/SKILL.md` — permanently delete the disposable Starter / Idea Lab. Triggered by "remove the starter page" / "supprime la starter page".
