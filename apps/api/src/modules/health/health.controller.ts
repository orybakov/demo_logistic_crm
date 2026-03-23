import { Controller, Get, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";
import { PrismaService } from "../../database/prisma.service";
import type { Response } from "express";
import { MetricsService } from "../../common/observability";

@ApiTags("health")
@Controller({ path: "health", version: "1" })
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  async check() {
    const start = Date.now();

    let dbStatus = "healthy";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.metrics.setDatabaseReady(true);
    } catch {
      dbStatus = "unhealthy";
      this.metrics.setDatabaseReady(false);
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - start,
      services: {
        api: "healthy",
        database: dbStatus,
      },
    };
  }

  @Get("ready")
  @Public()
  @ApiOperation({ summary: "Readiness check endpoint" })
  @ApiResponse({ status: 200, description: "Service is ready" })
  async ready(@Res({ passthrough: true }) res: Response) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.metrics.setDatabaseReady(true);
      res.status(200);
      return { status: "ready" };
    } catch {
      this.metrics.setDatabaseReady(false);
      res.status(503);
      return { status: "not_ready" };
    }
  }

  @Get("live")
  @Public()
  @ApiOperation({ summary: "Liveness check endpoint" })
  @ApiResponse({ status: 200, description: "Service is alive" })
  live() {
    return { status: "alive" };
  }

  @Get("metrics")
  @Public()
  async metricsEndpoint(@Res({ passthrough: true }) res: Response) {
    res.type("text/plain; version=0.0.4");
    return this.metrics.getMetrics();
  }
}
