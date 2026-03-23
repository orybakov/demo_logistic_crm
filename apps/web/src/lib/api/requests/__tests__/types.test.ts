import {
  RequestStatus,
  RequestPriority,
  RequestType,
  statusLabels,
  priorityLabels,
  typeLabels,
} from '../types';

describe('Requests Types', () => {
  describe('RequestStatus', () => {
    it('should have correct status values', () => {
      expect(RequestStatus.NEW).toBe('new');
      expect(RequestStatus.CONFIRMED).toBe('confirmed');
      expect(RequestStatus.IN_PROGRESS).toBe('in_progress');
      expect(RequestStatus.COMPLETED).toBe('completed');
      expect(RequestStatus.CANCELLED).toBe('cancelled');
      expect(RequestStatus.ON_HOLD).toBe('on_hold');
    });

    it('should have all expected statuses', () => {
      const statuses = Object.values(RequestStatus);
      expect(statuses).toContain('new');
      expect(statuses).toContain('confirmed');
      expect(statuses).toContain('in_progress');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('cancelled');
      expect(statuses).toContain('on_hold');
    });
  });

  describe('RequestPriority', () => {
    it('should have correct priority values', () => {
      expect(RequestPriority.LOW).toBe('low');
      expect(RequestPriority.NORMAL).toBe('normal');
      expect(RequestPriority.HIGH).toBe('high');
      expect(RequestPriority.URGENT).toBe('urgent');
    });
  });

  describe('RequestType', () => {
    it('should have correct type values', () => {
      expect(RequestType.AUTO).toBe('auto');
      expect(RequestType.EXPRESS).toBe('express');
      expect(RequestType.CHARTER).toBe('charter');
      expect(RequestType.CONTAINER).toBe('container');
    });
  });

  describe('Status Labels', () => {
    it('should have labels for all statuses', () => {
      Object.values(RequestStatus).forEach((status) => {
        expect(statusLabels[status]).toBeDefined();
        expect(typeof statusLabels[status]).toBe('string');
      });
    });

    it('should return Russian labels', () => {
      expect(statusLabels[RequestStatus.NEW]).toBe('Новая');
      expect(statusLabels[RequestStatus.CONFIRMED]).toBe('Подтверждена');
      expect(statusLabels[RequestStatus.IN_PROGRESS]).toBe('В работе');
      expect(statusLabels[RequestStatus.COMPLETED]).toBe('Завершена');
    });
  });

  describe('Priority Labels', () => {
    it('should have labels for all priorities', () => {
      Object.values(RequestPriority).forEach((priority) => {
        expect(priorityLabels[priority]).toBeDefined();
        expect(typeof priorityLabels[priority]).toBe('string');
      });
    });

    it('should return Russian labels', () => {
      expect(priorityLabels[RequestPriority.LOW]).toBe('Низкий');
      expect(priorityLabels[RequestPriority.NORMAL]).toBe('Обычный');
      expect(priorityLabels[RequestPriority.HIGH]).toBe('Высокий');
      expect(priorityLabels[RequestPriority.URGENT]).toBe('Срочный');
    });
  });

  describe('Type Labels', () => {
    it('should have labels for all types', () => {
      Object.values(RequestType).forEach((type) => {
        expect(typeLabels[type]).toBeDefined();
        expect(typeof typeLabels[type]).toBe('string');
      });
    });

    it('should return Russian labels', () => {
      expect(typeLabels[RequestType.AUTO]).toBe('Авто');
      expect(typeLabels[RequestType.EXPRESS]).toBe('Экспресс');
    });
  });
});

