# Generate Core — Shared Generator Logic (Elio Scaffold v7)

This file is referenced by `/generate-from-google-ai-studio`, `/generate-from-jira`, `/generate-from-jira-and-ai-studio`, and `/builder`. It contains all shared generation rules, phases, and constraints. **Do not duplicate this content — always reference this file.**

---

## CORE PRINCIPLE

**Nothing from the spec is dropped.** Every feature in the spec gets a proper BACKLOG entry. Features that cannot be built immediately (platform constraints, missing libraries) are documented with clear warnings. The PO's full vision is captured. Only the BUILD scope differs.

---

## COMMUNICATION STYLE — ALWAYS FOLLOW THIS

- **Feature inventory always comes first** — before any questions, before the plan
- **Three categories, three icons** — ✅ / ⚠️ / 🔒 — always consistent
- **Questions are about business ambiguity only** — never technical, never about dropping features
- **Zero jargon in questions** — the PO is non-technical. Never write "slug", "JSON", "LLM", "SSE", "séquentiel", "appel API", or any developer term in a question
- **"Feature is in backlog"** is different from **"feature is out of scope"** — say backlog, never out of scope
- **Closing report always lists** what was built AND what is in backlog V2
- **Hard stop always starts with** "🚫 Je ne peux pas générer —"

---

## YOUR DOCUMENTS

- **PRODUCT.md** — you write (PM role) from spec intent + description. Mark uncertain sections `*À préciser avec /product-manager*`
- **BACKLOG.md** — you write ALL features (Architect role) + ALL stories (Builder role), including ⚠️ and 🔒
- **Code files** — backend + frontend (Builder role) for Cat A stories only
- **SUBMISSION.md** — all 6 sections

After generation, the PO can continue with `/product-manager` to refine the vision, `/architect` to adjust features, and `/builder` for Cat C stories when the platform enables them.

---

## FEATURE CLASSIFICATION SYSTEM

Classify every spec feature before showing anything to the PO.

| Category | Icon | Meaning | BACKLOG treatment | Code built? |
|---|---|---|---|---|
| A | ✅ | Maps cleanly to scaffold toolkit | Full story, Confirmed → Built | Yes |
| B | ⚠️ | Needs library not in the Elio contract | Full story + `⚠️ Bibliothèque requise` block — stays Confirmed | No — PO validates with tech team first |
| C | 🔒 | Requires platform capability not in Elio V1 | Full story + `⚠️ Contrainte plateforme` block — stays Confirmed | No — needs platform evolution |

**Typical classifications:**
| Feature type | Category |
|---|---|
| Core LLM generation | A |
| File upload for text extraction (PDF, DOCX, PPTX, XLSX, CSV) — via fileUploadService + process_files | A |
| File upload for multimodal LLM (images — base64) | A |
| Audio file transcription (MP3, WAV, M4A, OGG, etc. — Whisper via process_files) | A |
| Language / type / level / config selectors | A |
| Inline result editing (pure frontend state, no API) | A |
| Export to DOCX / PPTX (via generate_files service) | A |
| Word/PPTX file parsing (via process_files) | A |
| Export to CSV / Markdown download | A |
| History panel / CRUD (SQLite, database) | C |
| SMTP / email sending | C |
| Server-side file writes (`/api/save-file`) | C |
| External REST API beyond the LLM | C (or B depending on the API) |

---

## PHASE 1 — FEATURE INVENTORY + QUESTIONS (≤3)

Show the full inventory first. Then ask blocking questions — all at once, never one by one.

**Question pool** — only BUSINESS questions the PO can answer, max 3:
- **Q-name**: app name is unclear from the spec → "Quel nom donner à cet agent ? (ex: 'Mon Assistant RH', 'Compte-Rendu Express')"
- **Q-output**: result is a single text blob, unclear how to display → "Le résultat doit-il être un seul bloc de texte, ou découpé en sections (synthèse, détail, actions…) ?"
- **Q-priority**: multiple features, unclear which matters most → "Quelle est la feature la plus importante pour toi si je dois en prioriser une ?"

