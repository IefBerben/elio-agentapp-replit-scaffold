---
name: remove-starter
description: Permanently delete the disposable StarterPage from the scaffold. Triggered when the consultant is sure they no longer need the on-ramp.
when_to_invoke:
  - User says "remove the starter page" / "supprime la starter page"
  - User says "clean up the starter" / "nettoie la starter"
when_NOT_to_invoke:
  - User just uploaded product.md (the page is already soft-dismissed by the backend)
  - User asks how to hide the starter — explain soft-dismiss is automatic instead
---

# Skill: remove-starter

Permanently delete the disposable StarterPage from the scaffold and make the consultant's own AgentApp page the default landing.

Use this skill only when the consultant explicitly asks to remove the starter code from their repo, and has a built AgentApp to land on instead.

---

## Prerequisites

Before running, confirm the consultant has a functional AgentApp page at `front/src/pages/<Something>Page.tsx` (not `_ReferencePage.tsx`, not `ShowcasePage.tsx`, not `StarterPage.tsx`). That page's name is what you'll route to.

If they don't, **stop** — the scaffold would land on the Reference page, which is a tutorial, not their app. Ask them to build their app first.

---

## Files to delete

- `front/src/pages/StarterPage.tsx`

---

## Code to edit

### `back/main.py`
1. Remove the five starter routes:
   - `GET /agent-apps/scaffold-status`
   - `POST /agent-apps/upload-spec`
   - `POST /agent-apps/upload-prototype`
   - `POST /agent-apps/save-spec-text`
2. Remove the helpers `_spec_status`, `_validate_spec_content`, `_input_files`, the model `SaveSpecTextRequest`, the constants `_ALLOWED_SPEC_NAMES`, `_ALLOWED_PROTOTYPE_SUFFIXES`, `_PRODUCT_REQUIRED_SECTIONS`, `_BACKLOG_REQUIRED_SECTIONS`, the startup helper `_check_spec_files`, and the path constants `PRODUCT_MD_PATH`, `BACKLOG_MD_PATH`, `INPUT_DIR`. Note: keep `REPO_ROOT` if any production agent code relies on it.

### `front/src/App.tsx`
1. Remove the import: `import { StarterPage } from "@/pages/StarterPage";`
2. Remove `"starter"` from the `Page` type.
3. Remove the `"starter"` entry from the `items` array in `ScaffoldTopBar`.
4. Remove the `"starter"` branch in `readPageFromHash` and update the default return to the consultant's page id (e.g. `"my-agent"`).
5. Remove the `page === "starter" && <StarterPage />` line.
6. Add an import + render branch for the consultant's page.

### `front/src/i18n/locales/fr.json` and `en.json`
- Remove the `"starter"` namespace from both files.

---

## Procedure

1. **Confirm with the user** before deleting. Show them the file list and ask: *"Tu confirmes la suppression définitive de la starter page ? Tout est récupérable via git si tu changes d'avis. L'app `<MyAgentPage>` deviendra la page par défaut."*
2. **Make the edits** in this exact order: backend first (`main.py`), then frontend (`App.tsx` + delete `StarterPage.tsx`), then i18n.
3. **Show the diff** for `back/main.py` and `front/src/App.tsx` (the two files that are *edited* rather than deleted).
4. **Run the tests** to confirm nothing else depended on the starter:
   ```bash
   cd back && uv run pytest -v
   cd ../front && npm run typecheck
   ```
5. **Report** to the user with the list of removed files and the test results.

---

## After removal

The consultant's project is now slimmer. The next time they click Run, the app loads directly on `/reference` (or whichever page they have routed `/` to in `App.tsx`).

If the consultant wants the starter back, they can `git checkout` the deleted files — but in practice, by the time they ask for hard-delete, they've already moved on.
