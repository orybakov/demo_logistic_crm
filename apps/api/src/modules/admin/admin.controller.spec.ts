import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

describe("AdminController", () => {
  let app: INestApplication;
  const service = {
    getUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    updateUserPassword: jest.fn(),
    assignUserRoles: jest.fn(),
    deleteUser: jest.fn(),
    getRoles: jest.fn(),
    updateRole: jest.fn(),
    getAuditLogs: jest.fn(),
    getSettings: jest.fn(),
    updateSetting: jest.fn(),
    getReferenceCatalog: jest.fn(),
  } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: service }],
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

  it("gets users", async () => {
    service.getUsers.mockResolvedValue({ total: 0, users: [] });
    await request(app.getHttpServer()).get("/api/v1/admin/users").expect(200);
    expect(service.getUsers).toHaveBeenCalled();
  });
});