**Grey area decisions — batch, don't ask one by one:**
When you face micro-decisions (default language, sort order, display format, optional fields), resolve them yourself and present them as a batch in Phase 2. Use a table format:
```
Décisions que j'ai prises (dis-moi si tu veux changer quelque chose) :
| # | Décision | Mon choix |
|---|----------|-----------|
| 1 | Langue par défaut | Français |
| 2 | ... | ... |
```
The PO can "accept all" or change individual rows. Never ask these one by one.

**Auto-resolve silently (NEVER ask the PO):**
- Slug / identifier → derive from spec name or app title, apply naming conventions
- Number of steps → read the spec code or infer from business description
- Sequential vs parallel → determine from call structure or default to sequential
- Model name → auto-map (see table below) or use default
- Technical patterns (JSON, SSE, base64) → resolve from spec code or scaffold conventions

**Never ask:** whether to drop a feature. Never ask about the model. Never ask about "scope". Never ask anything requiring technical knowledge.

**Model mapping — auto-apply without asking:**
| Spec model | Elio equivalent |
|---|---|
| `gemini-2.5-pro`, `gemini-3.*` | `gpt-4.1` |
| `gemini-2.5-flash`, `gemini-2.0-flash*` | `gpt-4.1-mini` |
| `gpt-4*`, `gpt-4.1*` | `gpt-4.1` |
| `gpt-4*-mini`, `gpt-3.5*` | `gpt-4.1-mini` |
| `gpt-5*` | `gpt-5.1` |
| `gpt-5.1*` | `gpt-5.1` |
| `gpt-5*-mini` | `gpt-5-mini` |
| `o3*` | `o3` |
| `o4-mini*` | `o3` |
| `mistral-large*`, `claude*` | `gpt-4.1` |
| Other / unknown / not specified | `gpt-4.1-mini` — state assumption |

Allowed models (must match `back/services/config_llms.json` deployments): `gpt-5.1`, `gpt-5-mini`, `gpt-4.1`, `gpt-4.1-mini`, `o3`
To add a model, the PO must first add it to `config_llms.json`.

---

## PHASE 2 — PLAN PRESENTATION (soft gate)

```
Voici ce qui va être généré :

Agent : [usecase display name] — [une phrase métier]
Features : [N] identifiées — [M] à construire, [P] en backlog V2

Fichiers backend : back/agents/{usecase}/ [list files]
Fichiers frontend : front/src/ [list files]
Documents : PRODUCT.md, BACKLOG.md ([N] features, [X] stories), SUBMISSION.md

[If Cat B]: ⚠️ Stories en backlog — bibliothèque hors contrat : [python-docx, etc.] — à valider avec l'équipe technique
[If Cat C]: 🔒 Stories en backlog — contrainte plateforme : [feature names]

Je génère maintenant — sans interruption jusqu'au rapport final.
```

---

## PHASE 3 — BACKLOG GENERATION (no code yet)

**Write ALL documents before touching any code file. This is a hard boundary.**

### Step 1 — Write `PRODUCT.md` (PM-level)
Structure: Problème résolu | Utilisateurs cibles | Ce que l'agent fait | Ce qu'il ne fait PAS | Critère de succès.
Use description if provided. Mark uncertain sections `*À préciser avec /product-manager*`.
Cat C features → "Ce que l'agent ne fait PAS (en V1)" with a note they are in BACKLOG for V2.

### Step 2 — Write ALL features to BACKLOG.md (Architect-level)
→ Invoke `write-feature` skill for EACH feature — Cat A, B, and C.
One feature per functional domain (not one per LLM call).
**A feature is a business domain. Stories are the user scenarios inside it. Never create a 1:1 mapping.**

### Step 3 — Decompose ALL features into stories, write ALL stories to BACKLOG.md (Builder-level)

Use the **STORY DECOMPOSITION** rules from build-rules.md. Decompose until full functional coverage — never 1:1.
Each story must have **Gherkin acceptance criteria** (GIVEN/WHEN/THEN).
Cat B and C features still get decomposed into stories (they stay `Confirmed` with constraint block).

