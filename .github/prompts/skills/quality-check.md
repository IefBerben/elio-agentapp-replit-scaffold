# Skill: quality-check

## Inputs
- `story_name` — US-XX identifier and name
- `story_files` — list of files implemented for this story

## Process

Run every check below. Read the relevant source files before evaluating each one.

### B1 — Progression en temps réel
Verify every yield contains: `step`, `message`, `status`, `progress`.
Verify business data only appears on the "completed" yield.
Verify status values are only: "in_progress", "completed", "error".

✅ "L'agent communique sa progression étape par étape."
❌ "L'agent ne communique pas correctement sa progression — incompatible avec la plateforme Elio."

### B2 — Modèle IA autorisé
Verify `get_llm()` is used from `services/llm_config.py` — no direct instantiation anywhere.
Verify the model name is in the allowed list (authoritative source: `back/services/config_llms.json`):
gpt-5.1, gpt-5-mini, gpt-4.1, gpt-4.1-mini, o3
(image-only: gpt-image-1 — not for chat. To add models, the PO must first add them to config_llms.json.)

✅ "Le modèle IA utilisé est autorisé par la plateforme Elio."
❌ "Le modèle IA n'est pas dans la liste autorisée — l'équipe Neo ne pourra pas intégrer cet agent."

### B3 — Structure des données
Verify every input and output has a pydantic BaseModel in models.py.
Verify no raw dict is used as function input or output contract.

✅ "Les données échangées avec l'IA sont structurées et validées."
❌ "Les données ne sont pas correctement structurées — intégration impossible sans correction."

### B4 — Documentation technique
Verify every function has a Google-style docstring with Args and Yields/Returns.
Verify all parameters and return types have type hints.

✅ "Le code est documenté pour l'équipe technique Neo."
❌ "La documentation est incomplète — l'équipe Neo ne peut pas intégrer sans correction."

### B5 — Agent enregistré
Verify the agent_id is in AGENTS_MAP in `back/main.py`.
Verify the agent_id uses kebab-case with -step-N suffix.

✅ "L'agent est enregistré et accessible."
❌ "L'agent n'est pas enregistré — il ne sera pas accessible depuis l'interface."

### B6 — Décorateur @stream_safe
Verify every step function is decorated with `@stream_safe` from `utils.stream_error_handler`.
Verify the import is present: `from utils.stream_error_handler import stream_safe`
Verify the decorator is applied directly above the `async def` line.

✅ "Les erreurs Azure (credentials, quota, réseau) sont gérées proprement."
❌ "Le décorateur @stream_safe manque — une erreur Azure affichera une page blanche au PO."

### F1 — Langues français / anglais
Verify zero UI strings are hardcoded in components.
Verify every user-facing text uses `t("namespace.key")`.
Verify both fr.json and en.json have all new keys with actual translations.

✅ "L'interface est disponible en français et en anglais."
❌ "Certains textes ne sont pas traduits — l'interface ne fonctionnera qu'en une seule langue."

### F2 — Mémoire de l'application
Verify `isProcessing` is in the Zustand store, not local useState.
Verify `partialize` excludes: isProcessing, loadingMessage, isCancelled, error.
Verify both `setStep` and `advanceToStep` are implemented correctly.
Verify `isCancelled` is checked at the start of every SSE callback.

✅ "L'application mémorise correctement l'état."
❌ "L'état de l'application sera perdu si l'utilisateur navigue entre les pages."

### F3 — Protection du formulaire
Verify every form control has `disabled={isProcessing}`.
Verify GenerateButton has `disabled={!canProceed || isProcessing}`.

✅ "Le formulaire se désactive pendant la génération — pas de double envoi possible."
❌ "L'utilisateur peut modifier le formulaire pendant la génération — risque d'erreurs."

### F4 — Mode sombre
Verify every colored class has its dark variant:
- bg-{color}-50 → dark:bg-{color}-900/20
- bg-{color}-100 → dark:bg-{color}-900/30
- bg-{color}-200 → dark:bg-{color}-800/40
- text-{color}-700 → dark:text-{color}-300
- text-{color}-600 → dark:text-{color}-400
- border-{color}-100 → dark:border-{color}-800

