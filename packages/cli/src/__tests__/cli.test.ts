import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const execFileAsync = promisify(execFile);
// Vitest runs this file from src/__tests__/; the built CLI lives at dist/cli.js.
const cliPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "dist", "cli.js");

async function runCli(
  ...args: string[]
): Promise<{ stdout: string; stderr: string; code: number }> {
  return runCliEnv({}, ...args);
}

async function runCliEnv(
  env: Record<string, string>,
  ...args: string[]
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execFileAsync("node", [cliPath, ...args], {
      timeout: 110000,
      env: { ...process.env, ...env },
    });
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

describe("cli/evolve REAL (durable file state, isolated tmpdir)", () => {
  it("full loop via CLI: propose → history → promote → run uses version → rollback", async () => {
    const { mkdtempSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dataDir = mkdtempSync(join(tmpdir(), "seai-cli-evo-"));
    const env = { SEAI_DATA_DIR: dataDir };
    const mind = "clievo";

    const statusEmpty = await runCliEnv(env, "evolve", "status", "--mind", mind);
    expect(statusEmpty.code).toBe(0);
    expect(statusEmpty.stdout).toContain("(none yet");

    const propose = await runCliEnv(env, "evolve", "propose", "json answers wanted", "--mind", mind);
    expect(propose.code).toBe(0);
    expect(propose.stdout).toContain("ELIGIBLE");
    const idMatch = propose.stdout.match(/Experiment:\s+(\S+)/);
    expect(idMatch?.[1]).toBeTruthy();
    const experimentId = idMatch?.[1] as string;

    const history = await runCliEnv(env, "evolve", "history", "--mind", mind);
    expect(history.code).toBe(0);
    expect(history.stdout).toContain(experimentId);
    expect(history.stdout).toContain("ELIGIBLE");

    const promote = await runCliEnv(env, "evolve", "promote", experimentId, "--mind", mind);
    expect(promote.code).toBe(0);
    expect(promote.stdout + promote.stderr).toContain("Promoted genome");

    const statusActive = await runCliEnv(env, "evolve", "status", "--mind", mind);
    expect(statusActive.code).toBe(0);
    expect(statusActive.stdout).toContain("Active genome:");
    expect(statusActive.stdout).toContain("Rollback available: yes");

    const rollback = await runCliEnv(env, "evolve", "rollback", "--mind", mind, "--reason", "cli drill");
    expect(rollback.code).toBe(0);
    expect(rollback.stdout + rollback.stderr).toContain("Rolled back");

    const historyAfter = await runCliEnv(env, "evolve", "history", "--mind", mind);
    expect(historyAfter.code).toBe(0);
    expect(historyAfter.stdout).toContain("rolled-back (cli drill)");

    // Cross-process version adoption: promote again, then a FRESH process
    // running a task must use the promoted (JSON) version.
    const promote2 = await runCliEnv(env, "evolve", "promote", experimentId, "--mind", mind);
    expect(promote2.code).toBe(0);
    const runJson = await runCliEnv(env, "run", "What is 3 + 3? Answer in JSON.", "--mind", mind);
    expect(runJson.code).toBe(0);
    // The printed task JSON escapes the result string: "result": "{\"value\":6}".
    expect(runJson.stdout).toContain('\\"value\\":6');
    expect(runJson.stdout).toContain('"executionPath": "deterministic"');
  }, 300000);
});

describe("cli/evolve model-backed REAL", () => {
  it("propose with extraction suite and no models holds honestly (no fabrication)", async () => {
    const { mkdtempSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const env = { SEAI_DATA_DIR: mkdtempSync(join(tmpdir(), "seai-cli-model-")) };
    const res = await runCliEnv(
      env, "evolve", "propose", "extraction drill", "--mind", "climodel", "--suite", "extraction-json-v1"
    );
    expect(res.code).toBe(0);
    expect(res.stdout).toContain("HOLD");
    expect(res.stdout).toContain("extraction-json-v1");
  }, 180000);

  it("unknown suite is rejected with known options", async () => {
    const { mkdtempSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const env = { SEAI_DATA_DIR: mkdtempSync(join(tmpdir(), "seai-cli-suite-")) };
    const res = await runCliEnv(env, "evolve", "propose", "--mind", "clisuite", "--suite", "nope");
    expect(res.code).toBe(1);
    expect(res.stdout + res.stderr).toContain("Unknown suite");
  }, 120000);

  it("compare exposes per-arm measurements and deltas", async () => {
    const { mkdtempSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const env = { SEAI_DATA_DIR: mkdtempSync(join(tmpdir(), "seai-cli-compare-")) };
    const mind = "clicompare";
    const propose = await runCliEnv(env, "evolve", "propose", "--mind", mind);
    expect(propose.code).toBe(0);
    const idMatch = propose.stdout.match(/Experiment:\s+(\S+)/);
    const experimentId = idMatch?.[1] as string;
    const compare = await runCliEnv(env, "evolve", "compare", experimentId, "--mind", mind);
    expect(compare.code).toBe(0);
    expect(compare.stdout).toContain("baseline ");
    expect(compare.stdout).toContain("Deltas (candidate − baseline)");
    expect(compare.stdout).toContain("ELIGIBLE");
    expect(compare.stdout).toContain("Per-task (candidate arm)");
  }, 180000);
});