→ Invoke `write-story` skill for each story.

**Cat B stories:** append this constraint block:
```
> **⚠️ Bibliothèque requise :** Cette story nécessite [e.g. "python-docx"]
> qui n'est pas dans le contrat de développement Elio.
> **Pour débloquer :** valide l'ajout de cette bibliothèque avec l'équipe technique Neo.
> **À reprendre :** ouvre `/builder` quand la bibliothèque est approuvée.
```

**Cat C stories:** append this constraint block:
```
> **⚠️ Contrainte plateforme :** Cette story nécessite [e.g. "un service de base de données persistante"]
> qui n'est pas disponible dans le contrat de développement Elio V1.
> **Pour débloquer :** [What the Neo/platform team must provide]
> **À reprendre :** ouvre `/builder` quand la contrainte est levée.
```

### 🚫 HARD GATE — STOP before any code

**STOP. Re-read BACKLOG.md in full.** Verify:
- Every feature has stories with acceptance criteria
- Every story has GIVEN/WHEN/THEN criteria
- List the total count: "[N] features, [M] stories written to BACKLOG.md"

**Do NOT create any code file until this gate is passed. The backlog is the contract that drives all code generation.**

---

## PHASE 4 — CODE GENERATION (from the backlog)

**Re-read BACKLOG.md fresh before each story** — do NOT rely on your Phase 3 reading. Find all stories with `Statut : Confirmed` that have NO `⚠️ Bibliothèque requise` and NO `⚠️ Contrainte plateforme` block.
Build them in sequence using the **FILE CREATION ORDER** from build-rules.md.

**The story in BACKLOG.md is the contract. The spec is only a reference for prompts and loading phases.**

---

## PHASE 5 — FINALIZATION (once, after ALL stories are built)

**Re-read BACKLOG.md.** Confirm all Cat A stories show `Statut : Built`. Then:

### Step 1 — Invoke `quality-check` skill
Fix all ❌ before continuing. Never mark Built with a ❌.

### Step 2 — Verify BACKLOG.md statuses (final sweep)
Re-read BACKLOG.md. Verify EVERY Cat A story shows `Statut : Built`. Fix any missed. Cat B/C stories stay `Confirmed`.
If a summary table (Résumé) exists, verify every row matches.

### Step 3 — Invoke `enrich-submission` skill
For each **Built** story only.

### Step 4 — Write SUBMISSION.md
- Sections 1-3: from PRODUCT.md (mark with `*Généré depuis spec — à valider avec /product-manager*`)
- Section 4: what was translated or inferred, what is deferred and why
- Sections 5-6: from `enrich-submission` outputs

### Step 5 — Deliver mandatory closing report
Use the closing report template from the variant prompt (each variant has its own format).

---

## UNIVERSAL HARD STOPS

| INTERDIT | RAISON |
|---|---|
| Supprimer une feature de la spec sans entrée BACKLOG | Toutes les features restent dans le backlog |
| Demander au PO s'il veut supprimer une feature | C'est la vision du PO — pas à décider ici |
| Construire une story Cat C (DB, SMTP, filesystem) | Contrainte plateforme — backlog uniquement |
| Passer des File objects à executeAgentStreaming | JSON body ne supporte pas les File objects |

---

## UNIVERSAL EDGE CASES

| Case | Behavior |
|---|---|
| No description provided | Infer all PRODUCT.md fields; mark uncertain sections |
| Feature entirely Cat C | Write story + constraint block; skip all code for it |
| Model not in allowed list | Auto-map; state assumption |
| Audio/video files | `FileUploadZone` + note model must support multimodal |
| Bilingual spec (FR+EN arrays) | Map both arrays directly to fr.json + en.json |

---

## CONTEXT

This command reads `back/agents/_reference/` for technical patterns — it never modifies it.
The `_reference` folder and `_ReferencePage.tsx` are protected. They never appear in generated BACKLOG.md.
