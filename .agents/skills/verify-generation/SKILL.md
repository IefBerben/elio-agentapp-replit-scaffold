---
name: verify-generation
description: Machine-verify a freshly built AgentApp before handing it back to the consultant. Runs five gates — backend tests, frontend build+tests, wiring, platform conformity, SSE smoke — and repairs failures in-session.
when_to_invoke:
  - Automatically at the end of every `build-backend` + `build-frontend` run, before reporting "done" to the consultant
  - User says "verify the app" / "vérifie l'app"
  - User says "is the generation actually working?" / "est-ce que ça tourne vraiment ?"
when_NOT_to_invoke:
  - No agent has been built yet (only `_reference` in registered_apps.py) — tell the user to build first
  - User is still iterating on `backlog.md` — verification is a post-build gate, not a review tool
---

# Skill: verify-generation

Turn the Builder's "done" from self-reported into machine-checked.

The Builder reports success based on its own closing template. This skill runs five bounded gates against the actual repo state and only lets the Builder declare done when all five are green.

---

## Principles

- **Stop on first failure within a gate.** Fix it, re-run the gate, move on.
- **Bounded repair.** Max 3 repair loops per gate. After that, surface the remaining failures to the consultant as a checklist — never pretend success.
- **Stay inside the Elio coding contract.** Pytest only on the backend (no ruff/mypy). TypeScript + vitest on the frontend. Conformity handled by `platform-integration-check`.
- **No refactors during repair.** Repair edits must target the specific failure. If a fix needs broader changes, stop and ask.

---

## The five gates

Run in this exact order. A failing gate blocks the rest.

### Gate 1 — Backend tests

Use the **Test Backend** Replit workflow (workflow panel), or run `cd back && uv run pytest -v`.

Pass criteria: every test passes and the new agent's `tests/` folder has at least 5 tests (B6 of the coding contract).

On failure: open the failing test, read the traceback, fix the offending file, re-run `pytest`. Repeat up to 3 times.

### Gate 2 — Frontend build + tests

```bash
cd front && npm run build
cd front && npm run test
```

`npm run build` is `tsc && vite build` — catches type errors, missing imports, broken routes, JSX issues. `npm run test` runs vitest.

On failure: read the tsc/vite error (file:line), fix the exact location, re-run. Repeat up to 3 times.

### Gate 3 — Wiring check

Grep-based, no LLM judgment:

- Every new `DeclarativeAgentApp` subclass in `back/agents/<name>/app.py` is imported and registered in `back/registered_apps.py`.
- Every new page in `front/src/pages/` (not `StarterPage`, `ShowcasePage`, `_ReferencePage`) is imported in `front/src/App.tsx` and has a render branch in the page switcher.
- Every new Zustand store in `front/src/stores/agent-apps/` is used by at least one component.

Concrete commands:
```bash
grep -rE '^class [A-Z][a-zA-Z]+\(DeclarativeAgentApp\)' back/agents/ --include='*.py' | grep -v _reference
grep -E 'from agents\.' back/registered_apps.py
grep -E 'import.*from "@/pages' front/src/App.tsx
ls front/src/pages/*.tsx
```

On failure: add the missing import + registration. No retry loop — this is a one-shot fix.

### Gate 4 — Platform conformity

Two sub-gates, in order. The first is mechanical and cheap; only run the second if the first is green.

**4a — Contract test suite (machine-graded):**

Use the **Check Contract** Replit workflow (workflow panel), or run `cd back && uv run pytest tests/test_elio_contract.py -v`.

This encodes ~18 of the 23 B/F/I rules as real pytest assertions (the mechanically checkable ones — import banlists, AST decorator presence, file existence, regex-based anti-patterns, shared-types field parity, etc.). Failures cite file:line and the exact rule ID (e.g. `B7 violations: back/agents/my-app/step1.py:120 — hardcoded UI string "Terminé !"; move to prompt_fr/en.py`). Feed failures back to the Builder for repair, max 3 attempts per failing test.

