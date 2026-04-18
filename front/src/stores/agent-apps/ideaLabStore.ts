/**
 * idea_lab store — disposable, used only by the StarterPage.
 *
 * Removed by the `remove-starter` skill once the consultant picks a path.
 * Follows the same Zustand + persist + partialize pattern as _referenceStore.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { executeAgentStreaming, type SSEUpdate } from "@/services/agentService";

export interface IdeaSuggestion {
  title: string;
  problem: string;
  inputs: string;
  outputs: string;
  why_it_fits: string;
}

export interface IdeaLabResult {
  ideas: IdeaSuggestion[];
}

interface IdeaLabContext {
  role: string;
  pain: string;
  language: "fr" | "en";
}

interface IdeaLabState {
  context: IdeaLabContext;
  result: IdeaLabResult | null;

  // Runtime — NOT persisted
  isProcessing: boolean;
  loadingMessage: string;
  isCancelled: boolean;
  error: string | null;
}

interface IdeaLabActions {
  setContext: (partial: Partial<IdeaLabContext>) => void;
  setError: (error: string | null) => void;
  runIdeaLab: (interfaceLanguage: string) => { abort: () => void };
  handleStop: () => void;
  reset: () => void;
}

const initialContext: IdeaLabContext = {
  role: "",
  pain: "",
  language: "fr",
};

const initialState: IdeaLabState = {
  context: initialContext,
  result: null,
  isProcessing: false,
  loadingMessage: "",
  isCancelled: false,
  error: null,
};

export const useIdeaLabStore = create<IdeaLabState & IdeaLabActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setContext: (partial) =>
        set((s) => ({ context: { ...s.context, ...partial } })),

      setError: (error) => set({ error }),

      runIdeaLab: (interfaceLanguage: string) => {
        const { context } = get();
        set({ isProcessing: true, isCancelled: false, error: null, loadingMessage: "" });

        const controller = executeAgentStreaming(
          "idea-lab-step-1",
          {
            role: context.role,
            pain: context.pain,
            language: context.language,
            interface_language: interfaceLanguage,
          },
          (update: SSEUpdate) => {
            if (get().isCancelled) return;
            set({ loadingMessage: update.message });
          },
          (update: SSEUpdate) => {
            if (get().isCancelled) return;
            set({
              result: update.result as IdeaLabResult,
              isProcessing: false,
              loadingMessage: "",
            });
          },
          (err: Error) => {
            if (get().isCancelled) return;
            set({ error: err.message, isProcessing: false, loadingMessage: "" });
          },
        );

        return {
          abort: () => {
            set({ isCancelled: true });
            controller.abort();
          },
        };
      },

      handleStop: () =>
        set({ isCancelled: true, isProcessing: false, loadingMessage: "" }),

      reset: () => set({ ...initialState }),
    }),
    {
      name: "idea-lab-store",
      partialize: (s) => ({
        context: s.context,
        result: s.result,
      }),
    },
  ),
);
