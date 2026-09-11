import {
  TaskSchema,
  type Task,
} from "@seai/core";
import { generateId, nowISO, Result } from "@seai/core";
import { createTelemetry, EventTypes, type Telemetry } from "@seai/core";
import { MemoryEngine, type MemoryQuery } from "@seai/state";
import { SkillEngine } from "@seai/state";
import { ToolEngine } from "@seai/state";
import { RoutingEngine, type RoutingContext } from "@seai/runtime";
import { ModelSchema, type Model } from "@seai/core";
import { RuntimeManager, type ModelHandle } from "@seai/runtime";
import { SecurityEngine, type SecurityContext } from "@seai/core";
import { PolicyEngine, type PolicyContext } from "@seai/core";
import { EvaluationEngine, type EvaluationResult } from "./evaluation.js";

export interface CompilerConfig {
  enableOptimization: boolean;
  maxGraphDepth: number;
  cacheEnabled: boolean;
}

const DEFAULT_CONFIG: CompilerConfig = {
  enableOptimization: true,
  maxGraphDepth: 10,
  cacheEnabled: true,
};

export interface TaskGraph {
  id: string;
  goal: string;
  nodes: TaskNode[];
  edges: TaskEdge[];
  metadata: Record<string, unknown>;
}

export interface TaskNode {
  id: string;
  type: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  dependencies: string[];
  estimatedCost: number;
  estimatedLatencyMs: number;
  requiredCapabilities: string[];
  privacyLevel: string;
}

export interface TaskEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface CompilationResult {
  graph: TaskGraph;
  optimizationApplied: boolean;
  estimatedTotalCost: number;
  estimatedTotalLatencyMs: number;
  warnings: string[];
}

export class CognitiveCompiler {
  private config: CompilerConfig;
  private telemetry: Telemetry;
  private memoryEngine: MemoryEngine;
  private skillEngine: SkillEngine;
  private toolEngine: ToolEngine;
  private routingEngine: RoutingEngine;
  private runtimeManager: RuntimeManager;
  private securityEngine: SecurityEngine;
  private policyEngine: PolicyEngine;
  private evaluationEngine: EvaluationEngine;
  private compilationCache: Map<string, CompilationResult> = new Map();

  constructor(
    config: Partial<CompilerConfig>,
    telemetry: Telemetry,
    memoryEngine: MemoryEngine,
    skillEngine: SkillEngine,
    toolEngine: ToolEngine,
    routingEngine: RoutingEngine,
    runtimeManager: RuntimeManager,
    securityEngine: SecurityEngine,
    policyEngine: PolicyEngine,
    evaluationEngine: EvaluationEngine
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.telemetry = telemetry;
    this.memoryEngine = memoryEngine;
    this.skillEngine = skillEngine;
    this.toolEngine = toolEngine;
    this.routingEngine = routingEngine;
    this.runtimeManager = runtimeManager;
    this.securityEngine = securityEngine;
    this.policyEngine = policyEngine;
    this.evaluationEngine = evaluationEngine;
  }

