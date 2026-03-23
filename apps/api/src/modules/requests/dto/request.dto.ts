import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export enum RequestStatus {
  NEW = "new",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum RequestPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export enum RequestType {
  AUTO = "auto",
  EXPRESS = "express",
  CHARTER = "charter",
  CONTAINER = "container",
}

export class PointDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  sequence: number;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plannedTimeFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plannedTimeTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  locationId?: string;
}

export class CargoItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  volume?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  length?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pieces?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  packageType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDangerous?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adrClass?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  temperatureRequired?: boolean;
}

export class CreateRequestDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional()
  @IsEnum(RequestType)
  @IsOptional()
  type?: RequestType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  cargoTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalVolume?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalPieces?: number;

  @ApiPropertyOptional()
  @IsEnum(RequestPriority)
  @IsOptional()
  priority?: RequestPriority;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  temperatureFrom?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  temperatureTo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  filialId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiProperty({ type: [PointDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointDto)
  points?: PointDto[];

  @ApiProperty({ type: [CargoItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargoItemDto)
  cargoItems?: CargoItemDto[];
}

export class UpdateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(RequestType)
  type?: RequestType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cargoTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalVolume?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalPieces?: number;

  @ApiPropertyOptional()
  @IsEnum(RequestPriority)
  @IsOptional()
  priority?: RequestPriority;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  temperatureFrom?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  temperatureTo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  filialId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ type: [PointDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointDto)
  points?: PointDto[];

  @ApiPropertyOptional({ type: [CargoItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargoItemDto)
  cargoItems?: CargoItemDto[];
}

export class ChangeStatusDto {
  @ApiProperty({ enum: RequestStatus })
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class AddCommentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  text: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}

export class SetFlagsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  flags: string[];
}

export class AddFlagDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  flag: string;
}

export class RemoveFlagDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  flag: string;
}

export class RequestQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: RequestStatus })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({ enum: RequestPriority })
  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  filialId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  hasActiveTrips?: boolean;
}
