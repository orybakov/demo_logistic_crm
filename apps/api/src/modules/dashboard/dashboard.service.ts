import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Prisma } from "@prisma/client";
import { DashboardBlock, ProblemFlag } from "./dto";

export { DashboardBlock, ProblemFlag };

export interface DashboardResult {
  blocks: Record<string, unknown>;
  timestamp: Date;
}

export interface FreeRequest {
  id: string;
  number: string;
  clientName: string;
  status: string;
  priority: string;
  pickupCity?: string | null;
  deliveryCity?: string | null;
  createdAt: Date;
}

export interface FreeRequestsWidget {
  total: number;
  requests: FreeRequest[];
}

export interface ProblemFlagRequest {
  id: string;
  number: string;
  clientName: string;
  flags: (string | null)[] | Prisma.JsonArray;
  status: string;
  priority: string;
}

export interface ProblemFlagsWidget {
  byFlag: Record<string, number>;
  requests: ProblemFlagRequest[];
}

export interface ProblemOrder {
  id: string;
  number: string;
  clientName: string;
  total: number;
  status: string;
  paymentStatus: string;
  overdueDays?: number;
}

export interface ProblemOrdersWidget {
  byStatus: Record<string, number>;
  orders: ProblemOrder[];
}

export interface TodayCheckpoint {
  id: string;
  requestNumber: string;
  address: string | null;
  city?: string | null;
  plannedTime?: Date | null;
  vehiclePlate?: string | null;
  driverName?: string | null;
  status: string;
}

export interface TodayOperationsWidget {
  date: string;
  loadings: TodayCheckpoint[];
  deliveries: TodayCheckpoint[];
  stats: {
    totalLoadings: number;
    completedLoadings: number;
    totalDeliveries: number;
    completedDeliveries: number;
  };
}

export interface PendingPaymentOrder {
  id: string;
  number: string;
  clientName: string;
  total: number;
  paidAmount: number;
  paymentDeadline?: Date | null;
  overdueDays?: number;
}

export interface PendingPaymentsWidget {
  total: number;
  totalAmount: number;
  orders: PendingPaymentOrder[];
}

export interface DashboardStats {
  requestsToday: number;
  tripsActive: number;
  ordersPending: number;
  revenueToday: number;
}

export interface QuickSearchResult {
  type: "request" | "order" | "trip";
  id: string;
  number: string;
  status: string;
  clientName?: string;
  total?: number;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(
    userId: string,
    userFilialId: string | null,
    userRoles: string[],
    filialId?: string,
    blocks?: string[],
  ): Promise<DashboardResult> {
    const effectiveFilialId = filialId || userFilialId;
    const isAdmin =
      userRoles.includes("ADMIN") || userRoles.includes("MANAGER");
    const blocksSet = blocks
      ? new Set(blocks)
      : new Set(Object.values(DashboardBlock));

    const results: Record<string, unknown> = {};

    const blockFetches: Promise<void>[] = [];

    if (blocksSet.has(DashboardBlock.FREE_REQUESTS)) {
      blockFetches.push(
        this.getFreeRequestsWidget(effectiveFilialId, isAdmin).then((data) => {
          results.freeRequests = data;
        }),
      );
    }

    if (blocksSet.has(DashboardBlock.PROBLEM_FLAGS)) {
      blockFetches.push(
        this.getProblemFlagsWidget(effectiveFilialId, isAdmin).then((data) => {
          results.problemFlags = data;
        }),
      );
    }

    if (blocksSet.has(DashboardBlock.PROBLEM_ORDERS)) {
      blockFetches.push(
        this.getProblemOrdersWidget(effectiveFilialId, isAdmin).then((data) => {
          results.problemOrders = data;
        }),
      );
    }

    if (
      blocksSet.has(DashboardBlock.TODAY_LOADINGS) ||
      blocksSet.has(DashboardBlock.TODAY_DELIVERIES)
    ) {
      blockFetches.push(
        this.getTodayOperationsWidget(effectiveFilialId, isAdmin).then(
          (data) => {
            results.todayOperations = data;
          },
        ),
      );
    }

    if (blocksSet.has(DashboardBlock.PENDING_PAYMENTS)) {
      blockFetches.push(
        this.getPendingPaymentsWidget(effectiveFilialId, isAdmin).then(
          (data) => {
            results.pendingPayments = data;
          },
        ),
      );
    }

    blockFetches.push(
      this.getDashboardStats(effectiveFilialId, isAdmin).then((data) => {
        results.stats = data;
      }),
    );

    await Promise.all(blockFetches);

    return {
      blocks: results,
      timestamp: new Date(),
    };
  }

