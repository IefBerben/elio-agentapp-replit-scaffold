/**
 * Tests for agentService — SSE streaming service.
 *
 * HOW TO USE:
 *   cd front && npm run test
 *
 * These tests mock the global fetch API to simulate SSE streams.
 * They verify that callbacks are invoked correctly and abort works.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeAgentStreaming, type SSEUpdate } from "@/services/agentService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a ReadableStream that emits SSE lines from an array of SSEUpdate objects */
function makeSseStream(events: SSEUpdate[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    },
  });
}

/** Build a mock fetch Response with a given SSE stream */
function mockFetchResponse(events: SSEUpdate[]): Response {
  return {
    ok: true,
    body: makeSseStream(events),
  } as unknown as Response;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("executeAgentStreaming — endpoint", () => {
  it("calls the correct endpoint with the given agent_id", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockFetchResponse([
        { step: "done", message: "OK", status: "completed", progress: 100 },
      ])
    );

    const onComplete = vi.fn();
    executeAgentStreaming("my-agent-step-1", { prompt: "test" }, vi.fn(), onComplete, vi.fn());

    // Give the async IIFE time to run
    await new Promise((r) => setTimeout(r, 50));

    expect(fetchSpy).toHaveBeenCalledWith(
      "/agent-apps/execute/my-agent-step-1/stream",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "test" }),
      })
    );
  });
});

describe("executeAgentStreaming — callbacks", () => {
  it("calls onUpdate for in_progress events", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockFetchResponse([
        { step: "step1", message: "En cours...", status: "in_progress", progress: 30 },
        { step: "done",  message: "OK",         status: "completed",   progress: 100 },
      ])
    );

    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    executeAgentStreaming("agent-1", {}, onUpdate, onComplete, vi.fn());

    await new Promise((r) => setTimeout(r, 50));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "in_progress", progress: 30 })
    );
  });

  it("calls onComplete for the completed event", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockFetchResponse([
        { step: "done", message: "Terminé", status: "completed", progress: 100, result: { key: "val" } },
      ])
    );

    const onComplete = vi.fn();
    executeAgentStreaming("agent-1", {}, vi.fn(), onComplete, vi.fn());

    await new Promise((r) => setTimeout(r, 50));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", progress: 100 })
    );
  });

  it("calls onError when an event has status error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockFetchResponse([
        { step: "error", message: "❌ Quota Azure dépassé.", status: "error", progress: 0, error: "RateLimitError" },
      ])
    );

    const onError = vi.fn();
    executeAgentStreaming("agent-1", {}, vi.fn(), vi.fn(), onError);

    await new Promise((r) => setTimeout(r, 50));

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("calls onError on HTTP error status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      body: null,
    } as unknown as Response);

    const onError = vi.fn();
    executeAgentStreaming("nonexistent-agent", {}, vi.fn(), vi.fn(), onError);

    await new Promise((r) => setTimeout(r, 50));

    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0][0] as Error).message).toContain("404");
  });
});

describe("executeAgentStreaming — abort", () => {
  it("abort() stops the stream and does not call further callbacks", async () => {
    const encoder = new TextEncoder();
    let streamController: ReadableStreamDefaultController<Uint8Array>;

    // Stream that we control manually
    const stream = new ReadableStream<Uint8Array>({
      start(ctrl) {
        streamController = ctrl;
      },
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      body: stream,
    } as unknown as Response);

    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const controller = executeAgentStreaming("agent-1", {}, onUpdate, onComplete, vi.fn());

    // Abort before any events are emitted
    controller.abort();

    // Now push an event — it should not reach callbacks
    streamController!.enqueue(
      encoder.encode(`data: ${JSON.stringify({ step: "done", message: "OK", status: "completed", progress: 100 })}\n\n`)
    );
    streamController!.close();

    await new Promise((r) => setTimeout(r, 50));

    expect(onUpdate).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("abort() returns an AbortController with an abort method", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockFetchResponse([])
    );

    const controller = executeAgentStreaming("agent-1", {}, vi.fn(), vi.fn(), vi.fn());

    expect(controller).toBeDefined();
    expect(typeof controller.abort).toBe("function");
  });
});
