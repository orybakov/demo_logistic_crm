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
import { RecipientsService } from "./recipients.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { CreateRecipientDto, UpdateRecipientDto } from "./dto";

@ApiTags("recipients")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "recipients", version: "1" })
export class RecipientsController {
  constructor(private recipientsService: RecipientsService) {}

  @Get()
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.SALES,
    RoleCode.OPERATOR,
  )
  @ApiOperation({ summary: "Get all recipients" })
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
    const where: Prisma.RecipientWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { inn: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { contactName: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(filialId && { filialId }),
      ...(isActive !== undefined && { isActive: isActive === "true" }),
    };

    return this.recipientsService.findAll({
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
    RoleCode.SALES,
    RoleCode.OPERATOR,
  )
  @ApiOperation({ summary: "Get recipient by ID" })
  @ApiResponse({ status: 200, description: "Recipient retrieved successfully" })
  @ApiResponse({ status: 404, description: "Recipient not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.recipientsService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.SALES)
  @ApiOperation({ summary: "Create new recipient" })
  @ApiResponse({ status: 201, description: "Recipient created successfully" })
  async create(@Body() data: CreateRecipientDto) {
    return this.recipientsService.create(data);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.SALES)
  @ApiOperation({ summary: "Update recipient" })
  @ApiResponse({ status: 200, description: "Recipient updated successfully" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateRecipientDto,
  ) {
    return this.recipientsService.update(id, data);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete recipient (soft delete)" })
  @ApiResponse({ status: 200, description: "Recipient deleted successfully" })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.recipientsService.delete(id);
  }

  @Patch(":id/toggle-active")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Toggle recipient active status" })
  @ApiResponse({
    status: 200,
    description: "Recipient status toggled successfully",
  })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.recipientsService.toggleActive(id);
  }
}
