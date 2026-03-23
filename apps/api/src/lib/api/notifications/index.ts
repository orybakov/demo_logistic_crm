import type { NotificationTypeConfig } from "../../../modules/notifications/dto/notifications.dto";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const endpoint = "/notifications";

interface Notification {
  id: string;
  title?: string;
  body?: string;
  isRead?: boolean;
}

interface NotificationsResponse {
  data: Notification[];
  meta?: Record<string, unknown>;
}

interface NotificationFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
  types?: string[];
  entityType?: string;
  entityId?: string;
}

interface NotificationSettings {
  [key: string]: unknown;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const notificationsApi = {
  getList: (filters?: NotificationFilters) => {
    const params = new URLSearchParams();

    if (filters?.page) params.set("page", filters.page.toString());
    if (filters?.limit) params.set("limit", filters.limit.toString());
    if (filters?.isRead !== undefined)
      params.set("isRead", String(filters.isRead));
    if (filters?.types && filters.types.length > 0) {
      filters.types.forEach((type) => params.append("types", type));
    }
    if (filters?.entityType) params.set("entityType", filters.entityType);
    if (filters?.entityId) params.set("entityId", filters.entityId);

    const queryString = params.toString();
    return apiClient.get<NotificationsResponse>(
      `${endpoint}${queryString ? `?${queryString}` : ""}`,
    );
  },

  getUnreadCount: () =>
    apiClient.get<{ count: number }>(`${endpoint}/unread-count`),
  getAvailableTypes: () =>
    apiClient.get<{ types: NotificationTypeConfig[] }>(`${endpoint}/types`),
  getSettings: () =>
    apiClient.get<NotificationSettings>(`${endpoint}/settings`),
  getById: (id: string) => apiClient.get<Notification>(`${endpoint}/${id}`),
  markAsRead: (id: string) =>
    apiClient.put<Notification>(`${endpoint}/${id}/read`),
  markAsUnread: (id: string) =>
    apiClient.put<Notification>(`${endpoint}/${id}/unread`),
  markAllAsRead: () => apiClient.put<{ count: number }>(`${endpoint}/read-all`),
  updateSettings: (settings: NotificationSettings) =>
    apiClient.put<NotificationSettings>(`${endpoint}/settings`, settings),
  delete: (id: string) => apiClient.delete(`${endpoint}/${id}`),
  deleteAll: (olderThanDays?: number) => {
    const params = new URLSearchParams();
    if (olderThanDays !== undefined) {
      params.set("olderThanDays", olderThanDays.toString());
    }
    const queryString = params.toString();
    return apiClient.delete<{ count: number }>(
      `${endpoint}/all${queryString ? `?${queryString}` : ""}`,
    );
  },
  broadcast: (title: string, body: string, userIds?: string[]) => {
    return apiClient.post<{ success: boolean }>(`${endpoint}/broadcast`, {
      title,
      body,
      userIds,
    });
  },
};

export type {
  Notification,
  NotificationsResponse,
  NotificationFilters,
  NotificationSettings,
  NotificationTypeConfig,
};
