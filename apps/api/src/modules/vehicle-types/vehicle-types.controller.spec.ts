import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from "@nestjs/common";
import * as request from "supertest";
import { Prisma } from "@prisma/client";
import { VehicleTypesController } from "./vehicle-types.controller";
import { VehicleTypesService } from "./vehicle-types.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Reflector } from "@nestjs/core";

describe("VehicleTypesController", () => {
  let controller: VehicleTypesController;
  let app: INestApplication;
  let vehicleTypesService: jest.Mocked<VehicleTypesService>;

  const mockVehicleType = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    code: "truck_20t",
    name: "Грузовик 20т",
    description: "Грузовой автомобиль грузоподъемностью до 20 тонн",
    category: "general",
    capacityKg: new Prisma.Decimal(20000),
    capacityM3: new Prisma.Decimal(80),
    hasTrailer: false,
    isActive: true,
    sortOrder: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVehicleTypesResponse = {
    total: 1,
    vehicleTypes: [mockVehicleType],
  };

  beforeEach(async () => {
    const mockVehicleTypesService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      toggleActive: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleTypesController],
      providers: [
        {
          provide: VehicleTypesService,
          useValue: mockVehicleTypesService,
        },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VehicleTypesController>(VehicleTypesController);
    vehicleTypesService = module.get(VehicleTypesService);
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: "1",
      prefix: "v",
    });
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("GET /vehicle-types", () => {
    it("should return paginated list of vehicle types", async () => {
      vehicleTypesService.findAll.mockResolvedValue(mockVehicleTypesResponse);

      const response = await request(app.getHttpServer())
        .get("/api/v1/vehicle-types")
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.vehicleTypes).toHaveLength(1);
      expect(response.body.vehicleTypes[0].code).toBe("truck_20t");
    });

    it("should pass pagination parameters", async () => {
      vehicleTypesService.findAll.mockResolvedValue(mockVehicleTypesResponse);

      await request(app.getHttpServer())
        .get("/api/v1/vehicle-types?page=1&limit=20")
        .expect(200);

      expect(vehicleTypesService.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        search: undefined,
        isActive: undefined,
      });
    });

    it("should pass search query", async () => {
      vehicleTypesService.findAll.mockResolvedValue(mockVehicleTypesResponse);

      await request(app.getHttpServer())
        .get(
          "/api/v1/vehicle-types?q=%D0%B3%D1%80%D1%83%D0%B7%D0%BE%D0%B2%D0%B8%D0%BA",
        )
        .expect(200);

      expect(vehicleTypesService.findAll).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        search: "грузовик",
        isActive: undefined,
      });
    });

    it("should pass isActive filter", async () => {
      vehicleTypesService.findAll.mockResolvedValue(mockVehicleTypesResponse);

      await request(app.getHttpServer())
        .get("/api/v1/vehicle-types?isActive=true")
        .expect(200);

      expect(vehicleTypesService.findAll).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        search: undefined,
        isActive: true,
      });
    });

    it("should return empty list when no vehicle types found", async () => {
      vehicleTypesService.findAll.mockResolvedValue({
        total: 0,
        vehicleTypes: [],
      });

      const response = await request(app.getHttpServer())
        .get("/api/v1/vehicle-types")
        .expect(200);

      expect(response.body.total).toBe(0);
      expect(response.body.vehicleTypes).toHaveLength(0);
    });
  });

  describe("GET /vehicle-types/:id", () => {
    it("should return single vehicle type", async () => {
      vehicleTypesService.findOne.mockResolvedValue(mockVehicleType);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/vehicle-types/${mockVehicleType.id}`)
        .expect(200);

      expect(response.body.id).toBe(mockVehicleType.id);
      expect(response.body.code).toBe("truck_20t");
    });

    it("should return 404 when vehicle type not found", async () => {
      vehicleTypesService.findOne.mockRejectedValue(
        new (require("@nestjs/common").NotFoundException)(
          "Тип транспортного средства не найден",
        ),
      );

      await request(app.getHttpServer())
        .get("/api/v1/vehicle-types/123e4567-e89b-12d3-a456-426614174999")
        .expect(404);
    });
  });

  describe("POST /vehicle-types", () => {
    it("should create new vehicle type", async () => {
      const createDto = {
        code: "van_10t",
        name: "Фургон 10т",
        description: "Фургон грузоподъемностью до 10 тонн",
        category: "cargo",
        capacityKg: 10000,
        capacityM3: 50,
        hasTrailer: false,
        isActive: true,
        sortOrder: 5,
      };

      const createdVehicleType = {
        ...createDto,
        id: "new-vehicle-type-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vehicleTypesService.create.mockResolvedValue({
        ...createdVehicleType,
        capacityKg: new Prisma.Decimal(10000),
        capacityM3: new Prisma.Decimal(50),
      });

      const response = await request(app.getHttpServer())
        .post("/api/v1/vehicle-types")
        .send(createDto)
        .expect(201);

      expect(response.body.code).toBe("van_10t");
      expect(response.body.name).toBe("Фургон 10т");
    });

    it("should return 409 when vehicle type code already exists", async () => {
      const createDto = {
        code: "truck_20t",
        name: "Грузовик 20т",
      };

      vehicleTypesService.create.mockRejectedValue(
        new (require("@nestjs/common").ConflictException)(
          "Тип транспортного средства с таким кодом уже существует",
        ),
      );

      await request(app.getHttpServer())
        .post("/api/v1/vehicle-types")
        .send(createDto)
        .expect(409);
    });

    it("should return 400 for validation errors", async () => {
      const invalidDto = {
        name: "Test",
      };

      await request(app.getHttpServer())
        .post("/api/v1/vehicle-types")
        .send(invalidDto)
        .expect(400);
    });
  });

  describe("PUT /vehicle-types/:id", () => {
    it("should update vehicle type", async () => {
      const updateDto = {
        name: "Обновленный грузовик 20т",
        capacityKg: 25000,
      };
      const updatedVehicleType = {
        ...mockVehicleType,
        ...updateDto,
        capacityKg: new Prisma.Decimal(25000),
      };

      vehicleTypesService.update.mockResolvedValue(updatedVehicleType);

      const response = await request(app.getHttpServer())
        .put(`/api/v1/vehicle-types/${mockVehicleType.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe("Обновленный грузовик 20т");
      expect(response.body.capacityKg).toBe("25000");
    });

    it("should return 404 when vehicle type not found", async () => {
      vehicleTypesService.update.mockRejectedValue(
        new (require("@nestjs/common").NotFoundException)(
          "Тип транспортного средства не найден",
        ),
      );

      await request(app.getHttpServer())
        .put("/api/v1/vehicle-types/123e4567-e89b-12d3-a456-426614174999")
        .send({ name: "Test" })
        .expect(404);
    });

    it("should return 409 when updating to existing code", async () => {
      vehicleTypesService.update.mockRejectedValue(
        new (require("@nestjs/common").ConflictException)(
          "Тип транспортного средства с таким кодом уже существует",
        ),
      );

      await request(app.getHttpServer())
        .put(`/api/v1/vehicle-types/${mockVehicleType.id}`)
        .send({ code: "EXISTING" })
        .expect(409);
    });
  });

  describe("DELETE /vehicle-types/:id", () => {
    it("should soft delete vehicle type", async () => {
      const deletedVehicleType = { ...mockVehicleType, isActive: false };
      vehicleTypesService.delete.mockResolvedValue(deletedVehicleType);

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/vehicle-types/${mockVehicleType.id}`)
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });

    it("should return 404 when vehicle type not found", async () => {
      vehicleTypesService.delete.mockRejectedValue(
        new (require("@nestjs/common").NotFoundException)(
          "Тип транспортного средства не найден",
        ),
      );

      await request(app.getHttpServer())
        .delete("/api/v1/vehicle-types/123e4567-e89b-12d3-a456-426614174999")
        .expect(404);
    });
  });

  describe("PATCH /vehicle-types/:id/toggle-active", () => {
    it("should toggle vehicle type active status", async () => {
      const toggledVehicleType = { ...mockVehicleType, isActive: false };
      vehicleTypesService.toggleActive.mockResolvedValue(toggledVehicleType);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/vehicle-types/${mockVehicleType.id}/toggle-active`)
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });

    it("should return 404 when vehicle type not found", async () => {
      vehicleTypesService.toggleActive.mockRejectedValue(
        new (require("@nestjs/common").NotFoundException)(
          "Тип транспортного средства не найден",
        ),
      );

      await request(app.getHttpServer())
        .patch(
          "/api/v1/vehicle-types/123e4567-e89b-12d3-a456-426614174999/toggle-active",
        )
        .expect(404);
    });
  });
});
