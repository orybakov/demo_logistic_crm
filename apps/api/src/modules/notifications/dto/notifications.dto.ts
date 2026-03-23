import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsArray,
  IsNumber,
} from "class-validator";

export enum NotificationType {
  REQUEST_CREATED = "request_created",
  REQUEST_STATUS_CHANGED = "request_status_changed",
  REQUEST_ASSIGNED = "request_assigned",
  REQUEST_COMPLETED = "request_completed",

  TRIP_CREATED = "trip_created",
  TRIP_STATUS_CHANGED = "trip_status_changed",
  TRIP_ASSIGNED = "trip_assigned",
  TRIP_STARTED = "trip_started",
  TRIP_COMPLETED = "trip_completed",
  TRIP_DELAYED = "trip_delayed",

  ORDER_CREATED = "order_created",
  ORDER_STATUS_CHANGED = "order_status_changed",
  ORDER_PAYMENT_RECEIVED = "order_payment_received",
  ORDER_OVERDUE = "order_overdue",

  CHECKPOINT_COMPLETED = "checkpoint_completed",
  CHECKPOINT_DELAYED = "checkpoint_delayed",

  COMMENT_ADDED = "comment_added",
  FLAG_ADDED = "flag_added",
  FLAG_REMOVED = "flag_removed",

  VEHICLE_MAINTENANCE_DUE = "vehicle_maintenance_due",
  DRIVER_LICENSE_EXPIRES = "driver_license_expires",

  SYSTEM_ANNOUNCEMENT = "system_announcement",
}

export enum NotificationChannel {
  SYSTEM = "system",
  EMAIL = "email",
  PUSH = "push",
  SMS = "sms",
}

export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  READ = "read",
  FAILED = "failed",
}

export const notificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.REQUEST_CREATED]: "Новая заявка",
  [NotificationType.REQUEST_STATUS_CHANGED]: "Изменение статуса заявки",
  [NotificationType.REQUEST_ASSIGNED]: "Назначена заявка",
  [NotificationType.REQUEST_COMPLETED]: "Заявка выполнена",

  [NotificationType.TRIP_CREATED]: "Создан рейс",
  [NotificationType.TRIP_STATUS_CHANGED]: "Изменение статуса рейса",
  [NotificationType.TRIP_ASSIGNED]: "Назначен рейс",
  [NotificationType.TRIP_STARTED]: "Рейс начат",
  [NotificationType.TRIP_COMPLETED]: "Рейс завершён",
  [NotificationType.TRIP_DELAYED]: "Рейс задерживается",

  [NotificationType.ORDER_CREATED]: "Создан заказ",
  [NotificationType.ORDER_STATUS_CHANGED]: "Изменение статуса заказа",
  [NotificationType.ORDER_PAYMENT_RECEIVED]: "Получена оплата",
  [NotificationType.ORDER_OVERDUE]: "Просроченный заказ",

  [NotificationType.CHECKPOINT_COMPLETED]: "Точка выполнена",
  [NotificationType.CHECKPOINT_DELAYED]: "Задержка на точке",

  [NotificationType.COMMENT_ADDED]: "Новый комментарий",
  [NotificationType.FLAG_ADDED]: "Добавлен флаг",
  [NotificationType.FLAG_REMOVED]: "Удалён флаг",

  [NotificationType.VEHICLE_MAINTENANCE_DUE]: "Техобслуживание ТС",
  [NotificationType.DRIVER_LICENSE_EXPIRES]: "Истекает срок прав",

  [NotificationType.SYSTEM_ANNOUNCEMENT]: "Системное уведомление",
};

export const notificationTypeIcons: Record<NotificationType, string> = {
  [NotificationType.REQUEST_CREATED]: "file-plus",
  [NotificationType.REQUEST_STATUS_CHANGED]: "file-edit",
  [NotificationType.REQUEST_ASSIGNED]: "user-check",
  [NotificationType.REQUEST_COMPLETED]: "check-circle",

  [NotificationType.TRIP_CREATED]: "truck",
  [NotificationType.TRIP_STATUS_CHANGED]: "truck",
  [NotificationType.TRIP_ASSIGNED]: "user-check",
  [NotificationType.TRIP_STARTED]: "play",
  [NotificationType.TRIP_COMPLETED]: "check-circle",
  [NotificationType.TRIP_DELAYED]: "alert-triangle",

  [NotificationType.ORDER_CREATED]: "receipt",
  [NotificationType.ORDER_STATUS_CHANGED]: "receipt",
  [NotificationType.ORDER_PAYMENT_RECEIVED]: "credit-card",
  [NotificationType.ORDER_OVERDUE]: "alert-circle",

  [NotificationType.CHECKPOINT_COMPLETED]: "map-pin",
  [NotificationType.CHECKPOINT_DELAYED]: "clock",

  [NotificationType.COMMENT_ADDED]: "message-square",
  [NotificationType.FLAG_ADDED]: "flag",
  [NotificationType.FLAG_REMOVED]: "flag-off",

  [NotificationType.VEHICLE_MAINTENANCE_DUE]: "wrench",
  [NotificationType.DRIVER_LICENSE_EXPIRES]: "id-card",

  [NotificationType.SYSTEM_ANNOUNCEMENT]: "info",
};

