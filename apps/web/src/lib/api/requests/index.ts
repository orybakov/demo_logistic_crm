import { apiClient } from '@/lib/auth/api';
import type {
  Request,
  Comment,
  RequestsResponse,
  RequestFilters,
  CreateRequestDto,
  UpdateRequestDto,
  ChangeStatusDto,
} from './types';

const endpoint = '/requests';

export const requestsApi = {
  getList: (filters?: RequestFilters) => {
    const params = new URLSearchParams();

    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.priority && filters.priority !== 'all') params.set('priority', filters.priority);
    if (filters?.clientId) params.set('clientId', filters.clientId);
    if (filters?.assignedToId) params.set('assignedToId', filters.assignedToId);
    if (filters?.filialId) params.set('filialId', filters.filialId);
    if (filters?.q) params.set('q', filters.q);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);

    const queryString = params.toString();
    return apiClient.get<RequestsResponse>(`${endpoint}${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) => {
    return apiClient.get<Request>(`${endpoint}/${id}`);
  },

  create: (data: CreateRequestDto) => {
    return apiClient.post<Request>(endpoint, data);
  },

  update: (id: string, data: UpdateRequestDto) => {
    return apiClient.put<Request>(`${endpoint}/${id}`, data);
  },

  changeStatus: (id: string, data: ChangeStatusDto) => {
    return apiClient.post<Request>(`${endpoint}/${id}/status`, data);
  },

  delete: (id: string) => {
    return apiClient.delete<Request>(`${endpoint}/${id}`);
  },

  addComment: (id: string, text: string) => {
    return apiClient.post(`${endpoint}/${id}/comments`, { text });
  },

  getComments: (id: string, page = 1, limit = 100) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    return apiClient.get<{ comments: Comment[] }>(
      `${endpoint}/${id}/comments?${params.toString()}`
    );
  },

  addFlag: (id: string, flag: string) => {
    return apiClient.post(`${endpoint}/${id}/flags`, { flag });
  },

  removeFlag: (id: string, flag: string) => {
    return apiClient.delete(`${endpoint}/${id}/flags/${flag}`);
  },

  setFlags: (id: string, flags: string[]) => {
    return apiClient.put(`${endpoint}/${id}/flags`, { flags });
  },

  getStats: () => {
    return apiClient.get<{
      total: number;
      byStatus: Record<string, number>;
      byPriority: Record<string, number>;
    }>(`${endpoint}/stats`);
  },
};

export type {
  Request,
  RequestsResponse,
  RequestFilters,
  CreateRequestDto,
  UpdateRequestDto,
  ChangeStatusDto,
};
