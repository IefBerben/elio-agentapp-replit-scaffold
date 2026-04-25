# Skill: package-agent

Produce the deployable artifact for the Elio platform: a filled-in
`manifest.md` + a zipped bundle of the consultant's delta on top of the
scaffold.

Invoked **after** `verify-generation` has closed green (which internally runs `platform-integration-check` as its gate 4).

---

## Prerequisites

- `replit.md` Build Checkpoints rows #5 (`verify-generation`) and #6 (`platform-integration-check`) are both ✅ — if either is ⬜, stop and tell the consultant to run that skill first
- `verify-generation` returned all five gates green
- `SUBMISSION.md` sections 4 and 6 are filled (written by `platform-integration-check`)
- `replit.md` has the agent's kebab id, models used, and feature flags

---

## Step 1 — Fill `manifest.md`

Open `manifest.md` at the repo root. Populate every field by reading
authoritative sources:

| Field | Source |
|-------|--------|
| `agent_id`, `endpoints[].key` | `back/main.py` AGENTS_MAP |
| `endpoints[].module` + `function` | import lines in `back/main.py` |
| `display_name`, `description` | `product.md` |
| `author.email` | ask the consultant if missing from `replit.md` |
| `models` | grep `get_llm(` in `back/agents/{name}/` |
| `features.file_upload` | does the agent import `process_files`? which extensions? |
| `features.doc_generation` | does the agent import `generate_files`? which format? |
| `frontend.page` / `store` / `route` | `front/src/pages/`, `front/src/stores/agent-apps/`, React Router config |
| `frontend.i18n_namespace` | top-level key added to `front/src/i18n/locales/fr.json` |
| `shared_types` | new exports in `packages/shared-types/src/index.ts` |
| `scaffold_version` | `SCAFFOLD_VERSION` file |

Never leave a `""` in a required field. If you cannot derive a value,
ask the consultant.

Resolve the `{agent_id_snake}` / `{AgentIdPascal}` / `{agentIdCamel}`
placeholders in `package_includes` to concrete paths before packaging.

---

## Step 2 — Run the package script

Use the **Package** Replit workflow (workflow panel), or run `bash scripts/package.sh`.

The script:
1. Parses `manifest.md` YAML front-matter
2. Validates required fields are non-empty
3. Copies the **full workspace** into `dist/{agent_id}-{version}/` using rsync, excluding:
   - `.git/`, `.claude/`, `dist/`
   - `node_modules/`, `front/dist/`, `front/.vite/`
   - `back/.venv/`, `back/tempfiles/`, `back/.env`
   - `__pycache__/`, `*.pyc`
4. Zips the result to `dist/{agent_id}-{version}.zip`

The bundle is **standalone** — no scaffold baseline required on the target.

---

## Step 3 — Report to the consultant

```
✅ Package prêt : dist/{agent_id}-{version}.zip

Contenu :
- manifest.md + SUBMISSION.md
- back/               (backend complet)
- front/              (frontend complet)
- packages/           (shared types)
- .replit + replit.nix (config Replit)
- product.md + backlog.md

Prochaines étapes :
1. Vérifie le manifest : cat dist/{agent_id}-{version}/manifest.md
2. Envoie le zip + le lien du Repl à l'équipe Elio (elio@groupeonepoint.com)
```

**Update `replit.md` Build Checkpoints:** set row #7 (`package-agent`) to ✅ and fill the Date column with today's date.

---

## Notes for the tech team reviewing this proposal

- `manifest.md` is the contract; the bundle is a view of it.
- Full-workspace bundling means the zip is self-contained — unzip on any machine with Replit or a compatible Node/Python env and it runs without a pre-installed scaffold baseline.
- If the platform later moves to a delta-based deployment (baseline already present on target), flip `package.sh` back to copying only `package_includes` and computing patches for the three shared files (`AGENTS_MAP`, `shared-types`, `locales`).
- The manifest schema is intentionally minimal. Add fields (rate limits, required roles, cost tier, SLA) as the platform grows.
