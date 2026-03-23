import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { FilialsService } from "./filials.service";
import { PrismaService } from "../../database/prisma.service";

describe("FilialsService", () => {
  let service: FilialsService;
  let mockPrismaService: any;

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
    _count: {
      users: 5,
      clients: 20,
      vehicles: 10,
      drivers: 15,
      orders: 100,
      requests: 50,
    },
  };

  beforeEach(async () => {
    mockPrismaService = {
      filial: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilialsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FilialsService>(FilialsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return paginated filials", async () => {
      const filials = [
        {
          ...mockFilial,
          usersCount: 5,
          clientsCount: 20,
          vehiclesCount: 10,
          driversCount: 15,
          ordersCount: 100,
          requestsCount: 50,
          _count: undefined,
        },
      ];

      mockPrismaService.filial.count.mockResolvedValue(1);
      mockPrismaService.filial.findMany.mockResolvedValue([mockFilial]);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result.total).toBe(1);
      expect(result.filials).toEqual(filials);
      expect(mockPrismaService.filial.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              vehicles: true,
              drivers: true,
              orders: true,
              requests: true,
            },
          },
        },
      });
    });

    it("should filter by search query", async () => {
      mockPrismaService.filial.count.mockResolvedValue(0);
      mockPrismaService.filial.findMany.mockResolvedValue([]);

      await service.findAll({ search: "Москва" });

      expect(mockPrismaService.filial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "Москва", mode: "insensitive" } },
              { code: { contains: "Москва", mode: "insensitive" } },
            ],
          },
        }),
      );
    });

    it("should filter by isActive status", async () => {
      mockPrismaService.filial.count.mockResolvedValue(0);
      mockPrismaService.filial.findMany.mockResolvedValue([]);

      await service.findAll({ isActive: true });

      expect(mockPrismaService.filial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
          },
        }),
      );
    });

    it("should combine search and isActive filters", async () => {
      mockPrismaService.filial.count.mockResolvedValue(0);
      mockPrismaService.filial.findMany.mockResolvedValue([]);

      await service.findAll({ search: "test", isActive: false });

      expect(mockPrismaService.filial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "test", mode: "insensitive" } },
              { code: { contains: "test", mode: "insensitive" } },
            ],
            isActive: false,
          },
        }),
      );
    });
  });

  describe("findOne", () => {
    it("should return filial with relations", async () => {
      const filialWithRelations = {
        ...mockFilial,
        users: [
          {
            id: "1",
            firstName: "John",
            lastName: "Doe",
            email: "test@example.com",
          },
        ],
        usersCount: 1,
        clientsCount: 20,
        vehiclesCount: 10,
        driversCount: 15,
        contractsCount: 5,
        requestsCount: 50,
        ordersCount: 100,
        locationsCount: 3,
        warehousesCount: 2,
        tariffsCount: 10,
        recipientsCount: 25,
        _count: undefined,
      };

      mockPrismaService.filial.findUnique.mockResolvedValue({
        ...mockFilial,
        users: filialWithRelations.users,
        _count: {
          users: 1,
          clients: 20,
          vehicles: 10,
          drivers: 15,
          contracts: 5,
          requests: 50,
          orders: 100,
          locations: 3,
          warehouses: 2,
          tariffs: 10,
          recipients: 25,
        },
      });

      const result = await service.findOne(mockFilial.id);

      expect(result).toEqual(filialWithRelations);
      expect(mockPrismaService.filial.findUnique).toHaveBeenCalledWith({
        where: { id: mockFilial.id },
        include: {
          users: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: {
              users: true,
              clients: true,
              vehicles: true,
              drivers: true,
              contracts: true,
              requests: true,
              orders: true,
              locations: true,
              warehouses: true,
              tariffs: true,
              recipients: true,
            },
          },
        },
      });
    });

    it("should throw NotFoundException when filial not found", async () => {
      mockPrismaService.filial.findUnique.mockResolvedValue(null);

      await expect(service.findOne("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("should create a new filial", async () => {
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

      mockPrismaService.filial.findUnique.mockResolvedValue(null);
      mockPrismaService.filial.create.mockResolvedValue({
        ...createDto,
        id: "new-filial-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createDto);

      expect(result.code).toBe("SPB");
      expect(result.name).toBe("Санкт-Петербургский филиал");
      expect(mockPrismaService.filial.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it("should throw ConflictException when code already exists", async () => {
      const createDto = {
        name: "Московский филиал",
        code: "MOSCOW",
      };

      mockPrismaService.filial.findUnique.mockResolvedValue(mockFilial);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("update", () => {
    it("should update filial", async () => {
      const updateDto = { name: "Обновленное название" };

      mockPrismaService.filial.findUnique.mockResolvedValue(mockFilial);
      mockPrismaService.filial.update.mockResolvedValue({
        ...mockFilial,
        name: "Обновленное название",
      });

      const result = await service.update(mockFilial.id, updateDto);

      expect(result.name).toBe("Обновленное название");
      expect(mockPrismaService.filial.update).toHaveBeenCalledWith({
        where: { id: mockFilial.id },
        data: updateDto,
      });
    });

    it("should throw NotFoundException when filial not found", async () => {
      mockPrismaService.filial.findUnique.mockResolvedValue(null);

      await expect(
        service.update("non-existent-id", { name: "test" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException when updating to existing code", async () => {
      const existingFilial = {
        ...mockFilial,
        id: "different-id",
        code: "EXISTING",
      };
      const updateDto = { code: "EXISTING" };

      mockPrismaService.filial.findUnique
        .mockResolvedValueOnce(mockFilial)
        .mockResolvedValueOnce(existingFilial);

      await expect(service.update(mockFilial.id, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should allow updating code to same value", async () => {
      const updateDto = { code: mockFilial.code };

      mockPrismaService.filial.findUnique.mockResolvedValue(mockFilial);
      mockPrismaService.filial.update.mockResolvedValue(mockFilial);

      await service.update(mockFilial.id, updateDto);

      expect(mockPrismaService.filial.update).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should soft delete filial by setting isActive to false", async () => {
      mockPrismaService.filial.findUnique.mockResolvedValue(mockFilial);
      mockPrismaService.filial.update.mockResolvedValue({
        ...mockFilial,
        isActive: false,
      });

      const result = await service.delete(mockFilial.id);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.filial.update).toHaveBeenCalledWith({
        where: { id: mockFilial.id },
        data: { isActive: false },
      });
    });

    it("should throw NotFoundException when filial not found", async () => {
      mockPrismaService.filial.findUnique.mockResolvedValue(null);

      await expect(service.delete("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("toggleActive", () => {
    it("should toggle filial from active to inactive", async () => {
      mockPrismaService.filial.findUnique.mockResolvedValue(mockFilial);
      mockPrismaService.filial.update.mockResolvedValue({
        ...mockFilial,
        isActive: false,
      });

      const result = await service.toggleActive(mockFilial.id);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.filial.update).toHaveBeenCalledWith({
        where: { id: mockFilial.id },
        data: { isActive: false },
      });
    });

    it("should toggle filial from inactive to active", async () => {
      const inactiveFilial = { ...mockFilial, isActive: false };
      mockPrismaService.filial.findUnique.mockResolvedValue(inactiveFilial);
      mockPrismaService.filial.update.mockResolvedValue({
        ...inactiveFilial,
        isActive: true,
      });

      const result = await service.toggleActive(mockFilial.id);

      expect(result.isActive).toBe(true);
      expect(mockPrismaService.filial.update).toHaveBeenCalledWith({
        where: { id: mockFilial.id },
        data: { isActive: true },
      });
    });

    it("should throw NotFoundException when filial not found", async () => {
      mockPrismaService.filial.findUnique.mockResolvedValue(null);

      await expect(service.toggleActive("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