export interface NotificationTypeConfig {
  type: NotificationType;
  label: string;
  icon: string;
  description: string;
  channels: NotificationChannel[];
  defaultEnabled: boolean;
  roles: string[];
}

export const NOTIFICATION_TYPE_CONFIGS: NotificationTypeConfig[] = [
  {
    type: NotificationType.REQUEST_CREATED,
    label: notificationTypeLabels[NotificationType.REQUEST_CREATED],
    icon: notificationTypeIcons[NotificationType.REQUEST_CREATED],
    description: "Уведомление о создании новой заявки",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.EMAIL],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER"],
  },
  {
    type: NotificationType.REQUEST_STATUS_CHANGED,
    label: notificationTypeLabels[NotificationType.REQUEST_STATUS_CHANGED],
    icon: notificationTypeIcons[NotificationType.REQUEST_STATUS_CHANGED],
    description: "Уведомление об изменении статуса заявки",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.EMAIL],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER", "OPERATOR"],
  },
  {
    type: NotificationType.REQUEST_ASSIGNED,
    label: notificationTypeLabels[NotificationType.REQUEST_ASSIGNED],
    icon: notificationTypeIcons[NotificationType.REQUEST_ASSIGNED],
    description: "Уведомление о назначении заявки",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.EMAIL],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER", "OPERATOR"],
  },
  {
    type: NotificationType.REQUEST_COMPLETED,
    label: notificationTypeLabels[NotificationType.REQUEST_COMPLETED],
    icon: notificationTypeIcons[NotificationType.REQUEST_COMPLETED],
    description: "Уведомление о выполнении заявки",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.EMAIL],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "SALES"],
  },
  {
    type: NotificationType.TRIP_CREATED,
    label: notificationTypeLabels[NotificationType.TRIP_CREATED],
    icon: notificationTypeIcons[NotificationType.TRIP_CREATED],
    description: "Уведомление о создании рейса",
    channels: [
      NotificationChannel.SYSTEM,
      NotificationChannel.EMAIL,
      NotificationChannel.PUSH,
    ],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER", "DRIVER"],
  },
  {
    type: NotificationType.TRIP_STATUS_CHANGED,
    label: notificationTypeLabels[NotificationType.TRIP_STATUS_CHANGED],
    icon: notificationTypeIcons[NotificationType.TRIP_STATUS_CHANGED],
    description: "Уведомление об изменении статуса рейса",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.PUSH],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER", "DRIVER"],
  },
  {
    type: NotificationType.TRIP_ASSIGNED,
    label: notificationTypeLabels[NotificationType.TRIP_ASSIGNED],
    icon: notificationTypeIcons[NotificationType.TRIP_ASSIGNED],
    description: "Уведомление о назначении на рейс",
    channels: [
      NotificationChannel.SYSTEM,
      NotificationChannel.EMAIL,
      NotificationChannel.PUSH,
    ],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER", "DRIVER"],
  },
  {
    type: NotificationType.TRIP_COMPLETED,
    label: notificationTypeLabels[NotificationType.TRIP_COMPLETED],
    icon: notificationTypeIcons[NotificationType.TRIP_COMPLETED],
    description: "Уведомление о завершении рейса",
    channels: [NotificationChannel.SYSTEM],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER"],
  },
  {
    type: NotificationType.TRIP_DELAYED,
    label: notificationTypeLabels[NotificationType.TRIP_DELAYED],
    icon: notificationTypeIcons[NotificationType.TRIP_DELAYED],
    description: "Уведомление о задержке рейса",
    channels: [
      NotificationChannel.SYSTEM,
      NotificationChannel.EMAIL,
      NotificationChannel.PUSH,
    ],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER", "OPERATOR"],
  },
  {
    type: NotificationType.ORDER_CREATED,
    label: notificationTypeLabels[NotificationType.ORDER_CREATED],
    icon: notificationTypeIcons[NotificationType.ORDER_CREATED],
    description: "Уведомление о создании заказа",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.EMAIL],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "SALES"],
  },
  {
    type: NotificationType.ORDER_STATUS_CHANGED,
    label: notificationTypeLabels[NotificationType.ORDER_STATUS_CHANGED],
    icon: notificationTypeIcons[NotificationType.ORDER_STATUS_CHANGED],
    description: "Уведомление об изменении статуса заказа",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.EMAIL],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "SALES"],
  },
  {
    type: NotificationType.ORDER_PAYMENT_RECEIVED,
    label: notificationTypeLabels[NotificationType.ORDER_PAYMENT_RECEIVED],
    icon: notificationTypeIcons[NotificationType.ORDER_PAYMENT_RECEIVED],
    description: "Уведомление о получении оплаты",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.EMAIL],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "SALES"],
  },
  {
    type: NotificationType.ORDER_OVERDUE,
    label: notificationTypeLabels[NotificationType.ORDER_OVERDUE],
    icon: notificationTypeIcons[NotificationType.ORDER_OVERDUE],
    description: "Уведомление о просроченном заказе",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.EMAIL],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    type: NotificationType.CHECKPOINT_COMPLETED,
    label: notificationTypeLabels[NotificationType.CHECKPOINT_COMPLETED],
    icon: notificationTypeIcons[NotificationType.CHECKPOINT_COMPLETED],
    description: "Уведомление о выполнении контрольной точки",
    channels: [NotificationChannel.SYSTEM],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER"],
  },
  {
    type: NotificationType.CHECKPOINT_DELAYED,
    label: notificationTypeLabels[NotificationType.CHECKPOINT_DELAYED],
    icon: notificationTypeIcons[NotificationType.CHECKPOINT_DELAYED],
    description: "Уведомление о задержке на контрольной точке",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.PUSH],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER", "OPERATOR"],
  },
  {
    type: NotificationType.COMMENT_ADDED,
    label: notificationTypeLabels[NotificationType.COMMENT_ADDED],
    icon: notificationTypeIcons[NotificationType.COMMENT_ADDED],
    description: "Уведомление о новом комментарии",
    channels: [NotificationChannel.SYSTEM],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER", "OPERATOR", "DRIVER"],
  },
  {
    type: NotificationType.FLAG_ADDED,
    label: notificationTypeLabels[NotificationType.FLAG_ADDED],
    icon: notificationTypeIcons[NotificationType.FLAG_ADDED],
    description: "Уведомление о добавлении флага к заявке",
    channels: [NotificationChannel.SYSTEM],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER", "DISPATCHER"],
  },
  {
    type: NotificationType.VEHICLE_MAINTENANCE_DUE,
    label: notificationTypeLabels[NotificationType.VEHICLE_MAINTENANCE_DUE],
    icon: notificationTypeIcons[NotificationType.VEHICLE_MAINTENANCE_DUE],
    description: "Уведомление о необходимости техобслуживания",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.EMAIL],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    type: NotificationType.DRIVER_LICENSE_EXPIRES,
    label: notificationTypeLabels[NotificationType.DRIVER_LICENSE_EXPIRES],
    icon: notificationTypeIcons[NotificationType.DRIVER_LICENSE_EXPIRES],
    description: "Уведомление об истечении срока прав",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.EMAIL],
    defaultEnabled: true,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
    label: notificationTypeLabels[NotificationType.SYSTEM_ANNOUNCEMENT],
    icon: notificationTypeIcons[NotificationType.SYSTEM_ANNOUNCEMENT],
    description: "Системные объявления",
    channels: [NotificationChannel.SYSTEM, NotificationChannel.EMAIL],
    defaultEnabled: true,
    roles: [
      "ADMIN",
      "MANAGER",
      "DISPATCHER",
      "OPERATOR",
      "DRIVER",
      "SALES",
      "CLIENT",
    ],
  },
];

export class NotificationQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;
}

export class MarkReadDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];

  @IsOptional()
  @IsBoolean()
  markAllRead?: boolean;
}

export class UpdateNotificationSettingsDto {
  @IsArray()
  @IsString({ each: true })
  enabledTypes!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disabledChannels?: string[];
}

export class CreateNotificationDto {
  @IsUUID()
  userId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;
}
