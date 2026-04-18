/**
 * Agent execution service — SSE streaming to the backend.
 */

export interface SSEUpdate {
  step: string;
  message: string;
  status: "in_progress" | "completed" | "error";
  progress: number;
  error?: string;
  [key: string]: unknown;
}

export function executeAgentStreaming(
  agentId: string,
  params: Record<string, unknown>,
  onUpdate: (update: SSEUpdate) => void,
  onComplete: (update: SSEUpdate) => void,
  onError: (error: Error) => void,
  timeoutMs = 5 * 60 * 1000
): AbortController {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
    onError(new Error("Délai dépassé (5 min) — l'agent ne répond plus. Réessaie dans quelques instants."));
  }, timeoutMs);

  (async () => {
    try {
      const response = await fetch(`/agent-apps/execute/${agentId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}${detail ? ` — ${detail}` : ""}`);
      }

      if (!response.body) throw new Error("Response body is empty — possible CORS or network issue");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const json = trimmed.slice(5).trim();
          if (!json) continue;
          try {
            const update: SSEUpdate = JSON.parse(json);
            if (update.status === "completed") { clearTimeout(timeoutId); onComplete(update); }
            else if (update.status === "error") { clearTimeout(timeoutId); onError(new Error(update.error ?? update.message)); }
            else onUpdate(update);
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if ((err as Error).name !== "AbortError")
        onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return controller;
}
