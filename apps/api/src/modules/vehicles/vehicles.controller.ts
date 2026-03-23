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
import { VehiclesService } from "./vehicles.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";

@ApiTags("vehicles")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "vehicles", version: "1" })
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Get()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Get all vehicles" })
  @ApiQuery({ name: "skip", required: false })
  @ApiQuery({ name: "take", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "filialId", required: false })
  async findAll(
    @Query("skip") skip?: number,
    @Query("take") take?: number,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("filialId") filialId?: string,
  ) {
    const where: Prisma.VehicleWhereInput = {
      ...(search && {
        OR: [
          { plateNumber: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
          { model: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status && { status }),
      ...(filialId && { filialId }),
    };

    return this.vehiclesService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
    });
  }

  @Get("available")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Get available vehicles" })
  @ApiQuery({ name: "filialId", required: false })
  async findAvailable(@Query("filialId") filialId?: string) {
    return this.vehiclesService.findAvailable(filialId);
  }

  @Get(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Get vehicle by ID" })
  @ApiResponse({ status: 200, description: "Vehicle retrieved successfully" })
  @ApiResponse({ status: 404, description: "Vehicle not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Create new vehicle" })
  @ApiResponse({ status: 201, description: "Vehicle created successfully" })
  async create(
    @Body()
    data: {
      plateNumber: string;
      brand: string;
      model?: string;
      year?: number;
      bodyType: string;
      capacityKg: Prisma.Decimal;
      capacityM3?: Prisma.Decimal;
      lengthM?: Prisma.Decimal;
      widthM?: Prisma.Decimal;
      heightM?: Prisma.Decimal;
      fuelType?: string;
      vin?: string;
      trailerNumber?: string;
      temperatureControl?: boolean;
      temperatureFrom?: Prisma.Decimal;
      temperatureTo?: Prisma.Decimal;
      mileage?: Prisma.Decimal;
      nextMaintenance?: Date;
      insuranceNumber?: string;
      insuranceExpires?: Date;
      photoUrl?: string;
      filialId?: string;
    },
  ) {
    return this.vehiclesService.create(data);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Update vehicle" })
  @ApiResponse({ status: 200, description: "Vehicle updated successfully" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    data: Partial<{
      plateNumber: string;
      brand: string;
      model: string;
      year: number;
      bodyType: string;
      capacityKg: Prisma.Decimal;
      capacityM3: Prisma.Decimal;
      lengthM: Prisma.Decimal;
      widthM: Prisma.Decimal;
      heightM: Prisma.Decimal;
      fuelType: string;
      vin: string;
      trailerNumber: string;
      temperatureControl: boolean;
      temperatureFrom: Prisma.Decimal;
      temperatureTo: Prisma.Decimal;
      status: string;
      mileage: Prisma.Decimal;
      nextMaintenance: Date;
      insuranceNumber: string;
      insuranceExpires: Date;
      photoUrl: string;
      filialId: string;
      isActive: boolean;
    }>,
  ) {
    return this.vehiclesService.update(id, data);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete vehicle (soft delete)" })
  @ApiResponse({ status: 200, description: "Vehicle deleted successfully" })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.vehiclesService.delete(id);
  }
}
