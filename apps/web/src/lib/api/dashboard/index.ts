import { apiClient } from '@/lib/auth/api';
import type { DashboardResult, QuickSearchResult, DashboardBlock } from './types';

const endpoint = '/dashboard';

export const dashboardApi = {
  getDashboard: (params?: { filialId?: string; blocks?: string[] }) => {
    const searchParams = new URLSearchParams();
    if (params?.filialId) searchParams.set('filialId', params.filialId);
    if (params?.blocks) {
      params.blocks.forEach((block) => searchParams.append('blocks', block));
    }
    const queryString = searchParams.toString();
    return apiClient.get<DashboardResult>(`${endpoint}${queryString ? `?${queryString}` : ''}`);
  },

  search: (query: string) => {
    return apiClient.get<QuickSearchResult[]>(`${endpoint}/search?q=${encodeURIComponent(query)}`);
  },

  getBlocks: () => {
    return apiClient.get<{ blocks: DashboardBlock[] }>(`${endpoint}/blocks`);
  },

  updateVisibility: (visibleBlocks: string[]) => {
    return apiClient.put<{ success: boolean; visibleBlocks: string[] }>(`${endpoint}/visibility`, {
      visibleBlocks,
    });
  },
};

export type { DashboardResult, QuickSearchResult, DashboardBlock };
