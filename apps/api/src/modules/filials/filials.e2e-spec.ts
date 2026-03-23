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
import { RoleCode } from "@prisma/client";

describe("Filials (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let dispatcherToken: string;

  const testUser = {
    email: "admin@test.com",
    password: "password123",
    firstName: "Admin",
    lastName: "User",
  };

  const testFilial = {
    code: "TEST",
    name: "Тестовый филиал",
    shortName: "Тест",
    address: "г. Тестовый",
    phone: "+7 (999) 123-45-67",
    email: "test@filial.com",
    isHead: false,
    isActive: true,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: "1",
      prefix: "v",
    });
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    const configService = moduleFixture.get<ConfigService>(ConfigService);

    let adminUser = await prismaService.user.findUnique({
      where: { email: testUser.email },
    });

    if (!adminUser) {
      const bcrypt = require("bcrypt");
      const passwordHash = await bcrypt.hash(testUser.password, 10);

      const adminRole = await prismaService.role.findFirst({
        where: { code: RoleCode.ADMIN },
      });

      if (!adminRole) {
        throw new Error("Admin role not found");
      }

      await prismaService.user.create({
        data: {
          email: testUser.email,
          passwordHash,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          roles: {
            create: {
              roleId: adminRole.id,
            },
          },
        },
      });

      adminUser = await prismaService.user.findUnique({
        where: { email: testUser.email },
      });

      if (!adminUser) {
        throw new Error("Admin user not found after creation");
      }
    }

    adminToken = jwtService.sign(
      {
        sub: adminUser.id,
        email: testUser.email,
      },
      { secret: configService.get<string>("jwt.secret"), expiresIn: "15m" },
    );

    dispatcherToken = jwtService.sign(
      {
        sub: adminUser.id,
        email: testUser.email,
      },
      { secret: configService.get<string>("jwt.secret"), expiresIn: "15m" },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/v1/filials (GET)", () => {
    it("should return 401 without authentication", async () => {
      await request(app.getHttpServer()).get("/v1/filials").expect(401);
    });

    it("should return paginated filials with valid token", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/filials")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("filials");
      expect(Array.isArray(response.body.filials)).toBe(true);
    });

    it("should support pagination", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/filials?page=1&limit=5")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("total");
    });

    it("should support search query", async () => {
      await request(app.getHttpServer())
        .get("/v1/filials?q=test")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
    });

    it("should support isActive filter", async () => {
      await request(app.getHttpServer())
        .get("/v1/filials?isActive=true")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe("/v1/filials (POST)", () => {
    let createdFilialId: string;

    afterAll(async () => {
      if (createdFilialId) {
        await prismaService.filial.delete({ where: { id: createdFilialId } });
      }
    });

    it("should create a new filial", async () => {
      const response = await request(app.getHttpServer())
        .post("/v1/filials")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(testFilial)
        .expect(201);

      expect(response.body.code).toBe(testFilial.code);
      expect(response.body.name).toBe(testFilial.name);
      expect(response.body).toHaveProperty("id");

      createdFilialId = response.body.id;
    });

    it("should return 409 when creating filial with duplicate code", async () => {
      await request(app.getHttpServer())
        .post("/v1/filials")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(testFilial)
        .expect(409);
    });

    it("should return 401 without authentication", async () => {
      await request(app.getHttpServer())
        .post("/v1/filials")
        .send(testFilial)
        .expect(401);
    });

    it("should return 400 for invalid data", async () => {
      await request(app.getHttpServer())
        .post("/v1/filials")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test" })
        .expect(400);
    });
  });

  describe("/v1/filials/:id (GET)", () => {
    let testFilialId: string;

    beforeAll(async () => {
      const filial = await prismaService.filial.create({
        data: testFilial,
      });
      testFilialId = filial.id;
    });

    afterAll(async () => {
      if (testFilialId) {
        await prismaService.filial.delete({ where: { id: testFilialId } });
      }
    });

    it("should return filial by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/filials/${testFilialId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testFilialId);
      expect(response.body.code).toBe(testFilial.code);
    });

    it("should return 404 for non-existent filial", async () => {
      await request(app.getHttpServer())
        .get("/v1/filials/123e4567-e89b-12d3-a456-426614174999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("/v1/filials/:id (PUT)", () => {
    let testFilialId: string;

    beforeAll(async () => {
      const filial = await prismaService.filial.create({
        data: testFilial,
      });
      testFilialId = filial.id;
    });

    afterAll(async () => {
      if (testFilialId) {
        await prismaService.filial.delete({ where: { id: testFilialId } });
      }
    });

    it("should update filial", async () => {
      const updateData = {
        name: "Обновленный филиал",
        shortName: "Обновленный",
      };

      const response = await request(app.getHttpServer())
        .put(`/v1/filials/${testFilialId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.shortName).toBe(updateData.shortName);
    });

    it("should return 404 for non-existent filial", async () => {
      await request(app.getHttpServer())
        .put("/v1/filials/123e4567-e89b-12d3-a456-426614174999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test" })
        .expect(404);
    });
  });

  describe("/v1/filials/:id (DELETE)", () => {
    let testFilialId: string;

    beforeEach(async () => {
      const filial = await prismaService.filial.create({
        data: { ...testFilial, code: `DELETE_${Date.now()}` },
      });
      testFilialId = filial.id;
    });

    it("should soft delete filial", async () => {
      const response = await request(app.getHttpServer())
        .delete(`/v1/filials/${testFilialId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.isActive).toBe(false);

      const deletedFilial = await prismaService.filial.findUnique({
        where: { id: testFilialId },
      });
      expect(deletedFilial?.isActive).toBe(false);
    });

    it("should return 404 for non-existent filial", async () => {
      await request(app.getHttpServer())
        .delete("/v1/filials/123e4567-e89b-12d3-a456-426614174999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("/v1/filials/:id/toggle (PATCH)", () => {
    let testFilialId: string;

    beforeEach(async () => {
      const filial = await prismaService.filial.create({
        data: { ...testFilial, code: `TOGGLE_${Date.now()}`, isActive: true },
      });
      testFilialId = filial.id;
    });

    it("should toggle filial active status", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/filials/${testFilialId}/toggle`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("isActive");
    });

    it("should return 404 for non-existent filial", async () => {
      await request(app.getHttpServer())
        .patch("/v1/filials/123e4567-e89b-12d3-a456-426614174999/toggle")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("CRUD Workflow", () => {
    let filialId: string;

    it("should perform full CRUD workflow", async () => {
      const createDto = {
        code: `CRUD_${Date.now()}`,
        name: "CRUD Тест",
        shortName: "CRUD",
        isActive: true,
      };

      const createResponse = await request(app.getHttpServer())
        .post("/v1/filials")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(createDto)
        .expect(201);

      filialId = createResponse.body.id;
      expect(createResponse.body.code).toBe(createDto.code);

      const readResponse = await request(app.getHttpServer())
        .get(`/v1/filials/${filialId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(readResponse.body.id).toBe(filialId);

      const updateDto = {
        name: "Обновленный CRUD Тест",
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/v1/filials/${filialId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200);

      expect(updateResponse.body.name).toBe(updateDto.name);

      await request(app.getHttpServer())
        .delete(`/v1/filials/${filialId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const deletedFilial = await prismaService.filial.findUnique({
        where: { id: filialId },
      });
      expect(deletedFilial?.isActive).toBe(false);
    });

    afterAll(async () => {
      if (filialId) {
        await prismaService.filial.delete({ where: { id: filialId } });
      }
    });
  });
});
