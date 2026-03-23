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
} from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RoleCode } from "@prisma/client";
import {
  CreateOrderDto,
  UpdateOrderDto,
  ChangeStatusDto,
  AddPaymentDto,
  OrderQueryDto,
} from "./dto";

@ApiTags("orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "orders", version: "1" })
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.SALES, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Получить список заказов" })
  async findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get("stats")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @ApiOperation({ summary: "Получить статистику по заказам" })
  async getStats(@Query("filialId") filialId?: string) {
    return this.ordersService.getStats(filialId);
  }

  @Get(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.SALES, RoleCode.DISPATCHER)
  @ApiOperation({ summary: "Получить заказ по ID" })
  @ApiResponse({ status: 200, description: "Заказ найден" })
  @ApiResponse({ status: 404, description: "Заказ не найден" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.findOne(id, userId);
  }

  @Post()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.SALES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Создать новый заказ" })
  @ApiResponse({ status: 201, description: "Заказ создан" })
  @ApiResponse({ status: 400, description: "Ошибка валидации" })
  async create(@Body() dto: CreateOrderDto, @CurrentUser("id") userId: string) {
    return this.ordersService.create(dto, userId);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.SALES)
  @ApiOperation({ summary: "Обновить заказ" })
  @ApiResponse({ status: 200, description: "Заказ обновлен" })
  @ApiResponse({ status: 404, description: "Заказ не найден" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.update(id, dto, userId);
  }

  @Post(":id/status")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Изменить статус заказа" })
  @ApiResponse({ status: 200, description: "Статус изменен" })
  @ApiResponse({ status: 400, description: "Недопустимый переход статуса" })
  async changeStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.changeStatus(id, dto, userId);
  }

  @Post(":id/payments")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.SALES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Добавить оплату к заказу" })
  @ApiResponse({ status: 201, description: "Оплата добавлена" })
  async addPayment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddPaymentDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.addPayment(id, dto, userId);
  }

  @Post(":id/requests/:requestId")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Привязать заявку к заказу" })
  async linkRequest(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("requestId", ParseUUIDPipe) requestId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.linkRequest(id, requestId, userId);
  }

  @Delete(":id/requests/:requestId")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Отвязать заявку от заказа" })
  async unlinkRequest(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("requestId", ParseUUIDPipe) requestId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.unlinkRequest(id, requestId, userId);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Удалить заказ (мягкое удаление)" })
  @ApiResponse({ status: 200, description: "Заказ удален" })
  @ApiResponse({ status: 404, description: "Заказ не найден" })
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.delete(id, userId);
  }
}
