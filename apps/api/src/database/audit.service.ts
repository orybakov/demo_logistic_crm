import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import type { Prisma } from "@prisma/client";
import type { Request } from "express";

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: unknown;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    action: string,
    entityType: string,
    entityId: string,
    context: AuditContext,
    oldValues?: Prisma.InputJsonValue,
    newValues?: Prisma.InputJsonValue,
  ) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        oldValues,
        newValues,
      },
    });
  }

  async logCreate<T extends Record<string, unknown>>(
    entityType: string,
    entity: T & { id: string },
    context: AuditContext,
  ) {
    return this.log(
      "create",
      entityType,
      entity.id,
      context,
      undefined,
      entity as Prisma.InputJsonValue,
    );
  }

  async logUpdate<T extends Record<string, unknown>>(
    entityType: string,
    entityId: string,
    oldData: T,
    newData: Partial<T>,
    context: AuditContext,
  ) {
    const changedFields: Record<string, { old: unknown; new: unknown }> = {};
    for (const key of Object.keys(newData)) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changedFields[key] = { old: oldData[key], new: newData[key] };
      }
    }
    return this.log(
      "update",
      entityType,
      entityId,
      context,
      oldData as Prisma.InputJsonValue,
      changedFields as Prisma.InputJsonValue,
    );
  }

  async logDelete(
    entityType: string,
    entity: Record<string, unknown> & { id: string },
    context: AuditContext,
  ) {
    return this.log(
      "delete",
      entityType,
      entity.id,
      context,
      entity as Prisma.InputJsonValue,
      undefined,
    );
  }

  extractContext(req?: Request): AuditContext {
    return {
      ipAddress: req?.ip || req?.socket?.remoteAddress,
      userAgent: req?.headers?.["user-agent"],
    };
  }

  async findByEntity(entityType: string, entityId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async findByUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
