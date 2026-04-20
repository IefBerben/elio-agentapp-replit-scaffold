# Skill: package-agent

Produce the deployable artifact for the Elio platform: a filled-in
`manifest.md` + a zipped bundle of the consultant's delta on top of the
scaffold.

Invoked **after** `verify-generation` has closed green (which internally runs `platform-integration-check` as its gate 4).

---

## Prerequisites

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

```bash
bash scripts/package.sh
```

The script:
1. Parses `manifest.md` YAML front-matter
2. Validates required fields are non-empty
3. Copies files listed in `package_includes` into `dist/{agent_id}-{version}/`
4. Computes i18n + AGENTS_MAP + shared-types diffs vs the pristine
   scaffold baseline, writes them to `dist/{agent_id}-{version}/patches/`
5. Copies `manifest.md` and `SUBMISSION.md` into the bundle root
6. Zips the result to `dist/{agent_id}-{version}.zip`

---

## Step 3 — Report to the consultant

```
✅ Package prêt : dist/{agent_id}-{version}.zip

Contenu :
- manifest.md              (contrat de déploiement)
- SUBMISSION.md            (dossier de revue)
- back/agents/{name}/      (code backend)
- front/ …                 (page, store, i18n)
- patches/                 (diffs AGENTS_MAP + shared-types + locales)

Prochaines étapes :
1. Vérifie le manifest : cat dist/{agent_id}-{version}/manifest.md
2. Envoie le zip + le lien du Repl à l'équipe Elio (elio@groupeonepoint.com)
```

---

## Notes for the tech team reviewing this proposal

- `manifest.md` is the contract; the bundle is a view of it.
- Diff-based packaging avoids shipping the full scaffold on every submission.
  The deployment target already has the scaffold baseline; it only needs the
  delta + the patch fragments for the three shared files.
- If the platform prefers a full-workspace bundle instead, flip
  `package.sh` to copy `back/`, `front/`, `packages/` verbatim and drop the
  `patches/` step.
- The manifest schema is intentionally minimal. Add fields (rate limits,
  required roles, cost tier, SLA) as the platform grows.
