import { apiClient } from '@/lib/auth/api';
import type {
  DocumentEntityType,
  DocumentListResponse,
  DocumentMetadataDto,
  DocumentUploadDto,
} from './types';

const endpoint = '/documents';

async function authFetch(path: string, options: RequestInit = {}) {
  const token = apiClient.getAccessToken();
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${path}`,
    {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Ошибка документов');
  }

  return response;
}

export const documentsApi = {
  list: (
    entityType: DocumentEntityType,
    entityId: string,
    params?: { q?: string; page?: number; take?: number }
  ) => {
    const search = new URLSearchParams({ entityType, entityId });
    if (params?.q) search.set('q', params.q);
    if (params?.page) search.set('page', String(params.page));
    if (params?.take) search.set('take', String(params.take));
    return apiClient.get<DocumentListResponse>(`${endpoint}?${search.toString()}`);
  },

  upload: async (file: File, dto: DocumentUploadDto) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, String(value));
    });
    const token = apiClient.getAccessToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${endpoint}/upload`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      }
    );
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || 'Ошибка загрузки');
    }
    return response.json();
  },

  update: (id: string, dto: DocumentMetadataDto) => apiClient.put(`${endpoint}/${id}`, dto),
  delete: (id: string) => apiClient.delete(`${endpoint}/${id}`),
  get: (id: string) => apiClient.get(`${endpoint}/${id}`),
  downloadBlob: async (id: string) => (await authFetch(`${endpoint}/${id}/download`)).blob(),
  previewBlob: async (id: string) => (await authFetch(`${endpoint}/${id}/preview`)).blob(),
  downloadUrl: (id: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${endpoint}/${id}/download`,
  previewUrl: (id: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${endpoint}/${id}/preview`,
};
