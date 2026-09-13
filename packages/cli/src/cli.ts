#!/usr/bin/env node

import { Command } from "commander";
import { createClient, quickStart } from "@seai/sdk";
import { detectHardware, generateId, nowISO, createTelemetry, EventTypes } from "@seai/core";
import { createStorage, StorageAdapter } from "@seai/core";
import { SecurityEngine } from "@seai/core";
import { PolicyEngine } from "@seai/core";
import { createMemoryEngine, MemoryEngine } from "@seai/state";
import { createSkillEngine, SkillEngine } from "@seai/state";
import { createToolEngine, ToolEngine } from "@seai/state";
import { createRoutingEngine, RoutingEngine } from "@seai/runtime";
import { createRuntimeManager, RuntimeManager } from "@seai/runtime";
import { CognitionEngine } from "@seai/mind";
import { CognitiveCompiler } from "@seai/mind";
import { EvaluationEngine } from "@seai/mind";
import { EvolutionEngine } from "@seai/mind";
import { createGenomeEngine, GenomeEngine } from "@seai/state";
import { BenchmarkEngine } from "@seai/mind";
import { MindRuntime, createMindRuntime, DEFAULT_MIND_TEMPLATE, MindConfig, MindTemplate, defaultStorePaths, getActiveGenome, readExperimentHistory, loadGenomeSnapshot, promoteInStore, rollbackInStore, verifyHistoryIntegrity } from "@seai/mind";
import { IdentitySchema, VersionSchema, type Identity, type Version } from "@seai/core";
import chalk from "chalk";
import ora from "ora";

const program = new Command();

program
  .name("seai")
  .description("SE-AI Mind CLI - Self-Evolving Artificial Intelligence")
  .version("0.1.0-alpha");

