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
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { RequestsService } from "./requests.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RoleCode } from "@prisma/client";
import {
  CreateRequestDto,
  UpdateRequestDto,
  ChangeStatusDto,
  AddCommentDto,
  SetFlagsDto,
  AddFlagDto,
  RequestQueryDto,
} from "./dto";

@ApiTags("requests")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "requests", version: "1" })
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Get()
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.SALES,
    RoleCode.OPERATOR,
  )
  @ApiOperation({ summary: "Получить список заявок" })
  async findAll(
    @Query() query: RequestQueryDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.requestsService.findAll(query, userId);
  }

  @Get("stats")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Получить статистику по заявкам" })
  @ApiQuery({ name: "filialId", required: false })
  async getStats(@Query("filialId") filialId?: string) {
    return this.requestsService.getStats(filialId);
  }

  @Get(":id")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.SALES,
    RoleCode.OPERATOR,
  )
  @ApiOperation({ summary: "Получить заявку по ID" })
  @ApiResponse({ status: 200, description: "Заявка найдена" })
  @ApiResponse({ status: 404, description: "Заявка не найдена" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.requestsService.findOne(id, userId);
  }

  @Post()
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.SALES,
    RoleCode.OPERATOR,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Создать новую заявку" })
  @ApiResponse({ status: 201, description: "Заявка создана" })
  @ApiResponse({ status: 400, description: "Ошибка валидации" })
  async create(
    @Body() dto: CreateRequestDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.requestsService.create(dto, userId);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Обновить заявку" })
  @ApiResponse({ status: 200, description: "Заявка обновлена" })
  @ApiResponse({ status: 404, description: "Заявка не найдена" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRequestDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.requestsService.update(id, dto, userId);
  }

  @Post(":id/status")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Изменить статус заявки" })
  @ApiResponse({ status: 200, description: "Статус изменен" })
  @ApiResponse({ status: 400, description: "Недопустимый переход статуса" })
  async changeStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.requestsService.changeStatus(id, dto, userId);
  }

  @Post(":id/comments")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.SALES,
    RoleCode.OPERATOR,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Добавить комментарий к заявке" })
  @ApiResponse({ status: 201, description: "Комментарий добавлен" })
  async addComment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.requestsService.addComment(id, dto, userId);
  }

  @Get(":id/comments")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.SALES,
    RoleCode.OPERATOR,
  )
  @ApiOperation({ summary: "Получить комментарии заявки" })
  async getComments(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.requestsService.getComments(id, page, limit);
  }

  @Get(":id/history")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.SALES,
    RoleCode.OPERATOR,
  )
  @ApiOperation({ summary: "Получить историю изменений статусов" })
  async getStatusHistory(@Param("id", ParseUUIDPipe) id: string) {
    return this.requestsService.getStatusHistory(id);
  }

  @Put(":id/flags")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Установить флаги заявки" })
  async setFlags(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SetFlagsDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.requestsService.setFlags(id, dto, userId);
  }

  @Post(":id/flags")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Добавить флаг к заявке" })
  async addFlag(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddFlagDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.requestsService.addFlag(id, dto, userId);
  }

  @Delete(":id/flags/:flag")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Удалить флаг у заявки" })
  async removeFlag(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("flag") flag: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.requestsService.removeFlag(id, { flag }, userId);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Удалить заявку (мягкое удаление)" })
  @ApiResponse({ status: 200, description: "Заявка удалена" })
  @ApiResponse({ status: 404, description: "Заявка не найдена" })
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.requestsService.delete(id, userId);
  }
}
