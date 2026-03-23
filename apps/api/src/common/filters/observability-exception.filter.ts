import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ErrorTrackingService } from "../observability/error-tracking.service";
import { JsonLogger } from "../observability/json-logger";
import { MetricsService } from "../observability/metrics.service";

@Catch()
export class ObservabilityExceptionFilter implements ExceptionFilter {
  private readonly logger = new JsonLogger("Exceptions");

  constructor(
    private readonly errorTracking: ErrorTrackingService,
    private readonly metrics: MetricsService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<
      Request & { requestId?: string; user?: { id?: string } }
    >();
    const route =
      (request as any).route?.path || request.originalUrl || request.url;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: "Internal server error" };

    this.metrics.observeHttp(request.method, route, status, 0);
    this.logger.error(
      "request_failed",
      exception instanceof Error ? exception.stack : undefined,
      {
        requestId: request.requestId,
        method: request.method,
        path: route,
        statusCode: status,
        userId: request.user?.id,
        error:
          exception instanceof Error ? exception.message : String(exception),
      },
    );

    if (!(exception instanceof HttpException)) {
      await this.errorTracking.captureException(exception, {
        requestId: request.requestId,
        method: request.method,
        path: route,
        userId: request.user?.id,
      });
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(typeof message === "object" ? message : { message }),
    };

    response.status(status).json(errorResponse);
  }
}
