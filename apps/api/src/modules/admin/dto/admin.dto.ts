import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { PermissionAction, PermissionSubject, RoleCode } from "@prisma/client";

export class AdminListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  @IsOptional()
  @IsString()
  q?: string;
}

export class AdminUserQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsUUID()
  filialId?: string;

  @IsOptional()
  @IsEnum(RoleCode)
  roleCode?: RoleCode;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminAuditQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  action?: string;
}

export class AdminUserCreateDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  filialId?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(RoleCode, { each: true })
  roleCodes?: RoleCode[];
}

export class AdminUserUpdateDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  filialId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class AdminUserRolesDto {
  @IsArray()
  @IsEnum(RoleCode, { each: true })
  roleCodes: RoleCode[];

  @IsOptional()
  @IsUUID()
  filialId?: string;
}

export class AdminRoleUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  permissions?: Array<{
    subject: PermissionSubject;
    action: PermissionAction;
  }>;
}

export class AdminSettingUpdateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  section: string;

  @IsOptional()
  description?: string;

  @IsBoolean()
  isActive: boolean;

  @IsBoolean()
  isSystem: boolean;

  value: unknown;
}
