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
import { ClassifiersService } from "./classifiers.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { CreateClassifierDto, UpdateClassifierDto } from "./dto";

@ApiTags("classifiers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "classifiers", version: "1" })
export class ClassifiersController {
  constructor(private classifiersService: ClassifiersService) {}

  @Get()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.OPERATOR)
  @ApiOperation({ summary: "Get all classifiers" })
  @ApiQuery({ name: "skip", required: false })
  @ApiQuery({ name: "take", required: false })
  @ApiQuery({ name: "q", required: false, description: "Search query" })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "isActive", required: false })
  async findAll(
    @Query("skip") skip?: number,
    @Query("take") take?: number,
    @Query("q") search?: string,
    @Query("type") type?: string,
    @Query("isActive") isActive?: string,
  ) {
    const where: Prisma.ClassifierWhereInput = {
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(type && { type }),
      ...(isActive !== undefined && { isActive: isActive === "true" }),
    };

    return this.classifiersService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
    });
  }

  @Get("tree")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.OPERATOR)
  @ApiOperation({ summary: "Get classifier tree" })
  async getTree() {
    return this.classifiersService.getTree();
  }

  @Get("by-type/:type")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.OPERATOR)
  @ApiOperation({ summary: "Get classifiers by type" })
  async findByType(@Param("type") type: string) {
    return this.classifiersService.findByType(type);
  }

  @Get(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.OPERATOR)
  @ApiOperation({ summary: "Get classifier by ID" })
  @ApiResponse({
    status: 200,
    description: "Classifier retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Classifier not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.classifiersService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Create new classifier" })
  @ApiResponse({ status: 201, description: "Classifier created successfully" })
  async create(@Body() data: CreateClassifierDto) {
    return this.classifiersService.create(data);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Update classifier" })
  @ApiResponse({ status: 200, description: "Classifier updated successfully" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateClassifierDto,
  ) {
    return this.classifiersService.update(id, data);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete classifier (soft delete)" })
  @ApiResponse({ status: 200, description: "Classifier deleted successfully" })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.classifiersService.delete(id);
  }

  @Post(":id/toggle-active")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Toggle classifier active status" })
  @ApiResponse({ status: 200, description: "Classifier active status toggled" })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.classifiersService.toggleActive(id);
  }
}
