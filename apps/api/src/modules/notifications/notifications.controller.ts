import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RoleCode } from "@prisma/client";
import {
  NotificationQueryDto,
  MarkReadDto,
  UpdateNotificationSettingsDto,
  CreateNotificationDto,
  NOTIFICATION_TYPE_CONFIGS,
} from "./dto";

@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
    RoleCode.SALES,
    RoleCode.CLIENT,
  )
  async findAll(
    @CurrentUser("id") userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.findAll(userId, query);
  }

  @Get("unread-count")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
    RoleCode.SALES,
    RoleCode.CLIENT,
  )
  async getUnreadCount(@CurrentUser("id") userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Get("types")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
    RoleCode.SALES,
    RoleCode.CLIENT,
  )
  async getAvailableTypes(
    @CurrentUser("id") userId: string,
    @CurrentUser("roles") userRoles: any,
  ) {
    const roles = userRoles?.map((r: any) => r.code || r) || [];
    const types = await this.notificationsService.getAvailableTypes(
      userId,
      roles,
    );
    return { types };
  }

  @Get("settings")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
    RoleCode.SALES,
    RoleCode.CLIENT,
  )
  async getSettings(@CurrentUser("id") userId: string) {
    return this.notificationsService.getSettings(userId);
  }

  @Get(":id")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
    RoleCode.SALES,
    RoleCode.CLIENT,
  )
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.notificationsService.findOne(id, userId);
  }

  @Put(":id/read")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
    RoleCode.SALES,
    RoleCode.CLIENT,
  )
  async markAsRead(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Put(":id/unread")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
    RoleCode.SALES,
    RoleCode.CLIENT,
  )
  async markAsUnread(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.notificationsService.markAsUnread(id, userId);
  }

  @Put("read-all")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
    RoleCode.SALES,
    RoleCode.CLIENT,
  )
  async markAllAsRead(@CurrentUser("id") userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Put("settings")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
    RoleCode.SALES,
    RoleCode.CLIENT,
  )
  async updateSettings(
    @CurrentUser("id") userId: string,
    @Body() data: UpdateNotificationSettingsDto,
  ) {
    return this.notificationsService.updateSettings(
      userId,
      data.enabledTypes,
      data.disabledChannels,
    );
  }

  @Delete(":id")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
    RoleCode.SALES,
    RoleCode.CLIENT,
  )
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    await this.notificationsService.delete(id, userId);
    return { success: true };
  }

  @Delete("all")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
    RoleCode.SALES,
    RoleCode.CLIENT,
  )
  async deleteAll(
    @CurrentUser("id") userId: string,
    @Query("olderThanDays") olderThanDays?: number,
  ) {
    return this.notificationsService.deleteAll(userId, olderThanDays);
  }

  @Delete("cleanup")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  async cleanup(@Query("days") days: number = 30) {
    return this.notificationsService.cleanupOld(days);
  }

  @Post("broadcast")
  @Roles(RoleCode.ADMIN)
  async broadcast(
    @Body() data: { title: string; body: string; userIds?: string[] },
  ) {
    await this.notificationsService.notifySystemAnnouncement(
      data.title,
      data.body,
      data.userIds,
    );
    return { success: true };
  }
}
