export type RoleCode =
  | 'ADMIN'
  | 'MANAGER'
  | 'DISPATCHER'
  | 'SALES'
  | 'OPERATOR'
  | 'DRIVER'
  | 'CLIENT';
export type PermissionSubject =
  | 'requests'
  | 'orders'
  | 'trips'
  | 'clients'
  | 'vehicles'
  | 'drivers'
  | 'reports'
  | 'users'
  | 'admin'
  | 'locations'
  | 'tariffs'
  | 'notifications';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface AdminUserRole {
  id: string;
  code: RoleCode;
  name: string;
  filialId?: string | null;
  filialName?: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone?: string | null;
  filialId?: string | null;
  isActive: boolean;
  createdAt: string;
  roles: AdminUserRole[];
}

export interface AdminUsersResponse {
  total: number;
  page: number;
  take: number;
  totalPages: number;
  users: AdminUser[];
}

export interface AdminPermission {
  id: string;
  subject: PermissionSubject;
  action: PermissionAction;
  name: string;
  description?: string | null;
}

export interface AdminRolePermission {
  subject: PermissionSubject;
  action: PermissionAction;
  name: string;
}

export interface AdminRole {
  id: string;
  code: RoleCode;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  usersCount: number;
  permissions: AdminRolePermission[];
}

export interface AdminRolesResponse {
  roles: AdminRole[];
  permissions: AdminPermission[];
}

export interface AdminAuditLog {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface AdminAuditResponse {
  total: number;
  page: number;
  take: number;
  totalPages: number;
  logs: AdminAuditLog[];
}

export interface AdminSetting {
  id: string;
  key: string;
  title: string;
  section: string;
  value: unknown;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSettingsResponse {
  settings: AdminSetting[];
}

export interface AdminReferenceCatalog {
  sections: Array<{ key: string; title: string; path: string }>;
}

export interface AdminUserFilters {
  page?: number;
  take?: number;
  q?: string;
  filialId?: string;
  roleCode?: RoleCode;
  isActive?: boolean;
}

export interface AdminAuditFilters {
  page?: number;
  take?: number;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
}

export interface AdminUserCreateDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  filialId?: string;
  roleCodes?: RoleCode[];
}

export interface AdminUserUpdateDto {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  filialId?: string;
  isActive?: boolean;
}

export interface AdminUserRolesDto {
  roleCodes: RoleCode[];
  filialId?: string;
}

export interface AdminRoleUpdateDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissions?: Array<{ subject: PermissionSubject; action: PermissionAction }>;
}

export interface AdminSettingUpdateDto {
  title: string;
  section: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  value: unknown;
}