✅ "L'interface fonctionne en mode clair et en mode sombre."
❌ "L'interface n'est pas compatible avec le mode sombre — obligatoire sur la plateforme Elio."

### F5 — Composants standards Elio
Verify no custom loading overlay or spinner (use GeneratingOverlay or ProgressBanner from barrel).
Verify no custom error display (use ErrorBanner from barrel).
Verify no direct fetch() calls (use executeAgentStreaming()).
Verify no imports from external UI libraries not in `front/package.json` (shadcn, radix-ui, headlessui...).

✅ "L'interface utilise les composants standards Elio."
❌ "Des composants non-standards sont utilisés — l'équipe Neo devra les remplacer."

### F6 — Conformité du barrel
Read `front/src/components/agent-apps/index.ts`. Verify:
- Every component imported from `@/components/agent-apps` actually exists in that file's exports
- Dropdowns/selects use `AgentAppSelect` — not a from-scratch custom component
- Boolean toggles use `AgentAppSwitch` — not a from-scratch custom component
- No barrel component is re-implemented locally in the page file

✅ "Tous les composants Elio utilisés existent dans le barrel — intégration garantie."
❌ "Des composants inexistants dans le barrel sont importés — l'intégration Elio échouera."

### V1 — Vérification des artefacts (3 niveaux)
For each file listed in the story's **Fichiers** section, verify 3 levels:

**Niveau 1 — EXISTE :** The file exists on disk.
**Niveau 2 — SUBSTANTIEL :** The file contains real implementation:
  - No TODO/FIXME/placeholder comments in business logic
  - No empty function bodies or `pass` statements in step functions
  - No `console.log`-only functions in frontend
  - No hardcoded mock data where LLM output should be

**Niveau 3 — CONNECTÉ :** The file is wired to the rest of the system:
  - Backend: step function is importable via `__init__.py` AND registered in AGENTS_MAP
  - Frontend: page is routed in `App.tsx` AND store is used by the page component
  - Tests: test file actually imports and calls the step function
  - i18n: keys used in components exist in both fr.json and en.json

✅ "Tous les fichiers sont implémentés et connectés au système."
❌ "Des fichiers contiennent du code placeholder ou ne sont pas connectés — [details]."

### S1 — SUBMISSION.md enrichi
Verify SUBMISSION.md sections 5-6 contain content for this specific story:
- Section 5: at least one input/output example added
- Section 6: at least one screenshot description added
- Quality table: a row for this story with all 14 checks filled

✅ "Le dossier de soumission est à jour pour cette story."
❌ "SUBMISSION.md n'a pas été enrichi pour cette story — à compléter avant de marquer Built."

## Output

Always use this exact report format:

```
🔍 Vérification qualité — {story_name}

Compatibilité plateforme Elio :
  B1 Progression en temps réel  : ✅ / ❌
  B2 Modèle IA autorisé         : ✅ / ❌
  B3 Structure des données      : ✅ / ❌
  B4 Documentation technique    : ✅ / ❌
  B5 Agent enregistré           : ✅ / ❌
  B6 Décorateur @stream_safe    : ✅ / ❌

Interface utilisateur :
  F1 Langues français / anglais : ✅ / ❌
  F2 Mémoire de l'application   : ✅ / ❌
  F3 Protection du formulaire   : ✅ / ❌
  F4 Mode sombre                : ✅ / ❌
  F5 Composants standards Elio  : ✅ / ❌
  F6 Conformité du barrel       : ✅ / ❌

Vérification des artefacts :
  V1 Existe / Substantiel / Connecté : ✅ / ❌

Dossier de soumission :
  S1 SUBMISSION.md enrichi      : ✅ / ❌

[If all ✅]:
"✅ La story est conforme à la plateforme Elio. Je mets à jour le backlog."

[If any ❌]:
"🔧 Je dois corriger avant de continuer — [N] point(s) non conforme(s).
Je corrige maintenant et refais la vérification."
```

Never deliver partial results. Never mark Built with a ❌.
