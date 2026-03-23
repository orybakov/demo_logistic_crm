import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

describe("DocumentsController", () => {
  let app: INestApplication;
  const service = {
    list: jest.fn(),
    upload: jest.fn(),
    findOne: jest.fn(),
    updateMetadata: jest.fn(),
    remove: jest.fn(),
    streamFile: jest.fn(),
  } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [{ provide: DocumentsService, useValue: service }],
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
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it("lists files", async () => {
    service.list.mockResolvedValue({ total: 0, files: [] });
    await request(app.getHttpServer())
      .get(
        "/api/v1/documents?entityType=request&entityId=123e4567-e89b-12d3-a456-426614174000",
      )
      .expect(200);
  });
});
