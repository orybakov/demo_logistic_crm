import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsIn,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export enum TripStatus {
  SCHEDULED = "scheduled",
  ASSIGNED = "assigned",
  LOADING = "loading",
  IN_PROGRESS = "in_progress",
  UNLOADING = "unloading",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DELAYED = "delayed",
}

export const tripStatusLabels: Record<TripStatus, string> = {
  [TripStatus.SCHEDULED]: "Запланирован",
  [TripStatus.ASSIGNED]: "Назначен",
  [TripStatus.LOADING]: "На погрузке",
  [TripStatus.IN_PROGRESS]: "В пути",
  [TripStatus.UNLOADING]: "На выгрузке",
  [TripStatus.COMPLETED]: "Завершён",
  [TripStatus.CANCELLED]: "Отменён",
  [TripStatus.DELAYED]: "Задерживается",
};

export const VALID_STATUS_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  [TripStatus.SCHEDULED]: [TripStatus.ASSIGNED, TripStatus.CANCELLED],
  [TripStatus.ASSIGNED]: [TripStatus.LOADING, TripStatus.CANCELLED],
  [TripStatus.LOADING]: [
    TripStatus.IN_PROGRESS,
    TripStatus.DELAYED,
    TripStatus.CANCELLED,
  ],
  [TripStatus.IN_PROGRESS]: [
    TripStatus.UNLOADING,
    TripStatus.DELAYED,
    TripStatus.CANCELLED,
  ],
  [TripStatus.UNLOADING]: [TripStatus.COMPLETED, TripStatus.DELAYED],
  [TripStatus.DELAYED]: [
    TripStatus.IN_PROGRESS,
    TripStatus.UNLOADING,
    TripStatus.CANCELLED,
  ],
  [TripStatus.COMPLETED]: [],
  [TripStatus.CANCELLED]: [TripStatus.SCHEDULED],
};

export class CreateTripDto {
  @IsUUID()
  requestId!: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsDateString()
  plannedStart?: string;

  @IsOptional()
  @IsDateString()
  plannedEnd?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedDistance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedFuel?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTripDto {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsDateString()
  plannedStart?: string;

  @IsOptional()
  @IsDateString()
  plannedEnd?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedDistance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedFuel?: number;

  @IsOptional()
  @IsNumber()
  delayMinutes?: number;

  @IsOptional()
  @IsString()
  delayReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignResourcesDto {
  @IsUUID()
  vehicleId!: string;

  @IsUUID()
  driverId!: string;
}

export class StartTripDto {
  @IsOptional()
  @IsDateString()
  actualStart?: string;
}

export class CompleteTripDto {
  @IsOptional()
  @IsDateString()
  actualEnd?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualDistance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualFuel?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelTripDto {
  @IsString()
  cancellationReason!: string;
}

export class ChangeStatusDto {
  @IsIn(Object.values(TripStatus))
  status!: TripStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateCheckpointDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedArrival?: number;

  @IsOptional()
  @IsDateString()
  actualTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  signatureUrl?: string;
}

export class AddCheckpointDto {
  @IsUUID()
  pointId!: string;

  @IsString()
  @IsIn(["loading", "unloading"])
  type!: string;

  @IsNumber()
  @Min(1)
  sequence!: number;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  plannedTime?: string;
}

export class LinkRequestDto {
  @IsUUID()
  requestId!: string;
}

export class TripQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  filialId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";
}

export class ScheduleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  type?: "loading" | "unloading";
}

export class AddCommentDto {
  @IsString()
  text!: string;
}
