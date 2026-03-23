import { apiClient } from '@/lib/auth/api';
import type {
  Order,
  OrdersResponse,
  OrderFilters,
  OrderStats,
  CreateOrderDto,
  UpdateOrderDto,
  ChangeStatusDto,
  AddPaymentDto,
} from './types';

const endpoint = '/orders';

export const ordersApi = {
  getList: (filters?: OrderFilters) => {
    const params = new URLSearchParams();

    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.paymentStatus && filters.paymentStatus !== 'all')
      params.set('paymentStatus', filters.paymentStatus);
    if (filters?.clientId) params.set('clientId', filters.clientId);
    if (filters?.filialId) params.set('filialId', filters.filialId);
    if (filters?.assignedToId) params.set('assignedToId', filters.assignedToId);
    if (filters?.q) params.set('q', filters.q);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    return apiClient.get<OrdersResponse>(`${endpoint}${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) => {
    return apiClient.get<Order>(`${endpoint}/${id}`);
  },

  create: (data: CreateOrderDto) => {
    return apiClient.post<Order>(endpoint, data);
  },

  update: (id: string, data: UpdateOrderDto) => {
    return apiClient.put<Order>(`${endpoint}/${id}`, data);
  },

  changeStatus: (id: string, data: ChangeStatusDto) => {
    return apiClient.post<Order>(`${endpoint}/${id}/status`, data);
  },

  addPayment: (id: string, data: AddPaymentDto) => {
    return apiClient.post<Order>(`${endpoint}/${id}/payments`, data);
  },

  linkRequest: (orderId: string, requestId: string) => {
    return apiClient.post<Order>(`${endpoint}/${orderId}/requests/${requestId}`);
  },

  unlinkRequest: (orderId: string, requestId: string) => {
    return apiClient.delete<Order>(`${endpoint}/${orderId}/requests/${requestId}`);
  },

  delete: (id: string) => {
    return apiClient.delete(`${endpoint}/${id}`);
  },

  getStats: (filialId?: string) => {
    const params = new URLSearchParams();
    if (filialId) params.set('filialId', filialId);
    const queryString = params.toString();
    return apiClient.get<OrderStats>(`${endpoint}/stats${queryString ? `?${queryString}` : ''}`);
  },
};

export type {
  Order,
  OrdersResponse,
  OrderFilters,
  OrderStats,
  CreateOrderDto,
  UpdateOrderDto,
  ChangeStatusDto,
  AddPaymentDto,
};