  async compile(goal: string, context: {
    mindId: string;
    securityContext: SecurityContext;
    policyContext: PolicyContext;
    hardwareProfile: any;
    availableModels: Model[];
    availableProviders: any[];
  }): Promise<Result<CompilationResult, Error>> {
    const cacheKey = this.getCacheKey(goal, context);
    
    if (this.config.cacheEnabled && this.compilationCache.has(cacheKey)) {
      return Result.ok(this.compilationCache.get(cacheKey)!);
    }

    try {
      const classification = this.classifyGoal(goal);
      const nodes = await this.generateNodes(goal, classification, context);
      const edges = this.generateEdges(nodes);
      
      let graph: TaskGraph = {
        id: generateId(),
        goal,
        nodes,
        edges,
        metadata: { classification, compiledAt: nowISO() },
      };

      let optimizationApplied = false;
      if (this.config.enableOptimization) {
        graph = this.optimizeGraph(graph, context);
        optimizationApplied = true;
      }

      const result: CompilationResult = {
        graph,
        optimizationApplied,
        estimatedTotalCost: this.estimateTotalCost(graph),
        estimatedTotalLatencyMs: this.estimateTotalLatency(graph),
        warnings: this.validateGraph(graph),
      };

      if (this.config.cacheEnabled) {
        this.compilationCache.set(cacheKey, result);
      }

      this.telemetry.emitEvent(EventTypes.TASK_CREATED, "cognitive-compiler", { 
        goal, 
        graphId: graph.id, 
        nodeCount: graph.nodes.length 
      });

      return Result.ok(result);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private classifyGoal(goal: string): { category: string; complexity: number; requiredCapabilities: string[] } {
    const lowerGoal = goal.toLowerCase();
    
    if (lowerGoal.includes("code") || lowerGoal.includes("program") || lowerGoal.includes("implement")) {
      return { category: "coding", complexity: 0.7, requiredCapabilities: ["coding"] };
    }
    if (lowerGoal.includes("research") || lowerGoal.includes("investigate") || lowerGoal.includes("find")) {
      return { category: "research", complexity: 0.8, requiredCapabilities: ["reasoning", "extraction", "tool-use"] };
    }
    if (lowerGoal.includes("summarize") || lowerGoal.includes("summary")) {
      return { category: "summarization", complexity: 0.4, requiredCapabilities: ["summarization"] };
    }
    if (lowerGoal.includes("extract") || lowerGoal.includes("parse")) {
      return { category: "extraction", complexity: 0.5, requiredCapabilities: ["extraction", "structured-output"] };
    }
    if (lowerGoal.includes("plan") || lowerGoal.includes("strategy")) {
      return { category: "planning", complexity: 0.9, requiredCapabilities: ["reasoning", "planning"] };
    }
    if (lowerGoal.includes("reason") || lowerGoal.includes("analyze")) {
      return { category: "reasoning", complexity: 0.8, requiredCapabilities: ["reasoning"] };
    }
    
    return { category: "general", complexity: 0.5, requiredCapabilities: ["chat"] };
  }

  private async generateNodes(
    goal: string,
    classification: { category: string; complexity: number; requiredCapabilities: string[] },
    context: { mindId: string; availableModels: Model[]; availableProviders: any[]; securityContext: SecurityContext; policyContext: PolicyContext; hardwareProfile: any }
  ): Promise<TaskNode[]> {
    const nodes: TaskNode[] = [];
    const nodeId = (suffix: string) => `${classification.category}-${suffix}`;

    // Check memory first (cheapest)
    nodes.push({
      id: nodeId("check-memory"),
      type: "memory-check",
      name: "Check Memory",
      description: "Retrieve relevant memories for the goal",
      inputSchema: { goal: "string" },
      outputSchema: { memories: "array" },
      dependencies: [],
      estimatedCost: 0,
      estimatedLatencyMs: 50,
      requiredCapabilities: [],
      privacyLevel: context.securityContext.privacyLevel,
    });

    // Check for relevant skills
    nodes.push({
      id: nodeId("check-skills"),
      type: "skill-check",
      name: "Check Skills",
      description: "Find applicable skills for the goal",
      inputSchema: { goal: "string", capabilities: "string[]" },
      outputSchema: { skillId: "string?" },
      dependencies: [],
      estimatedCost: 0,
      estimatedLatencyMs: 50,
      requiredCapabilities: [],
      privacyLevel: context.securityContext.privacyLevel,
    });

    // Check for applicable tools
    nodes.push({
      id: nodeId("check-tools"),
      type: "tool-check",
      name: "Check Tools",
      description: "Find applicable tools for the goal",
      inputSchema: { goal: "string", capabilities: "string[]" },
      outputSchema: { toolId: "string?" },
      dependencies: [],
      estimatedCost: 0,
      estimatedLatencyMs: 50,
      requiredCapabilities: [],
      privacyLevel: context.securityContext.privacyLevel,
    });

    // Main execution node
    const mainNode: TaskNode = {
      id: nodeId("execute"),
      type: classification.category,
      name: `Execute ${classification.category}`,
      description: `Main execution for ${classification.category}`,
      inputSchema: { goal: "string", context: "object" },
      outputSchema: { result: "unknown" },
      dependencies: [nodeId("check-memory"), nodeId("check-skills"), nodeId("check-tools")],
      estimatedCost: this.estimateExecutionCost(classification),
      estimatedLatencyMs: this.estimateExecutionLatency(classification),
      requiredCapabilities: classification.requiredCapabilities,
      privacyLevel: context.securityContext.privacyLevel,
    };
    nodes.push(mainNode);

    // Verification node
    nodes.push({
      id: nodeId("verify"),
      type: "verification",
      name: "Verify Result",
      description: "Verify the execution result meets quality criteria",
      inputSchema: { result: "unknown", goal: "string" },
      outputSchema: { verified: "boolean", issues: "string[]" },
      dependencies: [nodeId("execute")],
      estimatedCost: 0.001,
      estimatedLatencyMs: 500,
      requiredCapabilities: ["evaluation"],
      privacyLevel: context.securityContext.privacyLevel,
    });

    // Escalation node (conditional)
    nodes.push({
      id: nodeId("escalate"),
      type: "escalation",
      name: "Escalate",
      description: "Escalate to more capable model if verification fails",
      inputSchema: { result: "unknown", issues: "string[]" },
      outputSchema: { result: "unknown" },
      dependencies: [nodeId("verify")],
      estimatedCost: this.estimateExecutionCost(classification) * 2,
      estimatedLatencyMs: this.estimateExecutionLatency(classification) * 2,
      requiredCapabilities: classification.requiredCapabilities,
      privacyLevel: context.securityContext.privacyLevel,
    });

    return nodes;
  }

  private generateEdges(nodes: TaskNode[]): TaskEdge[] {
    const edges: TaskEdge[] = [];
    
    for (const node of nodes) {
      for (const dep of node.dependencies) {
        edges.push({ from: dep, to: node.id });
      }
    }
    
    // Add conditional edge for escalation
    const verifyNode = nodes.find(n => n.type === "verification");
    const escalateNode = nodes.find(n => n.type === "escalation");
    if (verifyNode && escalateNode) {
      edges.push({ from: verifyNode.id, to: escalateNode.id, condition: "!verified" });
    }
    
    return edges;
  }

  private optimizeGraph(graph: TaskGraph, context: any): TaskGraph {
    // Remove redundant nodes
    const optimizedNodes = graph.nodes.filter(node => {
      // Keep essential nodes
      if (["memory-check", "skill-check", "tool-check", "verification"].includes(node.type)) return true;
      if (node.type === "escalation") return true;
      return true;
    });

    // Merge sequential nodes where possible
    // This is a simplified optimization

    return {
      ...graph,
      nodes: optimizedNodes,
      metadata: { ...graph.metadata, optimized: true, optimizedAt: nowISO() },
    };
  }

  private estimateTotalCost(graph: TaskGraph): number {
    return graph.nodes.reduce((sum, node) => sum + node.estimatedCost, 0);
  }

  private estimateTotalLatency(graph: TaskGraph): number {
    // Critical path estimation
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
    const visited = new Set<string>();
    
    const calculateLatency = (nodeId: string): number => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);
      
      const node = nodeMap.get(nodeId);
      if (!node) return 0;
      
      const depLatencies = node.dependencies.map(dep => calculateLatency(dep));
      const maxDepLatency = depLatencies.length > 0 ? Math.max(...depLatencies) : 0;
      
      return maxDepLatency + node.estimatedLatencyMs;
    };

    // Find sink nodes (nodes with no outgoing edges)
    const hasOutgoing = new Set(graph.edges.map(e => e.from));
    const sinkNodes = graph.nodes.filter(n => !hasOutgoing.has(n.id));
    
    return Math.max(...sinkNodes.map(n => calculateLatency(n.id)));
  }

