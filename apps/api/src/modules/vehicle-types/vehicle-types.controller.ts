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
import { VehicleTypesService } from "./vehicle-types.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleCode } from "@prisma/client";
import { CreateVehicleTypeDto, UpdateVehicleTypeDto } from "./dto";

@ApiTags("vehicle-types")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "vehicle-types", version: "1" })
export class VehicleTypesController {
  constructor(private vehicleTypesService: VehicleTypesService) {}

  @Get()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Get all vehicle types" })
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

    return this.vehicleTypesService.findAll({
      skip,
      take,
      search,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    });
  }

  @Get(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Get vehicle type by ID" })
  @ApiResponse({
    status: 200,
    description: "Vehicle type retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Vehicle type not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.vehicleTypesService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Create new vehicle type" })
  @ApiResponse({
    status: 201,
    description: "Vehicle type created successfully",
  })
  async create(@Body() data: CreateVehicleTypeDto) {
    return this.vehicleTypesService.create(data);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Update vehicle type" })
  @ApiResponse({
    status: 200,
    description: "Vehicle type updated successfully",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateVehicleTypeDto,
  ) {
    return this.vehicleTypesService.update(id, data);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete vehicle type (soft delete)" })
  @ApiResponse({
    status: 200,
    description: "Vehicle type deleted successfully",
  })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.vehicleTypesService.delete(id);
  }

  @Patch(":id/toggle-active")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Toggle vehicle type active status" })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.vehicleTypesService.toggleActive(id);
  }
}
