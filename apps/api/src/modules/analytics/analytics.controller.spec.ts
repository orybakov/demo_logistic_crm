import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

describe("AnalyticsController", () => {
  let app: INestApplication;
  let analyticsService: jest.Mocked<AnalyticsService>;

  beforeEach(async () => {
    const mockAnalyticsService = {
      getKpi: jest.fn(),
      getRequestsReport: jest.fn(),
      getOrdersReport: jest.fn(),
      exportRequests: jest.fn(),
      exportOrders: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    analyticsService =
      mockAnalyticsService as unknown as jest.Mocked<AnalyticsService>;
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns KPI data", async () => {
    analyticsService.getKpi.mockResolvedValue({
      period: { dateFrom: "2026-03-01", dateTo: "2026-03-21" },
      requests: {
        total: 1,
        byStatus: {},
        active: 1,
        completed: 0,
        cancelled: 0,
        completionRate: 0,
        linkedToOrders: 0,
      },
      orders: {
        total: 1,
        byStatus: {},
        totalAmount: 100,
        paidAmount: 0,
        unpaidAmount: 100,
        collectionRate: 0,
        averageCheck: 100,
        overdueCount: 0,
      },
    });

    await request(app.getHttpServer()).get("/api/v1/analytics/kpi").expect(200);

    expect(analyticsService.getKpi).toHaveBeenCalled();
  });

  it("returns request report data", async () => {
    analyticsService.getRequestsReport.mockResolvedValue({
      period: { dateFrom: "2026-03-01", dateTo: "2026-03-21" },
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
      rows: [],
      summary: {},
    });

    await request(app.getHttpServer())
      .get("/api/v1/analytics/reports/requests")
      .expect(200);

    expect(analyticsService.getRequestsReport).toHaveBeenCalled();
  });
});
