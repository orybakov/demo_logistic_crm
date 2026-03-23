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
import { FlagsService } from "./flags.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleCode } from "@prisma/client";
import { CreateFlagDto, UpdateFlagDto } from "./dto";

@ApiTags("flags")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "flags", version: "1" })
export class FlagsController {
  constructor(private flagsService: FlagsService) {}

  @Get()
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
  )
  @ApiOperation({ summary: "Get all flags" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "entityType", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiResponse({ status: 200, description: "Flags retrieved successfully" })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("entityType") entityType?: string,
    @Query("isActive") isActive?: boolean,
    @Query("q") search?: string,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    return this.flagsService.findAll({
      skip,
      take: limitNum,
      entityType,
      isActive,
      search,
    });
  }

  @Get(":id")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
  )
  @ApiOperation({ summary: "Get flag by ID" })
  @ApiResponse({ status: 200, description: "Flag retrieved successfully" })
  @ApiResponse({ status: 404, description: "Flag not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.flagsService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Create new flag" })
  @ApiResponse({ status: 201, description: "Flag created successfully" })
  async create(@Body() data: CreateFlagDto) {
    return this.flagsService.create(data);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Update flag" })
  @ApiResponse({ status: 200, description: "Flag updated successfully" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateFlagDto,
  ) {
    return this.flagsService.update(id, data);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Delete flag (soft delete)" })
  @ApiResponse({ status: 200, description: "Flag deleted successfully" })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.flagsService.delete(id);
  }

  @Put(":id/toggle-active")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Toggle flag active status" })
  @ApiResponse({ status: 200, description: "Flag toggled successfully" })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.flagsService.toggleActive(id);
  }
}
