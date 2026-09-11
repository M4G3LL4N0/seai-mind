import { describe, it, expect } from "vitest";
import {
  createMemoryEngine,
  memoryEngine as singletonMemory,
  createSkillEngine,
  createToolEngine,
  toolEngine as singletonTools,
  createGenomeEngine,
} from "../index.js";
import { createTelemetry, createStorage, SecurityEngine, generateId } from "@seai/core";

function testDeps() {
  const telemetry = createTelemetry({ enabled: false });
  // Isolated storage per test: no cross-test contamination through the singleton.
  const storage = createStorage();
  const security = new SecurityEngine();
  return { telemetry, storage, security };
}

const ctx = (privacyLevel = "internal") => ({
  userId: "test",
  sessionId: "test-session",
  permissions: ["memory:read", "memory:write", "tool:execute"],
  privacyLevel,
  securityLevel: "low",
});

describe("state/memory REAL", () => {
  it("memory engine creates with deps", () => {
    const { telemetry, storage, security } = testDeps();
    const engine = createMemoryEngine({}, telemetry, storage, security);
    expect(engine).toBeDefined();
    expect(typeof engine.capture).toBe("function");
    expect(typeof engine.retrieve).toBe("function");
  });

  it("memory STORE then GETBYID roundtrip (REAL)", async () => {
    const { telemetry, storage, security } = testDeps();
    const engine = createMemoryEngine({}, telemetry, storage, security);
    await engine.initialize();
    const mindId = `mind-${Date.now()}`;
    const cap = await engine.capture(mindId, "episodic", { text: "hello world" }, ctx() as never);
    expect(cap.ok).toBe(true);
    if (!cap.ok) return;
    expect(cap.value.mindId).toBe(mindId);
    const got = await engine.getById(cap.value.id, ctx() as never);
    expect(got.ok).toBe(true);
    if (got.ok) {
      expect(got.value?.id).toBe(cap.value.id);
      expect(got.value?.mindId).toBe(mindId);
    }
    const ret = await engine.retrieve(mindId, { limit: 10 }, ctx() as never);
    expect(ret.ok).toBe(true);
    await engine.shutdown().catch(() => undefined);
  });

  it("singleton memory engine exists", () => {
    expect(singletonMemory).toBeDefined();
  });
});

