import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../database/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { Prisma } from "@prisma/client";
import {
  CreateRequestDto,
  UpdateRequestDto,
  ChangeStatusDto,
  AddCommentDto,
  SetFlagsDto,
  AddFlagDto,
  RemoveFlagDto,
  RequestStatus,
  RequestPriority,
  RequestQueryDto,
} from "./dto";

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [RequestStatus.NEW]: [
    RequestStatus.CONFIRMED,
    RequestStatus.ON_HOLD,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.CONFIRMED]: [
    RequestStatus.IN_PROGRESS,
    RequestStatus.ON_HOLD,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.IN_PROGRESS]: [
    RequestStatus.COMPLETED,
    RequestStatus.ON_HOLD,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.ON_HOLD]: [
    RequestStatus.NEW,
    RequestStatus.CONFIRMED,
    RequestStatus.IN_PROGRESS,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.COMPLETED]: [],
  [RequestStatus.CANCELLED]: [RequestStatus.NEW],
};

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  private generateRequestNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `REQ-${year}${month}${day}-${random}`;
  }

  async findAll(query: RequestQueryDto, userId?: string) {
    const {
      page = 1,
      limit = 20,
      q,
      status,
      priority,
      clientId,
      assignedToId,
      filialId,
      dateFrom,
      dateTo,
      hasActiveTrips,
    } = query;

    const where: Prisma.RequestWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(clientId && { clientId }),
      ...(assignedToId && { assignedToId }),
      ...(filialId && { filialId }),
      ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
      ...(dateTo && {
        createdAt: { lte: new Date(dateTo + "T23:59:59.999Z") },
      }),
      ...(hasActiveTrips !== undefined && {
        trips: hasActiveTrips
          ? { some: { status: { notIn: ["completed", "cancelled"] } } }
          : { none: { status: { notIn: ["completed", "cancelled"] } } },
      }),
    };

    if (q) {
      where.OR = [
        { number: { contains: q, mode: "insensitive" } },
        { client: { name: { contains: q, mode: "insensitive" } } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, requests] = await Promise.all([
      this.prisma.request.count({ where }),
      this.prisma.request.findMany({
        skip,
        take: limit,
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          client: { select: { id: true, name: true, inn: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          filial: { select: { id: true, name: true, shortName: true } },
          _count: {
            select: {
              trips: true,
              comments: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      requests: requests.map((r) => ({
        ...r,
        flags: r.flags ? JSON.parse(r.flags as string) : [],
      })),
    };
  }

  async findOne(id: string, userId?: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        client: true,
        filial: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        points: {
          orderBy: { sequence: "asc" },
        },
        cargoItems: true,
        trips: {
          include: {
            vehicle: true,
            driver: true,
            assignedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            checkpoints: { orderBy: { sequence: "asc" } },
            _count: { select: { checkpoints: true } },
          },
        },
        statusHistory: {
          orderBy: { changedAt: "desc" },
          take: 20,
          include: {
            changedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        order: {
          select: { id: true, number: true, total: true, paymentStatus: true },
        },
        _count: {
          select: {
            trips: true,
            comments: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    return {
      ...request,
      flags: request.flags ? JSON.parse(request.flags as string) : [],
    };
  }

  async create(dto: CreateRequestDto, userId: string, context?: any) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException("Клиент не найден");
    }

    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      });
      if (!order) {
        throw new NotFoundException("Заказ не найден");
      }
    }

    if (dto.points && dto.points.length < 2) {
      throw new BadRequestException(
        "Требуется минимум 2 точки (погрузка и выгрузка)",
      );
    }

    const number = this.generateRequestNumber();

    const hasPickup = dto.points?.some((p) => p.type === "pickup");
    const hasDelivery = dto.points?.some((p) => p.type === "delivery");

    if (!hasPickup || !hasDelivery) {
      throw new BadRequestException(
        "Требуется точка погрузки и точка доставки",
      );
    }

    const request = await this.prisma.request.create({
      data: {
        number,
        clientId: dto.clientId,
        orderId: dto.orderId,
        type: dto.type || "auto",
        cargoTypeId: dto.cargoTypeId,
        totalWeight: dto.totalWeight
          ? new Prisma.Decimal(dto.totalWeight)
          : undefined,
        totalVolume: dto.totalVolume
          ? new Prisma.Decimal(dto.totalVolume)
          : undefined,
        totalPieces: dto.totalPieces,
        status: RequestStatus.NEW,
        priority: dto.priority || RequestPriority.NORMAL,
        flags: dto.flags ? JSON.stringify(dto.flags) : undefined,
        temperatureFrom: dto.temperatureFrom
          ? new Prisma.Decimal(dto.temperatureFrom)
          : undefined,
        temperatureTo: dto.temperatureTo
          ? new Prisma.Decimal(dto.temperatureTo)
          : undefined,
        notes: dto.notes,
        estimatedPrice: dto.estimatedPrice
          ? new Prisma.Decimal(dto.estimatedPrice)
          : undefined,
        filialId: dto.filialId || client.filialId,
        assignedToId: dto.assignedToId,
        createdById: userId,
        points: dto.points
          ? {
              create: dto.points.map((p, idx) => ({
                ...p,
                sequence: idx + 1,
              })),
            }
          : undefined,
        cargoItems: dto.cargoItems
          ? {
              create: dto.cargoItems.map((item) => ({
                ...item,
                weight: item.weight
                  ? new Prisma.Decimal(item.weight)
                  : undefined,
                volume: item.volume
                  ? new Prisma.Decimal(item.volume)
                  : undefined,
                length: item.length
                  ? new Prisma.Decimal(item.length)
                  : undefined,
                width: item.width ? new Prisma.Decimal(item.width) : undefined,
                height: item.height
                  ? new Prisma.Decimal(item.height)
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        client: true,
        filial: true,
        points: { orderBy: { sequence: "asc" } },
        cargoItems: true,
      },
    });

    await this.prisma.requestStatusHistory.create({
      data: {
        requestId: request.id,
        status: RequestStatus.NEW,
        changedById: userId,
        comment: "Заявка создана",
      },
    });

    await this.auditService.logCreate("request", request as any, {
      userId,
      ...context,
    });

    await this.notificationsService.notifyRequestCreated(request, userId);

    return this.findOne(request.id, userId);
  }

  async update(
    id: string,
    dto: UpdateRequestDto,
    userId: string,
    context?: any,
  ) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: { points: true, cargoItems: true, trips: true },
    });

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    if (
      request.status === RequestStatus.COMPLETED ||
      request.status === RequestStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "Нельзя редактировать завершенную или отмененную заявку",
      );
    }

    const activeTrips = request.trips?.filter(
      (t) => !["completed", "cancelled"].includes(t.status),
    );
    if (activeTrips && activeTrips.length > 0) {
      throw new BadRequestException(
        "Нельзя редактировать заявку с активными рейсами",
      );
    }

    const updateData: Prisma.RequestUpdateInput = {};

    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.cargoTypeId !== undefined) updateData.cargoTypeId = dto.cargoTypeId;
    if (dto.totalWeight !== undefined)
      updateData.totalWeight = new Prisma.Decimal(dto.totalWeight);
    if (dto.totalVolume !== undefined)
      updateData.totalVolume = new Prisma.Decimal(dto.totalVolume);
    if (dto.totalPieces !== undefined) updateData.totalPieces = dto.totalPieces;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.flags !== undefined) updateData.flags = JSON.stringify(dto.flags);
    if (dto.temperatureFrom !== undefined)
      updateData.temperatureFrom = new Prisma.Decimal(dto.temperatureFrom);
    if (dto.temperatureTo !== undefined)
      updateData.temperatureTo = new Prisma.Decimal(dto.temperatureTo);
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.estimatedPrice !== undefined)
      updateData.estimatedPrice = new Prisma.Decimal(dto.estimatedPrice);
    if (dto.filialId !== undefined)
      updateData.filial = { connect: { id: dto.filialId } };
    if (dto.assignedToId !== undefined)
      updateData.assignedTo = { connect: { id: dto.assignedToId } };

    await this.prisma.request.update({
      where: { id },
      data: updateData,
    });

    if (dto.points) {
      await this.prisma.point.deleteMany({ where: { requestId: id } });
      await this.prisma.point.createMany({
        data: dto.points.map((p, idx) => ({
          ...p,
          requestId: id,
          sequence: idx + 1,
        })),
      });
    }

    if (dto.cargoItems) {
      await this.prisma.cargoItem.deleteMany({ where: { requestId: id } });
      await this.prisma.cargoItem.createMany({
        data: dto.cargoItems.map((item) => ({
          ...item,
          requestId: id,
          weight: item.weight ? new Prisma.Decimal(item.weight) : undefined,
          volume: item.volume ? new Prisma.Decimal(item.volume) : undefined,
          length: item.length ? new Prisma.Decimal(item.length) : undefined,
          width: item.width ? new Prisma.Decimal(item.width) : undefined,
          height: item.height ? new Prisma.Decimal(item.height) : undefined,
        })),
      });
    }

    return this.findOne(id, userId);
  }

  async changeStatus(
    id: string,
    dto: ChangeStatusDto,
    userId: string,
    context?: any,
  ) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: { trips: true },
    });

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    const currentStatus = request.status;
    const newStatus = dto.status;

    if (currentStatus === RequestStatus.COMPLETED) {
      throw new BadRequestException("Заявка уже завершена");
    }

    if (
      currentStatus === RequestStatus.CANCELLED &&
      newStatus !== RequestStatus.NEW
    ) {
      throw new BadRequestException(
        "Отмененную заявку можно только вернуть в статус 'Новая'",
      );
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Недопустимый переход статуса: ${currentStatus} → ${newStatus}. Допустимые: ${allowedTransitions.join(", ") || "нет"}`,
      );
    }

    if (newStatus === RequestStatus.CANCELLED) {
      const activeTrips = request.trips?.filter(
        (t) => !["completed", "cancelled"].includes(t.status),
      );
      if (activeTrips && activeTrips.length > 0) {
        throw new BadRequestException(
          "Нельзя отменить заявку с активными рейсами",
        );
      }
    }

    if (newStatus === RequestStatus.COMPLETED) {
      const hasActiveTrips = request.trips?.some(
        (t) => !["completed", "cancelled"].includes(t.status),
      );
      if (hasActiveTrips) {
        throw new BadRequestException(
          "Все рейсы должны быть завершены перед закрытием заявки",
        );
      }
    }

    const oldStatus = request.status;

    const updateData: Prisma.RequestUpdateInput = { status: newStatus };
    if (newStatus === RequestStatus.CONFIRMED) {
      updateData.confirmedAt = new Date();
    }
    if (newStatus === RequestStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    await Promise.all([
      this.prisma.request.update({
        where: { id },
        data: updateData,
      }),
      this.prisma.requestStatusHistory.create({
        data: {
          requestId: id,
          status: newStatus,
          changedById: userId,
          reason: dto.reason,
          comment: dto.comment,
        },
      }),
    ]);

    await this.notificationsService.notifyRequestStatusChanged(
      request,
      oldStatus,
      newStatus,
      userId,
    );

    if (dto.comment?.trim()) {
      await this.addComment(
        id,
        { text: dto.comment.trim(), isSystem: false },
        userId,
      );
    }

    return this.findOne(id, userId);
  }

  async addComment(id: string, dto: AddCommentDto, userId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    const comment = await this.prisma.comment.create({
      data: {
        text: dto.text,
        entityType: "request",
        entityId: id,
        authorId: userId,
        isSystem: dto.isSystem || false,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.notificationsService.notifyCommentAdded("request", id, comment, [
      request.createdById,
      request.assignedToId,
      userId,
    ]);

    return comment;
  }

  async setFlags(id: string, dto: SetFlagsDto, userId: string, context?: any) {
    const request = await this.prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    const oldFlags = request.flags ? JSON.parse(request.flags as string) : [];

    await this.prisma.request.update({
      where: { id },
      data: { flags: JSON.stringify(dto.flags) },
    });

    return this.findOne(id, userId);
  }

  async addFlag(id: string, dto: AddFlagDto, userId: string, context?: any) {
    const request = await this.prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    const currentFlags: string[] = request.flags
      ? JSON.parse(request.flags as string)
      : [];
    if (currentFlags.includes(dto.flag)) {
      throw new ConflictException(`Флаг '${dto.flag}' уже установлен`);
    }

    const newFlags = [...currentFlags, dto.flag];

    await this.prisma.request.update({
      where: { id },
      data: { flags: JSON.stringify(newFlags) },
    });

    await this.addComment(
      id,
      { text: `Добавлен флаг: ${dto.flag}`, isSystem: true },
      userId,
    );

    await this.notificationsService.notifyFlagAdded(
      "request",
      id,
      dto.flag,
      userId,
      [request.createdById, request.assignedToId, userId],
    );

    return this.findOne(id, userId);
  }

  async removeFlag(
    id: string,
    dto: RemoveFlagDto,
    userId: string,
    context?: any,
  ) {
    const request = await this.prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    const currentFlags: string[] = request.flags
      ? JSON.parse(request.flags as string)
      : [];
    if (!currentFlags.includes(dto.flag)) {
      throw new NotFoundException(`Флаг '${dto.flag}' не установлен`);
    }

    const newFlags = currentFlags.filter((f) => f !== dto.flag);

    await this.prisma.request.update({
      where: { id },
      data: { flags: JSON.stringify(newFlags) },
    });

    await this.addComment(
      id,
      { text: `Удален флаг: ${dto.flag}`, isSystem: true },
      userId,
    );

    await this.notificationsService.notifyFlagRemoved(
      "request",
      id,
      dto.flag,
      userId,
      [request.createdById, request.assignedToId, userId],
    );

    return this.findOne(id, userId);
  }

  async getStatusHistory(id: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    return this.prisma.requestStatusHistory.findMany({
      where: { requestId: id },
      orderBy: { changedAt: "desc" },
      include: {
        changedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getComments(id: string, page = 1, limit = 20) {
    const request = await this.prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    const skip = (page - 1) * limit;

    const [total, comments] = await Promise.all([
      this.prisma.comment.count({
        where: { entityType: "request", entityId: id },
      }),
      this.prisma.comment.findMany({
        where: { entityType: "request", entityId: id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      comments,
    };
  }

  async delete(id: string, userId: string, context?: any) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: { trips: true },
    });

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    const activeTrips = request.trips?.filter(
      (t) => !["completed", "cancelled"].includes(t.status),
    );
    if (activeTrips && activeTrips.length > 0) {
      throw new BadRequestException(
        "Нельзя удалить заявку с активными рейсами",
      );
    }

    await this.prisma.request.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.logDelete("request", request as any, {
      userId,
      ...context,
    });

    return { success: true, message: "Заявка удалена" };
  }

  async getStats(filialId?: string) {
    const where: Prisma.RequestWhereInput = {
      deletedAt: null,
      ...(filialId && { filialId }),
    };

    const [total, byStatus, byPriority, recent] = await Promise.all([
      this.prisma.request.count({ where }),
      this.prisma.request.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      this.prisma.request.groupBy({
        by: ["priority"],
        where: { ...where, status: { not: RequestStatus.COMPLETED } },
        _count: true,
      }),
      this.prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          number: true,
          status: true,
          priority: true,
          createdAt: true,
          client: { select: { name: true } },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, s) => {
          acc[s.status] = s._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byPriority: byPriority.reduce(
        (acc, p) => {
          acc[p.priority] = p._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recent,
    };
  }
}