  private async getFreeRequestsWidget(
    filialId: string | null,
    isAdmin: boolean,
  ): Promise<FreeRequestsWidget> {
    const where: Prisma.RequestWhereInput = {
      deletedAt: null,
      status: { in: ["new", "confirmed"] },
      assignedToId: null,
      ...(filialId && !isAdmin ? { filialId } : {}),
    };

    const [requests, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        take: 10,
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          number: true,
          status: true,
          priority: true,
          createdAt: true,
          client: { select: { name: true } },
          points: {
            where: { type: "pickup" },
            take: 1,
            select: { city: true },
          },
        },
      }),
      this.prisma.request.count({ where }),
    ]);

    const deliveryPoints = await this.prisma.point.findMany({
      where: {
        requestId: { in: requests.map((r) => r.id) },
        type: "delivery",
      },
      select: { requestId: true, city: true },
    });

    const deliveryMap = new Map(
      deliveryPoints.map((p) => [p.requestId, p.city]),
    );

    return {
      total,
      requests: requests.map((r) => ({
        id: r.id,
        number: r.number,
        clientName: r.client.name,
        status: r.status,
        priority: r.priority,
        pickupCity: r.points[0]?.city,
        deliveryCity: deliveryMap.get(r.id),
        createdAt: r.createdAt,
      })),
    };
  }

  private async getProblemFlagsWidget(
    filialId: string | null,
    isAdmin: boolean,
  ): Promise<ProblemFlagsWidget> {
    const problemFlags = [
      ProblemFlag.URGENT,
      ProblemFlag.OVERSIZE,
      ProblemFlag.FRAGILE,
      ProblemFlag.TEMP,
      ProblemFlag.HAZMAT,
      ProblemFlag.EXPRESS,
    ];

    const where: Prisma.RequestWhereInput = {
      deletedAt: null,
      status: { in: ["new", "confirmed", "in_progress"] },
      flags: { not: Prisma.JsonNull },
      ...(filialId && !isAdmin ? { filialId } : {}),
    };

    const requests = await this.prisma.request.findMany({
      where,
      take: 20,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        number: true,
        status: true,
        priority: true,
        flags: true,
        client: { select: { name: true } },
      },
    });

    const byFlag: Record<string, number> = {};
    for (const flag of problemFlags) {
      byFlag[flag] = 0;
    }

    const processedRequests: ProblemFlagRequest[] = [];

    for (const r of requests) {
      const flags = Array.isArray(r.flags) ? r.flags : [];
      for (const flag of problemFlags) {
        if (flags.includes(flag)) {
          byFlag[flag]++;
        }
      }
      processedRequests.push({
        id: r.id,
        number: r.number,
        clientName: r.client.name,
        flags,
        status: r.status,
        priority: r.priority,
      });
    }

    return {
      byFlag,
      requests: processedRequests,
    };
  }

  private async getProblemOrdersWidget(
    filialId: string | null,
    isAdmin: boolean,
  ): Promise<ProblemOrdersWidget> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      OR: [
        { paymentStatus: { in: ["not_paid", "partially_paid"] } },
        { status: { in: ["overdue", "cancelled"] } },
        { paymentDeadline: { lt: today } },
      ],
      ...(filialId && !isAdmin ? { filialId } : {}),
    };

    const [orders, byStatusAgg] = await Promise.all([
      this.prisma.order.findMany({
        where,
        take: 20,
        orderBy: [{ paymentDeadline: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          number: true,
          total: true,
          status: true,
          paymentStatus: true,
          paymentDeadline: true,
          client: { select: { name: true } },
        },
      }),
      this.prisma.order.groupBy({
        by: ["paymentStatus", "status"],
        where: {
          deletedAt: null,
          ...(filialId && !isAdmin ? { filialId } : {}),
        },
        _count: true,
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const item of byStatusAgg) {
      const key =
        item.paymentStatus !== "paid" ? item.paymentStatus : item.status;
      byStatus[key] = (byStatus[key] || 0) + item._count;
    }

    return {
      byStatus,
      orders: orders.map((o) => {
        let overdueDays: number | undefined;
        if (o.paymentDeadline && o.paymentDeadline < today) {
          overdueDays = Math.floor(
            (today.getTime() - o.paymentDeadline.getTime()) /
              (1000 * 60 * 60 * 24),
          );
        }
        return {
          id: o.id,
          number: o.number,
          clientName: o.client.name,
          total: Number(o.total),
          status: o.status,
          paymentStatus: o.paymentStatus,
          overdueDays,
        };
      }),
    };
  }

  private async getTodayOperationsWidget(
    filialId: string | null,
    isAdmin: boolean,
  ): Promise<TodayOperationsWidget> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tripWhere: Prisma.TripWhereInput = {
      deletedAt: null,
      status: { in: ["scheduled", "in_progress"] },
      checkpoints: {
        some: {
          plannedTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      },
      ...(filialId && !isAdmin ? { request: { filialId } } : {}),
    };

    const checkpoints = await this.prisma.checkpoint.findMany({
      where: {
        trip: tripWhere,
        plannedTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { plannedTime: "asc" },
      include: {
        trip: {
          select: {
            id: true,
            number: true,
            status: true,
            vehicle: { select: { plateNumber: true } },
            driver: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            request: {
              select: {
                number: true,
              },
            },
          },
        },
      },
    });

    const loadings: TodayCheckpoint[] = checkpoints
      .filter((c) => c.type === "loading")
      .map((c) => ({
        id: c.trip.request.number,
        requestNumber: c.trip.request.number,
        address: c.address || c.name,
        city: undefined,
        plannedTime: c.plannedTime || undefined,
        vehiclePlate: c.trip.vehicle?.plateNumber || undefined,
        driverName: c.trip.driver
          ? `${c.trip.driver.firstName} ${c.trip.driver.lastName}`
          : undefined,
        status: c.trip.status,
      }));

    const deliveries: TodayCheckpoint[] = checkpoints
      .filter((c) => c.type === "unloading")
      .map((c) => ({
        id: c.trip.request.number,
        requestNumber: c.trip.request.number,
        address: c.address || c.name,
        city: undefined,
        plannedTime: c.plannedTime || undefined,
        vehiclePlate: c.trip.vehicle?.plateNumber || undefined,
        driverName: c.trip.driver
          ? `${c.trip.driver.firstName} ${c.trip.driver.lastName}`
          : undefined,
        status: c.trip.status,
      }));

    const [
      totalLoadings,
      completedLoadings,
      totalDeliveries,
      completedDeliveries,
    ] = await Promise.all([
      this.prisma.checkpoint.count({
        where: {
          trip: tripWhere,
          type: "loading",
        },
      }),
      this.prisma.checkpoint.count({
        where: {
          trip: tripWhere,
          type: "loading",
          isCompleted: true,
        },
      }),
      this.prisma.checkpoint.count({
        where: {
          trip: tripWhere,
          type: "unloading",
        },
      }),
      this.prisma.checkpoint.count({
        where: {
          trip: tripWhere,
          type: "unloading",
          isCompleted: true,
        },
      }),
    ]);

    return {
      date: today.toISOString().split("T")[0],
      loadings,
      deliveries,
      stats: {
        totalLoadings,
        completedLoadings,
        totalDeliveries,
        completedDeliveries,
      },
    };
  }

  private async getPendingPaymentsWidget(
    filialId: string | null,
    isAdmin: boolean,
  ): Promise<PendingPaymentsWidget> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      paymentStatus: { in: ["not_paid", "partially_paid"] },
      total: { gt: 0 },
      ...(filialId && !isAdmin ? { filialId } : {}),
    };

    const [orders, totalAmountAgg] = await Promise.all([
      this.prisma.order.findMany({
        where,
        take: 10,
        orderBy: { paymentDeadline: "asc" },
        select: {
          id: true,
          number: true,
          total: true,
          paidAmount: true,
          paymentDeadline: true,
          client: { select: { name: true } },
        },
      }),
      this.prisma.order.aggregate({
        where,
        _sum: { total: true },
      }),
    ]);

    return {
      total: orders.length,
      totalAmount: Number(totalAmountAgg._sum.total || 0),
      orders: orders.map((o) => {
        let overdueDays: number | undefined;
        if (o.paymentDeadline && o.paymentDeadline < today) {
          overdueDays = Math.floor(
            (today.getTime() - o.paymentDeadline.getTime()) /
              (1000 * 60 * 60 * 24),
          );
        }
        return {
          id: o.id,
          number: o.number,
          clientName: o.client.name,
          total: Number(o.total),
          paidAmount: Number(o.paidAmount),
          paymentDeadline: o.paymentDeadline || undefined,
          overdueDays,
        };
      }),
    };
  }

  private async getDashboardStats(
    filialId: string | null,
    isAdmin: boolean,
  ): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [requestsToday, tripsActive, ordersPending, revenueToday] =
      await Promise.all([
        this.prisma.request.count({
          where: {
            deletedAt: null,
            createdAt: { gte: today, lt: tomorrow },
            ...(filialId && !isAdmin ? { filialId } : {}),
          },
        }),
        this.prisma.trip.count({
          where: {
            deletedAt: null,
            status: "in_progress",
            ...(filialId && !isAdmin ? { request: { filialId } } : {}),
          },
        }),
        this.prisma.order.count({
          where: {
            deletedAt: null,
            status: { in: ["draft", "confirmed", "invoiced"] },
            ...(filialId && !isAdmin ? { filialId } : {}),
          },
        }),
        this.prisma.payment.aggregate({
          where: {
            paymentDate: { gte: today, lt: tomorrow },
            status: "completed",
          },
          _sum: { amount: true },
        }),
      ]);

    return {
      requestsToday,
      tripsActive,
      ordersPending,
      revenueToday: Number(revenueToday._sum.amount || 0),
    };
  }

  async quickSearch(
    query: string,
    limit: number = 10,
  ): Promise<QuickSearchResult[]> {
    if (!query || query.length < 2) return [];

    const [requests, orders, trips] = await Promise.all([
      this.prisma.request.findMany({
        where: {
          deletedAt: null,
          OR: [
            { number: { contains: query, mode: "insensitive" } },
            { client: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          client: { select: { name: true } },
        },
      }),
      this.prisma.order.findMany({
        where: {
          deletedAt: null,
          OR: [
            { number: { contains: query, mode: "insensitive" } },
            { client: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          client: { select: { name: true } },
        },
      }),
      this.prisma.trip.findMany({
        where: {
          deletedAt: null,
          OR: [
            { number: { contains: query, mode: "insensitive" } },
            { request: { number: { contains: query, mode: "insensitive" } } },
          ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          request: { select: { number: true } },
        },
      }),
    ]);

    const results: QuickSearchResult[] = [];

    for (const r of requests) {
      results.push({
        type: "request",
        id: r.id,
        number: r.number,
        status: r.status,
        clientName: r.client.name,
      });
    }

    for (const o of orders) {
      results.push({
        type: "order",
        id: o.id,
        number: o.number,
        status: o.status,
        clientName: o.client.name,
        total: Number(o.total),
      });
    }

    for (const t of trips) {
      results.push({
        type: "trip",
        id: t.id,
        number: t.number,
        status: t.status,
        clientName: t.request.number,
      });
    }

    return results.slice(0, limit);
  }
}
