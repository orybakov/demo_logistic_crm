import { MetricsService } from "./metrics.service";

describe("MetricsService", () => {
  const config = { get: jest.fn().mockReturnValue("development") } as any;
  const service = new MetricsService(config);

  it("records and exposes metrics", async () => {
    service.observeHttp("GET", "/health", 200, 0.01);
    const metrics = await service.getMetrics();
    expect(metrics).toContain("http_requests_total");
  });
});
