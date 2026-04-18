import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Persona {
  name: string;
  age: number;
  profession: string;
  education: string;
  personality_type: string;
  description: string;
  interests: string[];
  communication_style: string;
  opinion_on_topic: string;
}

export interface ConversationMessage {
  speaker: string;
  message: string;
  tone: string;
}

export interface ProgressInfo {
  title: string;
  progress: number;
}

export interface UploadedFile {
  /** Original filename as displayed to the user */
  name: string;
  /** File size in bytes */
  size: number;
  /** Absolute path on the backend where the file was saved */
  path: string;
}

interface ConversationState {
  // Input data
  topic: string;
  persona1Hint: string;
  persona2Hint: string;
  numExchanges: number;

  // Uploaded files (persisted so they survive page refresh)
  uploadedFiles: UploadedFile[];

  // Step navigation
  currentStep: number;
  maxReachedStep: number;

  // Generated data
  persona1: Persona | null;
  persona2: Persona | null;
  conversation: ConversationMessage[];

  // UI state
  isProcessing: boolean;
  isUploading: boolean;
  errorMessage: string;
  progressInfo: ProgressInfo | null;

  // Actions — Input
  setTopic: (topic: string) => void;
  setPersona1Hint: (hint: string) => void;
  setPersona2Hint: (hint: string) => void;
  setNumExchanges: (n: number) => void;

  // Actions — Files
  setUploadedFiles: (files: UploadedFile[]) => void;
  addUploadedFiles: (files: UploadedFile[]) => void;
  removeUploadedFile: (name: string) => void;
  setIsUploading: (uploading: boolean) => void;

  // Actions — Navigation
  setCurrentStep: (step: number) => void;
  advanceToStep: (step: number) => void;

  // Actions — Data
  setPersonas: (p1: Persona, p2: Persona) => void;
  addConversationMessage: (msg: ConversationMessage) => void;
  setConversation: (msgs: ConversationMessage[]) => void;

  // Actions — UI
  setIsProcessing: (processing: boolean) => void;
  setErrorMessage: (message: string) => void;
  setProgressInfo: (info: ProgressInfo | null) => void;
  handleStop: () => void;
  resetAll: () => void;
}

const initialState = {
  topic: "",
  persona1Hint: "",
  persona2Hint: "",
  numExchanges: 8,
  uploadedFiles: [] as UploadedFile[],
  currentStep: 1,
  maxReachedStep: 1,
  persona1: null as Persona | null,
  persona2: null as Persona | null,
  conversation: [] as ConversationMessage[],
  isProcessing: false,
  isUploading: false,
  errorMessage: "",
  progressInfo: null as ProgressInfo | null,
};

export const useConversationStore = create<ConversationState>()(
  persist(
    (set) => ({
      ...initialState,

      // Actions — Input
      setTopic: (topic) => set({ topic }),
      setPersona1Hint: (hint) => set({ persona1Hint: hint }),
      setPersona2Hint: (hint) => set({ persona2Hint: hint }),
      setNumExchanges: (n) => set({ numExchanges: n }),

      // Actions — Files
      setUploadedFiles: (files) => set({ uploadedFiles: files }),
      addUploadedFiles: (files) =>
        set((state) => ({ uploadedFiles: [...state.uploadedFiles, ...files] })),
      removeUploadedFile: (name) =>
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((f) => f.name !== name),
        })),
      setIsUploading: (uploading) => set({ isUploading: uploading }),

      // Actions — Navigation
      setCurrentStep: (step) =>
        set((state) => ({
          currentStep: step,
          maxReachedStep: Math.max(state.maxReachedStep, step),
        })),
      advanceToStep: (step) => set({ currentStep: step, maxReachedStep: step }),

      // Actions — Data
      setPersonas: (p1, p2) => set({ persona1: p1, persona2: p2 }),
      addConversationMessage: (msg) =>
        set((state) => ({
          conversation: [...state.conversation, msg],
        })),
      setConversation: (msgs) => set({ conversation: msgs }),

      // Actions — UI
      setIsProcessing: (processing) => set({ isProcessing: processing }),
      setErrorMessage: (message) => set({ errorMessage: message }),
      setProgressInfo: (info) => set({ progressInfo: info }),
      handleStop: () => set({ isProcessing: false, progressInfo: null }),
      resetAll: () => set(initialState),
    }),
    {
      name: "conversation-agent-store",
      // Only persist user data and generated results — NOT runtime state.
      // isProcessing / isUploading / errorMessage / progressInfo must always start clean.
      partialize: (state) => ({
        topic: state.topic,
        persona1Hint: state.persona1Hint,
        persona2Hint: state.persona2Hint,
        numExchanges: state.numExchanges,
        uploadedFiles: state.uploadedFiles,
        currentStep: state.currentStep,
        maxReachedStep: state.maxReachedStep,
        persona1: state.persona1,
        persona2: state.persona2,
        conversation: state.conversation,
      }),
    },
  ),
);
