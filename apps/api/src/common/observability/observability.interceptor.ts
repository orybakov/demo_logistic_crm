import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { ConfigService } from "@nestjs/config";
import { AuditService } from "../../database/audit.service";
import { MetricsService } from "./metrics.service";
import { JsonLogger } from "./json-logger";

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  private readonly logger = new JsonLogger("HTTP");

  constructor(
    private readonly metrics: MetricsService,
    private readonly auditService: AuditService,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = process.hrtime.bigint();
    const method = request.method;
    const route =
      (request as any).route?.path || request.originalUrl || request.url;
    const requestId =
      request.requestId || String(response.getHeader("X-Request-ID") || "");
    const requestLogging =
      this.config.get<boolean>("observability.requestLogging") !== false;
    const shouldAudit =
      this.config.get<boolean>("observability.auditHttpRequests") &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
      !route.startsWith("/api/v1/metrics") &&
      !route.startsWith("/api/v1/health");

    return next.handle().pipe(
      tap({
        next: () => {
          const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
          const status = response.statusCode || 200;
          this.metrics.observeHttp(method, route, status, durationSeconds);
          if (requestLogging) {
            this.logger.log("request_completed", {
              requestId,
              method,
              path: route,
              statusCode: status,
              durationMs: Math.round(durationSeconds * 1000),
              userId: request.user?.id,
            });
          }

          if (shouldAudit && request.user?.id) {
            void this.auditService
              .log(
                "http_request",
                route,
                request.requestId || route,
                {
                  userId: request.user.id,
                  ipAddress: request.ip,
                  userAgent: request.headers["user-agent"],
                },
                undefined,
                {
                  method,
                  path: route,
                  statusCode: status,
                  requestId,
                },
              )
              .catch(() => undefined);
          }
        },
      }),
    );
  }
}
