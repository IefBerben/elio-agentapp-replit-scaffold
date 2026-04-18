# Skill: build-frontend

Build the React frontend for the agent app.
Read `.agents/docs/AGENT_APP_GUIDELINES_FRONT.md` and `.agents/docs/CONVENTIONS.md` before writing any code.

---

## Prerequisites

- `build-backend` completed and tests pass
- `packages/shared-types/src/index.ts` exists
- `.agents/docs/api-contracts.md` exists

---

## File creation order

### 1. `front/src/stores/agent-apps/{name}Store.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { {Name}Step1Input, {Name}Step1Result } from "@shared-types";

interface {Name}State {
  // Navigation
  step: number;
  maxReachedStep: number;

  // User inputs (persisted)
  // ... fields from {Name}Step1Input

  // LLM results (persisted — editable by user before step 2)
  step1Result: {Name}Step1Result | null;

  // Runtime (NOT persisted)
  isProcessing: boolean;
  loadingAction: string;
  isCancelled: boolean;
  error: string | null;
}

interface {Name}Actions {
  // Navigation
  setStep: (step: number) => void;
  advanceToStep: (step: number) => void;

  // Setters for user inputs
  set{Field}: (value: type) => void;

  // Setters for editable results (user can modify before step 2)
  setStep1Result: (result: {Name}Step1Result) => void;

  // Runtime
  setIsProcessing: (v: boolean) => void;
  setLoadingAction: (msg: string) => void;
  setError: (err: string | null) => void;
  handleStop: () => void;
  resetAll: () => void;
}

const initialState = { step: 1, maxReachedStep: 1, /* ... */ };

export const use{Name}Store = create<{Name}State & {Name}Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) =>
        set((s) => ({ step, maxReachedStep: Math.max(s.maxReachedStep, step) })),

      advanceToStep: (step) => set({ step, maxReachedStep: step }),

      handleStop: () => set({ isCancelled: true, isProcessing: false, loadingAction: "" }),

      resetAll: () => set({ ...initialState, isProcessing: false, isCancelled: false, error: null, loadingAction: "" }),

      // ... other actions
    }),
    {
      name: "{name}-storage",
      partialize: (state) => ({
        step: state.step,
        maxReachedStep: state.maxReachedStep,
        // ... user inputs and results
        // NEVER include: isProcessing, loadingAction, isCancelled, error
      }),
    },
  ),
);
```

Rules:
- `setStep` updates `maxReachedStep = Math.max(current, step)` — user navigation preserves future steps
- `advanceToStep` sets `maxReachedStep = step` — after generation, future steps are invalidated
- `partialize` must exclude all runtime state
- Intermediate results (step1Result) are persisted and must be editable

### 2. `front/src/i18n/locales/fr.json` + `en.json`

Add a namespace matching the component name in camelCase:

```json
{
  "{camelCaseName}": {
    "title": "...",
    "description": "...",
    "step1Label": "...",
    "step2Label": "...",
    "promptLabel": "...",
    "promptPlaceholder": "...",
    "generateButton": "Générer",
    "generatingLabel": "Génération en cours...",
    "resultsTitle": "Résultats",
    "editableHint": "Vous pouvez modifier ces résultats avant de continuer."
  }
}
```

Rules:
- Zero hardcoded strings in the component — every user-facing text must have a key
- Both fr.json and en.json must have all keys
- Reuse existing `agentAppCommon.*` keys where they apply (stop, reset, error, etc.)

### 3. `front/src/pages/{Name}AgentAppPage.tsx`

Follow the pattern in `front/src/pages/_ReferencePage.tsx`.

Structure:
```tsx
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";  // Replace with category icon in production
import {
  AgentAppCard, AgentAppPageShell, AgentAppSection,
  ErrorBanner, FormField, FormInput, FormTextarea,
  GenerateButton, LanguageToggle, ProgressBanner, StepIndicator,
} from "@/components/agent-apps";
import { executeAgentStreaming } from "@/services/agentService";
import { use{Name}Store } from "@/stores/agent-apps/{name}Store";
import type { {Name}Step1Result } from "@shared-types";

