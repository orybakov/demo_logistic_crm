import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { FilialsController } from "./filials.controller";
import { FilialsService } from "./filials.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Reflector } from "@nestjs/core";
import { RoleCode } from "@prisma/client";

describe("FilialsController", () => {
  let controller: FilialsController;
  let app: INestApplication;
  let filialsService: jest.Mocked<FilialsService>;

  const mockFilial = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    code: "MOSCOW",
    name: "Московский филиал",
    shortName: "Москва",
    address: "г. Москва, ул. Примерная, д. 1",
    phone: "+7 (495) 123-45-67",
    email: "moscow@example.com",
    isHead: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [
      {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      },
    ],
    usersCount: 5,
    clientsCount: 20,
    vehiclesCount: 10,
    driversCount: 15,
    contractsCount: 3,
    ordersCount: 100,
    requestsCount: 50,
    locationsCount: 2,
    warehousesCount: 1,
    tariffsCount: 5,
    recipientsCount: 10,
    _count: undefined,
  };

  const mockFilialListItem = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    code: "MOSCOW",
    name: "Московский филиал",
    shortName: "Москва",
    address: "г. Москва, ул. Примерная, д. 1",
    phone: "+7 (495) 123-45-67",
    email: "moscow@example.com",
    isHead: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    usersCount: 5,
    clientsCount: 20,
    vehiclesCount: 10,
    driversCount: 15,
    ordersCount: 100,
    requestsCount: 50,
    _count: undefined,
  };

  const mockFilialResponse = {
    total: 1,
    filials: [mockFilialListItem],
  };

  beforeEach(async () => {
    const mockFilialsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      toggleActive: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilialsController],
      providers: [
        {
          provide: FilialsService,
          useValue: mockFilialsService,
        },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FilialsController>(FilialsController);
    filialsService =
      mockFilialsService as unknown as jest.Mocked<FilialsService>;
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("GET /filials", () => {
    it("should return paginated list of filials", async () => {
      filialsService.findAll.mockResolvedValue(mockFilialResponse);

      const response = await request(app.getHttpServer())
        .get("/api/v1/filials")
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.filials).toHaveLength(1);
      expect(response.body.filials[0].code).toBe("MOSCOW");
    });

    it("should pass pagination parameters", async () => {
      filialsService.findAll.mockResolvedValue(mockFilialResponse);

      await request(app.getHttpServer())
        .get("/api/v1/filials?page=2&limit=20")
        .expect(200);

      expect(filialsService.findAll).toHaveBeenCalledWith({
        skip: 20,
        take: 20,
        search: undefined,
        isActive: undefined,
      });
    });

    it("should pass search query", async () => {
      filialsService.findAll.mockResolvedValue(mockFilialResponse);

      await request(app.getHttpServer())
        .get("/api/v1/filials?q=test")
        .expect(200);

      expect(filialsService.findAll).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        search: "test",
        isActive: undefined,
      });
    });

    it("should pass isActive filter", async () => {
      filialsService.findAll.mockResolvedValue(mockFilialResponse);

      await request(app.getHttpServer())
        .get("/api/v1/filials?isActive=true")
        .expect(200);

      expect(filialsService.findAll).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        search: undefined,
        isActive: true,
      });
    });

    it("should combine all filters", async () => {
      filialsService.findAll.mockResolvedValue(mockFilialResponse);

      await request(app.getHttpServer())
        .get("/api/v1/filials?page=1&limit=10&q=test&isActive=false")
        .expect(200);

      expect(filialsService.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        search: "test",
        isActive: false,
      });
    });

    it("should return empty list when no filials found", async () => {
      filialsService.findAll.mockResolvedValue({ total: 0, filials: [] });

      const response = await request(app.getHttpServer())
        .get("/api/v1/filials")
        .expect(200);

      expect(response.body.total).toBe(0);
      expect(response.body.filials).toHaveLength(0);
    });
  });

  describe("GET /filials/:id", () => {
    it("should return single filial", async () => {
      filialsService.findOne.mockResolvedValue(mockFilial);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/filials/${mockFilial.id}`)
        .expect(200);

      expect(response.body.id).toBe(mockFilial.id);
      expect(response.body.code).toBe("MOSCOW");
    });

    it("should return 404 when filial not found", async () => {
      filialsService.findOne.mockRejectedValue(
        new (require("@nestjs/common").NotFoundException)("Филиал не найден"),
      );

      await request(app.getHttpServer())
        .get(`/api/v1/filials/00000000-0000-0000-0000-000000000000`)
        .expect(404);
    });
  });

  describe("POST /filials", () => {
    it("should create new filial", async () => {
      const createDto = {
        name: "Санкт-Петербургский филиал",
        code: "SPB",
        shortName: "Санкт-Петербург",
        address: "г. Санкт-Петербург",
        phone: "+7 (812) 123-45-67",
        email: "spb@example.com",
        isHead: false,
        isActive: true,
      };

      const createdFilial = {
        ...createDto,
        id: "new-filial-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      filialsService.create.mockResolvedValue(createdFilial);

      const response = await request(app.getHttpServer())
        .post("/api/v1/filials")
        .send(createDto)
        .expect(201);

      expect(response.body.code).toBe("SPB");
      expect(response.body.name).toBe("Санкт-Петербургский филиал");
    });

    it("should return 409 when filial code already exists", async () => {
      const createDto = {
        name: "Московский филиал",
        code: "MOSCOW",
      };

      filialsService.create.mockRejectedValue(
        new (require("@nestjs/common").ConflictException)(
          "Филиал с таким кодом уже существует",
        ),
      );

      await request(app.getHttpServer())
        .post("/api/v1/filials")
        .send(createDto)
        .expect(409);
    });

    it("should return 400 for validation errors", async () => {
      const invalidDto = {
        name: "Test",
      };

      await request(app.getHttpServer())
        .post("/api/v1/filials")
        .send(invalidDto)
        .expect(400);
    });
  });

  describe("PUT /filials/:id", () => {
    it("should update filial", async () => {
      const updateDto = { name: "Обновленное название" };
      const updatedFilial = { ...mockFilial, name: "Обновленное название" };

      filialsService.update.mockResolvedValue(updatedFilial);

      const response = await request(app.getHttpServer())
        .put(`/api/v1/filials/${mockFilial.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe("Обновленное название");
    });

    it("should return 404 when filial not found", async () => {
      filialsService.update.mockRejectedValue(
        new (require("@nestjs/common").NotFoundException)("Филиал не найден"),
      );

      await request(app.getHttpServer())
        .put("/api/v1/filials/00000000-0000-0000-0000-000000000000")
        .send({ name: "Test" })
        .expect(404);
    });

    it("should return 409 when updating to existing code", async () => {
      filialsService.update.mockRejectedValue(
        new (require("@nestjs/common").ConflictException)(
          "Филиал с таким кодом уже существует",
        ),
      );

      await request(app.getHttpServer())
        .put(`/api/v1/filials/${mockFilial.id}`)
        .send({ code: "EXISTING" })
        .expect(409);
    });
  });

  describe("DELETE /filials/:id", () => {
    it("should soft delete filial", async () => {
      const deletedFilial = { ...mockFilial, isActive: false };
      filialsService.delete.mockResolvedValue(deletedFilial);

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/filials/${mockFilial.id}`)
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });

    it("should return 404 when filial not found", async () => {
      filialsService.delete.mockRejectedValue(
        new (require("@nestjs/common").NotFoundException)("Филиал не найден"),
      );

      await request(app.getHttpServer())
        .delete("/api/v1/filials/00000000-0000-0000-0000-000000000000")
        .expect(404);
    });
  });

  describe("PATCH /filials/:id/toggle", () => {
    it("should toggle filial active status", async () => {
      const toggledFilial = { ...mockFilial, isActive: false };
      filialsService.toggleActive.mockResolvedValue(toggledFilial);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/filials/${mockFilial.id}/toggle`)
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });

    it("should return 404 when filial not found", async () => {
      filialsService.toggleActive.mockRejectedValue(
        new (require("@nestjs/common").NotFoundException)("Филиал не найден"),
      );

      await request(app.getHttpServer())
        .patch("/api/v1/filials/00000000-0000-0000-0000-000000000000/toggle")
        .expect(404);
    });
  });
});
