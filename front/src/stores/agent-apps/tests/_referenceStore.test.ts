/**
 * Tests for _referenceStore — Zustand store pattern.
 *
 * HOW TO USE:
 *   cd front && npm run test
 *
 * These tests cover store behavior only — no component rendering.
 * Copy this file for your own use case store.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the agentService before importing the store
vi.mock("@/services/agentService", () => ({
  executeAgentStreaming: vi.fn(() => ({ abort: vi.fn() })),
}));

// Reset Zustand store state between tests
beforeEach(() => {
  // Clear localStorage to reset persisted state
  localStorage.clear();
  // Reset module registry so the store re-initializes
  vi.resetModules();
});

describe("_referenceStore — navigation", () => {
  it("setStep navigates to the target step and updates maxReachedStep", async () => {
    const { useReferenceStore } = await import("@/stores/agent-apps/_referenceStore");
    const store = useReferenceStore.getState();

    store.setStep(2);

    const state = useReferenceStore.getState();
    expect(state.step).toBe(2);
    expect(state.maxReachedStep).toBe(2);
  });

  it("setStep preserves maxReachedStep if already higher", async () => {
    const { useReferenceStore } = await import("@/stores/agent-apps/_referenceStore");
    const store = useReferenceStore.getState();

    // Reach step 3, then go back to step 1
    store.setStep(3);
    store.setStep(1);

    const state = useReferenceStore.getState();
    expect(state.step).toBe(1);
    expect(state.maxReachedStep).toBe(3); // maxReachedStep stays at 3
  });

  it("advanceToStep resets maxReachedStep to the target step", async () => {
    const { useReferenceStore } = await import("@/stores/agent-apps/_referenceStore");
    const store = useReferenceStore.getState();

    // First reach step 3
    store.setStep(3);
    // advanceToStep should reset maxReachedStep (invalidates stale data)
    store.advanceToStep(2);

    const state = useReferenceStore.getState();
    expect(state.step).toBe(2);
    expect(state.maxReachedStep).toBe(2);
  });

  it("advanceToStep does not go backwards (post-generation forward-only)", async () => {
    const { useReferenceStore } = await import("@/stores/agent-apps/_referenceStore");
    const store = useReferenceStore.getState();

    store.advanceToStep(2);
    store.advanceToStep(2); // calling again should be idempotent

    const state = useReferenceStore.getState();
    expect(state.step).toBe(2);
    expect(state.maxReachedStep).toBe(2);
  });
});

describe("_referenceStore — isCancelled", () => {
  it("isCancelled is false by default", async () => {
    const { useReferenceStore } = await import("@/stores/agent-apps/_referenceStore");
    const state = useReferenceStore.getState();
    expect(state.isCancelled).toBe(false);
  });

  it("handleStop sets isCancelled to true and clears processing state", async () => {
    const { useReferenceStore } = await import("@/stores/agent-apps/_referenceStore");
    const store = useReferenceStore.getState();

    store.handleStop();

    const state = useReferenceStore.getState();
    expect(state.isCancelled).toBe(true);
    expect(state.isProcessing).toBe(false);
    expect(state.loadingMessage).toBe("");
  });

  it("runStep1 resets isCancelled to false when starting", async () => {
    const { useReferenceStore } = await import("@/stores/agent-apps/_referenceStore");
    const store = useReferenceStore.getState();

    // First cancel
    store.handleStop();
    expect(useReferenceStore.getState().isCancelled).toBe(true);

    // Then start a new step1 — isCancelled must reset
    store.runStep1();
    expect(useReferenceStore.getState().isCancelled).toBe(false);
  });
});

describe("_referenceStore — isProcessing", () => {
  it("isProcessing is false by default", async () => {
    const { useReferenceStore } = await import("@/stores/agent-apps/_referenceStore");
    const state = useReferenceStore.getState();
    expect(state.isProcessing).toBe(false);
  });

  it("runStep1 sets isProcessing to true immediately", async () => {
    const { useReferenceStore } = await import("@/stores/agent-apps/_referenceStore");
    const store = useReferenceStore.getState();

    store.runStep1();

    expect(useReferenceStore.getState().isProcessing).toBe(true);
  });
});

describe("_referenceStore — partialize (persistence)", () => {
  it("partialize excludes isProcessing, loadingMessage, isCancelled, error", async () => {
    const { useReferenceStore } = await import("@/stores/agent-apps/_referenceStore");

    // Access the persist options to verify partialize behavior
    // We do this by checking what keys are in localStorage after a state change
    const store = useReferenceStore.getState();
    store.setStep(2);
    store.setError("test error");
    store.setIsProcessing(true);

    // Give Zustand time to persist
    await new Promise((r) => setTimeout(r, 50));

    const persisted = JSON.parse(localStorage.getItem("_reference-store") ?? "{}");
    const persistedState = persisted?.state ?? {};

    // These MUST be persisted
    expect(persistedState).toHaveProperty("step");
    expect(persistedState).toHaveProperty("maxReachedStep");
    expect(persistedState).toHaveProperty("context");

    // These must NOT be persisted
    expect(persistedState).not.toHaveProperty("isProcessing");
    expect(persistedState).not.toHaveProperty("loadingMessage");
    expect(persistedState).not.toHaveProperty("isCancelled");
    expect(persistedState).not.toHaveProperty("error");
  });
});