**4b — LLM-judged rules (platform-integration-check skill):**

Invoke the `platform-integration-check` skill. It covers the remaining rules that need judgment: B3 (SSE payload shape across all yields), B9 (docstring completeness), F6 (dark-mode color pairs), F7 (disabled={isProcessing} on every control), F9 (intermediate results are editable). The skill also owns `SUBMISSION.md` sections 4 and 6.

Pass criteria: 4a exits 0 AND 4b reports all 23 checks ✅.

On failure in 4b: fix per the skill's own retry policy (max 2 attempts per rule). Remaining red lines propagate to the final report.

### Gate 5 — SSE smoke

For each new app registered in `back/registered_apps.py` (keys not starting with `_`):

1. Check `http://localhost:8000/` with a 2-second timeout. If it responds, use it.
2. If not reachable, start a transient backend:
   ```bash
   cd back && uv run uvicorn main:app --port 8001 &
   ```
   Wait up to 10 seconds for `http://localhost:8001/` to respond, then use it.
3. POST a minimal payload to `/agent-apps/execute/{app_id}/{step_id}/stream` (use the first `@step` method's id) with:
   ```json
   {"username": "verify", "prompt": "smoke test", "interface_language": "fr"}
   ```
4. Assert:
   - First SSE event arrives within 5 seconds
   - Stream closes cleanly (final event has `"status": "completed"` or `"status": "error"` — errors from the LLM are acceptable; crashes are not)
   - No 5xx response
5. If you started a transient backend, stop it.

On failure: read the backend logs, fix the crash (missing import, wrong field, bad registration), re-run the smoke. Repeat up to 3 times.

---

## Repair loop rules

- Repair edits target the **specific failure**. Don't "clean up" adjacent code.
- After each repair, re-run **only the failing gate**, not all five.
- Counter resets per gate. 3 strikes on gate 2 does not shorten gate 5.
- If the same file fails the same gate twice with the same error, stop trying — you're in a loop. Escalate to the consultant.

---

## Final report

When all five gates are green, update `replit.md` Build Checkpoint row #5 (`verify-generation`) to ✅ with today's date before reporting to the consultant.

Template:

```
✅ Vérification génération — 5 gates

Gate 1 — Backend tests    : ✅ 12 tests passed
Gate 2 — Frontend build   : ✅ tsc clean, vite build clean, 4 tests passed
Gate 3 — Wiring           : ✅ 2 agents registered, 1 page wired, 1 store wired
Gate 4 — Plateforme       : ✅ B1-B10 F1-F10 I1-I3 all green
Gate 5 — Smoke SSE        : ✅ my-usecase-step-1 streamed cleanly in 1.2s

Temps total : 2m 14s
Tokens de réparation : 0 (aucune passe corrective nécessaire)

L'app est prête pour itération ou soumission.
```

On partial failure:

```
⚠️  Vérification génération — 2 échecs après réparation

Gate 1 — Backend tests    : ✅
Gate 2 — Frontend build   : ❌ front/src/pages/MyPage.tsx:47 — Type 'string' is not assignable to 'number'
Gate 3 — Wiring           : ✅
Gate 4 — Plateforme       : ⚠️  F6 dark mode pair manquant sur 3 classes (cf. log)
Gate 5 — Smoke SSE        : skipped (gate 2 failing)

J'ai tenté 3 passes de réparation sur gate 2 sans succès. Regarde le type
de `count` dans ton store — il est typé `number` mais la page l'utilise
comme string. Dis-moi si je retente avec une correction plus large.
```

Never claim the app is "done" with a red gate. Surfacing failures honestly is the whole point of this skill.

---

## Cost expectations

- Typical clean run: ~90-180 seconds, negligible tokens.
- With repair: +60-120 seconds per failed gate, +2-5k tokens per repair pass.
- If you're hitting the 3-strike cap on any gate, something is structurally wrong — stop repairing, ask.
