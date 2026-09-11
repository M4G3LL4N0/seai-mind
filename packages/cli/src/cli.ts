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
import { MindRuntime, createMindRuntime, DEFAULT_MIND_TEMPLATE, MindConfig, MindTemplate } from "@seai/mind";
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
  .action(async (task, options) => {
    const spinner = ora("Running task...").start();
    
    try {
      const client = createClient({
        mindName: "default",
        generation: "Darwin",
        codename: "Darwin 0.1",
        autoInitialize: true,
      });

      await client.initialize();
      
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

program
  .command("evolve <weakness>")
  .description("Trigger evolution to address a weakness")
  .action(async (weakness) => {
    const spinner = ora(`Evolving to address: ${weakness}...`).start();
    
    try {
      const client = createClient({
        mindName: "default",
        generation: "Darwin",
        codename: "Darwin 0.1",
        autoInitialize: true,
      });

      await client.initialize();
      
      const result = await client.evolve(weakness);
      
      spinner.succeed("Evolution cycle completed");
      
      console.log("\n" + chalk.bold("Evolution Result:"));
      console.log(chalk.gray("─".repeat(50)));
      console.log(JSON.stringify(result, null, 2));
      
      await client.shutdown();
      
    } catch (error) {
      spinner.fail("Evolution failed");
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
