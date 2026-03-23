import { Injectable, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as ExcelJS from "exceljs";
import { PrismaService } from "../../database/prisma.service";
import {
  AnalyticsEntity,
  AnalyticsExportFormat,
  AnalyticsQueryDto,
} from "./dto";

type AnalyticsDateRange = {
  from: Date;
  to: Date;
  fromIso: string;
  toIso: string;
};

type SelectableUser = {
  firstName: string;
  lastName: string;
};

export interface AnalyticsKpiResponse {
  period: { dateFrom: string; dateTo: string };
  requests: {
    total: number;
    byStatus: Record<string, number>;
    active: number;
    completed: number;
    cancelled: number;
    completionRate: number;
    linkedToOrders: number;
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    collectionRate: number;
    averageCheck: number;
    overdueCount: number;
  };
}

export interface AnalyticsRequestsReportRow {
  id: string;
  number: string;
  clientName: string;
  filialName: string | null;
  status: string;
  priority: string;
  assignedToName: string | null;
  createdAt: string;
  completedAt: string | null;
  orderNumber: string | null;
  tripsCount: number;
}

export interface AnalyticsOrdersReportRow {
  id: string;
  number: string;
  clientName: string;
  filialName: string | null;
  status: string;
  paymentStatus: string;
  assignedToName: string | null;
  orderDate: string;
  paymentDeadline: string | null;
  total: number;
  paidAmount: number;
  requestsCount: number;
}

export interface AnalyticsReportResponse<T> {
  period: { dateFrom: string; dateTo: string };
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  rows: T[];
  summary: Record<string, number>;
}

export interface AnalyticsExecutorOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpi(query: AnalyticsQueryDto): Promise<AnalyticsKpiResponse> {
    const range = this.buildDateRange(query.dateFrom, query.dateTo);
    const requestWhere = this.buildRequestWhere(query, range);
    const orderWhere = this.buildOrderWhere(query, range);

    const [
      requestTotal,
      requestStatusAgg,
      linkedToOrders,
      orderTotal,
      orderStatusAgg,
      orderTotals,
      overdueCount,
    ] = await Promise.all([
      this.prisma.request.count({ where: requestWhere }),
      this.prisma.request.groupBy({
        by: ["status"],
        where: requestWhere,
        _count: true,
      }),
      this.prisma.request.count({
        where: { ...requestWhere, orderId: { not: null } },
      }),
      this.prisma.order.count({ where: orderWhere }),
      this.prisma.order.groupBy({
        by: ["status"],
        where: orderWhere,
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: orderWhere,
        _sum: { total: true, paidAmount: true },
      }),
      this.prisma.order.count({
        where: {
          ...orderWhere,
          paymentDeadline: { lt: range.to },
          paymentStatus: { not: "paid" },
          total: { gt: 0 },
        },
      }),
    ]);

    const requestByStatus = this.reduceGroupedCount(
      requestStatusAgg,
      (row) => row.status,
    );
    const orderByStatus = this.reduceGroupedCount(
      orderStatusAgg,
      (row) => row.status,
    );

    const requestCompleted = requestByStatus.completed || 0;
    const requestCancelled = requestByStatus.cancelled || 0;
    const requestActive = Math.max(
      requestTotal - requestCompleted - requestCancelled,
      0,
    );

    const totalAmount = Number(orderTotals._sum.total || 0);
    const paidAmount = Number(orderTotals._sum.paidAmount || 0);

    return {
      period: {
        dateFrom: range.fromIso,
        dateTo: range.toIso,
      },
      requests: {
        total: requestTotal,
        byStatus: requestByStatus,
        active: requestActive,
        completed: requestCompleted,
        cancelled: requestCancelled,
        completionRate: this.percent(requestCompleted, requestTotal),
        linkedToOrders,
      },
      orders: {
        total: orderTotal,
        byStatus: orderByStatus,
        totalAmount,
        paidAmount,
        unpaidAmount: Math.max(totalAmount - paidAmount, 0),
        collectionRate: this.percent(paidAmount, totalAmount),
        averageCheck: this.division(totalAmount, orderTotal),
        overdueCount,
      },
    };
  }

  async getRequestsReport(
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsReportResponse<AnalyticsRequestsReportRow>> {
    const range = this.buildDateRange(query.dateFrom, query.dateTo);
    const where = this.buildRequestWhere(query, range);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, rows, summaryCounts] = await Promise.all([
      this.prisma.request.count({ where }),
      this.prisma.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          number: true,
          status: true,
          priority: true,
          createdAt: true,
          completedAt: true,
          order: { select: { number: true } },
          client: { select: { name: true } },
          filial: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
          _count: { select: { trips: true } },
        },
      }),
      this.prisma.request.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
    ]);

    return {
      period: { dateFrom: range.fromIso, dateTo: range.toIso },
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      rows: rows.map((row) => ({
        id: row.id,
        number: row.number,
        clientName: row.client.name,
        filialName: row.filial?.name || null,
        status: row.status,
        priority: row.priority,
        assignedToName: this.fullName(row.assignedTo),
        createdAt: row.createdAt.toISOString(),
        completedAt: row.completedAt ? row.completedAt.toISOString() : null,
        orderNumber: row.order?.number || null,
        tripsCount: row._count.trips,
      })),
      summary: {
        ...this.reduceGroupedCount(summaryCounts, (row) => row.status),
        linkedToOrders: await this.prisma.request.count({
          where: { ...where, orderId: { not: null } },
        }),
      },
    };
  }

  async getOrdersReport(
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsReportResponse<AnalyticsOrdersReportRow>> {
    const range = this.buildDateRange(query.dateFrom, query.dateTo);
    const where = this.buildOrderWhere(query, range);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, rows, summaryCounts, totals, overdueCount] =
      await Promise.all([
        this.prisma.order.count({ where }),
        this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ orderDate: "desc" }],
          select: {
            id: true,
            number: true,
            status: true,
            paymentStatus: true,
            orderDate: true,
            paymentDeadline: true,
            total: true,
            paidAmount: true,
            client: { select: { name: true } },
            filial: { select: { name: true } },
            assignedTo: { select: { firstName: true, lastName: true } },
            _count: { select: { requests: true } },
          },
        }),
        this.prisma.order.groupBy({
          by: ["status"],
          where,
          _count: true,
        }),
        this.prisma.order.aggregate({
          where,
          _sum: { total: true, paidAmount: true },
        }),
        this.prisma.order.count({
          where: {
            ...where,
            paymentDeadline: { lt: range.to },
            paymentStatus: { not: "paid" },
            total: { gt: 0 },
          },
        }),
      ]);

    const totalAmount = Number(totals._sum.total || 0);
    const paidAmount = Number(totals._sum.paidAmount || 0);

    return {
      period: { dateFrom: range.fromIso, dateTo: range.toIso },
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      rows: rows.map((row) => ({
        id: row.id,
        number: row.number,
        clientName: row.client.name,
        filialName: row.filial?.name || null,
        status: row.status,
        paymentStatus: row.paymentStatus,
        assignedToName: this.fullName(row.assignedTo),
        orderDate: row.orderDate.toISOString(),
        paymentDeadline: row.paymentDeadline
          ? row.paymentDeadline.toISOString()
          : null,
        total: Number(row.total),
        paidAmount: Number(row.paidAmount),
        requestsCount: row._count.requests,
      })),
      summary: {
        ...this.reduceGroupedCount(summaryCounts, (row) => row.status),
        totalAmount,
        paidAmount,
        unpaidAmount: Math.max(totalAmount - paidAmount, 0),
        overdueCount,
      },
    };
  }

  async getExecutors(filialId?: string): Promise<AnalyticsExecutorOption[]> {
    const [requestAssignments, orderAssignments] = await Promise.all([
      this.prisma.request.findMany({
        where: {
          deletedAt: null,
          assignedToId: { not: null },
          ...(filialId && { filialId }),
        },
        distinct: ["assignedToId"],
        select: { assignedToId: true },
      }),
      this.prisma.order.findMany({
        where: {
          deletedAt: null,
          assignedToId: { not: null },
          ...(filialId && { filialId }),
        },
        distinct: ["assignedToId"],
        select: { assignedToId: true },
      }),
    ]);

    const ids = Array.from(
      new Set(
        [...requestAssignments, ...orderAssignments]
          .map((item) => item.assignedToId)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    if (ids.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return users;
  }

  async exportRequests(
    query: AnalyticsQueryDto,
    format: AnalyticsExportFormat,
  ) {
    const report = await this.getRequestsReport({
      ...query,
      page: 1,
      limit: 5000,
    });
    return this.buildExport(
      report.rows as any[],
      format,
      AnalyticsEntity.REQUESTS,
    );
  }

  async exportOrders(query: AnalyticsQueryDto, format: AnalyticsExportFormat) {
    const report = await this.getOrdersReport({
      ...query,
      page: 1,
      limit: 5000,
    });
    return this.buildExport(
      report.rows as any[],
      format,
      AnalyticsEntity.ORDERS,
    );
  }

  private buildRequestWhere(
    query: AnalyticsQueryDto,
    range: AnalyticsDateRange,
  ): Prisma.RequestWhereInput {
    return {
      deletedAt: null,
      createdAt: { gte: range.from, lte: range.to },
      ...(query.filialId && { filialId: query.filialId }),
      ...(query.status && { status: query.status }),
      ...(query.assignedToId && { assignedToId: query.assignedToId }),
    };
  }

  private buildOrderWhere(
    query: AnalyticsQueryDto,
    range: AnalyticsDateRange,
  ): Prisma.OrderWhereInput {
    return {
      deletedAt: null,
      orderDate: { gte: range.from, lte: range.to },
      ...(query.filialId && { filialId: query.filialId }),
      ...(query.status && { status: query.status }),
      ...(query.assignedToId && { assignedToId: query.assignedToId }),
    };
  }

  private buildDateRange(
    dateFrom?: string,
    dateTo?: string,
  ): AnalyticsDateRange {
    const now = new Date();
    const to = dateTo ? this.endOfDay(dateTo) : now;
    const from = dateFrom
      ? this.startOfDay(dateFrom)
      : new Date(new Date(to).getTime() - 29 * 24 * 60 * 60 * 1000);

    return {
      from,
      to,
      fromIso: from.toISOString(),
      toIso: to.toISOString(),
    };
  }

  private startOfDay(value: string) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Некорректная дата начала периода");
    }
    return date;
  }

  private endOfDay(value: string) {
    const date = new Date(`${value}T23:59:59.999Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Некорректная дата окончания периода");
    }
    return date;
  }

  private reduceGroupedCount<T extends Record<string, unknown>>(
    rows: Array<T & { _count: number }>,
    keySelector: (row: T) => string,
  ): Record<string, number> {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const key = keySelector(row);
      acc[key] = row._count;
      return acc;
    }, {});
  }

  private percent(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 1000) / 10;
  }

  private division(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100) / 100;
  }

  private fullName(user: SelectableUser | null): string | null {
    if (!user) return null;
    return `${user.firstName} ${user.lastName}`.trim();
  }

  private async buildExport(
    rows: any[],
    format: AnalyticsExportFormat,
    entity: AnalyticsEntity,
  ) {
    if (format === AnalyticsExportFormat.XLSX) {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(entity);
      const headers = Object.keys(rows[0] || {});
      sheet.columns = headers.map((header) => ({
        header,
        key: header,
        width: 20,
      }));
      sheet.addRows(rows.map((row) => headers.map((header) => row[header])));
      return {
        buffer: await workbook.xlsx.writeBuffer(),
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extension: "xlsx",
      };
    }

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((header) => this.escapeCsvValue(row[header])).join(","),
      ),
    ].join("\n");

    return {
      buffer: Buffer.from(csv, "utf-8"),
      contentType: "text/csv; charset=utf-8",
      extension: "csv",
    };
  }

  private escapeCsvValue(value: unknown) {
    if (value === null || value === undefined) return "";
    const normalized = String(value).replace(/"/g, '""');
    return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
  }
}
