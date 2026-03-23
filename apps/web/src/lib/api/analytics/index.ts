import { apiClient } from '@/lib/auth/api';
import type {
  AnalyticsEntity,
  AnalyticsExportFormat,
  AnalyticsFilters,
  AnalyticsKpiResponse,
  AnalyticsOrdersReportRow,
  AnalyticsReportResponse,
  AnalyticsRequestsReportRow,
} from './types';

const endpoint = '/analytics';

function buildQuery(filters?: AnalyticsFilters & { format?: AnalyticsExportFormat }) {
  const params = new URLSearchParams();

  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);
  if (filters?.filialId) params.set('filialId', filters.filialId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.assignedToId) params.set('assignedToId', filters.assignedToId);
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.limit) params.set('limit', filters.limit.toString());
  if (filters?.format) params.set('format', filters.format);

  return params.toString();
}

async function downloadFile(path: string): Promise<Blob> {
  const token = apiClient.getAccessToken();
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${path}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Ошибка экспорта');
  }

  return response.blob();
}

export const analyticsApi = {
  getKpi: (filters?: AnalyticsFilters) => {
    const query = buildQuery(filters);
    return apiClient.get<AnalyticsKpiResponse>(`${endpoint}/kpi${query ? `?${query}` : ''}`);
  },

  getRequestsReport: (filters?: AnalyticsFilters) => {
    const query = buildQuery(filters);
    return apiClient.get<AnalyticsReportResponse<AnalyticsRequestsReportRow>>(
      `${endpoint}/reports/requests${query ? `?${query}` : ''}`
    );
  },

  getOrdersReport: (filters?: AnalyticsFilters) => {
    const query = buildQuery(filters);
    return apiClient.get<AnalyticsReportResponse<AnalyticsOrdersReportRow>>(
      `${endpoint}/reports/orders${query ? `?${query}` : ''}`
    );
  },

  exportReport: async (
    entity: AnalyticsEntity,
    filters?: AnalyticsFilters,
    format: AnalyticsExportFormat = 'csv'
  ) => {
    const query = buildQuery({ ...filters, format });
    return downloadFile(`${endpoint}/reports/${entity}/export${query ? `?${query}` : ''}`);
  },
};

export type {
  AnalyticsEntity,
  AnalyticsExportFormat,
  AnalyticsFilters,
  AnalyticsKpiResponse,
  AnalyticsOrdersReportRow,
  AnalyticsReportResponse,
  AnalyticsRequestsReportRow,
};
