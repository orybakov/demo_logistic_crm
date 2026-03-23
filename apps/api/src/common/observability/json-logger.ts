import type { LoggerService } from "@nestjs/common";

type LogLevel = "log" | "error" | "warn" | "debug" | "verbose";

export interface LogMeta {
  context?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string;
  entityType?: string;
  entityId?: string;
  error?: unknown;
  [key: string]: unknown;
}

export class JsonLogger implements LoggerService {
  constructor(private readonly context = "App") {}

  log(message: unknown, meta?: LogMeta) {
    this.write("log", message, meta);
  }

  error(message: unknown, trace?: string, meta?: LogMeta) {
    this.write("error", message, { ...meta, trace });
  }

  warn(message: unknown, meta?: LogMeta) {
    this.write("warn", message, meta);
  }

  debug(message: unknown, meta?: LogMeta) {
    this.write("debug", message, meta);
  }

  verbose(message: unknown, meta?: LogMeta) {
    this.write("verbose", message, meta);
  }

  private write(level: LogLevel, message: unknown, meta?: LogMeta) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      context: meta?.context || this.context,
      message,
      ...meta,
    };
    const serialized = JSON.stringify(payload);
    if (level === "error") {
      console.error(serialized);
      return;
    }
    if (level === "warn") {
      console.warn(serialized);
      return;
    }
    console.log(serialized);
  }
}

export const appLogger = new JsonLogger("Bootstrap");
