import type { RoleCode, PermissionSubject, PermissionAction } from '@logistics-crm/shared';

export type { RoleCode, PermissionSubject, PermissionAction };

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  avatarUrl?: string;
  filialId?: string;
  isActive: boolean;
  isSuperadmin: boolean;
  roles: RoleCode[];
}

export interface AuthUser extends User {
  permissions: Permission[];
}

export interface Permission {
  subject: PermissionSubject;
  action: PermissionAction;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
