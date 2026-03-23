export enum NotificationType {
  REQUEST_CREATED = 'request_created',
  REQUEST_STATUS_CHANGED = 'request_status_changed',
  REQUEST_ASSIGNED = 'request_assigned',
  REQUEST_COMPLETED = 'request_completed',

  TRIP_CREATED = 'trip_created',
  TRIP_STATUS_CHANGED = 'trip_status_changed',
  TRIP_ASSIGNED = 'trip_assigned',
  TRIP_STARTED = 'trip_started',
  TRIP_COMPLETED = 'trip_completed',
  TRIP_DELAYED = 'trip_delayed',

  ORDER_CREATED = 'order_created',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  ORDER_PAYMENT_RECEIVED = 'order_payment_received',
  ORDER_OVERDUE = 'order_overdue',

  CHECKPOINT_COMPLETED = 'checkpoint_completed',
  CHECKPOINT_DELAYED = 'checkpoint_delayed',

  COMMENT_ADDED = 'comment_added',
  FLAG_ADDED = 'flag_added',
  FLAG_REMOVED = 'flag_removed',

  VEHICLE_MAINTENANCE_DUE = 'vehicle_maintenance_due',
  DRIVER_LICENSE_EXPIRES = 'driver_license_expires',

  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

export enum NotificationChannel {
  SYSTEM = 'system',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

export const notificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.REQUEST_CREATED]: 'Новая заявка',
  [NotificationType.REQUEST_STATUS_CHANGED]: 'Изменение статуса заявки',
  [NotificationType.REQUEST_ASSIGNED]: 'Назначена заявка',
  [NotificationType.REQUEST_COMPLETED]: 'Заявка выполнена',

  [NotificationType.TRIP_CREATED]: 'Создан рейс',
  [NotificationType.TRIP_STATUS_CHANGED]: 'Изменение статуса рейса',
  [NotificationType.TRIP_ASSIGNED]: 'Назначен рейс',
  [NotificationType.TRIP_STARTED]: 'Рейс начат',
  [NotificationType.TRIP_COMPLETED]: 'Рейс завершён',
  [NotificationType.TRIP_DELAYED]: 'Рейс задерживается',

  [NotificationType.ORDER_CREATED]: 'Создан заказ',
  [NotificationType.ORDER_STATUS_CHANGED]: 'Изменение статуса заказа',
  [NotificationType.ORDER_PAYMENT_RECEIVED]: 'Получена оплата',
  [NotificationType.ORDER_OVERDUE]: 'Просроченный заказ',

  [NotificationType.CHECKPOINT_COMPLETED]: 'Точка выполнена',
  [NotificationType.CHECKPOINT_DELAYED]: 'Задержка на точке',

  [NotificationType.COMMENT_ADDED]: 'Новый комментарий',
  [NotificationType.FLAG_ADDED]: 'Добавлен флаг',
  [NotificationType.FLAG_REMOVED]: 'Удалён флаг',

  [NotificationType.VEHICLE_MAINTENANCE_DUE]: 'Техобслуживание ТС',
  [NotificationType.DRIVER_LICENSE_EXPIRES]: 'Истекает срок прав',

  [NotificationType.SYSTEM_ANNOUNCEMENT]: 'Системное уведомление',
};

export const notificationTypeIcons: Record<NotificationType, string> = {
  [NotificationType.REQUEST_CREATED]: 'file-plus',
  [NotificationType.REQUEST_STATUS_CHANGED]: 'file-edit',
  [NotificationType.REQUEST_ASSIGNED]: 'user-check',
  [NotificationType.REQUEST_COMPLETED]: 'check-circle',

  [NotificationType.TRIP_CREATED]: 'truck',
  [NotificationType.TRIP_STATUS_CHANGED]: 'truck',
  [NotificationType.TRIP_ASSIGNED]: 'user-check',
  [NotificationType.TRIP_STARTED]: 'play',
  [NotificationType.TRIP_COMPLETED]: 'check-circle',
  [NotificationType.TRIP_DELAYED]: 'alert-triangle',

  [NotificationType.ORDER_CREATED]: 'receipt',
  [NotificationType.ORDER_STATUS_CHANGED]: 'receipt',
  [NotificationType.ORDER_PAYMENT_RECEIVED]: 'credit-card',
  [NotificationType.ORDER_OVERDUE]: 'alert-circle',

  [NotificationType.CHECKPOINT_COMPLETED]: 'map-pin',
  [NotificationType.CHECKPOINT_DELAYED]: 'clock',

  [NotificationType.COMMENT_ADDED]: 'message-square',
  [NotificationType.FLAG_ADDED]: 'flag',
  [NotificationType.FLAG_REMOVED]: 'flag-off',

  [NotificationType.VEHICLE_MAINTENANCE_DUE]: 'wrench',
  [NotificationType.DRIVER_LICENSE_EXPIRES]: 'id-card',

  [NotificationType.SYSTEM_ANNOUNCEMENT]: 'info',
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

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  channel: NotificationChannel;
  status: string;
  sentAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
  types?: NotificationType[];
  entityType?: string;
  entityId?: string;
}

export interface NotificationSettings {
  enabledTypes: string[];
  disabledChannels: string[];
}

export interface NotificationTypeInfo {
  type: string;
  label: string;
  icon: string;
  description: string;
  channels: string[];
  defaultEnabled: boolean;
  roles: string[];
}
