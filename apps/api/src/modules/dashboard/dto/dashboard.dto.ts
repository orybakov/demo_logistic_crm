import {
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsEnum,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export class DashboardQueryDto {
  @IsOptional()
  @IsString()
  filialId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blocks?: string[];
}

export enum DashboardBlock {
  FREE_REQUESTS = "free_requests",
  PROBLEM_FLAGS = "problem_flags",
  PROBLEM_ORDERS = "problem_orders",
  TODAY_LOADINGS = "today_loadings",
  TODAY_DELIVERIES = "today_deliveries",
  RECENT_ACTIVITY = "recent_activity",
  PENDING_PAYMENTS = "pending_payments",
}

export enum ProblemFlag {
  URGENT = "urgent",
  OVERSIZE = "oversize",
  FRAGILE = "fragile",
  TEMP = "temp",
  HAZMAT = "hazmat",
  EXPRESS = "express",
}

export enum ProblemStatus {
  OVERDUE = "overdue",
  ON_HOLD = "on_hold",
  CANCELLED = "cancelled",
}

export class DashboardBlockVisibilityDto {
  @IsArray()
  @IsString({ each: true })
  visibleBlocks: DashboardBlock[];
}
