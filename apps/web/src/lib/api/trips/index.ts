import { apiClient } from '@/lib/auth/api';
import type {
  Trip,
  TripComment,
  TripsResponse,
  TripStats,
  TripFilters,
  TripCommentsResponse,
  ScheduleSlot,
  ScheduleFilters,
  CreateTripDto,
  UpdateTripDto,
  AssignResourcesDto,
  CompleteTripDto,
  ChangeStatusDto,
  AddCommentDto,
  UpdateCheckpointDto,
  AvailableResources,
} from './types';

const endpoint = '/trips';

export const tripsApi = {
  getList: (filters?: TripFilters) => {
    const params = new URLSearchParams();

    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.requestId) params.set('requestId', filters.requestId);
    if (filters?.vehicleId) params.set('vehicleId', filters.vehicleId);
    if (filters?.driverId) params.set('driverId', filters.driverId);
    if (filters?.filialId) params.set('filialId', filters.filialId);
    if (filters?.q) params.set('q', filters.q);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    return apiClient.get<TripsResponse>(`${endpoint}${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) => {
    return apiClient.get<Trip>(`${endpoint}/${id}`);
  },

  getComments: (id: string, page = 1, limit = 100) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    return apiClient.get<TripCommentsResponse>(`${endpoint}/${id}/comments?${params.toString()}`);
  },

  getStats: () => {
    return apiClient.get<TripStats>(`${endpoint}/stats`);
  },

  create: (data: CreateTripDto) => {
    return apiClient.post<Trip>(endpoint, data);
  },

  update: (id: string, data: UpdateTripDto) => {
    return apiClient.put<Trip>(`${endpoint}/${id}`, data);
  },

  assignResources: (id: string, data: AssignResourcesDto) => {
    return apiClient.put<Trip>(`${endpoint}/${id}/assign`, data);
  },

  changeStatus: (id: string, data: ChangeStatusDto) => {
    return apiClient.put<Trip>(`${endpoint}/${id}/status`, data);
  },

  start: (id: string) => {
    return apiClient.put<Trip>(`${endpoint}/${id}/start`, {});
  },

  complete: (id: string, data: CompleteTripDto) => {
    return apiClient.put<Trip>(`${endpoint}/${id}/complete`, data);
  },

  cancel: (id: string, reason: string) => {
    return apiClient.put<Trip>(`${endpoint}/${id}/cancel`, { cancellationReason: reason });
  },

  updateCheckpoint: (tripId: string, checkpointId: string, data: UpdateCheckpointDto) => {
    return apiClient.put(`${endpoint}/${tripId}/checkpoints/${checkpointId}`, data);
  },

  linkRequest: (tripId: string, requestId: string) => {
    return apiClient.post<Trip>(`${endpoint}/${tripId}/link-request`, { requestId });
  },

  unlinkRequest: (tripId: string) => {
    return apiClient.delete(`${endpoint}/${tripId}/link-request`);
  },

  addComment: (tripId: string, data: AddCommentDto) => {
    return apiClient.post<TripComment>(`${endpoint}/${tripId}/comments`, data);
  },

  delete: (id: string) => {
    return apiClient.delete(`${endpoint}/${id}`);
  },

  getSchedule: (filters?: ScheduleFilters) => {
    const params = new URLSearchParams();

    if (filters?.year) params.set('year', filters.year.toString());
    if (filters?.month) params.set('month', filters.month.toString());
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.vehicleId) params.set('vehicleId', filters.vehicleId);
    if (filters?.driverId) params.set('driverId', filters.driverId);
    if (filters?.type) params.set('type', filters.type);

    const queryString = params.toString();
    return apiClient.get<ScheduleSlot[]>(
      `${endpoint}/schedule${queryString ? `?${queryString}` : ''}`
    );
  },

  getAvailableResources: (dateFrom: string, dateTo: string, excludeTripId?: string) => {
    const params = new URLSearchParams();
    params.set('dateFrom', dateFrom);
    params.set('dateTo', dateTo);
    if (excludeTripId) params.set('excludeTripId', excludeTripId);
    return apiClient.get<AvailableResources>(
      `${endpoint}/available-resources?${params.toString()}`
    );
  },
};

export type {
  Trip,
  TripComment,
  TripCommentsResponse,
  TripsResponse,
  TripStats,
  TripFilters,
  ScheduleSlot,
  ScheduleFilters,
  CreateTripDto,
  UpdateTripDto,
  AssignResourcesDto,
  CompleteTripDto,
  ChangeStatusDto,
  AddCommentDto,
  UpdateCheckpointDto,
  AvailableResources,
};