describe("state/memory ISOLATION (P0)", () => {
  it("Mind A cannot retrieve Mind B's memory and vice versa", async () => {
    const { telemetry, storage, security } = testDeps();
    const engine = createMemoryEngine({}, telemetry, storage, security);
    await engine.initialize();

    const mindA = generateId();
    const mindB = generateId();

    const a1 = await engine.capture(mindA, "episodic", { text: "A secret one" }, ctx() as never);
    const a2 = await engine.capture(mindA, "semantic", { text: "A secret two" }, ctx() as never);
    const b1 = await engine.capture(mindB, "episodic", { text: "B secret one" }, ctx() as never);
    expect(a1.ok).toBe(true);
    expect(a2.ok).toBe(true);
    expect(b1.ok).toBe(true);
    if (!a1.ok || !a2.ok || !b1.ok) return;

    // Listing path: A receives only A, B receives only B.
    const retA = await engine.retrieve(mindA, { limit: 100 }, ctx() as never);
    const retB = await engine.retrieve(mindB, { limit: 100 }, ctx() as never);
    expect(retA.ok).toBe(true);
    expect(retB.ok).toBe(true);
    if (!retA.ok || !retB.ok) return;
    expect(retA.value.map((m) => m.id).sort()).toEqual([a1.value.id, a2.value.id].sort());
    expect(retB.value.map((m) => m.id)).toEqual([b1.value.id]);
    for (const m of retA.value) expect(m.mindId).toBe(mindA);
    for (const m of retB.value) expect(m.mindId).toBe(mindB);

    // Search path: searchText must not leak across Minds.
    const searchA = await engine.retrieve(mindA, { searchText: "secret", limit: 100 }, ctx() as never);
    expect(searchA.ok).toBe(true);
    if (searchA.ok) {
      expect(searchA.value.length).toBe(2);
      for (const m of searchA.value) expect(m.mindId).toBe(mindA);
    }

    // Direct-ID path: cross-Mind getById is denied (fail closed).
    const cross = await engine.getById(a1.value.id, ctx() as never, mindB);
    expect(cross.ok).toBe(false);
    const own = await engine.getById(a1.value.id, ctx() as never, mindA);
    expect(own.ok).toBe(true);

    // Similarity path: scoped to the requesting Mind.
    const emb = await engine.capture(
      mindA,
      "semantic",
      { text: "vector memory" },
      ctx() as never,
      { embedding: [1, 0, 0] }
    );
    expect(emb.ok).toBe(true);
    const simB = await engine.searchSimilar(mindB, [1, 0, 0], 10, 0.5);
    expect(simB.find((m) => m.mindId === mindA)).toBeUndefined();
    const simA = await engine.searchSimilar(mindA, [1, 0, 0], 10, 0.5);
    expect(simA.some((m) => emb.ok && m.id === emb.value.id)).toBe(true);

    // Ownership is immutable: update cannot transfer a record to another Mind.
    const hijack = await engine.update(a1.value.id, { mindId: mindB } as never, ctx() as never, mindA);
    expect(hijack.ok).toBe(true);
    if (hijack.ok) expect(hijack.value.mindId).toBe(mindA);
    const crossUpdate = await engine.update(a1.value.id, { content: "x" }, ctx() as never, mindB);
    expect(crossUpdate.ok).toBe(false);

    // Deletion is ownership-checked.
    const crossDelete = await engine.delete(a1.value.id, { ...ctx(), privacyLevel: "private" } as never, false, mindB);
    expect(crossDelete.ok).toBe(false);
    const ownDelete = await engine.delete(a1.value.id, { ...ctx(), privacyLevel: "private" } as never, true, mindA);
    expect(ownDelete.ok).toBe(true);
    const gone = await engine.getById(a1.value.id, ctx() as never, mindA);
    expect(gone.ok).toBe(true);
    if (gone.ok) expect(gone.value).toBeNull();

    await engine.shutdown().catch(() => undefined);
  });

  it("query.mindId spoofing does not widen scope", async () => {
    const { telemetry, storage, security } = testDeps();
    const engine = createMemoryEngine({}, telemetry, storage, security);
    await engine.initialize();
    const mindA = generateId();
    const mindB = generateId();
    await engine.capture(mindA, "episodic", { text: "aaa" }, ctx() as never);
    await engine.capture(mindB, "episodic", { text: "bbb" }, ctx() as never);
    // Caller is A but query claims B: the caller identity must win.
    const ret = await engine.retrieve(mindA, { mindId: mindB, limit: 100 } as never, ctx() as never);
    expect(ret.ok).toBe(true);
    if (ret.ok) {
      for (const m of ret.value) expect(m.mindId).toBe(mindA);
    }
    await engine.shutdown().catch(() => undefined);
  });
});

describe("state/tools REAL", () => {
  it("tool engine lists builtin capabilities", () => {
    const engine = createToolEngine();
    const caps = engine.listCapabilities();
    expect(caps.length).toBeGreaterThan(0);
    expect(engine.getCapability("file.read")).toBeDefined();
  });

  it("tool execute unknown returns failure (not throw)", async () => {
    const engine = createToolEngine();
    const res = await engine.executeTool("does.not.exist", {});
    expect(res.success).toBe(false);
  });

  it("singleton tools exists", () => {
    expect(singletonTools).toBeDefined();
  });
});

describe("state/skills REAL", () => {
  it("skill engine creates with deps", () => {
    const { telemetry, storage, security } = testDeps();
    const engine = createSkillEngine({}, telemetry, storage, security);
    expect(engine).toBeDefined();
    expect(typeof engine.createSkill).toBe("function");
    expect(typeof engine.validateSkill).toBe("function");
  });
});

describe("state/genome REAL", () => {
  it("genome engine creates with deps and rejects low privacy", async () => {
    const { telemetry, storage, security } = testDeps();
    const engine = createGenomeEngine({}, telemetry, storage, security);
    expect(engine).toBeDefined();
    // low privacy context should be denied for genome creation (requires confidential)
    const res = await engine.createGenome(
      "mind-x",
      {
        mindId: "mind-x",
        baseModels: [],
        adapters: [],
        prompts: {},
        skills: [],
        tools: [],
        policies: [],
        routing: { rules: [], defaultRoute: "local", fallbackChain: [] } as never,
        evaluators: [],
        knowledge: [],
        memoryConfig: {} as never,
      } as never,
      ctx("public") as never
    );
    expect(res.ok).toBe(false);
  });
});
