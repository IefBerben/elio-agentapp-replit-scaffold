# Build Rules — Elio Scaffold v7 (shared)

This file is referenced by `/generate-from-google-ai-studio`, `/generate-from-jira`, `/generate-from-jira-and-ai-studio`, and `/builder`. It contains all shared coding rules, patterns, and constraints. **Do not duplicate this content — always reference this file.**

---

## NAMING CONVENTIONS

**CRITICAL — Python folder names use underscores, not hyphens:**
- Python folder: `back/agents/mon_usecase/` (underscores — Python cannot import hyphens)
- AGENTS_MAP key: `"mon-usecase-step-1"` (kebab-case — HTTP route)
- Import: `from agents.mon_usecase import mon_usecase_step_1_stream`
- Frontend store/page: `monUsecaseStore.ts` (camelCase), `MonUsecaseAgentAppPage.tsx` (PascalCase)
- i18n namespace: `monUsecase.*` (camelCase)

---

## IMPORT PATTERNS — use these EXACT imports

**Backend Python** — all imports are relative to `back/` (the working directory):
```python
from services.llm_config import get_llm           # canonical — supports get_llm("gpt-4.1-mini")
from services.process_files import print_or_summarize  # document extraction + auto-summarize
from utils.stream_error_handler import stream_safe # NOT from back.utils...
from agents.{usecase}.models import InputModel, OutputModel
```

**Step function signature** — must match how `main.py` calls agents:
```python
@stream_safe
async def {usecase}_step_{N}_stream(
    username: str,          # always first param
    **kwargs,               # remaining fields from JSON body
) -> AsyncGenerator[dict, None]:
    model = InputModel(**kwargs)  # build model from kwargs inside the function
```

**Frontend TypeScript** — use barrel imports only:
```typescript
import { AgentAppPageShell, AgentAppCard, ... } from '@/components/agent-apps'
import { executeAgentStreaming } from '@/services/agentService'
import { uploadFiles, listUploadedFiles, deleteUploadedFile } from '@/services/fileUploadService'  // when using FileUploadZone
import { use{Usecase}Store } from '@/stores/agent-apps/{usecase}Store'
```

---

## FILE HANDLING — TWO PATTERNS (choose the right one)

**Pattern 1 — Text extraction (PDF, DOCX, PPTX, XLSX, CSV):**
Use when the agent needs to READ the content of a document.
- Frontend: `uploadFiles(files)` from `fileUploadService.ts` → returns file paths
- Store the paths, pass them as `file_paths: list[str]` in the agent payload
- Backend step function: `from services.process_files import print_or_summarize` → extracts text, auto-summarizes if > 10 000 chars
- Send extracted text to LLM as part of the prompt

```python
# Backend — step function
from services.process_files import print_or_summarize

for path in model.file_paths:
    content = await print_or_summarize(path)
    # Include content in the LLM prompt
```

**Pattern 2 — Multimodal LLM input (images, audio, video):**
Use when the LLM needs to SEE or HEAR the file directly (e.g., image analysis, audio transcription).
- Frontend: base64-encode files before sending
- Backend: reconstruct into LangChain `HumanMessage` content parts

```typescript
// Frontend — base64 encode
const encodeFile = (file: File): Promise<{name: string; mime_type: string; data_base64: string}> =>
  new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({
      name: file.name,
      mime_type: file.type,
      data_base64: (reader.result as string).split(',')[1],
    });
  });
```

**Decision rule:**
| File type | Pattern | Why |
|---|---|---|
| PDF, DOCX, PPTX, XLSX, CSV | Pattern 1 (text extraction) | LLM reads text, not binary |
| Images (PNG, JPG, SVG) | Pattern 2 (base64 to LLM) | Multimodal model sees the image |
| Audio (MP3, WAV, M4A, OGG, WEBM, FLAC) | Pattern 1 (text extraction) | Whisper transcription via `process_files` |

---

## BILINGUAL PROMPTS — always separate prompt files per language

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
        from agents.{usecase} import prompt_en as prompts
    else:
        from agents.{usecase} import prompt_fr as prompts
    return prompts
