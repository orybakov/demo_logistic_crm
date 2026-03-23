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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RoleCode } from "@prisma/client";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Get all users" })
  @ApiQuery({ name: "skip", required: false, type: Number })
  @ApiQuery({ name: "take", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "filialId", required: false, type: String })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  async findAll(
    @Query("skip") skip?: number,
    @Query("take") take?: number,
    @Query("search") search?: string,
    @Query("filialId") filialId?: string,
  ) {
    return this.usersService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where: {
        deletedAt: null,
        ...(search && {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(filialId && { filialId }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        filial: true,
        roles: { include: { role: true } },
      },
    });
  }

  @Get(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Create new user" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  async create(
    @Body()
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      middleName?: string;
      phone?: string;
      filialId?: string;
      roleCodes?: RoleCode[];
    },
  ) {
    return this.usersService.create(data);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Update user" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    data: {
      firstName?: string;
      lastName?: string;
      middleName?: string;
      phone?: string;
      filialId?: string;
      isActive?: boolean;
    },
  ) {
    return this.usersService.update(id, data);
  }

  @Put(":id/password")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Update user password" })
  @ApiResponse({ status: 200, description: "Password updated successfully" })
  async updatePassword(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("newPassword") newPassword: string,
  ) {
    return this.usersService.updatePassword(id, newPassword);
  }

  @Put(":id/roles")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Assign roles to user" })
  @ApiResponse({ status: 200, description: "Roles assigned successfully" })
  async assignRoles(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: { roleCodes: RoleCode[]; filialId?: string },
  ) {
    return this.usersService.assignRoles(id, data.roleCodes, data.filialId);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete user (soft delete)" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.delete(id);
  }
}
