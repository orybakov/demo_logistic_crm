import { apiClient } from '@/lib/auth/api';
import type {
  Notification,
  NotificationSettings,
  NotificationFilters,
  NotificationsResponse,
  NotificationTypeInfo,
} from './types';

export const notificationsApi = {
  async getList(filters: NotificationFilters = {}): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.isRead !== undefined) params.set('isRead', filters.isRead.toString());
    if (filters.types?.length) {
      filters.types.forEach((type) => params.append('types', type));
    }
    if (filters.entityType) params.set('entityType', filters.entityType);
    if (filters.entityId) params.set('entityId', filters.entityId);

    const query = params.toString();
    return apiClient.get<NotificationsResponse>(`/notifications${query ? `?${query}` : ''}`);
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.count;
  },

  async getAvailableTypes(): Promise<NotificationTypeInfo[]> {
    const response = await apiClient.get<{ types: NotificationTypeInfo[] }>('/notifications/types');
    return response.types;
  },

  async getSettings(): Promise<NotificationSettings> {
    return apiClient.get<NotificationSettings>('/notifications/settings');
  },

  async markAsRead(id: string): Promise<void> {
    return apiClient.put<void>(`/notifications/${id}/read`);
  },

  async markAsUnread(id: string): Promise<void> {
    return apiClient.put<void>(`/notifications/${id}/unread`);
  },

  async markAllAsRead(): Promise<void> {
    return apiClient.put<void>('/notifications/read-all');
  },

  async updateSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    return apiClient.put<NotificationSettings>('/notifications/settings', settings);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/notifications/${id}`);
  },

  async deleteAll(daysOld: number = 30): Promise<void> {
    return apiClient.delete<void>(`/notifications/all?olderThanDays=${daysOld}`);
  },

  async broadcast(params: { title: string; body: string; roles?: string[] }): Promise<void> {
    return apiClient.post<void>('/notifications/broadcast', params);
  },
};
