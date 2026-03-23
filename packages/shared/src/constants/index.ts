export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
export const APP_NAME = 'Logistics CRM';
export const APP_DESCRIPTION = 'Enterprise logistics management system';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
} as const;

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const REQUEST_STATUSES = [
  { value: 'new', label: 'Новая', color: 'blue' },
  { value: 'calculating', label: 'Расчёт', color: 'yellow' },
  { value: 'calculated', label: 'Рассчитана', color: 'cyan' },
  { value: 'confirmed', label: 'Подтверждена', color: 'green' },
  { value: 'in_progress', label: 'В работе', color: 'orange' },
  { value: 'completed', label: 'Завершена', color: 'emerald' },
  { value: 'cancelled', label: 'Отменена', color: 'red' },
] as const;

export const REQUEST_PRIORITIES = [
  { value: 'low', label: 'Низкий', color: 'gray' },
  { value: 'normal', label: 'Обычный', color: 'blue' },
  { value: 'high', label: 'Высокий', color: 'orange' },
  { value: 'urgent', label: 'Срочный', color: 'red' },
] as const;

export const TRIP_STATUSES = [
  { value: 'scheduled', label: 'Запланирован', color: 'gray' },
  { value: 'assigned', label: 'Назначен', color: 'blue' },
  { value: 'in_progress', label: 'В пути', color: 'orange' },
  { value: 'completed', label: 'Завершён', color: 'green' },
  { value: 'cancelled', label: 'Отменён', color: 'red' },
] as const;

export const ORDER_STATUSES = [
  { value: 'draft', label: 'Черновик', color: 'gray' },
  { value: 'confirmed', label: 'Подтверждён', color: 'blue' },
  { value: 'in_progress', label: 'В работе', color: 'orange' },
  { value: 'completed', label: 'Завершён', color: 'green' },
  { value: 'cancelled', label: 'Отменён', color: 'red' },
] as const;

export const PAYMENT_STATUSES = [
  { value: 'not_paid', label: 'Не оплачен', color: 'red' },
  { value: 'partial', label: 'Частично оплачен', color: 'orange' },
  { value: 'paid', label: 'Оплачен', color: 'green' },
] as const;

export const VEHICLE_BODY_TYPES = [
  { value: 'van', label: 'Фургон' },
  { value: 'truck', label: 'Грузовик' },
  { value: 'trailer', label: 'Прицеп' },
  { value: 'semitrailer', label: 'Полуприцеп' },
  { value: 'refrigerator', label: 'Рефрижератор' },
  { value: 'container', label: 'Контейнер' },
  { value: 'tank', label: 'Цистерна' },
  { value: 'platform', label: 'Платформа' },
] as const;

export const POINT_TYPES = [
  { value: 'pickup', label: 'Загрузка' },
  { value: 'delivery', label: 'Доставка' },
  { value: 'warehouse', label: 'Склад' },
  { value: 'border', label: 'Граница' },
  { value: 'other', label: 'Другое' },
] as const;

export const PACKAGE_TYPES = [
  { value: 'box', label: 'Коробка' },
  { value: 'pallet', label: 'Паллета' },
  { value: 'container', label: 'Контейнер' },
  { value: 'bag', label: 'Мешок' },
  { value: 'barrel', label: 'Бочка' },
  { value: 'roll', label: 'Рулон' },
  { value: 'bundle', label: 'Связка' },
  { value: 'other', label: 'Другое' },
] as const;

export const ADR_CLASSES = [
  { value: '1', label: 'Класс 1 - Взрывчатые вещества' },
  { value: '2', label: 'Класс 2 - Газы' },
  { value: '3', label: 'Класс 3 - Легковоспламеняющиеся жидкости' },
  { value: '4', label: 'Класс 4 - Легковоспламеняющиеся твёрдые вещества' },
  { value: '5', label: 'Класс 5 - Окисляющие вещества' },
  { value: '6', label: 'Класс 6 - Токсичные вещества' },
  { value: '7', label: 'Класс 7 - Радиоактивные материалы' },
  { value: '8', label: 'Класс 8 - Коррозионные вещества' },
  { value: '9', label: 'Класс 9 - Прочие опасные грузы' },
] as const;
