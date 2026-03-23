export enum TripStatus {
  SCHEDULED = 'scheduled',
  ASSIGNED = 'assigned',
  LOADING = 'loading',
  IN_PROGRESS = 'in_progress',
  UNLOADING = 'unloading',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DELAYED = 'delayed',
}

export const tripStatusLabels: Record<TripStatus, string> = {
  [TripStatus.SCHEDULED]: 'Запланирован',
  [TripStatus.ASSIGNED]: 'Назначен',
  [TripStatus.LOADING]: 'На погрузке',
  [TripStatus.IN_PROGRESS]: 'В пути',
  [TripStatus.UNLOADING]: 'На выгрузке',
  [TripStatus.COMPLETED]: 'Завершён',
  [TripStatus.CANCELLED]: 'Отменён',
  [TripStatus.DELAYED]: 'Задерживается',
};

export interface Client {
  id: string;
  name: string;
}

export interface Point {
  id: string;
  type: string;
  address: string;
  city?: string;
  plannedDate?: string;
  sequence: number;
}

export interface CargoItem {
  id: string;
  description?: string;
  weight?: number;
  volume?: number;
  pieces?: number;
}

export interface Checkpoint {
  id: string;
  type: string;
  sequence: number;
  name: string;
  address?: string;
  plannedTime?: string;
  actualTime?: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

export interface TripComment {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Trip {
  id: string;
  number: string;
  requestId: string;
  clientId?: string;
  vehicleId?: string;
  driverId?: string;
  status: TripStatus;
  plannedStart?: string;
  actualStart?: string;
  plannedEnd?: string;
  actualEnd?: string;
  plannedDistance?: number;
  actualDistance?: number;
  plannedDuration?: number;
  actualDuration?: number;
  plannedFuel?: number;
  actualFuel?: number;
  delayMinutes?: number;
  delayReason?: string;
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  request?: {
    id: string;
    number: string;
    client?: Client;
    points?: Point[];
    cargoItems?: CargoItem[];
  };
  vehicle?: {
    id: string;
    plateNumber: string;
    brand?: string;
    model?: string;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  completedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  checkpoints?: Checkpoint[];
  statusHistory?: Array<{
    id: string;
    status: string;
    changedAt: string;
    changedBy?: {
      id: string;
      firstName: string;
      lastName: string;
    };
    comment?: string;
  }>;
  comments?: TripComment[];
  _count?: {
    checkpoints: number;
  };
}

export interface TripsResponse {
  data: Trip[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TripCommentsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  comments: TripComment[];
}

export interface TripStats {
  active: number;
  completedToday: number;
  scheduled: number;
}

export interface TripFilters {
  page?: number;
  limit?: number;
  status?: TripStatus | 'all';
  requestId?: string;
  vehicleId?: string;
  driverId?: string;
  filialId?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ScheduleSlot {
  tripId: string;
  tripNumber: string;
  requestNumber: string;
  checkpointId: string;
  type: 'loading' | 'unloading';
  plannedTime: string;
  actualTime?: string;
  isCompleted: boolean;
  address: string;
  city?: string;
  vehiclePlate?: string;
  driverName?: string;
  status: string;
}

export interface ScheduleFilters {
  year?: number;
  month?: number;
  dateFrom?: string;
  dateTo?: string;
  vehicleId?: string;
  driverId?: string;
  type?: 'loading' | 'unloading';
}

export interface CreateTripDto {
  requestId: string;
  vehicleId?: string;
  driverId?: string;
  plannedStart?: string;
  plannedEnd?: string;
  plannedDistance?: number;
  plannedDuration?: number;
  plannedFuel?: number;
  notes?: string;
}

export interface UpdateTripDto {
  vehicleId?: string;
  driverId?: string;
  plannedStart?: string;
  plannedEnd?: string;
  plannedDistance?: number;
  plannedDuration?: number;
  plannedFuel?: number;
  delayMinutes?: number;
  delayReason?: string;
  notes?: string;
}

export interface AssignResourcesDto {
  vehicleId: string;
  driverId: string;
}

export interface CompleteTripDto {
  actualEnd?: string;
  actualDistance?: number;
  actualDuration?: number;
  actualFuel?: number;
  notes?: string;
}

export interface ChangeStatusDto {
  status: TripStatus;
  comment?: string;
}

export interface AddCommentDto {
  text: string;
}

export interface UpdateCheckpointDto {
  actualTime?: string;
  notes?: string;
  photoUrl?: string;
  signatureUrl?: string;
}

export interface AvailableResources {
  vehicles: Array<{
    id: string;
    plateNumber: string;
    brand?: string;
    model?: string;
    bodyType?: string;
    capacityKg?: number;
  }>;
  drivers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    licenseCategory?: string;
  }>;
}
