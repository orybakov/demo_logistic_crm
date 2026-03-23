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
import { ProblemReasonsService } from "./problem-reasons.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { CreateProblemReasonDto, UpdateProblemReasonDto } from "./dto";

@ApiTags("problem-reasons")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "problem-reasons", version: "1" })
export class ProblemReasonsController {
  constructor(private problemReasonsService: ProblemReasonsService) {}

  @Get()
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.OPERATOR,
    RoleCode.DISPATCHER,
  )
  @ApiOperation({ summary: "Get all problem reasons" })
  @ApiQuery({ name: "skip", required: false })
  @ApiQuery({ name: "take", required: false })
  @ApiQuery({ name: "q", required: false, description: "Search query" })
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "severity", required: false })
  @ApiQuery({ name: "isActive", required: false })
  async findAll(
    @Query("skip") skip?: number,
    @Query("take") take?: number,
    @Query("q") search?: string,
    @Query("category") category?: string,
    @Query("severity") severity?: string,
    @Query("isActive") isActive?: string,
  ) {
    const where: Prisma.ProblemReasonWhereInput = {
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(category && { category }),
      ...(severity && { severity }),
      ...(isActive !== undefined && { isActive: isActive === "true" }),
    };

    return this.problemReasonsService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
    });
  }

  @Get(":id")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.OPERATOR,
    RoleCode.DISPATCHER,
  )
  @ApiOperation({ summary: "Get problem reason by ID" })
  @ApiResponse({
    status: 200,
    description: "Problem reason retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Problem reason not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.problemReasonsService.findOne(id);
  }

  @Post()
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Create new problem reason" })
  @ApiResponse({
    status: 201,
    description: "Problem reason created successfully",
  })
  async create(@Body() data: CreateProblemReasonDto) {
    return this.problemReasonsService.create(data);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Update problem reason" })
  @ApiResponse({
    status: 200,
    description: "Problem reason updated successfully",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateProblemReasonDto,
  ) {
    return this.problemReasonsService.update(id, data);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Delete problem reason (soft delete)" })
  @ApiResponse({
    status: 200,
    description: "Problem reason deleted successfully",
  })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.problemReasonsService.delete(id);
  }

  @Post(":id/toggle-active")
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: "Toggle problem reason active status" })
  @ApiResponse({
    status: 200,
    description: "Problem reason active status toggled",
  })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.problemReasonsService.toggleActive(id);
  }
}
