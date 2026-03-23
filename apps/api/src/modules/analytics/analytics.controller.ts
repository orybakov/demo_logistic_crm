import {
  Controller,
  Get,
  Param,
  Query,
  ParseEnumPipe,
  UseGuards,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { RoleCode } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  AnalyticsEntity,
  AnalyticsExportFormat,
  AnalyticsExportQueryDto,
  AnalyticsQueryDto,
} from "./dto";
import { AnalyticsService } from "./analytics.service";

@Controller({ path: "analytics", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("kpi")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER, RoleCode.SALES)
  getKpi(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getKpi(query);
  }

  @Get("reports/requests")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER, RoleCode.SALES)
  getRequestsReport(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRequestsReport(query);
  }

  @Get("reports/orders")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.SALES)
  getOrdersReport(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOrdersReport(query);
  }

  @Get("executors")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER, RoleCode.SALES)
  getExecutors(@Query("filialId") filialId?: string) {
    return this.analyticsService.getExecutors(filialId);
  }

  @Get("reports/:entity/export")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER, RoleCode.SALES)
  async exportReport(
    @Param("entity", new ParseEnumPipe(AnalyticsEntity))
    entity: AnalyticsEntity,
    @Query() query: AnalyticsExportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const format = query.format || AnalyticsExportFormat.CSV;
    const exportResult =
      entity === AnalyticsEntity.REQUESTS
        ? await this.analyticsService.exportRequests(query, format)
        : await this.analyticsService.exportOrders(query, format);

    res.setHeader("Content-Type", exportResult.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${entity}-${new Date().toISOString().slice(0, 10)}.${exportResult.extension}"`,
    );

    return res.send(
      Buffer.isBuffer(exportResult.buffer)
        ? exportResult.buffer
        : Buffer.from(exportResult.buffer),
    );
  }
}
