export interface SEAIError extends Error {
  code: string;
  statusCode: number;
  details: Record<string, unknown>;
  retryable: boolean;
}

export class SEAIBaseError extends Error implements SEAIError {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown>;
  public readonly retryable: boolean;

  constructor(code: string, message: string, options: {
    statusCode?: number;
    details?: Record<string, unknown>;
    retryable?: boolean;
    cause?: Error;
  } = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = options.statusCode ?? 500;
    this.details = options.details ?? {};
    this.retryable = options.retryable ?? false;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ConfigurationError extends SEAIBaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFIGURATION_ERROR", message, { statusCode: 500, details: details ?? {}, retryable: false });
  }
}

export class ValidationError extends SEAIBaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, { statusCode: 400, details: details ?? {}, retryable: false });
  }
}

export class NotFoundError extends SEAIBaseError {
  constructor(resource: string, id: string) {
    super("NOT_FOUND", `${resource} not found: ${id}`, { statusCode: 404, details: { resource, id }, retryable: false });
  }
}

export class UnauthorizedError extends SEAIBaseError {
  constructor(message: string = "Unauthorized", details?: Record<string, unknown>) {
    super("UNAUTHORIZED", message, { statusCode: 401, details: details ?? {}, retryable: false });
  }
}

export class ForbiddenError extends SEAIBaseError {
  constructor(message: string = "Forbidden", details?: Record<string, unknown>) {
    super("FORBIDDEN", message, { statusCode: 403, details: details ?? {}, retryable: false });
  }
}

export class ConflictError extends SEAIBaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFLICT", message, { statusCode: 409, details: details ?? {}, retryable: false });
  }
}

export class RateLimitError extends SEAIBaseError {
  constructor(message: string, retryAfterMs?: number) {
    super("RATE_LIMITED", message, { 
      statusCode: 429, 
      details: { retryAfterMs: retryAfterMs ?? 0 }, 
      retryable: true 
    });
  }
}

export class ProviderError extends SEAIBaseError {
  constructor(message: string, provider: string, details?: Record<string, unknown>) {
    super("PROVIDER_ERROR", message, { 
      statusCode: 502, 
      details: { provider, ...(details ?? {}) }, 
      retryable: true 
    });
  }
}

export class ModelError extends SEAIBaseError {
  constructor(message: string, model: string, details?: Record<string, unknown>) {
    super("MODEL_ERROR", message, { 
      statusCode: 500, 
      details: { model, ...(details ?? {}) }, 
      retryable: true 
    });
  }
}

export class PolicyDeniedError extends SEAIBaseError {
  constructor(policy: string, reason: string, details?: Record<string, unknown>) {
    super("POLICY_DENIED", `Policy denied: ${policy} - ${reason}`, { 
      statusCode: 403, 
      details: { policy, reason, ...(details ?? {}) }, 
      retryable: false 
    });
  }
}

export class PrivacyBlockedError extends SEAIBaseError {
  constructor(reason: string, details?: Record<string, unknown>) {
    super("PRIVACY_BLOCKED", `Privacy blocked: ${reason}`, { 
      statusCode: 403, 
      details: { reason, ...(details ?? {}) }, 
      retryable: false 
    });
  }
}

export class EvolutionError extends SEAIBaseError {
  constructor(message: string, candidateId?: string, details?: Record<string, unknown>) {
    super("EVOLUTION_ERROR", message, { 
      statusCode: 500, 
      details: { candidateId: candidateId ?? "", ...(details ?? {}) }, 
      retryable: false 
    });
  }
}

export class BenchmarkError extends SEAIBaseError {
  constructor(message: string, experimentId?: string, details?: Record<string, unknown>) {
    super("BENCHMARK_ERROR", message, { 
      statusCode: 500, 
      details: { experimentId, ...details }, 
      retryable: false 
    });
  }
}

export class HardwareError extends SEAIBaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("HARDWARE_ERROR", message, { 
      statusCode: 500, 
      details: details ?? {}, 
      retryable: false 
    });
  }
}

