import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as client from "prom-client";

@Injectable()
export class MetricsService {
  private readonly registry = new client.Registry();
  private readonly httpRequestsTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status"] as const,
    registers: [this.registry],
  });
  private readonly httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status"] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [this.registry],
  });
  private readonly dbReady = new client.Gauge({
    name: "database_ready",
    help: "Database readiness state",
    registers: [this.registry],
  });

  constructor(private readonly config: ConfigService) {
    client.collectDefaultMetrics({ register: this.registry, prefix: "app_" });
    this.registry.setDefaultLabels({
      service: "logistics-crm-api",
      environment: this.config.get<string>("app.nodeEnv") || "development",
    });
  }

  observeHttp(
    method: string,
    route: string,
    status: number,
    durationSeconds: number,
  ) {
    if (this.config.get<boolean>("observability.metricsEnabled") === false)
      return;
    this.httpRequestsTotal.inc({ method, route, status: String(status) });
    this.httpRequestDuration.observe(
      { method, route, status: String(status) },
      durationSeconds,
    );
  }

  setDatabaseReady(isReady: boolean) {
    if (this.config.get<boolean>("observability.metricsEnabled") === false)
      return;
    this.dbReady.set(isReady ? 1 : 0);
  }

  async getMetrics(): Promise<string> {
    if (this.config.get<boolean>("observability.metricsEnabled") === false) {
      return "# metrics disabled";
    }
    return this.registry.metrics();
  }
}
