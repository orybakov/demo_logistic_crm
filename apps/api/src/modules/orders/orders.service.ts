import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../database/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { Prisma } from "@prisma/client";
import {
  OrderStatus,
  PaymentStatus,
  CreateOrderDto,
  UpdateOrderDto,
  ChangeStatusDto,
  AddPaymentDto,
  OrderQueryDto,
} from "./dto";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `ORD-${year}${month}-${random}`;
  }

  private readonly validStatusTransitions: Record<OrderStatus, OrderStatus[]> =
    {
      [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.INVOICED, OrderStatus.CANCELLED],
      [OrderStatus.INVOICED]: [
        OrderStatus.PARTIALLY_PAID,
        OrderStatus.PAID,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PARTIALLY_PAID]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [],
      [OrderStatus.CANCELLED]: [],
    };

  async findAll(query: OrderQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.paymentStatus && { paymentStatus: query.paymentStatus }),
      ...(query.clientId && { clientId: query.clientId }),
      ...(query.filialId && { filialId: query.filialId }),
      ...(query.assignedToId && { assignedToId: query.assignedToId }),
      ...(query.q && {
        OR: [
          { number: { contains: query.q, mode: "insensitive" } },
          { client: { name: { contains: query.q, mode: "insensitive" } } },
          {
            notes: { contains: query.q, mode: "insensitive" },
          } as Prisma.OrderWhereInput,
        ],
      }),
    };

    if (query.dateFrom || query.dateTo) {
      where.orderDate = {};
      if (query.dateFrom) {
        (where.orderDate as any).gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        (where.orderDate as any).lte = new Date(query.dateTo);
      }
    }

    const orderBy: Prisma.OrderOrderByWithRelationInput =
      query.sortBy && query.sortOrder
        ? { [query.sortBy]: query.sortOrder }
        : { createdAt: "desc" };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        skip,
        take: limit,
        where,
        orderBy,
        include: {
          client: { select: { id: true, name: true, inn: true } },
          filial: { select: { id: true, name: true, code: true } },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { items: true, payments: true, requests: true } },
        },
      }),
    ]);

    return {
      data: orders.map((order) => ({
        ...order,
        subtotal: Number(order.subtotal),
        vatAmount: Number(order.vatAmount),
        total: Number(order.total),
        paidAmount: Number(order.paidAmount),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        filial: { select: { id: true, name: true, code: true } },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: { orderBy: { id: "asc" } },
        payments: { orderBy: { paymentDate: "desc" } },
        requests: {
          where: { deletedAt: null },
          select: {
            id: true,
            number: true,
            status: true,
            createdAt: true,
            _count: { select: { trips: true } },
          },
        },
        _count: { select: { items: true, payments: true, requests: true } },
      },
    });

    if (!order) {
      throw new NotFoundException("Заказ не найден");
    }

    return {
      ...order,
      subtotal: Number(order.subtotal),
      vatAmount: Number(order.vatAmount),
      total: Number(order.total),
      paidAmount: Number(order.paidAmount),
      payments: order.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    };
  }

  async create(dto: CreateOrderDto, userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException("Клиент не найден");
    }

    if (dto.contractId) {
      const contract = await this.prisma.contract.findUnique({
        where: { id: dto.contractId },
      });
      if (!contract) {
        throw new NotFoundException("Договор не найден");
      }
    }

    const number = this.generateOrderNumber();
    const subtotal = new Prisma.Decimal(dto.subtotal);
    const vatRate = new Prisma.Decimal(dto.vatRate ?? 20);
    const vatAmount =
      dto.vatAmount !== undefined
        ? new Prisma.Decimal(dto.vatAmount)
        : subtotal.mul(vatRate).div(100);
    const total =
      dto.total !== undefined
        ? new Prisma.Decimal(dto.total)
        : subtotal.add(vatAmount);

    const order = await this.prisma.order.create({
      data: {
        number,
        clientId: dto.clientId,
        contractId: dto.contractId,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        subtotal,
        vatRate,
        vatAmount,
        total,
        paymentStatus: dto.paymentStatus || PaymentStatus.UNPAID,
        paymentType: dto.paymentType,
        paymentDeadline: dto.paymentDeadline
          ? new Date(dto.paymentDeadline)
          : undefined,
        notes: dto.notes,
        filialId: dto.filialId,
        assignedToId: dto.assignedToId,
        createdById: userId,
        status: OrderStatus.DRAFT,
        paidAmount: new Prisma.Decimal(0),
        items: dto.items
          ? {
              create: dto.items.map((item) => ({
                description: item.description,
                quantity: item.quantity
                  ? new Prisma.Decimal(item.quantity)
                  : undefined,
                unit: item.unit,
                pricePerUnit: new Prisma.Decimal(item.pricePerUnit),
                total:
                  item.total !== undefined
                    ? new Prisma.Decimal(item.total)
                    : new Prisma.Decimal(
                        (item.quantity ?? 1) * item.pricePerUnit,
                      ),
                vatRate: item.vatRate
                  ? new Prisma.Decimal(item.vatRate)
                  : vatRate,
                notes: item.notes,
              })),
            }
          : undefined,
      },
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
    });

    await this.auditService.log(
      "create",
      "order",
      order.id,
      { userId },
      undefined,
      { number: order.number },
    );

    await this.notificationsService.notifyOrderCreated(order, userId);

    return this.findOne(order.id, userId);
  }

  async update(id: string, dto: UpdateOrderDto, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException("Заказ не найден");
    }

    if (order.status === OrderStatus.PAID && dto.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        "Нельзя изменить статус оплаченного заказа",
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException("Нельзя изменить отмененный заказ");
    }

    const updateData: Prisma.OrderUpdateInput = {
      ...(dto.contractId !== undefined && { contractId: dto.contractId }),
      ...(dto.orderDate !== undefined && {
        orderDate: new Date(dto.orderDate),
      }),
      ...(dto.subtotal !== undefined && {
        subtotal: new Prisma.Decimal(dto.subtotal),
      }),
      ...(dto.vatRate !== undefined && {
        vatRate: new Prisma.Decimal(dto.vatRate),
      }),
      ...(dto.vatAmount !== undefined && {
        vatAmount: new Prisma.Decimal(dto.vatAmount),
      }),
      ...(dto.total !== undefined && { total: new Prisma.Decimal(dto.total) }),
      ...(dto.paidAmount !== undefined && {
        paidAmount: new Prisma.Decimal(dto.paidAmount),
      }),
      ...(dto.paymentStatus !== undefined && {
        paymentStatus: dto.paymentStatus,
      }),
      ...(dto.paymentType !== undefined && { paymentType: dto.paymentType }),
      ...(dto.paymentDeadline !== undefined && {
        paymentDeadline: new Date(dto.paymentDeadline),
      }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.filialId !== undefined && { filialId: dto.filialId }),
      ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
    };

    await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log("update", "order", id, { userId }, undefined, {
      changes: Object.keys(dto),
    });

    return this.findOne(id, userId);
  }

  async changeStatus(id: string, dto: ChangeStatusDto, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException("Заказ не найден");
    }

    const currentStatus = order.status as OrderStatus;
    const validTransitions = this.validStatusTransitions[currentStatus];

    if (!validTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Недопустимый переход статуса: ${currentStatus} -> ${dto.status}`,
      );
    }

    if (currentStatus === OrderStatus.PAID) {
      throw new BadRequestException(
        "Нельзя изменить статус оплаченного заказа",
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.auditService.log(
      "status_change",
      "order",
      id,
      { userId },
      undefined,
      { fromStatus: currentStatus, toStatus: dto.status, comment: dto.comment },
    );

    await this.notificationsService.notifyOrderStatusChanged(
      order,
      currentStatus,
      dto.status,
      userId,
    );

    return this.findOne(id, userId);
  }

  async addPayment(id: string, dto: AddPaymentDto, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException("Заказ не найден");
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        "Нельзя добавить оплату к отмененному заказу",
      );
    }

    await this.prisma.payment.create({
      data: {
        orderId: id,
        amount: new Prisma.Decimal(dto.amount),
        paymentDate: new Date(dto.paymentDate),
        paymentMethod: dto.paymentMethod,
        documentNumber: dto.documentNumber,
        documentUrl: dto.documentUrl,
        notes: dto.notes,
        status: "confirmed",
        createdById: userId,
      },
    });

    const allPayments = await this.prisma.payment.aggregate({
      where: { orderId: id, status: "confirmed" },
      _sum: { amount: true },
    });

    const totalPaid = allPayments._sum.amount?.toNumber() || 0;
    const orderTotal = Number(order.total);

    let newPaymentStatus: PaymentStatus;
    if (totalPaid >= orderTotal) {
      newPaymentStatus = PaymentStatus.PAID;
    } else if (totalPaid > 0) {
      newPaymentStatus = PaymentStatus.PARTIALLY_PAID;
    } else {
      newPaymentStatus = PaymentStatus.UNPAID;
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        paidAmount: new Prisma.Decimal(totalPaid),
        paymentStatus: newPaymentStatus,
      },
    });

    await this.auditService.log("payment", "order", id, { userId }, undefined, {
      amount: dto.amount,
      totalPaid,
    });

    await this.notificationsService.notifyOrderPaymentReceived(
      order,
      dto.amount,
    );

    return this.findOne(id, userId);
  }

  async linkRequest(orderId: string, requestId: string, userId: string) {
    const [order, request] = await Promise.all([
      this.prisma.order.findUnique({ where: { id: orderId } }),
      this.prisma.request.findUnique({ where: { id: requestId } }),
    ]);

    if (!order) {
      throw new NotFoundException("Заказ не найден");
    }
    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    await this.prisma.request.update({
      where: { id: requestId },
      data: { orderId },
    });

    await this.auditService.log(
      "link_request",
      "order",
      orderId,
      { userId },
      undefined,
      { requestId },
    );

    await this.notificationsService.notifySystemAnnouncement(
      `Заявка привязана к заказу ${order.number}`,
      `К заказу ${order.number} привязана заявка ${request.number}`,
      [userId, request.createdById].filter(Boolean),
    );

    return this.findOne(orderId, userId);
  }

  async unlinkRequest(orderId: string, requestId: string, userId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId, orderId },
    });
    if (!request) {
      throw new NotFoundException("Заявка не привязана к этому заказу");
    }

    await this.prisma.request.update({
      where: { id: requestId },
      data: { orderId: null },
    });

    await this.auditService.log(
      "unlink_request",
      "order",
      orderId,
      { userId },
      undefined,
      { requestId },
    );

    await this.notificationsService.notifySystemAnnouncement(
      `Заявка отвязана от заказа ${orderId}`,
      `Заявка ${requestId} отвязана от заказа`,
      [userId],
    );

    return this.findOne(orderId, userId);
  }

  async delete(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException("Заказ не найден");
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException("Нельзя удалить оплаченный заказ");
    }

    await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log(
      "delete",
      "order",
      id,
      { userId },
      { status: order.status },
      undefined,
    );

    return { success: true, id };
  }

  async getStats(filialId?: string) {
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(filialId && { filialId }),
    };

    const [total, draftCount, confirmedCount, invoicedCount, paidCount] =
      await Promise.all([
        this.prisma.order.count({ where }),
        this.prisma.order.count({
          where: { ...where, status: OrderStatus.DRAFT },
        }),
        this.prisma.order.count({
          where: { ...where, status: OrderStatus.CONFIRMED },
        }),
        this.prisma.order.count({
          where: { ...where, status: OrderStatus.INVOICED },
        }),
        this.prisma.order.count({
          where: { ...where, status: OrderStatus.PAID },
        }),
      ]);

    const totals = await this.prisma.order.aggregate({
      where: { ...where, deletedAt: null },
      _sum: { total: true, paidAmount: true },
    });

    return {
      total,
      byStatus: {
        [OrderStatus.DRAFT]: draftCount,
        [OrderStatus.CONFIRMED]: confirmedCount,
        [OrderStatus.INVOICED]: invoicedCount,
        [OrderStatus.PAID]: paidCount,
      },
      totalAmount: totals._sum.total?.toNumber() || 0,
      paidAmount: totals._sum.paidAmount?.toNumber() || 0,
      unpaidAmount:
        (totals._sum.total?.toNumber() || 0) -
        (totals._sum.paidAmount?.toNumber() || 0),
    };
  }
}
