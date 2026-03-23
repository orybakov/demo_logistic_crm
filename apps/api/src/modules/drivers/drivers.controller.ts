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
import { DriversService } from "./drivers.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";

@ApiTags("drivers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "drivers", version: "1" })
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Get()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Get all drivers" })
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
    const where: Prisma.DriverWhereInput = {
      ...(search && {
        OR: [
          { employeeId: { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status && { status }),
      ...(filialId && { filialId }),
    };

    return this.driversService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
    });
  }

  @Get("available")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Get available drivers" })
  @ApiQuery({ name: "filialId", required: false })
  async findAvailable(@Query("filialId") filialId?: string) {
    return this.driversService.findAvailable(filialId);
  }

  @Get(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Get driver by ID" })
  @ApiResponse({ status: 200, description: "Driver retrieved successfully" })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.driversService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Create new driver" })
  @ApiResponse({ status: 201, description: "Driver created successfully" })
  async create(
    @Body()
    data: {
      employeeId: string;
      firstName: string;
      lastName: string;
      middleName?: string;
      birthDate?: Date;
      phone: string;
      email?: string;
      photoUrl?: string;
      licenseNumber: string;
      licenseCategory: string;
      licenseExpires: Date;
      medicalCardNumber?: string;
      medicalCardExpires?: Date;
      notes?: string;
      filialId?: string;
    },
  ) {
    return this.driversService.create(data);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Update driver" })
  @ApiResponse({ status: 200, description: "Driver updated successfully" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    data: Partial<{
      employeeId: string;
      firstName: string;
      lastName: string;
      middleName: string;
      birthDate: Date;
      phone: string;
      email: string;
      photoUrl: string;
      licenseNumber: string;
      licenseCategory: string;
      licenseExpires: Date;
      medicalCardNumber: string;
      medicalCardExpires: Date;
      status: string;
      rating: Prisma.Decimal;
      notes: string;
      filialId: string;
      isActive: boolean;
    }>,
  ) {
    return this.driversService.update(id, data);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete driver (soft delete)" })
  @ApiResponse({ status: 200, description: "Driver deleted successfully" })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.driversService.delete(id);
  }
}
