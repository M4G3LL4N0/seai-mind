import { describe, it, expect } from "vitest";
import {
  generateId,
  Result,
  SEAIBaseError,
  ConfigurationError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ProviderError,
  ModelError,
  PolicyDeniedError,
  PrivacyBlockedError,
  EvolutionError,
  BenchmarkError,
  HardwareError,
  StorageError,
  SkillError,
  ToolError,
  MemoryError,
  GenomeError,
  unwrap,
  unwrapErr,
  withRetry,
  sleep,
  clamp,
  percentile,
  mean,
  median,
  standardDeviation,
  paginate,
  assertNonEmptyArray,
  isNonEmptyString,
  isValidUUID,
} from "../index.js";

describe("core/kernel", () => {
  it("generates valid UUID", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("Result.ok works", () => {
    const result = Result.ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(42);
  });

  it("Result.err works", () => {
    const result = Result.err(new Error("fail"));
    expect(result.ok).toBe(false);
  });

  it("unwrap succeeds on ok", () => {
    const result = Result.ok(42);
    expect(unwrap(result)).toBe(42);
  });

  it("unwrap throws on err", () => {
    const result = Result.err(new Error("fail"));
    expect(() => unwrap(result)).toThrow("fail");
  });

  it("unwrapErr succeeds on err", () => {
    const err = new Error("fail");
    const result = Result.err(err);
    expect(unwrapErr(result)).toBe(err);
  });

  it("unwrapErr throws on ok", () => {
    const result = Result.ok(42);
    expect(() => unwrapErr(result)).toThrow();
  });

  it("SEAI error hierarchy works", () => {
    const err = new ConfigurationError("test");
    expect(err.code).toBe("CONFIGURATION_ERROR");
    expect(err.statusCode).toBe(500);
    expect(err.retryable).toBe(false);
  });

  it("all error classes extend SEAIBaseError", () => {
    const errors = [
      new ConfigurationError("test"),
      new ValidationError("test"),
      new NotFoundError("resource", "123"),
      new UnauthorizedError(),
      new ForbiddenError(),
      new ConflictError("test"),
      new RateLimitError("test"),
      new ProviderError("test", "provider"),
      new ModelError("test", "model"),
      new PolicyDeniedError("policy", "reason"),
      new PrivacyBlockedError("reason"),
      new EvolutionError("test"),
      new BenchmarkError("test"),
      new HardwareError("test"),
      new StorageError("test", "operation"),
      new SkillError("test", "skill"),
      new ToolError("test", "tool"),
      new MemoryError("test"),
      new GenomeError("test"),
    ];

    for (const err of errors) {
      expect(err).toBeInstanceOf(SEAIBaseError);
      expect(err).toBeInstanceOf(Error);
      expect(typeof err.code).toBe("string");
      expect(typeof err.statusCode).toBe("number");
    }
  });

  it("withRetry succeeds on first try", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      return 42;
    });
    expect(result).toBe(42);
    expect(calls).toBe(1);
  });

  it("withRetry retries on failure", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls < 3) throw new ProviderError("fail", "test-provider");
        return 42;
      },
      { maxAttempts: 3, baseDelayMs: 10 }
    );
    expect(result).toBe(42);
    expect(calls).toBe(3);
  });

  it("sleep works", async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it("clamp works", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("percentile works", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(arr, 50)).toBe(5);
    expect(percentile(arr, 90)).toBe(9);
  });

  it("mean works", () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });

  it("median works", () => {
    expect(median([1, 2, 3, 4, 5])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2);
  });

  it("standardDeviation works", () => {
    const sd = standardDeviation([1, 2, 3, 4, 5]);
    expect(sd).toBeGreaterThan(0);
  });

  it("paginate works", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = paginate(items, { limit: 3, offset: 0 });
    expect(result.items).toEqual([1, 2, 3]);
    expect(result.total).toBe(10);
  });

  it("assertNonEmptyArray works", () => {
    expect(() => assertNonEmptyArray([1, 2, 3])).not.toThrow();
    expect(() => assertNonEmptyArray([])).toThrow();
  });

  it("isNonEmptyString works", () => {
    expect(isNonEmptyString("hello")).toBe(true);
    expect(isNonEmptyString("")).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
  });

  it("isValidUUID works", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidUUID("not-a-uuid")).toBe(false);
  });
});
