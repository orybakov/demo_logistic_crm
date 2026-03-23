import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../database/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { Prisma } from "@prisma/client";
import {
  TripStatus,
  tripStatusLabels,
  VALID_STATUS_TRANSITIONS,
  CreateTripDto,
  UpdateTripDto,
  ScheduleQueryDto,
} from "./dto";

export interface TripWithRelations {
  id: string;
  number: string;
  requestId: string;
  vehicleId: string | null;
  driverId: string | null;
  status: string;
  plannedStart: Date | null;
  actualStart: Date | null;
  plannedEnd: Date | null;
  actualEnd: Date | null;
  plannedDistance: Prisma.Decimal | null;
  actualDistance: Prisma.Decimal | null;
  plannedDuration: number | null;
  actualDuration: number | null;
  plannedFuel: Prisma.Decimal | null;
  actualFuel: Prisma.Decimal | null;
  delayMinutes: number | null;
  delayReason: string | null;
  cancellationReason: string | null;
  notes: string | null;
  assignedById: string | null;
  completedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  request?: any;
  vehicle?: any;
  driver?: any;
  assignedBy?: any;
  completedBy?: any;
  checkpoints?: any[];
  statusHistory?: any[];
  comments?: any[];
}

interface ResourceAvailability {
  vehicleId?: string;
  driverId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ScheduleSlot {
  tripId: string;
  tripNumber: string;
  requestNumber: string;
  checkpointId: string;
  type: "loading" | "unloading";
  plannedTime: Date;
  actualTime: Date | null;
  isCompleted: boolean;
  address: string;
  city?: string;
  vehiclePlate?: string;
  driverName?: string;
  status: string;
}

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  private generateTripNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `TRP-${year}${month}${day}-${hours}${minutes}-${random}`;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    requestId?: string;
    vehicleId?: string;
    driverId?: string;
    filialId?: string;
    q?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const {
      page = 1,
      limit = 20,
      status,
      requestId,
      vehicleId,
      driverId,
      filialId,
      q,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const where: Prisma.TripWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(requestId && { requestId }),
      ...(vehicleId && { vehicleId }),
      ...(driverId && { driverId }),
      ...(filialId && { request: { filialId } }),
      ...(dateFrom && { plannedStart: { gte: new Date(dateFrom) } }),
      ...(dateTo && {
        plannedStart: { lte: new Date(dateTo + "T23:59:59.999Z") },
      }),
    };

    if (q) {
      where.OR = [
        { number: { contains: q, mode: "insensitive" } },
        { request: { number: { contains: q, mode: "insensitive" } } },
        { request: { client: { name: { contains: q, mode: "insensitive" } } } },
        { vehicle: { plateNumber: { contains: q, mode: "insensitive" } } },
        { driver: { lastName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, trips] = await Promise.all([
      this.prisma.trip.count({ where }),
      this.prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          request: {
            include: {
              client: { select: { id: true, name: true } },
              points: {
                where: { type: { in: ["pickup", "delivery"] } },
                orderBy: { sequence: "asc" },
                take: 2,
              },
            },
          },
          vehicle: {
            select: { id: true, plateNumber: true, brand: true, model: true },
          },
          driver: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          assignedBy: { select: { id: true, firstName: true, lastName: true } },
          checkpoints: {
            select: {
              id: true,
              type: true,
              plannedTime: true,
              actualTime: true,
              isCompleted: true,
              address: true,
            },
            orderBy: { plannedTime: "asc" },
          },
          _count: { select: { checkpoints: true } },
        },
      }),
    ]);

