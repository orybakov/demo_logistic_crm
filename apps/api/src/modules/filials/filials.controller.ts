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
  Patch,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { FilialsService } from "./filials.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleCode } from "@prisma/client";
import { CreateFilialDto } from "./dto";
import { UpdateFilialDto } from "./dto";

@ApiTags("filials")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "filials", version: "1" })
export class FilialsController {
  constructor(private filialsService: FilialsService) {}

  @Get()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER, RoleCode.SALES)
  @ApiOperation({ summary: "Get all filials" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "q",
    required: false,
    description: "Search by name or code",
  })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("q") search?: string,
    @Query("isActive") isActive?: string,
  ) {
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit ? limit : undefined;

    return this.filialsService.findAll({
      skip,
      take,
      search,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    });
  }

  @Get(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER, RoleCode.SALES)
  @ApiOperation({ summary: "Get filial by ID" })
  @ApiResponse({ status: 200, description: "Filial retrieved successfully" })
  @ApiResponse({ status: 404, description: "Filial not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.filialsService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Create new filial" })
  @ApiResponse({ status: 201, description: "Filial created successfully" })
  @ApiResponse({
    status: 409,
    description: "Filial with this code already exists",
  })
  async create(@Body() createFilialDto: CreateFilialDto) {
    return this.filialsService.create(createFilialDto);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Update filial" })
  @ApiResponse({ status: 200, description: "Filial updated successfully" })
  @ApiResponse({ status: 404, description: "Filial not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateFilialDto: UpdateFilialDto,
  ) {
    return this.filialsService.update(id, updateFilialDto);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete filial (soft delete)" })
  @ApiResponse({ status: 200, description: "Filial deleted successfully" })
  @ApiResponse({ status: 404, description: "Filial not found" })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.filialsService.delete(id);
  }

  @Patch(":id/toggle")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Toggle filial active status" })
  @ApiResponse({
    status: 200,
    description: "Filial status toggled successfully",
  })
  @ApiResponse({ status: 404, description: "Filial not found" })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.filialsService.toggleActive(id);
  }
}
