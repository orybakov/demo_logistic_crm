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
import { ClientsService } from "./clients.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RoleCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";

@ApiTags("clients")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "clients", version: "1" })
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER, RoleCode.SALES)
  @ApiOperation({ summary: "Get all clients" })
  @ApiQuery({ name: "skip", required: false })
  @ApiQuery({ name: "take", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "filialId", required: false })
  @ApiQuery({ name: "isActive", required: false })
  async findAll(
    @Query("skip") skip?: number,
    @Query("take") take?: number,
    @Query("search") search?: string,
    @Query("filialId") filialId?: string,
    @Query("isActive") isActive?: string,
  ) {
    const where: Prisma.ClientWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { inn: { contains: search, mode: "insensitive" } },
          { contactName: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(filialId && { filialId }),
      ...(isActive !== undefined && { isActive: isActive === "true" }),
    };

    return this.clientsService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
    });
  }

  @Get(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER, RoleCode.SALES)
  @ApiOperation({ summary: "Get client by ID" })
  @ApiResponse({ status: 200, description: "Client retrieved successfully" })
  @ApiResponse({ status: 404, description: "Client not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN, RoleCode.SALES)
  @ApiOperation({ summary: "Create new client" })
  @ApiResponse({ status: 201, description: "Client created successfully" })
  async create(
    @Body()
    data: {
      type: string;
      name: string;
      inn: string;
      kpp?: string;
      ogrn?: string;
      legalAddress?: string;
      postalAddress?: string;
      phone?: string;
      email?: string;
      website?: string;
      contactName?: string;
      contactPhone?: string;
      contactEmail?: string;
      clientGroup?: string;
      creditLimit?: Prisma.Decimal;
      paymentDays?: number;
      filialId?: string;
    },
    @CurrentUser("id") userId: string,
  ) {
    return this.clientsService.create({ ...data, createdById: userId });
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN, RoleCode.SALES)
  @ApiOperation({ summary: "Update client" })
  @ApiResponse({ status: 200, description: "Client updated successfully" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    data: Partial<{
      type: string;
      name: string;
      inn: string;
      kpp: string;
      ogrn: string;
      legalAddress: string;
      postalAddress: string;
      phone: string;
      email: string;
      website: string;
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      clientGroup: string;
      creditLimit: Prisma.Decimal;
      paymentDays: number;
      filialId: string;
      isActive: boolean;
    }>,
  ) {
    return this.clientsService.update(id, data);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete client (soft delete)" })
  @ApiResponse({ status: 200, description: "Client deleted successfully" })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.clientsService.delete(id);
  }
}
