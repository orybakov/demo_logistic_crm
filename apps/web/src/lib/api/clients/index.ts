import { apiClient } from '@/lib/auth/api';

export interface ClientSummary {
  id: string;
  name: string;
  inn?: string;
  contactName?: string;
}

export interface ClientsResponse {
  total: number;
  clients: ClientSummary[];
}

export const clientsApi = {
  getList: (params?: { take?: number; search?: string; filialId?: string; isActive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.take) query.set('take', String(params.take));
    if (params?.search) query.set('search', params.search);
    if (params?.filialId) query.set('filialId', params.filialId);
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    const qs = query.toString();
    return apiClient.get<ClientsResponse>(`/clients${qs ? `?${qs}` : ''}`);
  },
};