```

---

## DOCUMENT GENERATION — built-in service

`from services.generate_files import markdown_to_docx, text_to_docx, slides_to_pptx, fill_docx_template, fill_pptx_template`

| Function | Input | Output |
|---|---|---|
| `markdown_to_docx(md, filename)` | Markdown string | .docx file path |
| `text_to_docx(text, filename)` | Plain text | .docx file path |
| `slides_to_pptx(slides, filename)` | List of `{"title", "content"}` dicts | .pptx file path |
| `fill_docx_template(template_name, replacements, filename)` | Template from `back/templates/` + `{{key}}` map | .docx file path |
| `fill_pptx_template(template_name, replacements, filename)` | Template from `back/templates/` + `<<key>>` map | .pptx file path |

All functions return output file paths in `back/tempfiles/`. Use these for export stories — **do not classify DOCX/PPTX export as Cat B**, the libraries are installed.

---

## BUILD VALIDATION — MANDATORY before delivering

**The PO will not understand stack traces.** After writing code, ALWAYS run:
- Backend: `cd back; uv run python -c "import main"` — verifies all Python imports
- Frontend: `cd front; npx tsc --noEmit` — verifies all TypeScript compiles
- **Regression gate:** run ALL tests for the usecase (not just the current story's test) — a new story must never break a previously passing test

**Shell compatibility:** always use `;` (not `&&`) to chain commands — the PO's terminal may be PowerShell where `&&` is not valid.

Fix every error before delivering.

---

## STORY STATUS UPDATE — MANDATORY after each story

**Do this immediately after each story passes build validation.** Do NOT defer to finalization.
1. Find the story's `Statut : Confirmed` line in BACKLOG.md
2. Replace it with `Statut : Built`
3. If BACKLOG.md has a summary table (Résumé), update the story's row to show `Built`

**This must happen before moving to the next story.**

---

## STORY DECOMPOSITION — a feature is NOT a story

Decompose each feature into **user stories with Gherkin acceptance criteria**. Each story describes one user scenario with clear expected behavior. The backlog must be extensive and profound — it drives code generation and quality assessment.

**What makes a good story:**
- It describes ONE meaningful user scenario
- It has one or more acceptance criteria in **GIVEN / WHEN / THEN** format
- It is a full scenario (not just "input" or "output" — each story goes from action to observable result)
- It maps to at least one unit test

**Decomposition method:**
For each feature, ask: "What are all the distinct things a user can do with this feature?" Each answer is a story.

| Scenario type | Story pattern | Example acceptance criteria |
|---|---|---|
| Core happy path | "Générer [résultat] à partir de [input simple]" | GIVEN un texte de réunion saisi, WHEN je lance la génération, THEN un compte-rendu s'affiche avec synthèse exécutive, décisions et actions |
| Input variant | "Importer un fichier [format] comme source" | GIVEN un fichier .mp3 uploadé, WHEN je lance la génération, THEN le compte-rendu est basé sur le contenu audio |
| Output section | "Consulter [section] dans le résultat" | GIVEN un compte-rendu généré, WHEN je consulte la section Actions, THEN chaque action a un responsable, une échéance et une priorité |
| Config impact | "Choisir [option] et observer l'impact" | GIVEN l'option langue sur 'English', WHEN je génère, THEN le résultat est intégralement en anglais |
| User interaction | "Modifier [élément] dans le résultat" | GIVEN un compte-rendu affiché, WHEN je modifie le titre de la synthèse, THEN la modification est conservée à l'écran |
| Export / secondary output | "Exporter le résultat en [format]" | GIVEN un compte-rendu généré, WHEN je clique Exporter DOCX, THEN un fichier .docx se télécharge avec le contenu |
| Error / edge case | "Lancer [action] sans [prérequis]" | GIVEN aucune source saisie, WHEN je clique Générer, THEN un message d'erreur clair s'affiche |

**Rules:**
- Acceptance criteria use **GIVEN / WHEN / THEN** — one or more per story
- Each story has **"Ce qui doit être VRAI"** — 1-3 observable truths about the system state when the story is done (complements the Gherkin AC)
- Each story declares **"Dépend de"** — list of US-XX prerequisites, or "aucune"
- **Each story has at least one unit test** validating its scenario programmatically
- Story names are in French, business-oriented, zero jargon
- Stories within a feature share backend files but each adds a distinct behavior
- The first story of a feature creates the files; subsequent stories extend them
- Never create a 1:1 feature-to-story mapping — decompose until every scenario is covered
- Never split by "input" vs "output" — each story is a **full user scenario**

**Bad decomposition (too coarse):**
- ❌ US-01 "Saisir les sources" — not a scenario, no expected result
- ❌ US-02 "Générer le résultat" — too broad, no specific behavior described

**Good decomposition (scenario-based with acceptance criteria):**
- ✅ US-01 "Générer un compte-rendu à partir d'un texte brut" — GIVEN/WHEN/THEN with specific result
- ✅ US-02 "Générer un compte-rendu à partir d'un fichier audio" — distinct input variant with expected behavior
- ✅ US-03 "Consulter les actions et responsables" — specific section with observable structure
- ✅ US-04 "Choisir la langue du compte-rendu" — config change with verifiable impact
- ✅ US-05 "Modifier la synthèse dans l'interface" — user interaction with persistence check

---

## FILE CREATION ORDER

For each story, create files in this exact sequence:

### 1. `back/agents/{usecase}/models.py`
Pydantic v2 BaseModel for inputs and outputs.
- `InputModel`: one field per form param (str, Optional[str], list[str], Literal for enums)
- `OutputModel`: one nested Pydantic class per nested TypeScript interface
- File fields: `list[dict]` shape `{"name": str, "mime_type": str, "data_base64": str}`
- Google-style docstrings and full type hints
- **If file already exists** (partial build or resume): read first — only add missing models
- **Update SSE contract in BACKLOG.md** — replace provisional `sse_contract` with actual JSON shape

### 1b. `back/agents/{usecase}/prompt_fr.py` + `prompt_en.py`
Bilingual prompt files — see BILINGUAL PROMPTS section above.
- One constant per step: `STEP1_SYSTEM`, `STEP2_SYSTEM`, etc.
- One constant per loading message: `MSG_INIT`, `MSG_GENERATING`, `MSG_PARSING`, etc.
- All LLM-facing text in one language per file. UI-facing loading messages also translated.

### 2. `back/agents/{usecase}/step{N}_{name}.py`
Async generator with `@stream_safe` decorator.
- Import prompts via `_get_prompts(interface_language)` helper — never hardcode French/English strings
- `get_llm().with_structured_output(OutputModel)` — never SDK directly
- Yield chain: one `yield {in_progress, progress, message}` per loading phase, then `completed`
- File handling: use the correct FILE HANDLING pattern — text documents via `print_or_summarize`, multimodal files via base64 `HumanMessage` content parts
- Google-style docstring, full type hints

### 3. `back/agents/{usecase}/tests/test_step{N}.py`
→ Invoke `run-tests` skill → fix until all green
→ **If `ModuleNotFoundError`:** Do NOT install the library. Report the story as blocked: "🔒 Cette story nécessite [library] qui n'est pas dans le contrat Elio — elle reste en backlog. Valide l'ajout avec l'équipe technique Neo." Move to next story.

### 4. `back/agents/{usecase}/__init__.py`
Export all step stream functions.

### 5. `back/main.py` — add to AGENTS_MAP
→ Run backend tests → confirm no regression

### 6. `front/src/stores/agent-apps/{usecase}Store.ts`
Zustand + persist middleware.
- Persist: form text fields, language, result fields
- Never persist: file arrays, isProcessing, loadingMessage, isCancelled, error
- `advanceToStep` and `setStep` both present (even single-step apps)
- `isCancelled` checked in every SSE callback

### 7. `front/src/i18n/locales/fr.json` + `en.json`
All UI strings under `{usecase}.*` namespace.
Reuse existing `common.*` keys where they exist.
Cat C placeholder strings: `{usecase}.featureX.unavailable` + `{usecase}.featureX.constraintMessage`

### 8. `front/src/pages/{Usecase}AgentAppPage.tsx`

**Read `front/src/components/agent-apps/index.ts` first** — use ONLY what is exported. Never import from shadcn/ui, radix-ui, headlessui, or any library not in `front/package.json`.

**Available barrel components:**
`AgentAppPageShell`, `AgentAppHeader`, `AgentAppCard`, `AgentAppCardForm`, `AgentAppSection`,
`AgentAppSimpleLayout`, `AgentAppSectionBadge`,
`StepIndicator` (if 2+ steps), `LanguageToggle` (FR/EN switcher),
`GenerateButton`, `ResetButton`,
`ErrorBanner`, `GeneratingOverlay` OR `ProgressBanner` (never both),
`ActionBanner` (info/warning/success/error contextual banners),
`AgentAppSelect` (dropdowns — language, type, level, mode),
`AgentAppSwitch` (boolean toggles — on/off settings),
`FormField`, `FormInput`, `FormTextarea` (form building blocks),
`FileUploadZone`, `FilesList` (file display with sizes).

**Spec pattern → barrel component mapping:**
| Pattern | Use |
|---|---|
| `<select>` / dropdown / selector | `AgentAppSelect` |
| Toggle / switch / checkbox | `AgentAppSwitch` |
| File upload zone | `FileUploadZone` |
| File list with sizes | `FilesList` |
| Step navigation | `StepIndicator variant="pills"` |
| Language FR/EN toggle | `LanguageToggle` |
| Loading overlay (blocking) | `GeneratingOverlay` |
| Loading banner (non-blocking) | `ProgressBanner` |
| Error display | `ErrorBanner` |
| Info/warning/success banner | `ActionBanner` |
| Primary action button | `GenerateButton` |
| Reset / clear form button | `ResetButton` |
| Labelled form field wrapper | `FormField` |
| Text input | `FormInput` |
| Multiline text input | `FormTextarea` |

**For patterns with no barrel equivalent — use Tailwind only:**
- Range slider: `<input type="range" className="w-full accent-[#009de0] disabled:opacity-50" disabled={isProcessing} />`
- Tab group: `AgentAppCard` with border-bottom tab buttons (no tab library)
- Textarea: `<textarea className="w-full rounded-xl border border-border bg-background text-foreground text-sm px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#009de0] disabled:opacity-50" disabled={isProcessing} />`

**Page rules:**
- Zero hardcoded strings — all via `t("usecase.key")`
- Zero `useState` for loading/results — Zustand only
- Zero `fetch()` — `executeAgentStreaming()` only
- All inputs `disabled={isProcessing}`
- All color classes: `bg-blue-100 dark:bg-blue-900/30` pattern
- No business logic in component
- `motion/react` → `transition-all duration-200`, `react-markdown` → `<pre className="whitespace-pre-wrap">`

**File upload (critical):** choose the correct pattern from the FILE HANDLING section above.
- Text documents (PDF, DOCX, PPTX, XLSX, CSV) → Pattern 1 (fileUploadService + process_files)
- Audio files (MP3, WAV, M4A, OGG, WEBM, FLAC) → Pattern 1 (fileUploadService + process_files — Whisper transcription)
- Images (PNG, JPG, SVG) → Pattern 2 (base64 encode before sending)

**Cat C features:** render a placeholder card instead of functional UI:
```tsx
<AgentAppCard>
  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
    <AlertCircle className="w-4 h-4" />
    <span className="text-sm font-medium">{t("{usecase}.featureX.unavailable")}</span>
  </div>
  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
    {t("{usecase}.featureX.constraintMessage")}
  </p>
