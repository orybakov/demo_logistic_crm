export enum RequestStatus {
  NEW = 'new',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum RequestPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum RequestType {
  AUTO = 'auto',
  EXPRESS = 'express',
  CHARTER = 'charter',
  CONTAINER = 'container',
}

export interface Point {
  id: string;
  type: string;
  sequence: number;
  address: string;
  city?: string;
  region?: string;
  contactName?: string;
  contactPhone?: string;
  plannedDate?: string;
  actualArrival?: string;
  actualDeparture?: string;
}

export interface CargoItem {
  id: string;
  description?: string;
  weight?: number;
  volume?: number;
  pieces?: number;
  isDangerous?: boolean;
  isFragile?: boolean;
  temperatureRequired?: boolean;
}

export interface Trip {
  id: string;
  number: string;
  status: string;
  vehicle?: {
    id: string;
    plateNumber: string;
    brand?: string;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface StatusHistoryEntry {
  id: string;
  status: string;
  changedAt: string;
  changedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  comment?: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  isSystem?: boolean;
}

export interface Client {
  id: string;
  name: string;
  inn: string;
}

export interface Filial {
  id: string;
  name: string;
  code: string;
}

export interface Request {
  id: string;
  number: string;
  clientId: string;
  client?: Client;
  orderId?: string;
  order?: {
    id: string;
    number: string;
    total: number;
    paymentStatus: string;
  };
  type: string;
  cargoTypeId?: string;
  totalWeight?: number;
  totalVolume?: number;
  totalPieces?: number;
  status: RequestStatus;
  priority: RequestPriority;
  flags: string[];
  temperatureFrom?: number;
  temperatureTo?: number;
  notes?: string;
  filialId?: string;
  filial?: Filial;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  points: Point[];
  cargoItems: CargoItem[];
  trips: Trip[];
  statusHistory: StatusHistoryEntry[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  _count?: {
    trips: number;
    comments: number;
  };
}

export interface RequestsResponse {
  requests: Request[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RequestFilters {
  page?: number;
  limit?: number;
  status?: RequestStatus | 'all';
  priority?: RequestPriority | 'all';
  clientId?: string;
  assignedToId?: string;
  filialId?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateRequestDto {
  clientId: string;
  orderId?: string;
  type?: RequestType;
  priority?: RequestPriority;
  points: Array<{
    type: string;
    sequence: number;
    address: string;
    city?: string;
    contactName?: string;
    contactPhone?: string;
  }>;
  cargoItems?: Array<{
    description?: string;
    weight?: number;
    volume?: number;
    pieces?: number;
  }>;
  notes?: string;
}

export interface UpdateRequestDto {
  clientId?: string;
  orderId?: string;
  type?: RequestType;
  priority?: RequestPriority;
  status?: RequestStatus;
  notes?: string;
}

export interface ChangeStatusDto {
  status: RequestStatus;
  comment?: string;
}

export const statusLabels: Record<RequestStatus, string> = {
  [RequestStatus.NEW]: 'Новая',
  [RequestStatus.CONFIRMED]: 'Подтверждена',
  [RequestStatus.IN_PROGRESS]: 'В работе',
  [RequestStatus.COMPLETED]: 'Завершена',
  [RequestStatus.CANCELLED]: 'Отменена',
  [RequestStatus.ON_HOLD]: 'На паузе',
};

export const priorityLabels: Record<RequestPriority, string> = {
  [RequestPriority.LOW]: 'Низкий',
  [RequestPriority.NORMAL]: 'Обычный',
  [RequestPriority.HIGH]: 'Высокий',
  [RequestPriority.URGENT]: 'Срочный',
};

export const typeLabels: Record<RequestType, string> = {
  [RequestType.AUTO]: 'Авто',
  [RequestType.EXPRESS]: 'Экспресс',
  [RequestType.CHARTER]: 'Чартер',
  [RequestType.CONTAINER]: 'Контейнер',
};
