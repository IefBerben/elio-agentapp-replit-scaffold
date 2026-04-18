# Elio Scaffold v7 — Copilot Instructions

## Tech stack

**Backend:** Python 3.12+ · FastAPI + uvicorn (port **8000**) · LangChain · Pydantic v2 · **uv** (package manager)
**Frontend:** Vite 6 + React 18 + TypeScript strict · Tailwind CSS 3 · Zustand 5 · react-i18next · lucide-react
**LLM:** `AzureChatOpenAI` — always via `get_llm()` from `back/services/llm_config.py` · Auth: `AZURE_OPENAI_API_KEY` env var (priority) or `DefaultAzureCredential` (`az login`)

## 5 rules — always apply

1. **LLM** — never instantiate directly. Always `from services.llm_config import get_llm` → `get_llm()` or `get_llm("gpt-4.1-mini")`
2. **State** — never `useState` for results, loading, or errors. Zustand store only (`src/stores/agent-apps/`)
3. **Step functions** — every `async def *_stream(...)` must be decorated with `@stream_safe` from `utils.stream_error_handler`
4. **Dark mode** — every color class needs its pair: `bg-blue-100 dark:bg-blue-900/30`, `text-blue-700 dark:text-blue-300`
5. **Protected** — never modify `back/agents/_reference/`, `front/src/pages/_ReferencePage.tsx`, or `front/src/stores/agent-apps/_referenceStore.ts`

## AGENTS_MAP naming

Keys use kebab-case + `-step-N`: `mon-usecase-step-1`, `mon-usecase-step-2`.

**CRITICAL — Python folder names use underscores, not hyphens:**
- Folder: `back/agents/mon_usecase/` (underscores — Python cannot import hyphens)
- AGENTS_MAP key: `"mon-usecase-step-1"` (kebab-case — HTTP route)
- Import: `from agents.mon_usecase import mon_usecase_step_1_stream`

## SSE contract (all step functions must yield this shape)

```python
yield {"step": "...", "message": "...", "status": "in_progress", "progress": 0}   # progress 0–99
yield {"step": "completed", "message": "...", "status": "completed", "progress": 100, "result": {...}}
```

## Shared UI components

Import from `@/components/agent-apps` only — never from shadcn/ui, radix-ui, or headlessui.
Available: `AgentAppPageShell`, `AgentAppHeader`, `AgentAppCard`, `AgentAppCardForm`, `AgentAppSection`,
`AgentAppSimpleLayout`, `AgentAppSectionBadge`, `StepIndicator`, `LanguageToggle`,
`GenerateButton`, `ResetButton`, `ErrorBanner`, `FileUploadZone`, `FilesList`,
`GeneratingOverlay`, `ProgressBanner`, `ActionBanner`, `AgentAppSelect`, `AgentAppSwitch`,
`FormField`, `FormInput`, `FormTextarea`

## Bilingual prompts — always separate prompt files per language

Never hardcode French/English strings in step files. Create `prompt_fr.py` and `prompt_en.py` in each agent folder:

```python
# prompt_fr.py / prompt_en.py
STEP1_SYSTEM = """..."""   # system prompt with {prompt}, {context_block} placeholders
MSG_INIT = "Initialisation..."
MSG_GENERATING = "Génération en cours..."
```

In the step function, use a `_get_prompts(interface_language)` helper:

```python
def _get_prompts(interface_language: str):
    if interface_language == "en":
        from agents.my_agent import prompt_en as prompts
    else:
        from agents.my_agent import prompt_fr as prompts
    return prompts
```

## File upload & document processing

Frontend: `front/src/services/fileUploadService.ts` — `uploadFiles()`, `listUploadedFiles()`, `deleteUploadedFile()`, `downloadUploadedFile()`
Backend temp storage: `back/tempfiles/` — paths returned by `/files/upload` can be passed as `file_paths` in agent payloads.

**Document processing — ALWAYS use the built-in service, never implement extraction manually:**
`from services.process_files import print_or_summarize` — extracts text from PDF/DOCX/PPTX/XLSX/CSV/audio; auto-summarizes if > 10 000 chars.

Usage in a step function:
```python
from services.process_files import print_or_summarize

async def my_step_stream(username, prompt, file_paths=None, language="fr", **kwargs):
    docs_context = ""
    if file_paths:
        lang = "FR" if language == "fr" else "EN"
        parts = [await print_or_summarize(p, language=lang) for p in file_paths]
        docs_context = "\n\n".join(parts)
    # inject docs_context into your LLM prompt
```

**All document libraries are already installed** in `back/pyproject.toml` — never add or install them manually:
- `python-docx` — .docx extraction
- `python-pptx` — .pptx extraction
- `PyMuPDF` — .pdf extraction
- `openpyxl` + `pandas` — .xlsx/.csv extraction
- `azure-ai-documentintelligence` — OCR fallback for scanned PDFs
- Audio transcription (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`, `.flac`) via Azure OpenAI Whisper

## Document generation

`from services.generate_files import markdown_to_docx, text_to_docx, slides_to_pptx, fill_docx_template, fill_pptx_template`

- `markdown_to_docx(md, filename)` — convert markdown string to .docx
- `text_to_docx(text, filename)` — plain text to .docx
- `slides_to_pptx(slides, filename)` — list of `{"title", "content"}` dicts to .pptx
- `fill_docx_template(template_name, replacements, filename)` — fill `{{key}}` placeholders in a template from `back/templates/`
- `fill_pptx_template(template_name, replacements, filename)` — fill `<<key>>` placeholders in a .pptx template

All functions return the output file path in `back/tempfiles/`.

## Model configuration

`back/services/config_llms.json` — **authoritative source** for all allowed model names. Azure OpenAI endpoint, deployment names, and default models.
`get_llm()` reads this file. To add or change a model, edit the `deployments` map and optionally update `defaults.chat`.
Pre-configured chat models: `gpt-5.1`, `gpt-5-mini`, `gpt-4.1`, `gpt-4.1-mini`, `o3`. Image: `gpt-image-1`. Whisper: `whisper`.

## Running commands (uv)

This project uses **uv** as its Python package manager. Never use `pip install` or `python -m` directly.

| Task | Command |
|---|---|
| Install Python deps | `cd back && uv sync` |
| Run backend | `cd back && uv run uvicorn main:app --reload --port 8000` |
| Run tests | `cd back && uv run pytest agents/ -v` |
| Add a dependency | Add it to `back/pyproject.toml` → `uv sync` |
| Run any Python script | `uv run python script.py` |

## Agent prompts

In Replit AI chat → click the attachment icon (trombone) → select the prompt file from `.github/prompts/`:

| File | Role |
|------|------|
| `product-manager.prompt.md` | Define product vision |
| `architect.prompt.md` | Design features & backlog |
| `builder.prompt.md` | Implement user stories |
| `quality.prompt.md` | QA and conformity checks |
| `status.prompt.md` | Project status dashboard |
| `generate-from-google-ai-studio.prompt.md` | Generate from AI Studio export |
| `generate-from-jira.prompt.md` | Generate from JIRA spec |
| `generate-from-jira-and-ai-studio.prompt.md` | Generate from both sources |
