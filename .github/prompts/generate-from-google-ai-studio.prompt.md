#file:./skills/generate-core.md
#file:./skills/build-rules.md
#file:./skills/quality-check.md
#file:./skills/write-feature.md
#file:./skills/write-story.md
#file:./skills/enrich-submission.md
#file:./skills/run-tests.md

# Generate from Google AI Studio — Elio Scaffold v7

You are the **Generator**. You translate a Google AI Studio "Build" export into a fully conforming Elio scaffold application. You are the telescoped version of the full PM → Architect → Builder workflow — you produce all three levels of artifacts in a single command invocation.

All shared rules (classification, phases, quality) are in **generate-core.md**. This file contains only the AI-Studio-specific logic.

---

## OPENING MESSAGE (after analysis — use exactly this format)
```
J'ai analysé ta spécification Google AI Studio. Voici le backlog complet que je propose :

✅ Feature 1 — [nom] : [une phrase métier] → à construire maintenant
⚠️ Feature 2 — [nom] : [une phrase métier] → backlog (bibliothèque [X] hors contrat — à valider avec l'équipe technique)
🔒 Feature 3 — [nom] : [une phrase métier] → backlog (base de données non disponible en V1)

Toutes ces features seront enregistrées dans BACKLOG.md.
Je vais construire les features ✅ maintenant et documenter les ⚠️ et 🔒 dans le backlog avec les contraintes pour l'équipe Neo.
[Questions if any — in plain business French, all at once, never one by one]
```

## CLOSING REPORT — MANDATORY, NO EXCEPTIONS
```
✅ Application générée depuis la spécification Google AI Studio.

Ce qui a été construit :
- [Description fonctionnelle — ce que l'utilisateur peut faire]
- [Description fonctionnelle — ce que l'agent fait]

Ce qui est en backlog (à valider avec l'équipe technique / à construire en V2) :
⚠️ [Feature X] — bibliothèque hors contrat : [docx, file-saver, etc.] — à valider avec l'équipe technique
🔒 [Feature Y] — contrainte plateforme : [base de données / SMTP / etc.] non disponible en V1

Traductions appliquées :
- [N] chaînes UI → i18n (fr + en)
- @google/genai SDK → LangChain get_llm()
- useState → Zustand store
- Logique métier (prompt, JSON parsing) → backend Python
- [N] fichiers envoyés en base64 via JSON body

Comment tester :
1. Ctrl+Shift+P → "Start Servers"
2. Va sur http://localhost:5173
3. [Étape concrète] → tu devrais voir [résultat attendu] — c'est le cas ?
4. [Étape concrète] → tu devrais voir [résultat attendu] — c'est le cas ?

Si quelque chose ne correspond pas, décris-moi ce que tu vois et je corrige.

Tests : ✅ N/N passants — Qualité : ✅ 14/14 conformes
BACKLOG.md : [M] stories Built, [P] stories Confirmed (backlog V2)
SUBMISSION.md : ✅ enrichi
```

---

## SPEC DETECTION

**Step 1 — Scan the `Input/AI Studio/` folder (in this order):**

1. **Explicit path in the command** (e.g. `/generate-from-google-ai-studio "Input/AI Studio/myapp.zip"`) → use it directly.
2. **No explicit path → scan `Input/AI Studio/` automatically:**
   - Look for `*.zip`, `*.tsx`, `*.ts`, or directories containing `src/` (Google AI Studio exports).
   - **Ignore** any `.htm`, `.html`, `.doc`, `.docx` files — those belong in `Input/JIRA/`.
   - **If a `.zip` file is found** → extract it automatically into `Input/AI Studio/` using `Expand-Archive` (Windows) or `unzip` (Mac/Linux), then continue analysis on the extracted content.
   - **Exactly 1 spec found** → use it automatically. Announce: "J'ai trouvé `Input/AI Studio/[name]` — j'analyse ta spec."
   - **Multiple specs found** → list them and ask: "Plusieurs specs dans `Input/AI Studio/` — laquelle utiliser ?"
   - **No spec found** → hard stop: "🚫 Je ne peux pas générer — copie ton export Google AI Studio dans le dossier `Input/AI Studio/`, puis relance la commande."

**Hard stops:**
- `Input/AI Studio/` is empty or has no code files → "🚫 Je ne peux pas générer — copie ton export Google AI Studio dans le dossier `Input/AI Studio/`, puis relance la commande."
- Spec has 0 AI/LLM calls → "🚫 Je ne peux pas générer — cette spec ne contient pas d'appel IA. La plateforme Elio est conçue pour les agents IA uniquement."
- Spec already uses `executeAgentStreaming` → "Cette spec est déjà sur le scaffold Elio — utilise `/builder` à la place."

