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
import { RoleCode } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AdminService } from "./admin.service";
import {
  AdminAuditQueryDto,
  AdminRoleUpdateDto,
  AdminSettingUpdateDto,
  AdminUserCreateDto,
  AdminUserQueryDto,
  AdminUserRolesDto,
  AdminUserUpdateDto,
  AdminUserPasswordDto,
} from "./dto";

@Controller({ path: "admin", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN, RoleCode.MANAGER)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Post("users")
  @Roles(RoleCode.ADMIN)
  createUser(
    @Body() dto: AdminUserCreateDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.adminService.createUser(dto, userId);
  }

  @Put("users/:id")
  @Roles(RoleCode.ADMIN)
  updateUser(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminUserUpdateDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.adminService.updateUser(id, dto, userId);
  }

  @Put("users/:id/password")
  @Roles(RoleCode.ADMIN)
  updatePassword(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminUserPasswordDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.adminService.updateUserPassword(id, dto.newPassword, userId);
  }

  @Put("users/:id/roles")
  @Roles(RoleCode.ADMIN)
  assignRoles(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminUserRolesDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.adminService.assignUserRoles(id, dto, userId);
  }

  @Delete("users/:id")
  @Roles(RoleCode.ADMIN)
  deleteUser(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.adminService.deleteUser(id, userId);
  }

  @Get("roles")
  getRoles() {
    return this.adminService.getRoles();
  }

  @Put("roles/:code")
  @Roles(RoleCode.ADMIN)
  updateRole(
    @Param("code") code: RoleCode,
    @Body() dto: AdminRoleUpdateDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.adminService.updateRole(code, dto, userId);
  }

  @Get("audit")
  getAuditLogs(@Query() query: AdminAuditQueryDto) {
    return this.adminService.getAuditLogs(query);
  }

  @Get("permissions")
  getReferencePermissions() {
    return this.adminService.getPermissions();
  }

  @Get("settings")
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put("settings/:key")
  @Roles(RoleCode.ADMIN)
  updateSetting(
    @Param("key") key: string,
    @Body() dto: AdminSettingUpdateDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.adminService.updateSetting(key, dto, userId);
  }

  @Get("references")
  getReferenceCatalog() {
    return this.adminService.getReferenceCatalog();
  }
}