program
  .command("doctor")
  .description("Check system health and dependencies")
  .action(async () => {
    const spinner = ora("Running system diagnostics...").start();
    
    try {
      const hardware = await detectHardware();
      
      spinner.succeed("System diagnostics complete");
      
      console.log("\n" + chalk.bold("Hardware Profile:"));
      console.log(chalk.gray("─".repeat(50)));
      console.log(`CPU: ${hardware.cpu.model} (${hardware.cpu.cores} cores, ${hardware.cpu.threads} threads)`);
      console.log(`Architecture: ${hardware.cpu.architecture}`);
      console.log(`RAM: ${(hardware.memory.totalBytes / 1024 / 1024 / 1024).toFixed(1)} GB`);
      console.log(`Available RAM: ${((hardware.memory.availableBytes ?? 0) / 1024 / 1024 / 1024).toFixed(1)} GB`);
      console.log(`Unified Memory: ${hardware.memory.unified ? "Yes" : "No"}`);
      console.log(`GPU: ${hardware.gpu.present ? hardware.gpu.model : "None"} (${hardware.gpu.vendor || "N/A"})`);
      if (hardware.gpu.memoryBytes) {
        console.log(`VRAM: ${(hardware.gpu.memoryBytes / 1024 / 1024 / 1024).toFixed(1)} GB`);
      }
      console.log(`Storage: ${hardware.storage.type} (${(hardware.storage.availableBytes / 1024 / 1024 / 1024).toFixed(1)} GB free)`);
      console.log(`OS: ${hardware.os.platform} ${hardware.os.release}`);
      
      if (hardware.battery?.present) {
        console.log(`Battery: ${((hardware.battery.level ?? 0) * 100).toFixed(0)}% ${hardware.battery.charging ? "(charging)" : ""}`);
      }
      
      if (hardware.thermal?.supported) {
        console.log(`Temperature: ${(hardware.thermal.temperatureCelsius ?? 0).toFixed(1)}°C`);
      }
      
      console.log(`Load: ${(hardware.load?.average1m ?? 0).toFixed(2)} / ${(hardware.load?.average5m ?? 0).toFixed(2)} / ${(hardware.load?.average15m ?? 0).toFixed(2)}`);
      
    } catch (error) {
      spinner.fail("System diagnostics failed");
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Initialize a new SE-AI Mind")
  .option("-n, --name <name>", "Mind name", "MyMind")
  .option("-g, --generation <generation>", "Generation name", "Darwin")
  .option("-c, --codename <codename>", "Codename", "Darwin 0.1")
  .option("--template <template>", "Template to use (default, minimal, research)", "default")
  .action(async (options) => {
    const spinner = ora(`Initializing ${options.name}...`).start();
    
    try {
      const client = createClient({
        mindName: options.name,
        generation: options.generation,
        codename: options.codename,
        autoInitialize: true,
      });

      await client.initialize();
      
      spinner.succeed(`Mind "${options.name}" initialized successfully`);
      
      console.log("\n" + chalk.bold("Mind Details:"));
      console.log(chalk.gray("─".repeat(50)));
      console.log(`Name: ${options.name}`);
      console.log(`Generation: ${options.generation}`);
      console.log(`Codename: ${options.codename}`);
      console.log(`Template: ${options.template}`);
      console.log(`Status: ${(client.getState() as { status?: string }).status ?? "N/A"}`);
      
      console.log("\n" + chalk.green("Ready to use! Try: seai run \"Your task here\""));
      
    } catch (error) {
      spinner.fail("Initialization failed");
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

program
  .command("run <task>")
  .description("Run a task on the mind")
  .option("-p, --priority <priority>", "Task priority (0-100)", "50")
  .option("--privacy <level>", "Privacy level (public, internal, private, confidential, restricted)", "internal")
  .option("--quality <target>", "Quality target (0-1)", "0.8")
  .option("--latency <ms>", "Latency budget in ms", "30000")
  .option("--cost <budget>", "Cost budget", "0.10")
  .option("--mind <name>", "Mind name (adopts its promoted genome if any)", "default")
  .action(async (task, options) => {
    const spinner = ora("Running task...").start();

    try {
      const client = createClient({
        mindName: options.mind,
        generation: "Darwin",
        codename: "Darwin 0.1",
        autoInitialize: true,
      });

      await client.initialize();

      // Adopt the last promoted genome (if any): subsequent executions use
      // the promoted version. Best-effort — absence changes nothing.
      try {
        await client.applyActiveGenome();
      } catch {
        // No durable evolution state yet; continue with defaults.
      }

      // Attach any locally reachable model runtime (e.g. Ollama).
      // Absence is fine — the Mind then fails honestly if a model is needed.
      const local = await client.enableLocalRuntimes();
      if (local.runtimes.length > 0) {
        spinner.text = `Running task (runtime: ${local.runtimes.join(", ")}, models: ${local.models})...`;
      }

      const result = await client.runTask("general", task, {
        priority: parseInt(options.priority),
        privacy: options.privacy,
        qualityTarget: parseFloat(options.quality),
        latencyBudgetMs: parseInt(options.latency),
        costBudget: parseFloat(options.cost),
      });
      
      spinner.succeed("Task completed");
      
      console.log("\n" + chalk.bold("Result:"));
      console.log(chalk.gray("─".repeat(50)));
      console.log(JSON.stringify(result, null, 2));
      
      const state = client.getState() as { uptime?: number };
      console.log(`\nLatency: ${state.uptime ?? 0}ms`);
      
      await client.shutdown();
      
    } catch (error) {
      spinner.fail("Task failed");
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

program
  .command("goal <goal>")
  .description("Compile and execute a goal")
  .action(async (goal) => {
    const spinner = ora("Compiling goal...").start();
    
    try {
      const client = createClient({
        mindName: "default",
        generation: "Darwin",
        codename: "Darwin 0.1",
        autoInitialize: true,
      });

      await client.initialize();
      await client.enableLocalRuntimes();

      spinner.text = "Executing goal...";
      const result = await client.compileGoal(goal);
      
      spinner.succeed("Goal compiled and executed");
      
      console.log("\n" + chalk.bold("Result:"));
      console.log(chalk.gray("─".repeat(50)));
      console.log(JSON.stringify(result, null, 2));
      
      await client.shutdown();
      
    } catch (error) {
      spinner.fail("Goal execution failed");
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

const evolveCmd = program
  .command("evolve")
  .description("Self-evolution: propose, inspect, promote, and roll back real experiments");

evolveCmd
  .command("propose [weakness]")
  .description("Run a real evolution experiment (baseline vs candidate, measured, gated)")
  .option("--mind <name>", "Mind name (durable history is keyed by name)", "default")
  .option("--suite <id>", "Suite: arithmetic-format-v1 (deterministic) or extraction-json-v1 (model-backed)", "arithmetic-format-v1")
  .option("--candidates <csv>", "Candidate configs (default: suite defaults)")
  .option("--models", "Enable locally reachable model runtimes first (needed for model-backed suites)")
  .option("--repeat-runs <n>", "Run each task N times to measure per-task variance (default 1)", "1")
  .option("--max-category-regression <fraction>", "Reject if any category regresses more than this fraction", "0.10")
  .option("--variance-signal-to-noise <multiplier>", "Quality signal must exceed Nx pooled per-task variance", "2")
  .action(async (weakness, options) => {
    const spinner = ora("Running evolution experiment...").start();

    try {
      const client = createClient({
        mindName: options.mind,
        generation: "Darwin",
        codename: "Darwin 0.1",
        autoInitialize: true,
      });

      await client.initialize();

      const result = await client.evolve(weakness ?? "operator-requested experiment", {
        suiteId: options.suite,
        candidates: options.candidates
          ? String(options.candidates).split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        enableModels: Boolean(options.models),
        repeatRuns: Number(options.repeatRuns),
        gateThresholds: {
          maxCategoryRegression: Number(options.maxCategoryRegression),
          varianceSignalToNoise: Number(options.varianceSignalToNoise),
        },
      });
      const record = result as {
        experimentId: string;
        suite: string;
        baselineQuality: number;
        candidateQuality: number;
        decision: string;
        reasons: string[];
        reproducibility: string;
        extraCandidates: Array<{ candidateId: string; quality: number; decision: string }>;
        taskRuns?: number;
        perTaskVariance?: number | null;
        confidence?: string;
        evidenceHash?: string;
      };

      spinner.succeed(`Experiment completed: ${String(record.decision).toUpperCase()}`);

      console.log("\n" + chalk.bold("Evolution Experiment"));
      console.log(chalk.gray("─".repeat(50)));
      console.log(`Mind: ${options.mind}`);
      if (weakness) console.log(`Observation: ${weakness}`);
      console.log(`Experiment: ${record.experimentId}`);
      console.log(`Suite: ${record.suite}`);
      console.log(`Reproducibility: ${record.reproducibility}`);
      if (record.taskRuns && record.taskRuns > 1) {
        console.log(`Runs per task: ${record.taskRuns} (confidence: ${record.confidence}, per-task variance: ${(record.perTaskVariance ?? 0).toFixed(4)})`);
      }
      console.log(`Evidence hash: ${String(record.evidenceHash ?? "n/a").slice(0, 16)}...`);
      console.log(`\nBaseline quality: ${Number(record.baselineQuality).toFixed(2)}`);
      console.log(`Candidate quality: ${Number(record.candidateQuality).toFixed(2)}`);
      for (const extra of record.extraCandidates ?? []) {
        console.log(`Candidate ${extra.candidateId.slice(0, 8)}: quality ${Number(extra.quality).toFixed(2)} → ${String(extra.decision).toUpperCase()}`);
      }
      console.log("\nDecision:");
      console.log(`  ${String(record.decision).toUpperCase()}`);
      for (const reason of record.reasons) console.log(`  - ${reason}`);
      if (record.decision === "eligible") {
        console.log(chalk.yellow(`\nEligible but NOT promoted (auto-promote is off). Run: seai evolve promote ${record.experimentId} --mind ${options.mind}`));
      }

      await client.shutdown();

    } catch (error) {
      spinner.fail("Evolution experiment failed");
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

evolveCmd
  .command("status")
  .description("Show real evolution state: active genome, latest experiment, promotion/rollback")
  .option("--mind <name>", "Mind name", "default")
  .action(async (options) => {
    try {
      const paths = defaultStorePaths(options.mind);
      const active = await getActiveGenome(paths);
      const history = await readExperimentHistory(paths);
      const latest = history.length > 0 ? history[history.length - 1] : undefined;

      console.log("\n" + chalk.bold(`Evolution Status (Mind: ${options.mind})`));
      console.log(chalk.gray("─".repeat(50)));
      if (!active) {
        console.log("Active genome: (none yet — run: seai evolve propose)");
      } else {
        console.log(`Active genome: ${active.genomeId} (v${active.version.major}.${active.version.minor}.${active.version.patch})`);
        const parent = await loadGenomeSnapshot(paths, active.genomeId).then(
          (g) => g?.parentGenome ?? null
        ).catch(() => null);
        console.log(`Rollback available: ${parent ? `yes (to ${parent})` : "no (genesis genome)"}`);
      }
      if (!latest) {
        console.log("Latest experiment: (none)");
      } else {
        console.log(`Latest experiment: ${latest.id} (${latest.suiteId}) → ${latest.gate.decision.toUpperCase()}`);
        console.log(`  baseline quality ${latest.baseline.qualityRate.toFixed(2)} vs candidate ${latest.candidateResult.qualityRate.toFixed(2)}`);
        console.log(`  promotion: ${latest.promotion ? latest.promotion.promotedGenomeId : "(none)"}`);
        console.log(`  rollback: ${latest.rollback ? latest.rollback.rolledBackGenomeId : "(none)"}`);
      }
      console.log(`Experiments on record: ${history.length}`);
    } catch (error) {
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

evolveCmd
  .command("history")
  .description("List recorded evolution experiments with decisions")
  .option("--mind <name>", "Mind name", "default")
  .action(async (options) => {
    try {
      const history = await readExperimentHistory(defaultStorePaths(options.mind));
      if (history.length === 0) {
        console.log("No evolution experiments recorded yet. Run: seai evolve propose");
        return;
      }
      console.log("\n" + chalk.bold(`Evolution History (Mind: ${options.mind})`));
      console.log(chalk.gray("─".repeat(50)));
      for (const record of history) {
        console.log(
          `${record.id}  ${record.suiteId}  ${record.gate.decision.toUpperCase()}  ` +
          `q ${record.baseline.qualityRate.toFixed(2)}→${record.candidateResult.qualityRate.toFixed(2)}  ` +
          `${record.promotion ? `promoted ${record.promotion.promotedGenomeId.slice(0, 8)}` : "not promoted"}  ` +
          `${record.rollback ? `rolled-back (${record.rollback.reason})` : ""}`
        );
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

evolveCmd
  .command("verify")
  .description("Audit evolution store integrity: verify evidence hashes, report tampering")
  .option("--mind <name>", "Mind name", "default")
  .action(async (options) => {
    try {
      const paths = defaultStorePaths(options.mind);
      const integrity = await verifyHistoryIntegrity(paths);
      console.log("\n" + chalk.bold(`Evolution Store Integrity (Mind: ${options.mind})`));
      console.log(chalk.gray("─".repeat(50)));
      console.log(`Lines:        ${integrity.total}`);
      console.log(`Verified:     ${integrity.verified} (signature matches measured evidence)`);
      console.log(`Legacy:       ${integrity.unsigned} (pre-hash records, tolerated)`);
      console.log(`Tampered:     ${integrity.tampered}`);
      if (integrity.tampered > 0) {
        console.log(chalk.red(`\nWARNING: ${integrity.tampered} line(s) failed evidence verification.`));
        console.log(chalk.red("Every tampered line is excluded from history — never silently accepted."));
        process.exitCode = 1;
      } else {
        console.log(chalk.green("\nStore integrity OK."));
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

evolveCmd
  .command("compare <experimentId>")
  .description("Show per-arm measurements and deltas for one experiment")
  .option("--mind <name>", "Mind name", "default")
  .action(async (experimentId, options) => {
    try {
      const history = await readExperimentHistory(defaultStorePaths(options.mind));
      const record = history.find((r) => r.id === experimentId);
      if (!record) {
        console.error(chalk.red(`Error: experiment not found: ${experimentId}`));
        process.exit(1);
      }
      const arm = (name: string, a: { successCount: number; taskCount: number; qualityRate: number; verificationRate: number; meanLatencyMs: number | null; totalTokensKnown: number; tokensUnknown: number }) =>
        `${name}: success ${a.successCount}/${a.taskCount}  quality ${a.qualityRate.toFixed(2)}  verified ${a.verificationRate.toFixed(2)}  latency ${a.meanLatencyMs?.toFixed(1) ?? "n/a"}ms  tokens ${a.tokensUnknown > 0 ? "n/a" : String(a.totalTokensKnown)}`;
      console.log("\n" + chalk.bold(`Experiment ${record.id} (${record.suiteId})`));
      console.log(chalk.gray("─".repeat(50)));
      console.log(arm("baseline ", record.baseline));
      console.log(arm("candidate", record.candidateResult));
      for (const extra of record.extraCandidates ?? []) {
        console.log(arm(`extra ${extra.candidate.id.slice(0, 8)}`, extra.result));
      }
      console.log("\nDeltas (candidate − baseline):");
      console.log(`  success ${record.deltas.success_delta >= 0 ? "+" : ""}${record.deltas.success_delta.toFixed(2)}  quality ${record.deltas.quality_delta >= 0 ? "+" : ""}${record.deltas.quality_delta.toFixed(2)}  verified ${record.deltas.verification_delta >= 0 ? "+" : ""}${record.deltas.verification_delta.toFixed(2)}`);
      console.log(`  latency ${record.deltas.latency_delta_ms === null ? "n/a" : `${record.deltas.latency_delta_ms >= 0 ? "+" : ""}${record.deltas.latency_delta_ms.toFixed(1)}ms`}  tokens ${record.deltas.token_delta === null ? "n/a (not measured)" : String(record.deltas.token_delta)}`);
      console.log(`\nDecision: ${record.gate.decision.toUpperCase()}  reproducibility: ${record.reproducibility}`);
      for (const reason of record.gate.reasons) console.log(`  - ${reason}`);
      console.log("\nPer-task (candidate arm):");
      for (const m of record.candidateResult.measurements) {
        console.log(`  ${m.taskId}: ${m.success ? (m.outputMatches ? "pass" : "FAIL-match") : "FAIL-exec"}  ${m.executionPath}${m.modelUsed ? ` ${m.modelUsed.slice(0, 8)}` : ""}  ${m.latencyMs}ms${m.tokensUsed !== null ? `  ${m.tokensUsed}tok` : ""}${m.error ? `  err: ${m.error.slice(0, 80)}` : ""}`);
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

evolveCmd
  .command("promote <experimentId> [candidateId]")
  .description("Explicitly promote an ELIGIBLE candidate to production (never automatic)")
  .option("--mind <name>", "Mind name", "default")
  .action(async (experimentId, candidateId, options) => {
    const spinner = ora(`Promoting ${experimentId}...`).start();
    try {
      const { genome } = await promoteInStore(defaultStorePaths(options.mind), experimentId, candidateId);
      spinner.succeed(`Promoted genome ${genome.id} (v${genome.version.major}.${genome.version.minor}.${genome.version.patch})`);
      console.log(`Active genome is now ${genome.id}. Subsequent runs use the promoted version.`);
    } catch (error) {
      spinner.fail("Promotion failed");
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

evolveCmd
  .command("rollback")
  .description("Roll back the active genome to its parent (lineage preserved)")
  .option("--mind <name>", "Mind name", "default")
  .option("--reason <reason>", "Rollback reason", "manual rollback via CLI")
  .action(async (options) => {
    const spinner = ora("Rolling back...").start();
    try {
      const { genome } = await rollbackInStore(defaultStorePaths(options.mind), options.reason);
      spinner.succeed(`Rolled back to genome ${genome.id} (v${genome.version.major}.${genome.version.minor}.${genome.version.patch})`);
    } catch (error) {
      spinner.fail("Rollback failed");
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

program
  .command("benchmark [name]")
  .description("Run benchmarks")
  .option("--experiment <name>", "Experiment name", "default-benchmark")
  .action(async (name, options) => {
    const spinner = ora(`Running benchmark: ${options.experiment}...`).start();
    
    try {
      const client = createClient({
        mindName: "default",
        generation: "Darwin",
        codename: "Darwin 0.1",
        autoInitialize: true,
      });

      await client.initialize();
      
      const result = await client.benchmark(options.experiment);
      
      spinner.succeed("Benchmark completed");
      
      console.log("\n" + chalk.bold("Benchmark Results:"));
      console.log(chalk.gray("─".repeat(50)));
      console.log(JSON.stringify(result, null, 2));
      
      await client.shutdown();
      
    } catch (error) {
      spinner.fail("Benchmark failed");
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

program
  .command("mind")
  .description("Mind management commands")
  .addCommand(
    new Command("list")
      .description("List all minds")
      .action(() => {
        console.log("Mind listing not yet implemented");
      })
  )
  .addCommand(
    new Command("inspect <id>")
      .description("Inspect a mind")
      .action((id) => {
        console.log(`Inspecting mind: ${id}`);
        console.log("Mind inspection not yet implemented");
      })
  )
  .addCommand(
    new Command("create")
      .description("Create a new mind")
      .option("-n, --name <name>", "Mind name")
      .option("-g, --generation <generation>", "Generation")
      .option("-c, --codename <codename>", "Codename")
      .action((options) => {
        console.log("Mind creation not yet implemented");
      })
  );

program
  .command("genome")
  .description("Genome management commands")
  .addCommand(
    new Command("show [id]")
      .description("Show genome details")
      .action((id) => {
        console.log(`Showing genome: ${id || "latest"}`);
        console.log("Genome display not yet implemented");
      })
  )
  .addCommand(
    new Command("diff <id1> <id2>")
      .description("Compare two genomes")
      .action((id1, id2) => {
        console.log(`Comparing genomes: ${id1} vs ${id2}`);
        console.log("Genome diff not yet implemented");
      })
  )
  .addCommand(
    new Command("branch <name>")
      .description("Create a genome branch")
      .action((name) => {
        console.log(`Creating branch: ${name}`);
        console.log("Branch creation not yet implemented");
      })
  );

program
  .command("memory")
  .description("Memory management commands")
  .addCommand(
    new Command("inspect")
      .description("Inspect memory")
      .action(() => {
        console.log("Memory inspection not yet implemented");
      })
  )
  .addCommand(
    new Command("clear")
      .description("Clear working memory")
      .action(() => {
        console.log("Memory clearing not yet implemented");
      })
  );

program
  .command("skill")
  .description("Skill management commands")
  .addCommand(
    new Command("list")
      .description("List all skills")
      .action(() => {
        console.log("Skill listing not yet implemented");
      })
  )
  .addCommand(
    new Command("create <name>")
      .description("Create a new skill")
      .action((name) => {
        console.log(`Creating skill: ${name}`);
        console.log("Skill creation not yet implemented");
      })
  );

program
  .command("model")
  .description("Model management commands")
  .addCommand(
    new Command("list")
      .description("List available models")
      .action(async () => {
        try {
          const runtimeManager = createRuntimeManager();
          // Would list models from all runtimes
          console.log("Model listing not yet implemented");
        } catch (error) {
          console.error("Error:", error);
        }
      })
  )
  .addCommand(
    new Command("pull <model>")
      .description("Pull a model")
      .action((model) => {
        console.log(`Pulling model: ${model}`);
        console.log("Model pull not yet implemented");
      })
  );

program
  .command("provider")
  .description("Provider management commands")
  .addCommand(
    new Command("list")
      .description("List providers")
      .action(() => {
        console.log("Provider listing not yet implemented");
      })
  )
  .addCommand(
    new Command("discover <endpoint>")
      .description("Discover a provider")
      .action((endpoint) => {
        console.log(`Discovering provider: ${endpoint}`);
        console.log("Provider discovery not yet implemented");
      })
  );

program
  .command("hardware")
  .description("Hardware inspection")
  .action(async () => {
    const spinner = ora("Detecting hardware...").start();
    
    try {
      const hardware = await detectHardware();
      spinner.succeed("Hardware detected");
      
      console.log("\n" + chalk.bold("Hardware Profile:"));
      console.log(chalk.gray("─".repeat(50)));
      console.log(JSON.stringify(hardware, null, 2));
      
    } catch (error) {
      spinner.fail("Hardware detection failed");
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

program
  .command("status")
  .description("Show mind status")
  .action(async () => {
    try {
      const client = createClient({
        mindName: "default",
        generation: "Darwin",
        codename: "Darwin 0.1",
        autoInitialize: true,
      });

      await client.initialize();
      
      const state = client.getState() as { name?: string; status?: string; activeTasks?: number; uptime?: number; lastActivity?: string };
      
      console.log("\n" + chalk.bold("Mind Status:"));
      console.log(chalk.gray("─".repeat(50)));
      console.log(`Name: ${state.name ?? "N/A"}`);
      console.log(`Status: ${state.status ?? "N/A"}`);
      console.log(`Active Tasks: ${state.activeTasks ?? 0}`);
      console.log(`Uptime: ${Math.floor((state.uptime ?? 0) / 1000)}s`);
      console.log(`Last Activity: ${state.lastActivity ?? "N/A"}`);
      
      await client.shutdown();
      
    } catch (error) {
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

program
  .command("quickstart <task>")
  .description("Quick start with a task")
  .action(async (task) => {
    const spinner = ora("Quick starting...").start();
    
    try {
      const { client, result } = await quickStart({
        mindName: "quickstart",
        goal: task,
      });
      
      spinner.succeed("Quick start completed");
      
      if (result) {
        console.log("\n" + chalk.bold("Result:"));
        console.log(chalk.gray("─".repeat(50)));
        console.log(JSON.stringify(result, null, 2));
      }
      
      await client.shutdown();
      
    } catch (error) {
      spinner.fail("Quick start failed");
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

export async function main(): Promise<void> {
  await program.parseAsync(process.argv);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
