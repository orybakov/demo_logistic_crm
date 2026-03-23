import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { Reflector } from "@nestjs/core";
import { RoleCode } from "@prisma/client";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

describe("AdminController (integration)", () => {
  let app: INestApplication;
  let currentUser: any;

  const service = {
    getUsers: jest.fn().mockResolvedValue({ total: 0, users: [] }),
    createUser: jest.fn().mockResolvedValue({ id: "user-1" }),
    updateUser: jest.fn().mockResolvedValue({ id: "user-1" }),
    updateUserPassword: jest.fn().mockResolvedValue({ success: true }),
    assignUserRoles: jest.fn().mockResolvedValue({ id: "user-1" }),
    deleteUser: jest.fn().mockResolvedValue({ success: true }),
    getRoles: jest.fn().mockResolvedValue({ roles: [], permissions: [] }),
    updateRole: jest.fn().mockResolvedValue({ code: RoleCode.ADMIN }),
    getAuditLogs: jest.fn().mockResolvedValue({ total: 0, logs: [] }),
    getSettings: jest.fn().mockResolvedValue({ settings: [] }),
    updateSetting: jest.fn().mockResolvedValue({ key: "ops.swagger" }),
    getReferenceCatalog: jest.fn().mockReturnValue({ sections: [] }),
  } as any;

  beforeEach(async () => {
    currentUser = {
      id: "user-id",
      isSuperadmin: false,
      roles: [RoleCode.ADMIN],
      permissions: [],
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: service },
        RolesGuard,
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          context.switchToHttp().getRequest().user = currentUser;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it("allows admins to list users", async () => {
    await request(app.getHttpServer()).get("/api/v1/admin/users").expect(200);
    expect(service.getUsers).toHaveBeenCalled();
  });

  it("blocks managers from creating users", async () => {
    currentUser.roles = [RoleCode.MANAGER];

    await request(app.getHttpServer())
      .post("/api/v1/admin/users")
      .send({
        email: "new@test.com",
        password: "password123",
        firstName: "New",
        lastName: "User",
      })
      .expect(403);
  });

  it("rejects invalid user ids before hitting service", async () => {
    await request(app.getHttpServer())
      .put("/api/v1/admin/users/not-a-uuid")
      .send({ firstName: "Updated" })
      .expect(400);
    expect(service.updateUser).not.toHaveBeenCalled();
  });
});
