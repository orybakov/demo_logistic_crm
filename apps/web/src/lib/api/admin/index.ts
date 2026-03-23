import { apiClient } from '@/lib/auth/api';
import type {
  AdminAuditFilters,
  AdminAuditResponse,
  AdminReferenceCatalog,
  AdminRoleUpdateDto,
  AdminRolesResponse,
  AdminSettingUpdateDto,
  AdminSettingsResponse,
  AdminUserCreateDto,
  AdminUserFilters,
  AdminUserRolesDto,
  AdminUserUpdateDto,
  AdminUsersResponse,
  RoleCode,
} from './types';

const endpoint = '/admin';

function query(filters?: Record<string, unknown> | object) {
  const params = new URLSearchParams();
  if (!filters) return '';
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'boolean') params.set(key, value ? 'true' : 'false');
    else params.set(key, String(value));
  }
  return params.toString();
}

export const adminApi = {
  getUsers: (filters?: AdminUserFilters) => {
    const qs = query(filters);
    return apiClient.get<AdminUsersResponse>(`${endpoint}/users${qs ? `?${qs}` : ''}`);
  },
  createUser: (dto: AdminUserCreateDto) => apiClient.post(`${endpoint}/users`, dto),
  updateUser: (id: string, dto: AdminUserUpdateDto) =>
    apiClient.put(`${endpoint}/users/${id}`, dto),
  updateUserPassword: (id: string, newPassword: string) =>
    apiClient.put(`${endpoint}/users/${id}/password`, { newPassword }),
  assignUserRoles: (id: string, dto: AdminUserRolesDto) =>
    apiClient.put(`${endpoint}/users/${id}/roles`, dto),
  deleteUser: (id: string) => apiClient.delete(`${endpoint}/users/${id}`),

  getRoles: () => apiClient.get<AdminRolesResponse>(`${endpoint}/roles`),
  updateRole: (code: RoleCode, dto: AdminRoleUpdateDto) =>
    apiClient.put(`${endpoint}/roles/${code}`, dto),

  getAuditLogs: (filters?: AdminAuditFilters) => {
    const qs = query(filters);
    return apiClient.get<AdminAuditResponse>(`${endpoint}/audit${qs ? `?${qs}` : ''}`);
  },

  getSettings: () => apiClient.get<AdminSettingsResponse>(`${endpoint}/settings`),
  updateSetting: (key: string, dto: AdminSettingUpdateDto) =>
    apiClient.put(`${endpoint}/settings/${key}`, dto),

  getReferenceCatalog: () => apiClient.get<AdminReferenceCatalog>(`${endpoint}/references`),
};
