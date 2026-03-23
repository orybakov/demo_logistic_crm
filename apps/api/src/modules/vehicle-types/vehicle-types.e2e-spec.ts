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

describe("VehicleTypes (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;

  const testVehicleType = {
    code: "e2e_truck",
    name: "E2E Тестовый грузовик",
    description: "Тестовый грузовик для e2e тестирования",
    category: "cargo",
    capacityKg: 15000,
    capacityM3: 60,
    hasTrailer: false,
    isActive: true,
    sortOrder: 20,
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

    const testUser = await prismaService.user.findFirst({
      where: {
        roles: {
          some: {
            role: {
              code: "ADMIN",
            },
          },
        },
      },
    });

    if (testUser) {
      adminToken = jwtService.sign(
        { sub: testUser.id, email: testUser.email },
        { secret: configService.get<string>("jwt.secret"), expiresIn: "15m" },
      );
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/v1/vehicle-types (GET)", () => {
    it("should return 401 without authentication", async () => {
      await request(app.getHttpServer()).get("/v1/vehicle-types").expect(401);
    });

    it("should return paginated vehicle types with valid token", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/vehicle-types")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("vehicleTypes");
      expect(Array.isArray(response.body.vehicleTypes)).toBe(true);
    });

    it("should support pagination", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/vehicle-types?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("total");
    });

    it("should support search query", async () => {
      await request(app.getHttpServer())
        .get(
          "/v1/vehicle-types?q=%D0%B3%D1%80%D1%83%D0%B7%D0%BE%D0%B2%D0%B8%D0%BA",
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
    });

    it("should support isActive filter", async () => {
      await request(app.getHttpServer())
        .get("/v1/vehicle-types?isActive=true")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe("/v1/vehicle-types (POST)", () => {
    let createdVehicleTypeId: string;

    afterAll(async () => {
      if (createdVehicleTypeId) {
        await prismaService.vehicleType.delete({
          where: { id: createdVehicleTypeId },
        });
      }
    });

    it("should create a new vehicle type", async () => {
      const createDto = {
        code: `e2e_van_${Date.now()}`,
        name: "E2E Тестовый фургон",
        description: "Тестовый фургон для e2e тестирования",
        category: "cargo",
        capacityKg: 10000,
        capacityM3: 50,
        hasTrailer: false,
        isActive: true,
        sortOrder: 15,
      };

      const response = await request(app.getHttpServer())
        .post("/v1/vehicle-types")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.code).toBe(createDto.code);
      expect(response.body.name).toBe(createDto.name);
      expect(response.body).toHaveProperty("id");

      createdVehicleTypeId = response.body.id;
    });

    it("should return 409 when creating vehicle type with duplicate code", async () => {
      const duplicateDto = {
        code: `e2e_duplicate_${Date.now()}`,
        name: "Тест",
      };

      await request(app.getHttpServer())
        .post("/v1/vehicle-types")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(duplicateDto)
        .expect(201);

      await request(app.getHttpServer())
        .post("/v1/vehicle-types")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(duplicateDto)
        .expect(409);
    });

    it("should return 401 without authentication", async () => {
      await request(app.getHttpServer())
        .post("/v1/vehicle-types")
        .send(testVehicleType)
        .expect(401);
    });

    it("should return 400 for invalid data", async () => {
      await request(app.getHttpServer())
        .post("/v1/vehicle-types")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test" })
        .expect(400);
    });
  });

  describe("/v1/vehicle-types/:id (GET)", () => {
    let testVehicleTypeId: string;

    beforeAll(async () => {
      const vehicleType = await prismaService.vehicleType.create({
        data: testVehicleType,
      });
      testVehicleTypeId = vehicleType.id;
    });

    afterAll(async () => {
      if (testVehicleTypeId) {
        await prismaService.vehicleType.delete({
          where: { id: testVehicleTypeId },
        });
      }
    });

    it("should return vehicle type by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/vehicle-types/${testVehicleTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testVehicleTypeId);
      expect(response.body.code).toBe(testVehicleType.code);
    });

    it("should return 404 for non-existent vehicle type", async () => {
      await request(app.getHttpServer())
        .get("/v1/vehicle-types/123e4567-e89b-12d3-a456-426614174999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("/v1/vehicle-types/:id (PUT)", () => {
    let testVehicleTypeId: string;

    beforeAll(async () => {
      const vehicleType = await prismaService.vehicleType.create({
        data: { ...testVehicleType, code: `e2e_update_${Date.now()}` },
      });
      testVehicleTypeId = vehicleType.id;
    });

    afterAll(async () => {
      if (testVehicleTypeId) {
        await prismaService.vehicleType.delete({
          where: { id: testVehicleTypeId },
        });
      }
    });

    it("should update vehicle type", async () => {
      const updateData = {
        name: "Обновленный грузовик",
        capacityKg: 18000,
      };

      const response = await request(app.getHttpServer())
        .put(`/v1/vehicle-types/${testVehicleTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.capacityKg).toBe(String(updateData.capacityKg));
    });

    it("should return 404 for non-existent vehicle type", async () => {
      await request(app.getHttpServer())
        .put("/v1/vehicle-types/123e4567-e89b-12d3-a456-426614174999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test" })
        .expect(404);
    });
  });

  describe("/v1/vehicle-types/:id (DELETE)", () => {
    let testVehicleTypeId: string;

    beforeEach(async () => {
      const vehicleType = await prismaService.vehicleType.create({
        data: { ...testVehicleType, code: `e2e_delete_${Date.now()}` },
      });
      testVehicleTypeId = vehicleType.id;
    });

    it("should soft delete vehicle type", async () => {
      const response = await request(app.getHttpServer())
        .delete(`/v1/vehicle-types/${testVehicleTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.isActive).toBe(false);

      const deletedVehicleType = await prismaService.vehicleType.findUnique({
        where: { id: testVehicleTypeId },
      });
      expect(deletedVehicleType?.isActive).toBe(false);
    });

    it("should return 404 for non-existent vehicle type", async () => {
      await request(app.getHttpServer())
        .delete("/v1/vehicle-types/123e4567-e89b-12d3-a456-426614174999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("/v1/vehicle-types/:id/toggle-active (PATCH)", () => {
    let testVehicleTypeId: string;

    beforeEach(async () => {
      const vehicleType = await prismaService.vehicleType.create({
        data: {
          ...testVehicleType,
          code: `e2e_toggle_${Date.now()}`,
          isActive: true,
        },
      });
      testVehicleTypeId = vehicleType.id;
    });

    it("should toggle vehicle type active status", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/vehicle-types/${testVehicleTypeId}/toggle-active`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("isActive");
    });

    it("should return 404 for non-existent vehicle type", async () => {
      await request(app.getHttpServer())
        .patch(
          "/v1/vehicle-types/123e4567-e89b-12d3-a456-426614174999/toggle-active",
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("CRUD Workflow", () => {
    let vehicleTypeId: string;

    it("should perform full CRUD workflow", async () => {
      const createDto = {
        code: `e2e_crud_${Date.now()}`,
        name: "E2E CRUD Тест",
        description: "CRUD тестирование",
        category: "cargo",
        capacityKg: 12000,
        capacityM3: 55,
        hasTrailer: false,
        isActive: true,
        sortOrder: 25,
      };

      const createResponse = await request(app.getHttpServer())
        .post("/v1/vehicle-types")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(createDto)
        .expect(201);

      vehicleTypeId = createResponse.body.id;
      expect(createResponse.body.code).toBe(createDto.code);

      const readResponse = await request(app.getHttpServer())
        .get(`/v1/vehicle-types/${vehicleTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(readResponse.body.id).toBe(vehicleTypeId);

      const updateDto = {
        name: "Обновленный E2E CRUD Тест",
        capacityKg: 14000,
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/v1/vehicle-types/${vehicleTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200);

      expect(updateResponse.body.name).toBe(updateDto.name);
      expect(updateResponse.body.capacityKg).toBe(String(updateDto.capacityKg));

      await request(app.getHttpServer())
        .delete(`/v1/vehicle-types/${vehicleTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const deletedVehicleType = await prismaService.vehicleType.findUnique({
        where: { id: vehicleTypeId },
      });
      expect(deletedVehicleType?.isActive).toBe(false);
    });

    afterAll(async () => {
      if (vehicleTypeId) {
        await prismaService.vehicleType.delete({
          where: { id: vehicleTypeId },
        });
      }
    });
  });
});
