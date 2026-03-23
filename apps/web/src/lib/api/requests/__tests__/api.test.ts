import { RequestStatus, RequestPriority } from '../types';

const mockFetch = jest.fn();

global.fetch = mockFetch;

jest.mock('@/lib/auth/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { requestsApi } from '../index';

describe('requestsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getList', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.getList();

      expect(apiClient.get).toHaveBeenCalledWith('/requests');
    });

    it('should include pagination parameters', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.getList({ page: 2, limit: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/requests?page=2&limit=10');
    });

    it('should include status filter', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.getList({ status: RequestStatus.NEW });

      expect(apiClient.get).toHaveBeenCalledWith('/requests?status=new');
    });

    it('should exclude "all" status filter', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.getList({ status: 'all' });

      expect(apiClient.get).toHaveBeenCalledWith('/requests');
    });

    it('should include search query', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.getList({ q: 'test search' });

      expect(apiClient.get).toHaveBeenCalledWith('/requests?q=test%20search');
    });

    it('should combine multiple filters', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.getList({
        status: RequestStatus.NEW,
        priority: RequestPriority.HIGH,
        q: 'test',
        page: 1,
        limit: 20,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/requests?page=1&limit=20&status=new&priority=high&q=test'
      );
    });

    it('should include date filters', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.getList({ dateFrom: '2026-01-01', dateTo: '2026-03-20' });

      expect(apiClient.get).toHaveBeenCalledWith('/requests?dateFrom=2026-01-01&dateTo=2026-03-20');
    });
  });

  describe('getById', () => {
    it('should call API with correct id', async () => {
      const mockResponse = {
        id: 'test-id',
        number: 'REQ-001',
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.getById('test-id');

      expect(apiClient.get).toHaveBeenCalledWith('/requests/test-id');
    });
  });

  describe('create', () => {
    it('should call API with POST method', async () => {
      const mockData = {
        clientId: 'client-1',
        points: [
          { type: 'pickup', sequence: 1, address: 'Address 1' },
          { type: 'delivery', sequence: 2, address: 'Address 2' },
        ],
      };

      const mockResponse = {
        id: 'new-id',
        number: 'REQ-002',
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.create(mockData);

      expect(apiClient.post).toHaveBeenCalledWith('/requests', mockData);
    });
  });

  describe('update', () => {
    it('should call API with PUT method and id', async () => {
      const mockData = {
        notes: 'Updated notes',
      };

      const mockResponse = {
        id: 'test-id',
        notes: 'Updated notes',
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.update('test-id', mockData);

      expect(apiClient.put).toHaveBeenCalledWith('/requests/test-id', mockData);
    });
  });

  describe('changeStatus', () => {
    it('should call POST method for status change', async () => {
      const mockData = {
        status: RequestStatus.CONFIRMED,
        comment: 'Confirmed by manager',
      };

      const mockResponse = {
        id: 'test-id',
        status: RequestStatus.CONFIRMED,
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.changeStatus('test-id', mockData);

      expect(apiClient.post).toHaveBeenCalledWith('/requests/test-id/status', mockData);
    });
  });

  describe('delete', () => {
    it('should call DELETE method', async () => {
      const mockResponse = {
        id: 'test-id',
        isActive: false,
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      await requestsApi.delete('test-id');

      expect(apiClient.delete).toHaveBeenCalledWith('/requests/test-id');
    });
  });

  describe('addComment', () => {
    it('should call POST with comment text', async () => {
      const { apiClient } = require('@/lib/auth/api');
      (apiClient.post as jest.Mock).mockResolvedValue({ id: 'comment-1' });

      await requestsApi.addComment('test-id', 'New comment');

      expect(apiClient.post).toHaveBeenCalledWith('/requests/test-id/comments', {
        text: 'New comment',
      });
    });
  });

  describe('addFlag', () => {
    it('should call POST with flag', async () => {
      const { apiClient } = require('@/lib/auth/api');
      (apiClient.post as jest.Mock).mockResolvedValue({ id: 'test-id' });

      await requestsApi.addFlag('test-id', 'urgent');

      expect(apiClient.post).toHaveBeenCalledWith('/requests/test-id/flags', {
        flag: 'urgent',
      });
    });
  });

  describe('removeFlag', () => {
    it('should call DELETE method with flag', async () => {
      const { apiClient } = require('@/lib/auth/api');
      (apiClient.delete as jest.Mock).mockResolvedValue({ id: 'test-id' });

      await requestsApi.removeFlag('test-id', 'urgent');

      expect(apiClient.delete).toHaveBeenCalledWith('/requests/test-id/flags/urgent');
    });
  });

  describe('setFlags', () => {
    it('should call PUT with flags array', async () => {
      const flags = ['urgent', 'express'];
      const { apiClient } = require('@/lib/auth/api');
      (apiClient.put as jest.Mock).mockResolvedValue({ id: 'test-id', flags });

      await requestsApi.setFlags('test-id', flags);

      expect(apiClient.put).toHaveBeenCalledWith('/requests/test-id/flags', { flags });
    });
  });

  describe('getStats', () => {
    it('should call stats endpoint', async () => {
      const mockResponse = {
        total: 100,
        byStatus: {
          new: 10,
          confirmed: 20,
          in_progress: 30,
          completed: 40,
        },
        byPriority: {
          normal: 60,
          high: 30,
          urgent: 10,
        },
      };

      const { apiClient } = require('@/lib/auth/api');
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await requestsApi.getStats();

      expect(apiClient.get).toHaveBeenCalledWith('/requests/stats');
      expect(result.total).toBe(100);
      expect(result.byStatus.new).toBe(10);
    });
  });
});