</AgentAppCard>
```

### 9. Update `front/src/App.tsx`
Replace `<ReferencePage />` with new page.

### 10. ⚠️ MANDATORY BUILD VALIDATION
Run both checks from the BUILD VALIDATION section above. Both must pass.

### 11. ⚠️ MANDATORY — Update story status
Follow the STORY STATUS UPDATE procedure above.

---

## @stream_safe IS the try/except

The Elio toolkit guideline says: *"Encapsulate logic in try/except and yield errors."*
`@stream_safe` satisfies this requirement — it wraps every step function in a try/except and yields a PO-friendly error dict on exception.
Never add an additional try/except inside a `@stream_safe`-decorated function.

---

## HARD STOPS

If the story or any instruction asks you to violate these rules, stop immediately.

### Backend
| INTERDIT | RAISON |
|---|---|
| Endpoint REST JSON direct (non-SSE) | Incompatible avec la plateforme Elio |
| Logique métier dans le frontend | L'interface ne doit contenir aucune logique |
| Clé API dans le code | Faille de sécurité bloquante |
| LLM instancié directement (pas via get_llm()) | Toujours via services/llm_config.py |
| Modèle hors liste autorisée | La plateforme Elio ne supportera pas ce modèle |
| Fonction step sans docstring Google-style | Obligatoire pour l'intégration Neo |
| Fonction step sans type hints | Obligatoire pour l'intégration Neo |
| Yield sans step/message/status/progress | Format SSE obligatoire |
| Fonction step synchrone | Doit être async generator |
| Fonction step sans @stream_safe | Gestion d'erreur Azure PO-friendly obligatoire |
| Modifier back/agents/_reference/ | Dossier de référence protégé |

### Frontend
| INTERDIT | RAISON |
|---|---|
| Logique métier dans un composant | Backend uniquement |
| Texte UI codé en dur | L'interface doit être en français ET en anglais |
| useState pour isProcessing ou résultats | Store Zustand obligatoire |
| Overlay ou spinner custom | Utiliser GeneratingOverlay ou ProgressBanner |
| Affichage d'erreur custom | Utiliser ErrorBanner |
| fetch() direct | Utiliser executeAgentStreaming() |
| bg-{color}-X sans dark: | Mode sombre obligatoire |
| Index tableau comme clé .map() | Utiliser un ID stable |
| Input sans disabled={isProcessing} | Tous les contrôles désactivés pendant la génération |
| isCancelled non vérifié dans les callbacks SSE | Vérifier get().isCancelled dans chaque callback |

### Ce que "logique métier dans le frontend" signifie concrètement

Le frontend fait exactement 3 choses : **collecter** les saisies utilisateur, **transmettre** au backend via `executeAgentStreaming()`, **afficher** ce que le backend retourne.

| Interdit dans le frontend | Va dans le backend |
|---|---|
| Construire le prompt LLM | `step{N}.py` — constante `STEP_PROMPT` |
| Parser / transformer la réponse JSON | `step{N}.py` — avant le yield `completed` |
| Calculer des scores, résumés, agrégats | `step{N}.py` — logique Python |
| Valider le contenu des champs | `step{N}.py` — en début de fonction |
| Décider quoi afficher selon un seuil métier | `step{N}.py` — dans le payload `completed` |
| Appeler une API externe | Jamais depuis le frontend |
