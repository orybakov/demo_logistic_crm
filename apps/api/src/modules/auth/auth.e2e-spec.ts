import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../database/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

describe("Auth and RBAC (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let config: ConfigService;
  let adminToken = "";
  let managerToken = "";
  let dispatcherToken = "";

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: "1",
      prefix: "v",
    });
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
    config = moduleRef.get(ConfigService);

    const login = async (email: string, password: string) => {
      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email, password })
        .expect(200);
      return res.body.accessToken as string;
    };

    adminToken = await login("admin@logistics.local", "password123");
    managerToken = await login("manager@logistics.local", "password123");
    dispatcherToken = await login("dispatcher@logistics.local", "password123");
  });

  afterAll(async () => {
    await app.close();
  });

  it("allows admin access to admin endpoints", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
  });

  it("blocks non-admin access to admin endpoints", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${dispatcherToken}`)
      .expect(403);
  });

  it("allows managers to read admin users but not create them", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${managerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        email: "manager-blocked@example.com",
        password: "password123",
        firstName: "Blocked",
        lastName: "User",
      })
      .expect(403);
  });

  it("exposes liveness without auth", async () => {
    await request(app.getHttpServer()).get("/api/v1/health/live").expect(200);
  });
});