  private validateGraph(graph: TaskGraph): string[] {
    const warnings: string[] = [];
    
    // Check for cycles
    if (this.hasCycles(graph)) {
      warnings.push("Graph contains cycles");
    }
    
    // Check for unreachable nodes
    const reachable = this.findReachableNodes(graph);
    const unreachable = graph.nodes.filter(n => !reachable.has(n.id));
    if (unreachable.length > 0) {
      warnings.push(`${unreachable.length} unreachable nodes`);
    }
    
    // Check depth
    const depth = this.calculateGraphDepth(graph);
    if (depth > this.config.maxGraphDepth) {
      warnings.push(`Graph depth ${depth} exceeds maximum ${this.config.maxGraphDepth}`);
    }
    
    return warnings;
  }

  private hasCycles(graph: TaskGraph): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
    const adjList = new Map<string, string[]>();
    
    for (const node of graph.nodes) {
      adjList.set(node.id, []);
    }
    for (const edge of graph.edges) {
      adjList.get(edge.from)?.push(edge.to);
    }
    
    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);
      
      for (const neighbor of adjList.get(nodeId) || []) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
      
      recStack.delete(nodeId);
      return false;
    };
    
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }
    
    return false;
  }

  private findReachableNodes(graph: TaskGraph): Set<string> {
    const reachable = new Set<string>();
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
    const adjList = new Map<string, string[]>();
    
    for (const node of graph.nodes) {
      adjList.set(node.id, []);
    }
    for (const edge of graph.edges) {
      adjList.get(edge.from)?.push(edge.to);
    }
    
    // Find source nodes (no incoming edges)
    const hasIncoming = new Set(graph.edges.map(e => e.to));
    const sourceNodes = graph.nodes.filter(n => !hasIncoming.has(n.id));
    
    const dfs = (nodeId: string) => {
      if (reachable.has(nodeId)) return;
      reachable.add(nodeId);
      for (const neighbor of adjList.get(nodeId) || []) {
        dfs(neighbor);
      }
    };
    
    for (const source of sourceNodes) {
      dfs(source.id);
    }
    
    return reachable;
  }

  private calculateGraphDepth(graph: TaskGraph): number {
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
    const adjList = new Map<string, string[]>();
    
    for (const node of graph.nodes) {
      adjList.set(node.id, []);
    }
    for (const edge of graph.edges) {
      adjList.get(edge.from)?.push(edge.to);
    }
    
    const hasIncoming = new Set(graph.edges.map(e => e.to));
    const sourceNodes = graph.nodes.filter(n => !hasIncoming.has(n.id));
    
    const memo = new Map<string, number>();
    
    const dfs = (nodeId: string): number => {
      if (memo.has(nodeId)) return memo.get(nodeId)!;
      
      const neighbors = adjList.get(nodeId) || [];
      if (neighbors.length === 0) {
        memo.set(nodeId, 1);
        return 1;
      }
      
      const maxDepth = Math.max(...neighbors.map(dfs));
      const depth = maxDepth + 1;
      memo.set(nodeId, depth);
      return depth;
    };
    
    return Math.max(...sourceNodes.map(n => dfs(n.id)));
  }

  private estimateExecutionCost(classification: { category: string; complexity: number }): number {
    const baseCosts: Record<string, number> = {
      coding: 0.01,
      research: 0.02,
      summarization: 0.002,
      extraction: 0.005,
      planning: 0.015,
      reasoning: 0.01,
      general: 0.005,
    };
    return (baseCosts[classification.category] || 0.005) * classification.complexity;
  }

  private estimateExecutionLatency(classification: { category: string; complexity: number }): number {
    const baseLatencies: Record<string, number> = {
      coding: 10000,
      research: 15000,
      summarization: 3000,
      extraction: 5000,
      planning: 10000,
      reasoning: 8000,
      general: 5000,
    };
    return Math.round((baseLatencies[classification.category] || 5000) * classification.complexity);
  }

  private getCacheKey(goal: string, context: any): string {
    return `${goal}:${context.mindId}:${context.hardwareProfile.cpu.cores}:${context.availableModels.length}`;
  }

  clearCache(): void {
    this.compilationCache.clear();
  }
}

