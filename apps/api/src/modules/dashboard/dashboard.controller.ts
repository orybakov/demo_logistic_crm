import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DashboardService } from "./dashboard.service";
import {
  DashboardQueryDto,
  DashboardBlockVisibilityDto,
  DashboardBlock,
} from "./dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Request() req: any, @Query() query: DashboardQueryDto) {
    const userId = req.user.id;
    const userFilialId = req.user.filialId || null;
    const userRoles = req.user.roles || [];

    return this.dashboardService.getDashboardData(
      userId,
      userFilialId,
      userRoles,
      query.filialId,
      query.blocks,
    );
  }

  @Get("search")
  async quickSearch(@Query("q") query: string) {
    return this.dashboardService.quickSearch(query || "", 10);
  }

  @Put("visibility")
  @Roles("ADMIN", "MANAGER")
  async updateVisibility(
    @Request() req: any,
    @Body() body: DashboardBlockVisibilityDto,
  ) {
    return {
      success: true,
      visibleBlocks: body.visibleBlocks,
    };
  }

  @Get("blocks")
  async getAvailableBlocks() {
    return {
      blocks: Object.values(DashboardBlock).map((block) => ({
        id: block,
        label: this.getBlockLabel(block),
        defaultVisible: true,
      })),
    };
  }

  private getBlockLabel(block: DashboardBlock): string {
    const labels: Record<DashboardBlock, string> = {
      [DashboardBlock.FREE_REQUESTS]: "Свободные заявки",
      [DashboardBlock.PROBLEM_FLAGS]: "Проблемные флаги",
      [DashboardBlock.PROBLEM_ORDERS]: "Проблемные заказы",
      [DashboardBlock.TODAY_LOADINGS]: "Сегодняшние загрузки",
      [DashboardBlock.TODAY_DELIVERIES]: "Сегодняшние выгрузки",
      [DashboardBlock.RECENT_ACTIVITY]: "Недавняя активность",
      [DashboardBlock.PENDING_PAYMENTS]: "Ожидающие платежи",
    };
    return labels[block] || block;
  }
}
