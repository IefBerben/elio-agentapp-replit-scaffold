# Elio Scaffold — Agent Instructions

You are building an Elio Agent App for the Onepoint marketplace.
These rules are non-negotiable. Read `docs/` before writing any code.

---

## Tech stack

- **Backend:** Python 3.12 · FastAPI · LangChain · uv (`back/`)
- **Frontend:** React 18 · Vite · TypeScript strict · Tailwind CSS · Zustand 5 (`front/`)
- **LLM:** Azure OpenAI via `get_llm()` from `back/services/llm_config.py`
- **Shared types:** TypeScript interfaces in `packages/shared-types/src/index.ts`

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
| `docs/AGENT_APP_GUIDELINES_BACK.md` | SSE patterns, bilingual prompts, file processing, doc generation |
| `docs/AGENT_APP_GUIDELINES_FRONT.md` | Components, Zustand patterns, dark mode, full creation checklist |
| `docs/CONVENTIONS.md` | Architecture, naming, allowed models, security |
| `docs/INTEGRATION_GUIDE.md` | How your POC integrates into the Elio platform |

---

## Skills available

Use these skills in order for a new app build:

1. `.agents/skills/intake-from-markdown/SKILL.md` — analyze inputs or run conversational intake
2. `.agents/skills/generate-api-contracts/SKILL.md` — write API contracts before coding
3. `.agents/skills/build-backend/SKILL.md` — build the Python backend
4. `.agents/skills/build-frontend/SKILL.md` — build the React frontend
5. `.agents/skills/platform-integration-check/SKILL.md` — validate and update SUBMISSION.md
