import { Test, type TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { HealthController } from "./health.controller";
import { PrismaService } from "../../database/prisma.service";
import { MetricsService } from "../../common/observability";

describe("HealthController", () => {
  let app: INestApplication;
  const prisma = { $queryRaw: jest.fn() } as any;
  const metrics = {
    setDatabaseReady: jest.fn(),
    getMetrics: jest.fn().mockResolvedValue("metrics"),
    observeHttp: jest.fn(),
  } as any;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: MetricsService, useValue: metrics },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it("returns health payload", async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);

    const res = await request(app.getHttpServer())
      .get("/api/v1/health")
      .expect(200);
    expect(res.body.status).toBe("ok");
    expect(metrics.setDatabaseReady).toHaveBeenCalledWith(true);
  });

  it("returns readiness payload", async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);

    const res = await request(app.getHttpServer())
      .get("/api/v1/health/ready")
      .expect(200);
    expect(res.body.status).toBe("ready");
  });

  it("returns metrics text", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/health/metrics")
      .expect(200);
    expect(res.text).toBe("metrics");
  });
});