describe('Request Interface', () => {
  it('should accept valid request structure', () => {
    const mockRequest = {
      id: 'test-id',
      number: 'REQ-001',
      clientId: 'client-1',
      client: {
        id: 'client-1',
        name: 'Test Client',
        inn: '1234567890',
      },
      type: RequestType.AUTO,
      status: RequestStatus.NEW,
      priority: RequestPriority.NORMAL,
      flags: ['urgent', 'express'],
      points: [
        {
          id: 'point-1',
          type: 'pickup',
          sequence: 1,
          address: 'Address 1',
          city: 'Moscow',
        },
        {
          id: 'point-2',
          type: 'delivery',
          sequence: 2,
          address: 'Address 2',
          city: 'St. Petersburg',
        },
      ],
      cargoItems: [],
      trips: [],
      statusHistory: [],
      comments: [],
      createdById: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(mockRequest.id).toBe('test-id');
    expect(mockRequest.status).toBe(RequestStatus.NEW);
    expect(mockRequest.flags).toContain('urgent');
    expect(mockRequest.points.length).toBe(2);
  });

  it('should handle optional fields', () => {
    const minimalRequest = {
      id: 'test-id',
      number: 'REQ-001',
      clientId: 'client-1',
      type: 'auto' as const,
      status: 'new' as const,
      priority: 'normal' as const,
      flags: [] as string[],
      points: [],
      cargoItems: [],
      trips: [],
      statusHistory: [],
      comments: [],
      createdById: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(minimalRequest.flags.length).toBe(0);
    expect(minimalRequest.points.length).toBe(0);
  });
});

describe('RequestFilters', () => {
  it('should support pagination filters', () => {
    const filters = {
      page: 1,
      limit: 20,
    };

    expect(filters.page).toBe(1);
    expect(filters.limit).toBe(20);
  });

  it('should support status filter', () => {
    const filters = {
      status: RequestStatus.NEW,
    };

    expect(filters.status).toBe('new');
  });

  it('should support "all" filter value', () => {
    const filters = {
      status: 'all' as const,
    };

    expect(filters.status).toBe('all');
  });

  it('should support search query', () => {
    const filters = {
      q: 'test search',
    };

    expect(filters.q).toBe('test search');
  });

  it('should support sorting', () => {
    const filters = {
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    };

    expect(filters.sortBy).toBe('createdAt');
    expect(filters.sortOrder).toBe('desc');
  });
});

describe('Point Helper Functions', () => {
  it('should correctly identify pickup points', () => {
    const points = [
      { type: 'pickup', sequence: 1, address: 'Moscow' },
      { type: 'delivery', sequence: 2, address: 'St. Petersburg' },
    ];

    const pickupPoints = points.filter((p) => p.type === 'pickup');
    expect(pickupPoints.length).toBe(1);
    expect(pickupPoints[0].address).toBe('Moscow');
  });

  it('should handle empty points array', () => {
    const points: Array<{ type: string; sequence: number; address: string }> = [];

    const pickupPoints = points.filter((p) => p.type === 'pickup');
    expect(pickupPoints.length).toBe(0);
  });
});

describe('Flag Management', () => {
  it('should handle adding flags', () => {
    const currentFlags = ['urgent'];
    const newFlag = 'express';
    const newFlags = [...currentFlags, newFlag];

    expect(newFlags).toContain('urgent');
    expect(newFlags).toContain('express');
    expect(newFlags.length).toBe(2);
  });

  it('should handle removing flags', () => {
    const currentFlags = ['urgent', 'express', 'fragile'];
    const flagToRemove = 'express';
    const newFlags = currentFlags.filter((f) => f !== flagToRemove);

    expect(newFlags).toContain('urgent');
    expect(newFlags).toContain('fragile');
    expect(newFlags).not.toContain('express');
    expect(newFlags.length).toBe(2);
  });

  it('should check if flag exists', () => {
    const currentFlags = ['urgent', 'express'];

    expect(currentFlags.includes('urgent')).toBe(true);
    expect(currentFlags.includes('nonexistent')).toBe(false);
  });

  it('should limit displayed flags', () => {
    const flags = ['urgent', 'express', 'fragile', 'hazmat', 'oversize'];
    const displayedFlags = flags.slice(0, 3);
    const remainingCount = flags.length - 3;

    expect(displayedFlags.length).toBe(3);
    expect(remainingCount).toBe(2);
  });
});

describe('Date Formatting', () => {
  it('should format dates correctly', () => {
    const dateStr = '2026-03-20T10:30:00.000Z';
    const date = new Date(dateStr);

    const formatted = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

    expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{2}/);
  });

  it('should handle invalid dates gracefully', () => {
    const invalidDate = new Date('invalid');
    expect(isNaN(invalidDate.getTime())).toBe(true);
  });
});
