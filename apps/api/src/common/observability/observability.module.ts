import { Global, Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AuditService } from "../../database/audit.service";
import { ErrorTrackingService } from "./error-tracking.service";
import { MetricsService } from "./metrics.service";
import { ObservabilityInterceptor } from "./observability.interceptor";
import { ObservabilityExceptionFilter } from "../filters/observability-exception.filter";

@Global()
@Module({
  providers: [
    MetricsService,
    ErrorTrackingService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ObservabilityInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ObservabilityExceptionFilter,
    },
  ],
  exports: [MetricsService, ErrorTrackingService],
})
export class ObservabilityModule {}