export class StorageError extends SEAIBaseError {
  constructor(message: string, operation: string, details?: Record<string, unknown>) {
    super("STORAGE_ERROR", message, { 
      statusCode: 500, 
      details: { operation, ...details }, 
      retryable: true 
    });
  }
}

export class SkillError extends SEAIBaseError {
  constructor(message: string, skillId: string, details?: Record<string, unknown>) {
    super("SKILL_ERROR", message, { 
      statusCode: 500, 
      details: { skillId, ...details }, 
      retryable: true 
    });
  }
}

export class ToolError extends SEAIBaseError {
  constructor(message: string, toolId: string, details?: Record<string, unknown>) {
    super("TOOL_ERROR", message, { 
      statusCode: 500, 
      details: { toolId, ...details }, 
      retryable: true 
    });
  }
}

export class MemoryError extends SEAIBaseError {
  constructor(message: string, memoryId?: string, details?: Record<string, unknown>) {
    super("MEMORY_ERROR", message, { 
      statusCode: 500, 
      details: { memoryId, ...details }, 
      retryable: true 
    });
  }
}

export class GenomeError extends SEAIBaseError {
  constructor(message: string, genomeId?: string, details?: Record<string, unknown>) {
    super("GENOME_ERROR", message, { 
      statusCode: 500, 
      details: { genomeId, ...details }, 
      retryable: false 
    });
  }
}

export function isSEAIError(error: unknown): error is SEAIError {
  return error instanceof SEAIBaseError;
}

export function getErrorCode(error: unknown): string {
  if (isSEAIError(error)) {
    return error.code;
  }
  if (error instanceof Error) {
    return "UNKNOWN_ERROR";
  }
  return "UNKNOWN_ERROR";
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function isRetryableError(error: unknown): boolean {
  if (isSEAIError(error)) {
    return error.retryable;
  }
  return false;
}

export const Result = {
  ok: <T>(value: T) => ({ ok: true as const, value }),
  err: <E extends Error>(error: E) => ({ ok: false as const, error }),
} as const;

export type Result<T, E extends Error = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

export function unwrapErr<T, E extends Error>(result: Result<T, E>): E {
  if (!result.ok) {
    return result.error;
  }
  throw new Error("Expected error result but got success");
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    retryableCodes?: string[];
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { 
    maxAttempts = 3, 
    baseDelayMs = 1000, 
    maxDelayMs = 30000,
    retryableCodes = ["RATE_LIMITED", "PROVIDER_ERROR", "MODEL_ERROR", "STORAGE_ERROR", "SKILL_ERROR", "TOOL_ERROR", "MEMORY_ERROR"],
    onRetry 
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const code = getErrorCode(error);
      if (!retryableCodes.includes(code)) {
        throw lastError;
      }
      
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      const jitter = delay * 0.1 * Math.random();
      
      if (onRetry) {
        onRetry(attempt, lastError);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError!;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateShortId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(p / 100 * sorted.length) - 1;
  const clampedIndex = Math.max(0, Math.min(index, sorted.length - 1));
  return sorted[clampedIndex] ?? 0;
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function median(arr: number[]): number {
  return percentile(arr, 50);
}

export function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / arr.length);
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor: string | undefined;
}

export function paginate<T>(items: T[], options: PaginationOptions): PaginatedResult<T> {
  const limit = Math.min(options.limit ?? 50, 1000);
  const offset = options.offset ?? 0;
  const start = offset;
  const end = start + limit;
  const paginatedItems = items.slice(start, end);
  
  return {
    items: paginatedItems,
    total: items.length,
    hasMore: end < items.length,
    nextCursor: end < items.length ? String(end) : undefined,
  };
}

export type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type NonEmptyArray<T> = [T, ...T[]];

export function assertNonEmptyArray<T>(arr: T[]): asserts arr is NonEmptyArray<T> {
  if (arr.length === 0) {
    throw new ValidationError("Array must not be empty");
  }
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}