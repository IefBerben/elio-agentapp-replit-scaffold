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

Permanently delete the disposable starter from the scaffold. This is the **hard delete** — the soft-dismiss (writing `.starter-dismissed`) is already handled automatically by the StarterPage once product.md is dropped.

Use this skill only when the consultant explicitly asks to remove the starter code from their repo.

---

## Files to delete

**Frontend:**
- `front/src/pages/StarterPage.tsx`

**Marker (if present):**
- `.starter-dismissed` (at repo root)

---

## Code to edit

### `back/main.py`
1. Remove the five starter routes:
   - `GET /agent-apps/scaffold-status`
   - `POST /agent-apps/upload-spec`
   - `POST /agent-apps/upload-prototype`
   - `POST /agent-apps/dismiss-starter`
   - `POST /agent-apps/restore-starter`
2. Remove the helpers `_product_md_status`, `_input_files`, the constants `_ALLOWED_SPEC_NAMES`, `_ALLOWED_PROTOTYPE_SUFFIXES`, and the related path constants `REPO_ROOT`, `STARTER_DISMISSED_MARKER`, `PRODUCT_MD_PATH`, `INPUT_DIR`. Note: if any production agent code relies on `REPO_ROOT`, keep that constant — only remove what the starter introduced.

### `front/src/App.tsx`
1. Remove the import: `import { StarterPage } from "@/pages/StarterPage";`
2. Remove the "starter" entry from `Page` type, `Nav` items, `readPageFromHash` switch, and the render branch.
3. Remove the `dismissed` state + the `useEffect` that fetches `/agent-apps/scaffold-status`.
4. Set the default page to `"reference"`.

### `front/src/i18n/locales/fr.json` and `en.json`
- Remove the `"starter"` namespace from both files.

---

## Procedure

1. **Confirm with the user** before deleting. Show them the file list and ask: *"Tu confirmes la suppression définitive de la starter page ? Tout est récupérable via git si tu changes d'avis."*
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