    return {
      data: trips,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<TripWithRelations> {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            client: {
              select: { id: true, name: true, phone: true, email: true },
            },
            points: { orderBy: { sequence: "asc" } },
            cargoItems: true,
          },
        },
        vehicle: true,
        driver: {
          include: {
            trips: {
              where: {
                status: {
                  in: ["assigned", "loading", "in_progress", "unloading"],
                },
                deletedAt: null,
              },
              select: { id: true, number: true, status: true },
            },
          },
        },
        assignedBy: { select: { id: true, firstName: true, lastName: true } },
        completedBy: { select: { id: true, firstName: true, lastName: true } },
        checkpoints: { orderBy: { sequence: "asc" } },
        statusHistory: {
          orderBy: { changedAt: "desc" },
          include: {
            changedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    return trip as TripWithRelations;
  }

  async create(
    data: CreateTripDto,
    userId: string,
  ): Promise<TripWithRelations> {
    const request = await this.prisma.request.findUnique({
      where: { id: data.requestId },
      include: {
        points: {
          orderBy: { sequence: "asc" },
        },
        trips: {
          where: {
            status: { notIn: ["completed", "cancelled"] },
            deletedAt: null,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    if (request.status !== "confirmed" && request.status !== "in_progress") {
      throw new BadRequestException(
        "Заявка должна быть подтверждена или в работе",
      );
    }

    if (request.trips.length > 0) {
      throw new ConflictException("К заявке уже привязан активный рейс");
    }

    if (data.vehicleId) {
      await this.checkVehicleAvailability(
        data.vehicleId,
        data.plannedStart,
        data.plannedEnd,
      );
    }

    if (data.driverId) {
      await this.checkDriverAvailability(
        data.driverId,
        data.plannedStart,
        data.plannedEnd,
      );
    }

    const tripNumber = this.generateTripNumber();

    const requestPoints = Array.isArray(request.points) ? request.points : [];

    const trip = await this.prisma.$transaction(async (tx) => {
      const createdTrip = await tx.trip.create({
        data: {
          number: tripNumber,
          requestId: data.requestId,
          vehicleId: data.vehicleId,
          driverId: data.driverId,
          plannedStart: data.plannedStart ? new Date(data.plannedStart) : null,
          plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : null,
          plannedDistance: data.plannedDistance,
          plannedDuration: data.plannedDuration,
          plannedFuel: data.plannedFuel,
          notes: data.notes,
          assignedById: userId,
          status:
            data.vehicleId && data.driverId
              ? TripStatus.ASSIGNED
              : TripStatus.SCHEDULED,
        },
      });

      await tx.tripStatusHistory.create({
        data: {
          tripId: createdTrip.id,
          status: createdTrip.status,
          changedById: userId,
        },
      });

      if (requestPoints.length > 0) {
        const checkpoints = requestPoints.map((point, index) => ({
          tripId: createdTrip.id,
          pointId: point.id,
          type: point.type === "pickup" ? "loading" : "unloading",
          sequence: index + 1,
          name: point.address,
          address: point.address,
          plannedTime: point.plannedDate,
          latitude: point.latitude,
          longitude: point.longitude,
        }));

        await tx.checkpoint.createMany({ data: checkpoints });
      }

      return createdTrip;
    });

    void this.auditService
      .log("create", "trip", trip.id, { userId }, undefined, {
        number: trip.number,
        status: trip.status,
      })
      .catch((error) =>
        this.logger.warn(
          `Failed to write audit log for trip ${trip.id}: ${String(error)}`,
        ),
      );

    void this.notificationsService
      .notifyTripCreated(trip, userId)
      .catch((error) =>
        this.logger.warn(
          `Failed to notify trip creation for ${trip.id}: ${String(error)}`,
        ),
      );

    return this.findOne(trip.id);
  }

  async update(
    id: string,
    data: UpdateTripDto,
    userId: string,
  ): Promise<TripWithRelations> {
    const trip = await this.prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    if (
      trip.status === TripStatus.COMPLETED ||
      trip.status === TripStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "Нельзя редактировать завершённый или отменённый рейс",
      );
    }

    if (data.vehicleId && data.vehicleId !== trip.vehicleId) {
      await this.checkVehicleAvailability(
        data.vehicleId,
        data.plannedStart,
        data.plannedEnd,
      );
    }

    if (data.driverId && data.driverId !== trip.driverId) {
      await this.checkDriverAvailability(
        data.driverId,
        data.plannedStart,
        data.plannedEnd,
      );
    }

    const updateData: Prisma.TripUncheckedUpdateInput = {
      ...data,
      plannedStart: data.plannedStart ? new Date(data.plannedStart) : undefined,
      plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : undefined,
    };

    const updatedTrip = await this.prisma.trip.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log(
      "update",
      "trip",
      id,
      { userId },
      trip,
      updatedTrip,
    );

    if (data.vehicleId || data.driverId) {
      await this.notificationsService.notifyTripStatusChanged(
        updatedTrip,
        trip.status,
        updatedTrip.status,
        userId,
      );
    }

    return this.findOne(id);
  }

  async assignResources(
    id: string,
    data: { vehicleId: string; driverId: string },
    userId: string,
  ): Promise<TripWithRelations> {
    const trip = await this.prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    if (trip.status !== TripStatus.SCHEDULED) {
      throw new BadRequestException(
        "Ресурсы можно назначить только для запланированного рейса",
      );
    }

    await this.checkVehicleAvailability(
      data.vehicleId,
      trip.plannedStart?.toISOString(),
      trip.plannedEnd?.toISOString(),
      id,
    );

    await this.checkDriverAvailability(
      data.driverId,
      trip.plannedStart?.toISOString(),
      trip.plannedEnd?.toISOString(),
      id,
    );

    await Promise.all([
      this.prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: "on_trip" },
      }),
      this.prisma.driver.update({
        where: { id: data.driverId },
        data: { status: "on_trip" },
      }),
      this.prisma.tripStatusHistory.create({
        data: {
          tripId: id,
          status: TripStatus.ASSIGNED,
          changedById: userId,
        },
      }),
    ]);

    const updatedTrip = await this.prisma.trip.update({
      where: { id },
      data: {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        status: TripStatus.ASSIGNED,
      },
    });

    await this.auditService.log("assign_resources", "trip", id, {
      userId,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
    });

    await this.notificationsService.notifyTripStatusChanged(
      updatedTrip,
      trip.status,
      TripStatus.ASSIGNED,
      userId,
    );

    return this.findOne(id);
  }

  async changeStatus(
    id: string,
    newStatus: TripStatus,
    userId: string,
    comment?: string,
  ): Promise<TripWithRelations> {
    const trip = await this.prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    const currentStatus = trip.status as TripStatus;
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];

    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Недопустимый переход статуса: ${tripStatusLabels[currentStatus]} → ${tripStatusLabels[newStatus]}`,
      );
    }

    const updateData: Prisma.TripUpdateInput = {
      status: newStatus,
    };

    if (newStatus === TripStatus.LOADING) {
      if (!trip.vehicleId || !trip.driverId) {
        throw new BadRequestException(
          "Для начала погрузки необходимо назначить транспорт и водителя",
        );
      }
    }

    if (newStatus === TripStatus.IN_PROGRESS) {
      updateData.actualStart = trip.actualStart || new Date();
    }

    if (newStatus === TripStatus.COMPLETED) {
      updateData.actualEnd = new Date();
      if (trip.vehicleId) {
        await this.prisma.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: "available" },
        });
      }
      if (trip.driverId) {
        await this.prisma.driver.update({
          where: { id: trip.driverId },
          data: { status: "available" },
        });
      }
    }

    if (newStatus === TripStatus.CANCELLED) {
      if (trip.vehicleId) {
        await this.prisma.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: "available" },
        });
      }
      if (trip.driverId) {
        await this.prisma.driver.update({
          where: { id: trip.driverId },
          data: { status: "available" },
        });
      }
    }

    await Promise.all([
      this.prisma.trip.update({ where: { id }, data: updateData }),
      this.prisma.tripStatusHistory.create({
        data: {
          tripId: id,
          status: newStatus,
          changedById: userId,
        },
      }),
    ]);

    await this.auditService.log("change_status", "trip", id, {
      userId,
      newStatus,
      comment,
    });

    if (comment?.trim()) {
      await this.addComment(id, comment.trim(), userId);
    }

    await this.notificationsService.notifyTripStatusChanged(
      trip,
      currentStatus,
      newStatus,
      userId,
    );

    return this.findOne(id);
  }

  async start(id: string, userId: string): Promise<TripWithRelations> {
    return this.changeStatus(id, TripStatus.IN_PROGRESS, userId);
  }

  async complete(
    id: string,
    data: {
      actualEnd?: Date;
      actualDistance?: number;
      actualDuration?: number;
      actualFuel?: number;
      notes?: string;
    },
    userId: string,
  ): Promise<TripWithRelations> {
    const trip = await this.prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    const updateData: Prisma.TripUncheckedUpdateInput = {
      status: TripStatus.COMPLETED,
      actualEnd: data.actualEnd ? new Date(data.actualEnd) : new Date(),
      actualDistance: data.actualDistance,
      actualDuration: data.actualDuration,
      actualFuel: data.actualFuel,
      notes: data.notes || trip.notes,
      completedById: userId,
    };

    await Promise.all([
      this.prisma.trip.update({ where: { id }, data: updateData }),
      trip.vehicleId
        ? this.prisma.vehicle.update({
            where: { id: trip.vehicleId },
            data: { status: "available" },
          })
        : Promise.resolve(),
      trip.driverId
        ? this.prisma.driver.update({
            where: { id: trip.driverId },
            data: { status: "available" },
          })
        : Promise.resolve(),
      this.prisma.tripStatusHistory.create({
        data: {
          tripId: id,
          status: TripStatus.COMPLETED,
          changedById: userId,
        },
      }),
    ]);

    await this.prisma.request.update({
      where: { id: trip.requestId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    await this.auditService.log("complete", "trip", id, { userId });

    await this.notificationsService.notifyTripStatusChanged(
      trip,
      trip.status,
      TripStatus.COMPLETED,
      userId,
    );

    return this.findOne(id);
  }

  async cancel(
    id: string,
    reason: string,
    userId: string,
  ): Promise<TripWithRelations> {
    const trip = await this.prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    if (trip.status === TripStatus.COMPLETED) {
      throw new BadRequestException("Нельзя отменить завершённый рейс");
    }

    await Promise.all([
      this.prisma.trip.update({
        where: { id },
        data: {
          status: TripStatus.CANCELLED,
          cancellationReason: reason,
        },
      }),
      trip.vehicleId
        ? this.prisma.vehicle.update({
            where: { id: trip.vehicleId },
            data: { status: "available" },
          })
        : Promise.resolve(),
      trip.driverId
        ? this.prisma.driver.update({
            where: { id: trip.driverId },
            data: { status: "available" },
          })
        : Promise.resolve(),
      this.prisma.tripStatusHistory.create({
        data: {
          tripId: id,
          status: TripStatus.CANCELLED,
          changedById: userId,
          reason,
        },
      }),
    ]);

    await this.auditService.log("cancel", "trip", id, { userId, reason });

    await this.notificationsService.notifyTripStatusChanged(
      trip,
      trip.status,
      TripStatus.CANCELLED,
      userId,
    );

    return this.findOne(id);
  }

  async updateCheckpoint(
    tripId: string,
    checkpointId: string,
    data: {
      isCompleted?: boolean;
      actualTime?: Date;
      notes?: string;
      completedById: string;
    },
  ): Promise<any> {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
    });

    if (!checkpoint || checkpoint.tripId !== tripId) {
      throw new NotFoundException("Контрольная точка не найдена");
    }

    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });

    if (data.isCompleted && trip && trip.status === TripStatus.IN_PROGRESS) {
      const firstIncomplete = await this.prisma.checkpoint.findFirst({
        where: { tripId, isCompleted: false },
        orderBy: { sequence: "asc" },
      });

      if (firstIncomplete && firstIncomplete.id !== checkpointId) {
        throw new BadRequestException(
          "Необходимо выполнить контрольные точки по порядку",
        );
      }
    }

    return this.prisma.checkpoint.update({
      where: { id: checkpointId },
      data: {
        isCompleted: data.isCompleted ?? true,
        actualTime: data.actualTime ?? (data.isCompleted ? new Date() : null),
        completedAt: data.isCompleted ? new Date() : null,
        completedById: data.completedById,
        notes: data.notes,
      },
    });
  }

  async addCheckpoint(tripId: string, data: any): Promise<any> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    if (
      trip.status === TripStatus.COMPLETED ||
      trip.status === TripStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "Нельзя добавить точку к завершённому или отменённому рейсу",
      );
    }

    return this.prisma.checkpoint.create({
      data: {
        tripId,
        pointId: data.pointId,
        type: data.type,
        sequence: data.sequence,
        name: data.name,
        address: data.address,
        plannedTime: data.plannedTime ? new Date(data.plannedTime) : null,
      },
    });
  }

  async removeCheckpoint(tripId: string, checkpointId: string): Promise<void> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    if (
      trip.status === TripStatus.COMPLETED ||
      trip.status === TripStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "Нельзя удалить точку из завершённого или отменённого рейса",
      );
    }

    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
    });

    if (!checkpoint || checkpoint.tripId !== tripId) {
      throw new NotFoundException("Контрольная точка не найдена");
    }

    if (checkpoint.isCompleted) {
      throw new BadRequestException("Нельзя удалить выполненную точку");
    }

    await this.prisma.checkpoint.delete({ where: { id: checkpointId } });
  }

  async addComment(
    tripId: string,
    text: string,
    authorId: string,
  ): Promise<any> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    const comment = await this.prisma.comment.create({
      data: {
        text,
        entityType: "trip",
        entityId: tripId,
        authorId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.notificationsService.notifyCommentAdded(
      "trip",
      tripId,
      comment,
      [trip.assignedById, trip.driverId, authorId],
    );

    return comment;
  }

  async getComments(id: string, page = 1, limit = 20) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    const skip = (page - 1) * limit;

    const [total, comments] = await Promise.all([
      this.prisma.comment.count({
        where: { entityType: "trip", entityId: id },
      }),
      this.prisma.comment.findMany({
        where: { entityType: "trip", entityId: id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true },
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

  async getSchedule(query: ScheduleQueryDto): Promise<ScheduleSlot[]> {
    const now = new Date();
    const year = query.year || now.getFullYear();
    const month = query.month || now.getMonth() + 1;

    let dateFrom: Date;
    let dateTo: Date;

    const parseBound = (value: string, endOfDay = false) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException("Некорректный диапазон дат");
      }

      if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        parsed.setHours(23, 59, 59, 999);
      }

      return parsed;
    };

    if (query.dateFrom && query.dateTo) {
      dateFrom = parseBound(query.dateFrom);
      dateTo = parseBound(query.dateTo, true);
    } else {
      dateFrom = new Date(year, month - 1, 1);
      dateTo = new Date(year, month, 0, 23, 59, 59, 999);
    }

    const where: Prisma.TripWhereInput = {
      deletedAt: null,
      status: {
        in: ["assigned", "loading", "in_progress", "unloading", "delayed"],
      },
      checkpoints: {
        some: {
          plannedTime: { gte: dateFrom, lte: dateTo },
        },
      },
      ...(query.vehicleId && { vehicleId: query.vehicleId }),
      ...(query.driverId && { driverId: query.driverId }),
    };

    const trips = await this.prisma.trip.findMany({
      where,
      include: {
        vehicle: { select: { plateNumber: true } },
        driver: { select: { firstName: true, lastName: true } },
        checkpoints: {
          where: {
            plannedTime: { gte: dateFrom, lte: dateTo },
            ...(query.type && { type: query.type }),
          },
          orderBy: { plannedTime: "asc" },
        },
        request: { select: { number: true } },
      },
    });

    const slots: ScheduleSlot[] = [];

    for (const trip of trips) {
      for (const checkpoint of trip.checkpoints) {
        slots.push({
          tripId: trip.id,
          tripNumber: trip.number,
          requestNumber: trip.request?.number || "—",
          checkpointId: checkpoint.id,
          type: checkpoint.type as "loading" | "unloading",
          plannedTime: checkpoint.plannedTime!,
          actualTime: checkpoint.actualTime,
          isCompleted: checkpoint.isCompleted,
          address: checkpoint.address || checkpoint.name,
          city: undefined,
          vehiclePlate: trip.vehicle?.plateNumber,
          driverName: trip.driver
            ? `${trip.driver.firstName} ${trip.driver.lastName}`
            : undefined,
          status: trip.status,
        });
      }
    }

    return slots.sort(
      (a, b) => a.plannedTime.getTime() - b.plannedTime.getTime(),
    );
  }

  async getAvailableResources(
    dateFrom: Date,
    dateTo: Date,
    excludeTripId?: string,
  ): Promise<{ vehicles: any[]; drivers: any[] }> {
    const vehicleWhere: Prisma.VehicleWhereInput = {
      isActive: true,
      status: "available",
      id: {
        notIn: (
          await this.prisma.trip.findMany({
            where: {
              deletedAt: null,
              status: {
                in: [
                  "assigned",
                  "loading",
                  "in_progress",
                  "unloading",
                  "delayed",
                ],
              },
              plannedStart: { lte: dateTo },
              OR: [{ plannedEnd: { gte: dateFrom } }, { plannedEnd: null }],
              ...(excludeTripId && { id: { not: excludeTripId } }),
            },
            select: { vehicleId: true },
          })
        )
          .map((t) => t.vehicleId)
          .filter((id) => id !== null),
      },
    };

    const driverWhere: Prisma.DriverWhereInput = {
      isActive: true,
      status: "available",
      id: {
        notIn: (
          await this.prisma.trip.findMany({
            where: {
              deletedAt: null,
              status: {
                in: [
                  "assigned",
                  "loading",
                  "in_progress",
                  "unloading",
                  "delayed",
                ],
              },
              plannedStart: { lte: dateTo },
              OR: [{ plannedEnd: { gte: dateFrom } }, { plannedEnd: null }],
              ...(excludeTripId && { id: { not: excludeTripId } }),
            },
            select: { driverId: true },
          })
        )
          .map((t) => t.driverId)
          .filter((id) => id !== null),
      },
    };

    const [vehicles, drivers] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: vehicleWhere,
        select: {
          id: true,
          plateNumber: true,
          brand: true,
          model: true,
          bodyType: true,
          capacityKg: true,
        },
      }),
      this.prisma.driver.findMany({
        where: driverWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          licenseCategory: true,
        },
      }),
    ]);

    return { vehicles, drivers };
  }

  async linkRequest(
    tripId: string,
    requestId: string,
    userId: string,
  ): Promise<TripWithRelations> {
    const [trip, request] = await Promise.all([
      this.prisma.trip.findUnique({ where: { id: tripId } }),
      this.prisma.request.findUnique({
        where: { id: requestId },
        include: {
          trips: {
            where: {
              status: { notIn: ["completed", "cancelled"] },
              deletedAt: null,
            },
          },
        },
      }),
    ]);

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    if (!request) {
      throw new NotFoundException("Заявка не найдена");
    }

    if (request.trips.length > 0) {
      throw new ConflictException("Заявка уже привязана к другому рейсу");
    }

    if (trip.requestId) {
      throw new BadRequestException("К рейсу уже привязана заявка");
    }

    await this.prisma.trip.update({
      where: { id: tripId },
      data: { requestId },
    });

    await this.auditService.log("link_request", "trip", tripId, {
      userId,
      requestId,
    });

    await this.notificationsService.notifySystemAnnouncement(
      `Заявка ${request.number} привязана к рейсу ${trip.number}`,
      `К рейсу ${trip.number} добавлена заявка ${request.number}`,
      [userId, request.createdById].filter(Boolean),
    );

    return this.findOne(tripId);
  }

  async unlinkRequest(
    tripId: string,
    userId: string,
  ): Promise<TripWithRelations> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    if (trip.status !== TripStatus.SCHEDULED) {
      throw new BadRequestException(
        "Можно отвязать заявку только от запланированного рейса",
      );
    }

    throw new BadRequestException(
      "Нельзя отвязать заявку от рейса с обязательной связью",
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    const trip = await this.prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      throw new NotFoundException("Рейс не найден");
    }

    if (
      trip.status !== TripStatus.SCHEDULED &&
      trip.status !== TripStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "Можно удалить только запланированный или отменённый рейс",
      );
    }

    await this.prisma.trip.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log("delete", "trip", id, { userId });
  }

  private async checkVehicleAvailability(
    vehicleId: string,
    dateFrom?: string,
    dateTo?: string,
    excludeTripId?: string,
  ): Promise<void> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException("Транспорт не найден");
    }

    if (!vehicle.isActive) {
      throw new BadRequestException("Транспорт неактивен");
    }

    if (vehicle.status !== "available") {
      throw new ConflictException("Транспорт недоступен");
    }

    if (!dateFrom || !dateTo) return;

    const conflict = await this.prisma.trip.findFirst({
      where: {
        id: excludeTripId ? { not: excludeTripId } : undefined,
        vehicleId,
        deletedAt: null,
        status: {
          in: ["assigned", "loading", "in_progress", "unloading", "delayed"],
        },
        OR: [
          {
            plannedStart: { lte: new Date(dateTo) },
            plannedEnd: { gte: new Date(dateFrom) },
          },
          { plannedEnd: null },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException(
        `Транспорт занят в рейсе ${conflict.number} в указанный период`,
      );
    }
  }

  private async checkDriverAvailability(
    driverId: string,
    dateFrom?: string,
    dateTo?: string,
    excludeTripId?: string,
  ): Promise<void> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException("Водитель не найден");
    }

    if (!driver.isActive) {
      throw new BadRequestException("Водитель неактивен");
    }

    if (driver.status !== "available") {
      throw new ConflictException("Водитель недоступен");
    }

    if (!dateFrom || !dateTo) return;

    const conflict = await this.prisma.trip.findFirst({
      where: {
        id: excludeTripId ? { not: excludeTripId } : undefined,
        driverId,
        deletedAt: null,
        status: {
          in: ["assigned", "loading", "in_progress", "unloading", "delayed"],
        },
        OR: [
          {
            plannedStart: { lte: new Date(dateTo) },
            plannedEnd: { gte: new Date(dateFrom) },
          },
          { plannedEnd: null },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException(
        `Водитель занят в рейсе ${conflict.number} в указанный период`,
      );
    }
  }
}
