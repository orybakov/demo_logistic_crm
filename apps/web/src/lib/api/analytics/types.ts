export type AnalyticsEntity = 'requests' | 'orders';
export type AnalyticsExportFormat = 'csv' | 'xlsx';

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  filialId?: string;
  status?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
}

export interface AnalyticsKpiResponse {
  period: { dateFrom: string; dateTo: string };
  requests: {
    total: number;
    byStatus: Record<string, number>;
    active: number;
    completed: number;
    cancelled: number;
    completionRate: number;
    linkedToOrders: number;
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    collectionRate: number;
    averageCheck: number;
    overdueCount: number;
  };
}

export interface AnalyticsRequestsReportRow {
  id: string;
  number: string;
  clientName: string;
  filialName: string | null;
  status: string;
  priority: string;
  assignedToName: string | null;
  createdAt: string;
  completedAt: string | null;
  orderNumber: string | null;
  tripsCount: number;
}

export interface AnalyticsOrdersReportRow {
  id: string;
  number: string;
  clientName: string;
  filialName: string | null;
  status: string;
  paymentStatus: string;
  assignedToName: string | null;
  orderDate: string;
  paymentDeadline: string | null;
  total: number;
  paidAmount: number;
  requestsCount: number;
}

export interface AnalyticsReportResponse<T> {
  period: { dateFrom: string; dateTo: string };
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  rows: T[];
  summary: Record<string, number>;
}
