/**
 * SSE (Server-Sent Events) stream service for agent apps.
 * Provides utilities for parsing and reading SSE streams with abort support.
 *
 * DO NOT MODIFY — This mirrors the Neo application's SSE service.
 */

export interface SSEMessage {
  status?: string;
  message?: string;
  error?: string;
  title?: string;
  progress?: number;
  description?: string;
  current_operation?: string;
  [key: string]: unknown;
}

export function parseSSEBuffer<T extends SSEMessage = SSEMessage>(
  buffer: string,
): { messages: T[]; remaining: string } {
  const parts = buffer.split("\n\n");
  const remaining = parts.pop() || "";
  const messages: T[] = [];

  for (const part of parts) {
    if (!part.trim()) continue;
    const dataMatch = /^data: (.+)$/m.exec(part);
    if (!dataMatch) continue;
    try {
      messages.push(JSON.parse(dataMatch[1]) as T);
    } catch {
      // Skip malformed messages
    }
  }

  return { messages, remaining };
}

export async function readSSEStream<T extends SSEMessage = SSEMessage>(
  response: Response,
  processMessage: (msg: T) => boolean,
  signal?: AbortSignal,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No reader available");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let aborted = false;

  const abortHandler = () => {
    aborted = true;
    reader.cancel().catch(() => {});
  };

  if (signal) {
    if (signal.aborted) {
      reader.cancel();
      throw new DOMException("Aborted", "AbortError");
    }
    signal.addEventListener("abort", abortHandler);
  }

  try {
    while (!aborted) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { messages, remaining } = parseSSEBuffer<T>(buffer);
      buffer = remaining;

      for (const msg of messages) {
        if (processMessage(msg)) return;
      }
    }

    if (aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
  } finally {
    if (signal) {
      signal.removeEventListener("abort", abortHandler);
    }
    reader.releaseLock();
  }
}
