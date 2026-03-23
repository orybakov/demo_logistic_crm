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
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { WarehousesService } from "./warehouses.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { CreateWarehouseDto, UpdateWarehouseDto } from "./dto";

@ApiTags("warehouses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "warehouses", version: "1" })
export class WarehousesController {
  constructor(private warehousesService: WarehousesService) {}

  @Get()
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
  )
  @ApiOperation({ summary: "Get all warehouses" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "filialId", required: false })
  @ApiQuery({ name: "isActive", required: false })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("q") search?: string,
    @Query("filialId") filialId?: string,
    @Query("isActive") isActive?: string,
  ) {
    const where: Prisma.WarehouseWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(filialId && { filialId }),
      ...(isActive !== undefined && { isActive: isActive === "true" }),
    };

    return this.warehousesService.findAll({
      skip: page && limit ? (Number(page) - 1) * Number(limit) : undefined,
      take: limit ? Number(limit) : undefined,
      where,
    });
  }

  @Get(":id")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
  )
  @ApiOperation({ summary: "Get warehouse by ID" })
  @ApiResponse({ status: 200, description: "Warehouse retrieved successfully" })
  @ApiResponse({ status: 404, description: "Warehouse not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.warehousesService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Create new warehouse" })
  @ApiResponse({ status: 201, description: "Warehouse created successfully" })
  async create(@Body() data: CreateWarehouseDto) {
    return this.warehousesService.create(data);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Update warehouse" })
  @ApiResponse({ status: 200, description: "Warehouse updated successfully" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(id, data);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete warehouse (soft delete)" })
  @ApiResponse({ status: 200, description: "Warehouse deleted successfully" })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.warehousesService.delete(id);
  }

  @Patch(":id/toggle-active")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Toggle warehouse active status" })
  @ApiResponse({
    status: 200,
    description: "Warehouse status toggled successfully",
  })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.warehousesService.toggleActive(id);
  }
}
