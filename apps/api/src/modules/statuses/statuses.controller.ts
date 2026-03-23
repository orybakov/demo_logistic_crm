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
import { StatusesService } from "./statuses.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleCode } from "@prisma/client";
import { CreateStatusDto, UpdateStatusDto } from "./dto";

@ApiTags("statuses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "statuses", version: "1" })
export class StatusesController {
  constructor(private statusesService: StatusesService) {}

  @Get()
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
  )
  @ApiOperation({ summary: "Get all statuses" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "entityType", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiResponse({ status: 200, description: "Statuses retrieved successfully" })
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

    return this.statusesService.findAll({
      skip,
      take: limitNum,
      entityType,
      isActive,
      search,
    });
  }

  @Get("by-entity/:entityType")
  @UseGuards(JwtAuthGuard)
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
  )
  @ApiOperation({ summary: "Get statuses by entity type for dropdowns" })
  @ApiResponse({ status: 200, description: "Statuses retrieved successfully" })
  async findByEntity(@Param("entityType") entityType: string) {
    return this.statusesService.findByEntity(entityType);
  }

  @Get(":id")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
  )
  @ApiOperation({ summary: "Get status by ID" })
  @ApiResponse({ status: 200, description: "Status retrieved successfully" })
  @ApiResponse({ status: 404, description: "Status not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.statusesService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Create new status" })
  @ApiResponse({ status: 201, description: "Status created successfully" })
  async create(@Body() data: CreateStatusDto) {
    return this.statusesService.create(data);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Update status" })
  @ApiResponse({ status: 200, description: "Status updated successfully" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateStatusDto,
  ) {
    return this.statusesService.update(id, data);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete status (soft delete)" })
  @ApiResponse({ status: 200, description: "Status deleted successfully" })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.statusesService.delete(id);
  }

  @Put(":id/toggle-active")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Toggle status active status" })
  @ApiResponse({ status: 200, description: "Status toggled successfully" })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.statusesService.toggleActive(id);
  }
}
