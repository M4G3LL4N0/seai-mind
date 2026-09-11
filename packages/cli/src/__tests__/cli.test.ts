import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const execFileAsync = promisify(execFile);
// Vitest runs this file from src/__tests__/; the built CLI lives at dist/cli.js.
const cliPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "dist", "cli.js");

async function runCli(...args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execFileAsync("node", [cliPath, ...args], { timeout: 55000 });
    return { stdout, stderr, code: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? "", code: e.code ?? 1 };
  }
}

describe("cli REAL (P2)", () => {
  it("seai --help lists commands", async () => {
    const res = await runCli("--help");
    expect(res.code).toBe(0);
    expect(res.stdout).toContain("doctor");
    expect(res.stdout).toContain("init");
    expect(res.stdout).toContain("run");
  }, 60000);

  it("seai status reports a ready Mind", async () => {
    const res = await runCli("status");
    expect(res.code).toBe(0);
    expect(res.stdout).toContain("Mind Status");
  }, 60000);

  it("seai run executes real deterministic arithmetic", async () => {
    const res = await runCli("run", "What is 2 + 2?");
    expect(res.code).toBe(0);
    // ora spinner text ("Task completed") goes to stderr; the result JSON to stdout.
    expect(res.stderr).toContain("Task completed");
    expect(res.stdout).toContain('"status": "completed"');
    expect(res.stdout).toContain('"executionPath": "deterministic"');
  }, 60000);

  it("seai run degrades honestly without a model, executes for real with one", async () => {
    // Environment-aware: with a live local runtime this performs REAL model
    // inference; without one it must fail with the configuration diagnostic.
    // Both outcomes are asserted — never faked.
    let ollamaLive = false;
    try {
      const res = await fetch("http://localhost:11434/api/version", {
        signal: AbortSignal.timeout(2000),
      });
      ollamaLive = res.ok;
    } catch {
      ollamaLive = false;
    }

    const res = await runCli("run", "Tell me a story about dragons");
    if (ollamaLive) {
      expect(res.code).toBe(0);
      expect(res.stdout).toContain('"executionPath": "model"');
    } else {
      expect(res.code).toBe(1);
      expect(res.stdout + res.stderr).toContain("No execution method available");
      expect(res.stdout + res.stderr).toContain("ollama serve");
    }
  }, 120000);
});