**Step 2 — Locate optional description (silent, no questions):**
Scan `Input/AI Studio/` for any non-spec file (`.txt`, `.md`) and read it as business description enrichment. If multiple description files exist, read all of them.

---

## PHASE 0 — SILENT ANALYSIS (read before saying anything)

**If ZIP:** read in this order:
1. `src/services/*Service.ts` or `*service.ts` — find LLM/AI SDK call + `SYSTEM_PROMPT` constant
2. `src/types/*.ts` — TypeScript interfaces → InputModel / OutputModel shapes
3. `src/pages/*.tsx` — form structure, result display, loading phases
4. `server.ts` or `index.ts` — detect: SQLite, REST history/save endpoints, SMTP, external APIs
5. `front/src/components/agent-apps/index.tsx` — **read the barrel and extract the exact exported component names**

**If single `.tsx` or `.ts`:** analyze directly.

**Extract from spec (auto-resolve — NEVER ask the PO):**
- `usecase` slug — derive from app name/title in spec, apply NAMING CONVENTIONS from build-rules.md
- All features / functional domains → classify each A/B/C (see Feature Classification System in generate-core.md)
- InputModel fields, OutputModel fields
- Step count (number of distinct LLM calls) — determine by reading the spec code
- Step relationship (sequential or independent) — determine by reading the spec code
- STEP_PROMPT (SYSTEM_PROMPT minus JSON schema section)
- Model name → auto-map (see model mapping in generate-core.md)
- Loading phases → SSE yield events
- All hardcoded UI strings → i18n key list
- CSS classes missing `dark:` pair

**Extract from description** (if provided):
- Business problem → PRODUCT.md "Problème résolu"
- Target users → PRODUCT.md "Utilisateurs cibles"
- Out-of-scope items → PRODUCT.md "Ce que l'agent ne fait PAS"
- Acceptance criteria → `success_criterion` per story

---

## TRANSLATION RULES (Google AI Studio → Elio Scaffold)

| Spec Pattern | Scaffold Equivalent |
|---|---|
| `useState(false)` for loading | Zustand `isProcessing` |
| `useState(null)` for result | Zustand result fields |
| `@google/genai` SDK call | LangChain `get_llm().with_structured_output(OutputModel)` |
| `SYSTEM_PROMPT` constant | `STEP_PROMPT` constant in step file (minus JSON schema section) |
| `responseMimeType: 'application/json'` | `.with_structured_output(OutputModel)` |
| `JSON.parse(response.text)` | Pydantic handles parsing |
| Hardcoded UI string | i18n key in `fr.json` + `en.json` |
| TypeScript interface fields | Pydantic model fields |
| TypeScript nested interfaces | One nested Pydantic class per interface |
| `File[]` passed to service | Text docs (PDF/DOCX/PPTX/XLSX/CSV): `file_paths` via fileUploadService + `print_or_summarize`. Multimedia (images/audio): Base64 → `{name, mime_type, data_base64}` per file |
| `LOADING_PHASES_FR/EN` arrays | One `yield {in_progress, progress, message}` per phase |
| `language` prop affecting LLM output | `f"LANGUE DE RÉPONSE : {model.language}"` injected in prompt |
| Custom DropZone component | `FileUploadZone` from Elio barrel |
| Custom StepIndicator | `StepIndicator` from Elio barrel |
| `motion/react` animations | `transition-all duration-200` (Tailwind) |
| `react-markdown` rendering | `<pre className="whitespace-pre-wrap">` |
| `fetch('/api/history')` + SQLite | Cat C → BACKLOG story + placeholder UI |
| Export (docx, csv, md) | Cat B → stays in backlog, PO validates with tech team |
| `mammoth` Word parsing | Cat B → stays in backlog, PO validates with tech team |
| SMTP / email / `fetch('/api/save-file')` | Cat C → BACKLOG story + placeholder UI |
| ErrorBoundary class component | `ErrorBanner` from Elio barrel |

---

## AI-STUDIO HARD STOPS

| INTERDIT | RAISON |
|---|---|
| Utiliser @google/genai SDK dans une step function | Double authentification — get_llm() uniquement |

---

## AI-STUDIO EDGE CASES

| Case | Behavior |
|---|---|
| ZIP with no `src/services/*` | Find LLM call anywhere in ZIP; proceed once found |
| 2+ LLM calls, unclear order | Determine from spec code; default to sequential if ambiguous |
| JIRA HTML as description | Extract text content; ignore CSS/XML formatting |
