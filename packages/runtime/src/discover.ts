import { createTelemetry } from "@seai/core";
import type { InferenceRuntime } from "./models.js";
import { OllamaRuntime } from "./adapters/ollama.js";

export interface LocalDiscoveryOptions {
  // Ollama endpoint. Defaults to OLLAMA_BASE_URL env or localhost.
  ollamaBaseUrl?: string;
  // Per-runtime probe budget so discovery never hangs startup.
  timeoutMs?: number;
}

// Detects locally reachable execution runtimes. This is intentionally
// conservative for Darwin 0.1:
// - Ollama is probed via its health endpoint (first reference adapter).
// - The local test-fixture runtime is NEVER auto-registered: a mock must
//   not silently stand in for real inference.
// - llama.cpp needs an explicit model path, so it cannot be probed yet.
// - MLX is a stub (reports unhealthy) and is excluded by the health check.
// Future providers (remote OpenAI-compatible endpoints, etc.) extend this
// function — the kernel contract (InferenceRuntime) does not change.
export async function discoverLocalRuntimes(
  options: LocalDiscoveryOptions = {}
): Promise<InferenceRuntime[]> {
  const timeoutMs = options.timeoutMs ?? 2000;
  const baseUrl =
    options.ollamaBaseUrl ?? process.env["OLLAMA_BASE_URL"] ?? "http://localhost:11434";

  const found: InferenceRuntime[] = [];
  const ollama = new OllamaRuntime(baseUrl, createTelemetry({ enabled: false }));
  if (await isHealthyWithin(ollama, timeoutMs)) {
    found.push(ollama);
  }
  return found;
}

async function isHealthyWithin(runtime: InferenceRuntime, timeoutMs: number): Promise<boolean> {
  try {
    const health = await Promise.race([
      runtime.health(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("health probe timeout")), timeoutMs)
      ),
    ]);
    return health !== null && (health as { healthy: boolean }).healthy;
  } catch {
    return false;
  }
}