const AGENT_STEP_1 = "{kebab-name}-step-1";

export function {Name}AgentAppPage() {
  const { t, i18n } = useTranslation();
  const isCancelledRef = useRef(false);

  // Individual selectors — never destructure the store
  const step = use{Name}Store((s) => s.step);
  const maxReachedStep = use{Name}Store((s) => s.maxReachedStep);
  const isProcessing = use{Name}Store((s) => s.isProcessing);
  const error = use{Name}Store((s) => s.error);
  const step1Result = use{Name}Store((s) => s.step1Result);

  const handleGenerate = useCallback(async () => {
    const { setIsProcessing, setLoadingAction, setError, setStep1Result, advanceToStep, isCancelled } =
      use{Name}Store.getState();

    isCancelledRef.current = false;
    setIsProcessing(true);
    setError(null);

    try {
      const { abort } = executeAgentStreaming(
        AGENT_STEP_1,
        { prompt, interface_language: i18n.language },
        (message) => {
          if (isCancelledRef.current) return;
          if (message.status === "in_progress") setLoadingAction(message.message ?? "");
          if (message.status === "completed" && message.result) {
            setStep1Result(message.result as {Name}Step1Result);
            advanceToStep(2);
          }
          if (message.status === "error") setError(message.error ?? "Erreur inconnue");
        },
      );
      // store abort ref if needed for stop button
    } catch (err) {
      if (!isCancelledRef.current) setError(String(err));
    } finally {
      setIsProcessing(false);
      setLoadingAction("");
    }
  }, [i18n.language]);

  const handleStop = useCallback(() => {
    isCancelledRef.current = true;
    use{Name}Store.getState().handleStop();
  }, []);

  return (
    <AgentAppPageShell
      title={t("{camelCaseName}.title")}
      description={t("{camelCaseName}.description")}
      icon={<Sparkles className="w-5 h-5" />}
      iconContainerClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      isProcessing={isProcessing}
      resetDisabled={isProcessing}
      onReset={use{Name}Store.getState().resetAll}
      headerActions={<StepIndicator steps={steps} currentStep={step} maxReachedStep={maxReachedStep} onStepClick={use{Name}Store.getState().setStep} variant="pills" />}
      headerExtra={<LanguageToggle />}
      useSimpleLayout
    >
      <ErrorBanner error={error} />
      {step === 1 && <Step1Content isProcessing={isProcessing} onGenerate={handleGenerate} onStop={handleStop} />}
      {step === 2 && <Step2Content isProcessing={isProcessing} onGenerate={handleStep2} onStop={handleStop} />}
    </AgentAppPageShell>
  );
}
```

Rules:
- `AgentAppPageShell` is always the root — never build a custom header/layout
- `LanguageToggle` always in `headerExtra`
- `StepIndicator` variant `"pills"` for Elio
- Every input has `disabled={isProcessing}`
- Intermediate results (step1Result fields) must be editable `FormInput`/`FormTextarea` components
- All colors: `bg-{color}-100 dark:bg-{color}-900/30`, `text-{color}-700 dark:text-{color}-300`
- Import types from `@shared-types`, never redefine inline

### 4. Register in `front/src/App.tsx`

Add a case for the new page in the page switcher (follow the existing pattern).

---

## After build

Run tests:
```bash
cd front && npm run test
```

Visual smoke test (open Webview):
- [ ] Page loads without errors
- [ ] Generate button triggers streaming
- [ ] Progress banner appears during generation
- [ ] Stop button cancels
- [ ] Results appear and are editable
- [ ] Language toggle switches FR/EN
- [ ] Reset clears everything
- [ ] Dark mode: toggle and check all colors

Update `replit.md` — set Frontend status to ✅.

Report to user:
```
Frontend construit :
- front/src/pages/{Name}AgentAppPage.tsx
- front/src/stores/agent-apps/{name}Store.ts
- i18n : [N] clés ajoutées (fr + en)

Je lance la vérification plateforme ?
```
