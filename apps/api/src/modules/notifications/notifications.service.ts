import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Prisma } from "@prisma/client";
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationQueryDto,
  CreateNotificationDto,
  NOTIFICATION_TYPE_CONFIGS,
  NotificationTypeConfig,
} from "./dto";

export interface NotificationEvent {
  type: NotificationType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  link?: string;
  userId?: string;
  userIds?: string[];
  roles?: string[];
  filialId?: string;
  excludeUserIds?: string[];
  channel?: NotificationChannel;
  metadata?: Record<string, unknown>;
}

export interface NotificationHandler {
  handle(event: NotificationEvent): Promise<void>;
}

export interface NotificationFilter {
  userId: string;
  roles: string[];
  settings?: string[];
}

@Injectable()
export class NotificationsService {
  private handlers: Map<NotificationType, NotificationHandler[]> = new Map();

  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<{
    data: any[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, isRead, types, entityType, entityId } = query;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(isRead !== undefined && { isRead }),
      ...(types && types.length > 0 && { type: { in: types } }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
    };

    const skip = (page - 1) * limit;

    const [total, unreadCount, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data: notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string): Promise<any> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException("Уведомление не найдено");
    }

    return notification;
  }

  async create(data: CreateNotificationDto): Promise<any> {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        entityType: data.entityType,
        entityId: data.entityId,
        link: data.link,
        channel: data.channel || NotificationChannel.SYSTEM,
        status: NotificationStatus.PENDING,
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<any> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException("Уведомление не найдено");
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });
  }

  async markAsUnread(id: string, userId: string): Promise<any> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException("Уведомление не найдено");
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: false,
        readAt: null,
        status: NotificationStatus.PENDING,
      },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });

    return { count: result.count };
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException("Уведомление не найдено");
    }

    await this.prisma.notification.delete({ where: { id } });
  }

  async deleteAll(
    userId: string,
    olderThanDays?: number,
  ): Promise<{ count: number }> {
    const where: Prisma.NotificationWhereInput = { userId };

    if (olderThanDays) {
      const date = new Date();
      date.setDate(date.getDate() - olderThanDays);
      where.createdAt = { lt: date };
    }

    const result = await this.prisma.notification.deleteMany({ where });

    return { count: result.count };
  }

  async cleanupOld(days: number = 30): Promise<{ count: number }> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const result = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: date } },
    });

    return { count: result.count };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async getSettings(userId: string): Promise<{
    enabledTypes: string[];
    disabledChannels: string[];
  }> {
    const settings = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        notificationSettings: true,
      },
    });

    if (!settings?.notificationSettings) {
      return {
        enabledTypes: NOTIFICATION_TYPE_CONFIGS.filter(
          (c) => c.defaultEnabled,
        ).map((c) => c.type),
        disabledChannels: [],
      };
    }

    return settings.notificationSettings as {
      enabledTypes: string[];
      disabledChannels: string[];
    };
  }

  async updateSettings(
    userId: string,
    enabledTypes: string[],
    disabledChannels?: string[],
  ): Promise<{
    enabledTypes: string[];
    disabledChannels: string[];
  }> {
    const settings = {
      enabledTypes,
      disabledChannels: disabledChannels || [],
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationSettings: settings },
    });

    return settings;
  }

  async getAvailableTypes(
    userId: string,
    roles: string[],
  ): Promise<NotificationTypeConfig[]> {
    return NOTIFICATION_TYPE_CONFIGS.filter((config) =>
      config.roles.some((role) => roles.includes(role)),
    );
  }

  async emit(event: NotificationEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      await Promise.all(handlers.map((handler) => handler.handle(event)));
    }

    const targets = await this.resolveTargets(event);

    if (targets.length > 0) {
      for (const userId of targets) {
        const shouldNotify = await this.shouldNotifyUser(event.type, userId);
        if (shouldNotify) {
          await this.create({
            userId,
            type: event.type,
            title: event.title,
            body: event.body,
            entityType: event.entityType,
            entityId: event.entityId,
            link: event.link,
            channel: event.channel,
          });
        }
      }
    }
  }

  private async resolveTargets(event: NotificationEvent): Promise<string[]> {
    if (event.userIds?.length) {
      return this.compactIds(...event.userIds);
    }

    if (event.userId) {
      return [event.userId];
    }

    if (!event.roles?.length) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(event.filialId && { filialId: event.filialId }),
        ...(event.excludeUserIds?.length && {
          id: { notIn: event.excludeUserIds },
        }),
        roles: {
          some: {
            role: {
              code: { in: event.roles as any },
            },
          },
        },
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  private compactIds(...ids: Array<string | null | undefined>): string[] {
    return [...new Set(ids.filter((id): id is string => Boolean(id)))];
  }

  private async resolveTripRequestCreator(
    trip: any,
  ): Promise<string | undefined> {
    if (trip?.request?.createdById) return trip.request.createdById;
    if (!trip?.id) return undefined;

    const found = await this.prisma.trip.findUnique({
      where: { id: trip.id },
      select: { request: { select: { createdById: true } } },
    });

    return found?.request?.createdById;
  }

  async shouldNotifyUser(
    type: NotificationType,
    userId: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) return false;

    const userRoles = user.roles.map((ur) => ur.role.code as string);
    const settings = await this.getSettings(userId);

    const config = NOTIFICATION_TYPE_CONFIGS.find((c) => c.type === type);
    if (!config) return false;

    const hasAccess = config.roles.some((role) =>
      userRoles.includes(role as string),
    );
    if (!hasAccess) return false;

    const isEnabled = settings.enabledTypes.includes(type);
    return isEnabled;
  }

  registerHandler(type: NotificationType, handler: NotificationHandler): void {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  unregisterHandler(
    type: NotificationType,
    handler: NotificationHandler,
  ): void {
    const handlers = this.handlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.handlers.set(type, handlers);
    }
  }

  async notifyRequestCreated(request: any, createdById: string): Promise<void> {
    await this.emit({
      type: NotificationType.REQUEST_CREATED,
      title: `Новая заявка: ${request.number}`,
      body: `Создана заявка для клиента ${request.client?.name || "—"}`,
      entityType: "request",
      entityId: request.id,
      link: `/requests/${request.id}`,
      userIds: this.compactIds(
        request.assignedToId,
        request.createdById,
        createdById,
      ),
      metadata: { request, createdById },
    });
  }

  async notifyRequestStatusChanged(
    request: any,
    oldStatus: string,
    newStatus: string,
    changedById: string,
  ): Promise<void> {
    await this.emit({
      type: NotificationType.REQUEST_STATUS_CHANGED,
      title: `Заявка ${request.number}: изменён статус`,
      body: `Статус изменён с "${oldStatus}" на "${newStatus}"`,
      entityType: "request",
      entityId: request.id,
      link: `/requests/${request.id}`,
      userIds: this.compactIds(
        request.assignedToId,
        request.createdById,
        changedById,
      ),
      metadata: { request, oldStatus, newStatus, changedById },
    });
  }

  async notifyTripCreated(trip: any, createdById: string): Promise<void> {
    const requestCreatorId = await this.resolveTripRequestCreator(trip);
    await this.emit({
      type: NotificationType.TRIP_CREATED,
      title: `Создан рейс: ${trip.number}`,
      body: `Рейс по заявке ${trip.request?.number || "—"}`,
      entityType: "trip",
      entityId: trip.id,
      link: `/trips/${trip.id}`,
      userIds: this.compactIds(
        trip.assignedById,
        trip.driverId,
        requestCreatorId,
        createdById,
      ),
      metadata: { trip, createdById },
    });
  }

  async notifyTripStatusChanged(
    trip: any,
    oldStatus: string,
    newStatus: string,
    changedById: string,
  ): Promise<void> {
    const requestCreatorId = await this.resolveTripRequestCreator(trip);
    await this.emit({
      type: NotificationType.TRIP_STATUS_CHANGED,
      title: `Рейс ${trip.number}: изменён статус`,
      body: `Статус изменён с "${oldStatus}" на "${newStatus}"`,
      entityType: "trip",
      entityId: trip.id,
      link: `/trips/${trip.id}`,
      userIds: this.compactIds(
        trip.assignedById,
        trip.driverId,
        requestCreatorId,
        changedById,
      ),
      metadata: { trip, oldStatus, newStatus, changedById },
    });
  }

  async notifyTripDelayed(trip: any, reason: string): Promise<void> {
    const requestCreatorId = await this.resolveTripRequestCreator(trip);
    await this.emit({
      type: NotificationType.TRIP_DELAYED,
      title: `Рейс ${trip.number} задерживается`,
      body: reason,
      entityType: "trip",
      entityId: trip.id,
      link: `/trips/${trip.id}`,
      userIds: this.compactIds(
        trip.assignedById,
        trip.driverId,
        requestCreatorId,
      ),
      metadata: { trip, reason },
    });
  }

  async notifyOrderCreated(order: any, createdById: string): Promise<void> {
    await this.emit({
      type: NotificationType.ORDER_CREATED,
      title: `Создан заказ: ${order.number}`,
      body: `Заказ на сумму ${order.total} ₽`,
      entityType: "order",
      entityId: order.id,
      link: `/orders/${order.id}`,
      userIds: this.compactIds(
        order.assignedToId,
        order.createdById,
        createdById,
      ),
      metadata: { order, createdById },
    });
  }

  async notifyOrderStatusChanged(
    order: any,
    oldStatus: string,
    newStatus: string,
    changedById: string,
  ): Promise<void> {
    await this.emit({
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: `Заказ ${order.number}: изменён статус`,
      body: `Статус изменён с "${oldStatus}" на "${newStatus}"`,
      entityType: "order",
      entityId: order.id,
      link: `/orders/${order.id}`,
      userIds: this.compactIds(
        order.assignedToId,
        order.createdById,
        changedById,
      ),
      metadata: { order, oldStatus, newStatus, changedById },
    });
  }

  async notifyOrderPaymentReceived(order: any, amount: number): Promise<void> {
    await this.emit({
      type: NotificationType.ORDER_PAYMENT_RECEIVED,
      title: `Получена оплата по заказу ${order.number}`,
      body: `Оплата на сумму ${amount} ₽`,
      entityType: "order",
      entityId: order.id,
      link: `/orders/${order.id}`,
      userIds: this.compactIds(order.assignedToId, order.createdById),
      metadata: { order, amount },
    });
  }

  async notifyCommentAdded(
    entityType: string,
    entityId: string,
    comment: any,
    targetUserIds?: Array<string | null | undefined>,
  ): Promise<void> {
    await this.emit({
      type: NotificationType.COMMENT_ADDED,
      title: `Новый комментарий`,
      body: `${comment.author?.firstName || "Пользователь"} оставил комментарий`,
      entityType,
      entityId,
      link: `/${entityType}s/${entityId}`,
      userIds: this.compactIds(...(targetUserIds || [comment.authorId])),
      metadata: { comment },
    });
  }

  async notifyFlagAdded(
    entityType: string,
    entityId: string,
    flag: string,
    addedById: string,
    targetUserIds?: Array<string | null | undefined>,
  ): Promise<void> {
    await this.emit({
      type: NotificationType.FLAG_ADDED,
      title: `Добавлен флаг: ${flag}`,
      body: `К ${entityType} добавлен флаг "${flag}"`,
      entityType,
      entityId,
      link: `/${entityType}s/${entityId}`,
      userIds: this.compactIds(...(targetUserIds || [addedById])),
      metadata: { flag, addedById },
    });
  }

  async notifyFlagRemoved(
    entityType: string,
    entityId: string,
    flag: string,
    removedById: string,
    targetUserIds?: Array<string | null | undefined>,
  ): Promise<void> {
    await this.emit({
      type: NotificationType.FLAG_REMOVED,
      title: `Удалён флаг: ${flag}`,
      body: `С ${entityType} удалён флаг "${flag}"`,
      entityType,
      entityId,
      link: `/${entityType}s/${entityId}`,
      userIds: this.compactIds(...(targetUserIds || [removedById])),
      metadata: { flag, removedById },
    });
  }

  async notifyCheckpointCompleted(
    tripId: string,
    checkpoint: any,
  ): Promise<void> {
    await this.emit({
      type: NotificationType.CHECKPOINT_COMPLETED,
      title: `Точка выполнена: ${checkpoint.name}`,
      body: `Контрольная точка "${checkpoint.name}" отмечена как выполненная`,
      entityType: "trip",
      entityId: tripId,
      link: `/trips/${tripId}`,
      userIds: this.compactIds(checkpoint.completedById),
      metadata: { checkpoint },
    });
  }

  async notifySystemAnnouncement(
    title: string,
    body: string,
    targetUserIds?: string[],
  ): Promise<void> {
    if (targetUserIds) {
      await this.emit({
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title,
        body,
        userIds: targetUserIds,
        metadata: { targetUserIds },
      });
    } else {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      await this.emit({
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title,
        body,
        userIds: users.map((u) => u.id),
        metadata: { broadcast: true },
      });
    }
  }
}
