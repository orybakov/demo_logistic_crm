import { AnalyticsService } from "./analytics.service";

describe("AnalyticsService", () => {
  const prisma = {
    request: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  } as any;

  const service = new AnalyticsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds KPI aggregates from prisma counts", async () => {
    prisma.request.count.mockResolvedValueOnce(10);
    prisma.request.groupBy.mockResolvedValueOnce([
      { status: "completed", _count: 4 },
      { status: "cancelled", _count: 1 },
      { status: "in_progress", _count: 5 },
    ]);
    prisma.request.count.mockResolvedValueOnce(6);
    prisma.order.count.mockResolvedValueOnce(8);
    prisma.order.groupBy.mockResolvedValueOnce([
      { status: "paid", _count: 3 },
      { status: "draft", _count: 5 },
    ]);
    prisma.order.aggregate.mockResolvedValueOnce({
      _sum: { total: 1000, paidAmount: 600 },
    });
    prisma.order.count.mockResolvedValueOnce(2);

    const result = await service.getKpi({
      dateFrom: "2026-03-01",
      dateTo: "2026-03-21",
    });

    expect(result.requests.total).toBe(10);
    expect(result.requests.completed).toBe(4);
    expect(result.requests.completionRate).toBe(40);
    expect(result.orders.totalAmount).toBe(1000);
    expect(result.orders.collectionRate).toBe(60);
  });

  it("returns request reports with normalized rows", async () => {
    prisma.request.count.mockResolvedValueOnce(1);
    prisma.request.findMany.mockResolvedValueOnce([
      {
        id: "1",
        number: "REQ-1",
        status: "new",
        priority: "normal",
        createdAt: new Date("2026-03-01T00:00:00Z"),
        completedAt: null,
        order: null,
        client: { name: "Client" },
        filial: { name: "Filial" },
        assignedTo: { firstName: "Ann", lastName: "Lee" },
        _count: { trips: 2 },
      },
    ]);
    prisma.request.groupBy.mockResolvedValueOnce([
      { status: "new", _count: 1 },
    ]);
    prisma.request.count.mockResolvedValueOnce(0);

    const result = await service.getRequestsReport({
      dateFrom: "2026-03-01",
      dateTo: "2026-03-21",
    });

    expect(result.total).toBe(1);
    expect(result.rows[0].assignedToName).toBe("Ann Lee");
    expect(result.summary.new).toBe(1);
  });
});
