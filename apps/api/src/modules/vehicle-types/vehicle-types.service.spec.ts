import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { VehicleTypesService } from "./vehicle-types.service";
import { PrismaService } from "../../database/prisma.service";

describe("VehicleTypesService", () => {
  let service: VehicleTypesService;
  let mockPrismaService: any;

  const mockVehicleType = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    code: "truck_20t",
    name: "Грузовик 20т",
    description: "Грузовой автомобиль грузоподъемностью до 20 тонн",
    category: "general",
    capacityKg: 20000,
    capacityM3: 80,
    hasTrailer: false,
    isActive: true,
    sortOrder: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPrismaService = {
      vehicleType: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleTypesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VehicleTypesService>(VehicleTypesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return paginated vehicle types", async () => {
      mockPrismaService.vehicleType.count.mockResolvedValue(1);
      mockPrismaService.vehicleType.findMany.mockResolvedValue([
        mockVehicleType,
      ]);

      const result = await service.findAll({ skip: 0, take: 20 });

      expect(result.total).toBe(1);
      expect(result.vehicleTypes).toEqual([mockVehicleType]);
      expect(mockPrismaService.vehicleType.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: {},
        orderBy: { sortOrder: "asc" },
      });
    });

    it("should use default pagination values", async () => {
      mockPrismaService.vehicleType.count.mockResolvedValue(0);
      mockPrismaService.vehicleType.findMany.mockResolvedValue([]);

      await service.findAll({});

      expect(mockPrismaService.vehicleType.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: {},
        orderBy: { sortOrder: "asc" },
      });
    });

    it("should filter by search query", async () => {
      mockPrismaService.vehicleType.count.mockResolvedValue(0);
      mockPrismaService.vehicleType.findMany.mockResolvedValue([]);

      await service.findAll({ search: "грузовик" });

      expect(mockPrismaService.vehicleType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { code: { contains: "грузовик", mode: "insensitive" } },
              { name: { contains: "грузовик", mode: "insensitive" } },
              { description: { contains: "грузовик", mode: "insensitive" } },
            ],
          },
        }),
      );
    });

    it("should filter by isActive status", async () => {
      mockPrismaService.vehicleType.count.mockResolvedValue(0);
      mockPrismaService.vehicleType.findMany.mockResolvedValue([]);

      await service.findAll({ isActive: true });

      expect(mockPrismaService.vehicleType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
          },
        }),
      );
    });

    it("should combine multiple filters", async () => {
      mockPrismaService.vehicleType.count.mockResolvedValue(0);
      mockPrismaService.vehicleType.findMany.mockResolvedValue([]);

      await service.findAll({
        skip: 10,
        take: 5,
        search: "test",
        isActive: false,
      });

      expect(mockPrismaService.vehicleType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
          where: {
            OR: [
              { code: { contains: "test", mode: "insensitive" } },
              { name: { contains: "test", mode: "insensitive" } },
              { description: { contains: "test", mode: "insensitive" } },
            ],
            isActive: false,
          },
        }),
      );
    });

    it("should return empty array when no vehicle types found", async () => {
      mockPrismaService.vehicleType.count.mockResolvedValue(0);
      mockPrismaService.vehicleType.findMany.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(result.total).toBe(0);
      expect(result.vehicleTypes).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return vehicle type by id", async () => {
      mockPrismaService.vehicleType.findUnique.mockResolvedValue(
        mockVehicleType,
      );

      const result = await service.findOne(mockVehicleType.id);

      expect(result).toEqual(mockVehicleType);
      expect(mockPrismaService.vehicleType.findUnique).toHaveBeenCalledWith({
        where: { id: mockVehicleType.id },
      });
    });

    it("should throw NotFoundException when vehicle type not found", async () => {
      mockPrismaService.vehicleType.findUnique.mockResolvedValue(null);

      await expect(service.findOne("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("should create a new vehicle type", async () => {
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

      mockPrismaService.vehicleType.findUnique.mockResolvedValue(null);
      mockPrismaService.vehicleType.create.mockResolvedValue({
        ...createDto,
        id: "new-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createDto);

      expect(result.code).toBe("van_10t");
      expect(result.name).toBe("Фургон 10т");
      expect(mockPrismaService.vehicleType.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          category: "cargo",
          hasTrailer: false,
          isActive: true,
          sortOrder: 5,
        },
      });
    });

    it("should use default values for optional fields", async () => {
      const createDto = {
        code: "simple_truck",
        name: "Простой грузовик",
      };

      mockPrismaService.vehicleType.findUnique.mockResolvedValue(null);
      mockPrismaService.vehicleType.create.mockResolvedValue({
        ...createDto,
        id: "new-id",
        category: "general",
        hasTrailer: false,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.create(createDto);

      expect(mockPrismaService.vehicleType.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          category: "general",
          hasTrailer: false,
          isActive: true,
          sortOrder: 0,
        },
      });
    });

    it("should throw ConflictException when code already exists", async () => {
      const createDto = {
        code: "truck_20t",
        name: "Грузовик 20т",
      };

      mockPrismaService.vehicleType.findUnique.mockResolvedValue(
        mockVehicleType,
      );

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("update", () => {
    it("should update vehicle type", async () => {
      const updateDto = {
        name: "Обновленный грузовик 20т",
        capacityKg: 25000,
      };

      mockPrismaService.vehicleType.findUnique.mockResolvedValue(
        mockVehicleType,
      );
      mockPrismaService.vehicleType.update.mockResolvedValue({
        ...mockVehicleType,
        ...updateDto,
      });

      const result = await service.update(mockVehicleType.id, updateDto);

      expect(result.name).toBe("Обновленный грузовик 20т");
      expect(result.capacityKg).toBe(25000);
      expect(mockPrismaService.vehicleType.update).toHaveBeenCalledWith({
        where: { id: mockVehicleType.id },
        data: updateDto,
      });
    });

    it("should throw NotFoundException when vehicle type not found", async () => {
      mockPrismaService.vehicleType.findUnique.mockResolvedValue(null);

      await expect(
        service.update("non-existent-id", { name: "test" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException when updating to existing code", async () => {
      const existingVehicleType = {
        ...mockVehicleType,
        id: "different-id",
        code: "existing_code",
      };
      const updateDto = { code: "existing_code" };

      mockPrismaService.vehicleType.findUnique
        .mockResolvedValueOnce(mockVehicleType)
        .mockResolvedValueOnce(existingVehicleType);

      await expect(
        service.update(mockVehicleType.id, updateDto),
      ).rejects.toThrow(ConflictException);
    });

    it("should allow updating code to same value", async () => {
      const updateDto = { code: mockVehicleType.code };

      mockPrismaService.vehicleType.findUnique.mockResolvedValue(
        mockVehicleType,
      );
      mockPrismaService.vehicleType.update.mockResolvedValue(mockVehicleType);

      await service.update(mockVehicleType.id, updateDto);

      expect(mockPrismaService.vehicleType.update).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should soft delete vehicle type by setting isActive to false", async () => {
      mockPrismaService.vehicleType.findUnique.mockResolvedValue(
        mockVehicleType,
      );
      mockPrismaService.vehicleType.update.mockResolvedValue({
        ...mockVehicleType,
        isActive: false,
      });

      const result = await service.delete(mockVehicleType.id);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.vehicleType.update).toHaveBeenCalledWith({
        where: { id: mockVehicleType.id },
        data: { isActive: false },
      });
    });

    it("should throw NotFoundException when vehicle type not found", async () => {
      mockPrismaService.vehicleType.findUnique.mockResolvedValue(null);

      await expect(service.delete("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("toggleActive", () => {
    it("should toggle vehicle type from active to inactive", async () => {
      mockPrismaService.vehicleType.findUnique.mockResolvedValue(
        mockVehicleType,
      );
      mockPrismaService.vehicleType.update.mockResolvedValue({
        ...mockVehicleType,
        isActive: false,
      });

      const result = await service.toggleActive(mockVehicleType.id);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.vehicleType.update).toHaveBeenCalledWith({
        where: { id: mockVehicleType.id },
        data: { isActive: false },
      });
    });

    it("should toggle vehicle type from inactive to active", async () => {
      const inactiveVehicleType = { ...mockVehicleType, isActive: false };
      mockPrismaService.vehicleType.findUnique.mockResolvedValue(
        inactiveVehicleType,
      );
      mockPrismaService.vehicleType.update.mockResolvedValue({
        ...inactiveVehicleType,
        isActive: true,
      });

      const result = await service.toggleActive(mockVehicleType.id);

      expect(result.isActive).toBe(true);
      expect(mockPrismaService.vehicleType.update).toHaveBeenCalledWith({
        where: { id: mockVehicleType.id },
        data: { isActive: true },
      });
    });

    it("should throw NotFoundException when vehicle type not found", async () => {
      mockPrismaService.vehicleType.findUnique.mockResolvedValue(null);

      await expect(service.toggleActive("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
