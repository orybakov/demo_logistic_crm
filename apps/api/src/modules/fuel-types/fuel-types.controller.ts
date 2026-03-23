import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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
import { FuelTypesService } from "./fuel-types.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleCode } from "@prisma/client";
import { CreateFuelTypeDto, UpdateFuelTypeDto } from "./dto";

@ApiTags("fuel-types")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "fuel-types", version: "1" })
export class FuelTypesController {
  constructor(private fuelTypesService: FuelTypesService) {}

  @Get()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Get all fuel types" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "isActive", required: false })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("q") search?: string,
    @Query("isActive") isActive?: string,
  ) {
    const skip = page && limit ? (Number(page) - 1) * Number(limit) : undefined;
    const take = limit ? Number(limit) : undefined;

    return this.fuelTypesService.findAll({
      skip,
      take,
      search,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    });
  }

  @Get(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Get fuel type by ID" })
  @ApiResponse({ status: 200, description: "Fuel type retrieved successfully" })
  @ApiResponse({ status: 404, description: "Fuel type not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.fuelTypesService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Create new fuel type" })
  @ApiResponse({ status: 201, description: "Fuel type created successfully" })
  async create(@Body() data: CreateFuelTypeDto) {
    return this.fuelTypesService.create(data);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Update fuel type" })
  @ApiResponse({ status: 200, description: "Fuel type updated successfully" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateFuelTypeDto,
  ) {
    return this.fuelTypesService.update(id, data);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete fuel type (soft delete)" })
  @ApiResponse({ status: 200, description: "Fuel type deleted successfully" })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.fuelTypesService.delete(id);
  }

  @Patch(":id/toggle-active")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Toggle fuel type active status" })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.fuelTypesService.toggleActive(id);
  }
}
