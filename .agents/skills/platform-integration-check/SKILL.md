# Skill: platform-integration-check

Validate the built app against all Elio platform requirements.
Fix every violation before reporting the app as ready.
Update SUBMISSION.md when all checks pass.

> **Run the contract test suite first.** `back/tests/test_elio_contract.py`
> encodes ~18 of the 23 rules as real pytest assertions (all the
> mechanical ones — import banlists, decorator presence, regex
> anti-patterns, shared-types field parity, placeholders in
> SUBMISSION.md, etc.). This skill owns only the rules that genuinely
> need LLM judgment: B3 SSE payload shape, B9 docstring completeness,
> F6 dark-mode pairs, F7 disabled={isProcessing}, F9 editable results.
> Use the **Check Contract** Replit workflow (workflow panel), or run
> `cd back && uv run pytest tests/test_elio_contract.py -v`.
> Fix every red line before this skill is worth running.

---

## Prerequisites

- `build-backend` and `build-frontend` both completed
- Tests pass

---

## Run the checklist

For each item, read the relevant file and verify. Mark ✅ or ❌ with the file path and line if failing.

### Backend (B)

- [ ] **B1 — LLM models** — every `get_llm("...")` call uses a model from `back/services/config_llms.json`. No direct `AzureChatOpenAI()` instantiation anywhere.
- [ ] **B2 — @stream_safe** — every step function (`async def *_stream`) has `@stream_safe` decorator. Check import: `from utils.stream_error_handler import stream_safe`.
- [ ] **B3 — SSE contract** — every `yield` contains `step`, `message`, `status`, `progress`. Final yield has `"status": "completed"` and a `"result"` key.
- [ ] **B4 — AGENTS_MAP** — every step function is registered in `back/main.py` AGENTS_MAP with kebab-case key ending in `-step-N`.
- [ ] **B5 — get_llm()** — `from services.llm_config import get_llm` is the only LLM import. No direct LLM class instantiation.
- [ ] **B6 — Tests** — `uv run pytest agents/{name}/tests/ -v` passes. Minimum 5 tests per step function.
- [ ] **B7 — Bilingual prompts** — `prompt_fr.py` and `prompt_en.py` both exist. No French or English strings hardcoded in step files.
- [ ] **B8 — interface_language** — every step function accepts `interface_language: str = "fr"` and uses `_get_prompts(interface_language)`.
- [ ] **B9 — Docstrings** — every function has a Google-style docstring with Args and Yields sections.
- [ ] **B10 — Protected files** — `back/agents/_reference/` is unmodified. Verify with: check that no _reference files appear in modified files.

### Frontend (F)

- [ ] **F1 — Zustand store** — store uses `persist` with `partialize`. Excluded from partialize: `isProcessing`, `loadingAction`, `isCancelled`, `error`. Verify the store file exists.
- [ ] **F2 — Selectors** — no `const { x, y } = useMyStore()` destructuring. Every state value accessed via individual selector `useMyStore((s) => s.field)`. Actions called via `useMyStore.getState().action()`.
- [ ] **F3 — i18n** — both `fr.json` and `en.json` have all keys for the new namespace. No hardcoded user-facing strings in the page component.
- [ ] **F4 — SSE service** — `executeAgentStreaming` from `@/services/agentService` used. No raw `fetch()` calls.
- [ ] **F5 — Components** — only `@/components/agent-apps` components used for UI. No shadcn/ui, radix, or raw `<input>` / `<textarea>` / `<select>` HTML.
- [ ] **F6 — Dark mode** — every `bg-{color}-50/100/200` has its `dark:bg-{color}-900/20|30|40` pair. Every `text-{color}-600/700` has its `dark:text-{color}-300/400` pair.
- [ ] **F7 — Inputs disabled** — every form control has `disabled={isProcessing}`.
- [ ] **F8 — interface_language** — `interface_language: i18n.language` sent in every SSE payload.
- [ ] **F9 — Editable results** — intermediate LLM results displayed as `FormInput`/`FormTextarea` components (editable), not as static text.
- [ ] **F10 — Protected files** — `front/src/pages/_ReferencePage.tsx` and `front/src/stores/agent-apps/_referenceStore.ts` are unmodified.

### Integration (I)

- [ ] **I1 — API contract match** — routes in `.agents/docs/api-contracts.md` match the registered AGENTS_MAP keys and actual step function signatures.
- [ ] **I2 — Types match** — interfaces in `packages/shared-types/src/index.ts` match the Pydantic models in `back/agents/{name}/models.py` field by field.
- [ ] **I3 — SUBMISSION.md** — sections 1, 2, 3 have real content (not placeholder text).

---

## Fix all ❌ before continuing

For each failing check:
1. State the exact file and line
2. Fix immediately
3. Re-run the check
4. Mark ✅ only when confirmed passing

Apply the fix-retry cap: max 2 attempts per failure. If still failing after 2 attempts, report to user with full context.

---

## Update SUBMISSION.md when all ✅

Fill in:
- **Section 4** (acceptance criteria) — from `backlog.md` acceptance criteria
- **Section 6** (conformity table) — the B1–B10, F1–F10, I1–I3 results

Update `replit.md` — set Build Checkpoint row #6 (`platform-integration-check`) to ✅ with today's date.

---

## Final report to user

```
✅ Vérification plateforme terminée.

Backend  : B1✅ B2✅ B3✅ B4✅ B5✅ B6✅ B7✅ B8✅ B9✅ B10✅
Frontend : F1✅ F2✅ F3✅ F4✅ F5✅ F6✅ F7✅ F8✅ F9✅ F10✅
Intégr.  : I1✅ I2✅ I3✅

SUBMISSION.md mis à jour — sections 4 et 6 complètes.

Ton app est prête pour soumission à l'équipe Elio.
Prochaines étapes :
1. Prends 3 screenshots (écran saisie, génération en cours, résultat final)
2. Ajoute-les dans SUBMISSION.md section 6
3. (Optionnel) Enregistre une démo vidéo de 1-3 minutes
4. Envoie SUBMISSION.md + le code à l'équipe Elio
```
