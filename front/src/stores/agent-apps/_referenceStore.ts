/**
 * Reference agent store — REFERENCE EXAMPLE, do not modify.
 *
 * HOW TO USE:
 * - Copy this file and rename it for your use case (e.g. myUsecaseStore.ts)
 * - Import useReferenceStore in your page component
 * - Call runStep1() to start generation — it returns { abort }
 * - Store loadingMessage for the ProgressBanner
 * - setStep() for user navigation, advanceToStep() after generation completes
 *
 * PERSISTENCE:
 * - context and results survive page navigation (Zustand + localStorage)
 * - isProcessing, error, isCancelled are NOT persisted (runtime only)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { executeAgentStreaming, type SSEUpdate } from "@/services/agentService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step1Result {
  summary: string;
  key_points: string[];
}

interface Step2Result {
  recommendations: string[];
  next_steps: string[];
  conclusion: string;
}

interface ReferenceContext {
  prompt: string;
  context: string;
  language: "fr" | "en";
}

interface ReferenceState {
  // Navigation
  step: number;
  maxReachedStep: number;

  // Data
  context: ReferenceContext;
  step1Result: Step1Result | null;
  step2Result: Step2Result | null;

  // Processing (NOT persisted)
  isProcessing: boolean;
  loadingMessage: string;
  isCancelled: boolean;
  error: string | null;
}

interface ReferenceActions {
  // Navigation — two semantics (see toolkit guidelines)
  setStep: (step: number) => void;
  advanceToStep: (step: number) => void;

  // Context setters
  setContext: (partial: Partial<ReferenceContext>) => void;

  // Processing
  setIsProcessing: (v: boolean) => void;
  setError: (error: string | null) => void;

  // Agent execution
  runStep1: () => { abort: () => void };
  runStep2: () => { abort: () => void };
  handleStop: () => void;
  reset: () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialContext: ReferenceContext = {
  prompt: "",
  context: "",
  language: "fr",
};

const initialState: ReferenceState = {
  step: 1,
  maxReachedStep: 1,
  context: initialContext,
  step1Result: null,
  step2Result: null,
  isProcessing: false,
  loadingMessage: "",
  isCancelled: false,
  error: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useReferenceStore = create<ReferenceState & ReferenceActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Navigation ──────────────────────────────────────────────────────────
      /** User-initiated navigation — preserves future steps already reached */
      setStep: (step) =>
        set((s) => ({ step, maxReachedStep: Math.max(s.maxReachedStep, step) })),

      /** Post-generation navigation — resets maxReachedStep to invalidate stale data */
      advanceToStep: (step) => set({ step, maxReachedStep: step }),

      // ── Context ─────────────────────────────────────────────────────────────
      setContext: (partial) =>
        set((s) => ({ context: { ...s.context, ...partial } })),

      setIsProcessing: (v) => set({ isProcessing: v }),
      setError: (error) => set({ error }),

      // ── Step 1 ──────────────────────────────────────────────────────────────
      runStep1: () => {
        const { context } = get();
        set({ isProcessing: true, isCancelled: false, error: null, loadingMessage: "" });

        const controller = executeAgentStreaming(
          "_reference-step-1",
          { prompt: context.prompt, context: context.context, language: context.language },
          (update: SSEUpdate) => {
            if (get().isCancelled) return;
            set({ loadingMessage: update.message });
          },
          (update: SSEUpdate) => {
            if (get().isCancelled) return;
            get().advanceToStep(2);
            set({
              step1Result: update.result as Step1Result,
              isProcessing: false,
              loadingMessage: "",
            });
          },
          (err: Error) => {
            if (get().isCancelled) return;
            set({ error: err.message, isProcessing: false, loadingMessage: "" });
          }
        );

        return { abort: () => { set({ isCancelled: true }); controller.abort(); } };
      },

      // ── Step 2 ──────────────────────────────────────────────────────────────
      runStep2: () => {
        const { context, step1Result } = get();
        if (!step1Result) {
          set({ error: "Step 1 must be completed first." });
          return { abort: () => {} };
        }

        set({ isProcessing: true, isCancelled: false, error: null, loadingMessage: "" });

        const controller = executeAgentStreaming(
          "_reference-step-2",
          { prompt: context.prompt, step1_result: step1Result, language: context.language },
          (update: SSEUpdate) => {
            if (get().isCancelled) return;
            set({ loadingMessage: update.message });
          },
          (update: SSEUpdate) => {
            if (get().isCancelled) return;
            // Stay on step 2 — step2Result being set is enough to show results
            set({
              step2Result: update.result as Step2Result,
              isProcessing: false,
              loadingMessage: "",
            });
          },
          (err: Error) => {
            if (get().isCancelled) return;
            set({ error: err.message, isProcessing: false, loadingMessage: "" });
          }
        );

        return { abort: () => { set({ isCancelled: true }); controller.abort(); } };
      },

      // ── Stop / Reset ────────────────────────────────────────────────────────
      handleStop: () => set({ isCancelled: true, isProcessing: false, loadingMessage: "" }),

      reset: () => set({ ...initialState }),
    }),
    {
      name: "_reference-store",
      // Persist only data — never runtime state
      partialize: (s) => ({
        step: s.step,
        maxReachedStep: s.maxReachedStep,
        context: s.context,
        step1Result: s.step1Result,
        step2Result: s.step2Result,
        // NOT persisted: isProcessing, loadingMessage, isCancelled, error
      }),
    }
  )
);
