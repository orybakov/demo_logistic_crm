import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  apiPrefix: process.env.API_PREFIX || "api",
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:3000",
  ],
}));

export const databaseConfig = registerAs("database", () => ({
  url:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/logistics_crm",
}));

export const redisConfig = registerAs("redis", () => ({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || "0", 10),
}));

export const jwtConfig = registerAs("jwt", () => ({
  secret:
    process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
}));

export const observabilityConfig = registerAs("observability", () => ({
  structuredLogs: process.env.STRUCTURED_LOGS !== "false",
  requestLogging: process.env.REQUEST_LOGGING !== "false",
  auditHttpRequests: process.env.AUDIT_HTTP_REQUESTS === "true",
  enableSwagger:
    process.env.ENABLE_SWAGGER === "true" ||
    process.env.NODE_ENV !== "production",
  metricsEnabled: process.env.METRICS_ENABLED !== "false",
  errorTrackingEnabled: process.env.ERROR_TRACKING_ENABLED === "true",
  errorTrackingWebhookUrl: process.env.ERROR_TRACKING_WEBHOOK_URL || "",
}));
