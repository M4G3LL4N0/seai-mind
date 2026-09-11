import { EventEmitter } from "node:events";
import {
  EventSchema,
  EventTypeSchema,
  SEAIEventTypes,
  type Event,
  type EventType,
  type SEAIEventType,
} from "./schemas.js";
import { generateId, nowISO } from "./kernel.js";

export interface EventHandler {
  (event: Event): Promise<void> | void;
}

export interface EventSubscription {
  unsubscribe(): void;
}

export interface TelemetryConfig {
  enabled: boolean;
  bufferSize: number;
  flushIntervalMs: number;
  persistEvents: boolean;
  storagePath?: string;
}

const DEFAULT_CONFIG: TelemetryConfig = {
  enabled: true,
  bufferSize: 1000,
  flushIntervalMs: 5000,
  persistEvents: false,
};

export class Telemetry extends EventEmitter {
  private config: TelemetryConfig;
  private buffer: Event[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();

  constructor(config: Partial<TelemetryConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  emitEvent(type: SEAIEventType | string, source: string, payload: unknown, options: {
    correlationId?: string;
    causationId?: string;
    version?: number;
  } = {}): Event {
    const event: Event = {
      id: generateId(),
      type,
      source,
      timestamp: nowISO(),
      payload,
      correlationId: options.correlationId,
      causationId: options.causationId,
      version: options.version ?? 1,
    };

    const validation = EventSchema.safeParse(event);
    if (!validation.success) {
      this.emit("error", new Error(`Invalid event: ${validation.error.message}`));
      return event;
    }

    if (this.config.enabled) {
      this.buffer.push(event);
      
      if (this.buffer.length >= this.config.bufferSize) {
        this.flush();
      }

      this.emit(type, event);
      this.emit("*", event);
      
      const typeHandlers = this.handlers.get(type);
      if (typeHandlers) {
        for (const handler of typeHandlers) {
          try {
            handler(event);
          } catch (error) {
            this.emit("error", error);
          }
        }
      }
      
      for (const handler of this.globalHandlers) {
        try {
          handler(event);
        } catch (error) {
          this.emit("error", error);
        }
      }
    }

    return event;
  }

  onEvent(type: SEAIEventType | string, handler: EventHandler): EventSubscription {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    
    return {
      unsubscribe: () => {
        this.handlers.get(type)?.delete(handler);
      },
    };
  }

  onAnyEvent(handler: EventHandler): EventSubscription {
    this.globalHandlers.add(handler);
    return {
      unsubscribe: () => {
        this.globalHandlers.delete(handler);
      },
    };
  }

  offEvent(type: SEAIEventType | string, handler: EventHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  offAnyEvent(handler: EventHandler): void {
    this.globalHandlers.delete(handler);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const events = [...this.buffer];
    this.buffer = [];
    
    if (this.config.persistEvents && this.config.storagePath) {
      await this.persistEvents(events);
    }
    
    this.emit("flushed", events);
  }

  private async persistEvents(events: Event[]): Promise<void> {
    if (!this.config.storagePath) return;
    
    try {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      
      const date = new Date();
      const filename = `events-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.jsonl`;
      const filepath = path.resolve(this.config.storagePath, filename);
      
      await fs.mkdir(this.config.storagePath, { recursive: true });
      
      const lines = events.map(e => JSON.stringify(e)).join("\n") + "\n";
      await fs.appendFile(filepath, lines);
    } catch (error) {
      this.emit("error", error);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => this.emit("error", error));
    }, this.config.flushIntervalMs);
    
    this.flushTimer.unref();
  }

  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush().catch(error => this.emit("error", error));
  }

  getBufferedEvents(): Event[] {
    return [...this.buffer];
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (enabled && !this.flushTimer) {
      this.startFlushTimer();
    } else if (!enabled && this.flushTimer) {
      this.stop();
    }
  }
}

export function createTelemetry(config?: Partial<TelemetryConfig>): Telemetry {
  return new Telemetry(config);
}

export const telemetry = createTelemetry();

export function emitEvent(type: SEAIEventType, source: string, payload: unknown, options?: {
  correlationId?: string;
  causationId?: string;
  version?: number;
}): Event {
  return telemetry.emitEvent(type, source, payload, options);
}

export function onEvent(type: SEAIEventType, handler: EventHandler): EventSubscription {
  return telemetry.onEvent(type, handler);
}

export function onAnyEvent(handler: EventHandler): EventSubscription {
  return telemetry.onAnyEvent(handler);
}

export const EventTypes = SEAIEventTypes;

export function createEvent(
  type: SEAIEventType,
  source: string,
  payload: unknown,
  options: {
    correlationId?: string;
    causationId?: string;
    version?: number;
  } = {}
): Event {
  return {
    id: generateId(),
    type,
    source,
    timestamp: nowISO(),
    payload,
    correlationId: options.correlationId,
    causationId: options.causationId,
    version: options.version ?? 1,
  };
}

export function validateEvent(event: unknown): Event {
  const result = EventSchema.safeParse(event);
  if (!result.success) {
    throw new Error(`Invalid event: ${result.error.message}`);
  }
  return result.data;
}

export function isEventType(type: string, expectedType: SEAIEventType): boolean {
  return type === expectedType;
}

export const EventCategories = {
  MIND: [
    SEAIEventTypes.MIND_CREATED,
    SEAIEventTypes.MIND_STARTED,
    SEAIEventTypes.MIND_STOPPED,
  ],
  TASK: [
    SEAIEventTypes.TASK_CREATED,
    SEAIEventTypes.TASK_STARTED,
    SEAIEventTypes.TASK_COMPLETED,
    SEAIEventTypes.TASK_FAILED,
  ],
  MEMORY: [
    SEAIEventTypes.MEMORY_CREATED,
    SEAIEventTypes.MEMORY_RETRIEVED,
    SEAIEventTypes.MEMORY_CONSOLIDATED,
    SEAIEventTypes.MEMORY_ARCHIVED,
  ],
  SKILL: [
    SEAIEventTypes.SKILL_CREATED,
    SEAIEventTypes.SKILL_USED,
    SEAIEventTypes.SKILL_EVOLVED,
  ],
  MODEL: [
    SEAIEventTypes.MODEL_SELECTED,
    SEAIEventTypes.MODEL_EXECUTED,
  ],
  EVOLUTION: [
    SEAIEventTypes.EVOLUTION_STARTED,
    SEAIEventTypes.EVOLUTION_CANDIDATE_CREATED,
    SEAIEventTypes.EVOLUTION_CANDIDATE_EVALUATED,
    SEAIEventTypes.EVOLUTION_PROMOTED,
    SEAIEventTypes.EVOLUTION_REJECTED,
    SEAIEventTypes.EVOLUTION_ROLLBACK,
  ],
  BENCHMARK: [
    SEAIEventTypes.BENCHMARK_STARTED,
    SEAIEventTypes.BENCHMARK_COMPLETED,
  ],
  SECURITY: [
    SEAIEventTypes.SECURITY_ALERT,
    SEAIEventTypes.POLICY_DENIED,
    SEAIEventTypes.PRIVACY_BLOCKED,
  ],
} as const satisfies Record<string, readonly SEAIEventType[]>;

export function getEventCategory(type: SEAIEventType): string | undefined {
  for (const [category, types] of Object.entries(EventCategories)) {
    if ((types as readonly SEAIEventType[]).includes(type)) {
      return category;
    }
  }
  return undefined;
}