export function createCognitiveCompiler(
  config: Partial<CompilerConfig>,
  telemetry: Telemetry,
  memoryEngine: MemoryEngine,
  skillEngine: SkillEngine,
  toolEngine: ToolEngine,
  routingEngine: RoutingEngine,
  runtimeManager: RuntimeManager,
  securityEngine: SecurityEngine,
  policyEngine: PolicyEngine,
  evaluationEngine: EvaluationEngine
): CognitiveCompiler {
  return new CognitiveCompiler(config, telemetry, memoryEngine, skillEngine, toolEngine, routingEngine, runtimeManager, securityEngine, policyEngine, evaluationEngine);
}

export interface CompilerPipeline {
  stages: Array<{
    name: string;
    compile: (goal: string, context: any) => Promise<Partial<TaskGraph>>;
  }>;
}

export function createCompilerPipeline(stages: CompilerPipeline["stages"]): CompilerPipeline {
  return { stages };
}

export async function runCompilerPipeline(
  pipeline: CompilerPipeline,
  goal: string,
  context: any
): Promise<TaskGraph> {
  let graph: Partial<TaskGraph> = { goal, nodes: [], edges: [], metadata: {} };
  
  for (const stage of pipeline.stages) {
    const partial = await stage.compile(goal, context);
    graph = { ...graph, ...partial };
  }
  
  return graph as TaskGraph;
}

export const DEFAULT_COMPILER_PIPELINE: CompilerPipeline = {
  stages: [
    {
      name: "analyze",
      compile: async (goal) => ({ goal }),
    },
    {
      name: "decompose",
      compile: async (goal) => ({ nodes: [] }),
    },
    {
      name: "optimize",
      compile: async (goal, context) => ({ metadata: { optimized: true } }),
    },
    {
      name: "validate",
      compile: async (goal) => ({ metadata: { validated: true } }),
    },
  ],
};