import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { RequestsService } from "./requests.service";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../database/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RequestStatus, RequestPriority, RequestType } from "./dto";

describe("RequestsService", () => {
  let service: RequestsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prismaService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let auditService: any;

  const mockUser = {
    id: "user-1",
    email: "admin@test.com",
    firstName: "Admin",
    lastName: "User",
  };

  const mockClient = {
    id: "client-1",
    name: "Test Client",
    inn: "1234567890",
    filialId: "filial-1",
  };

  const mockRequest = {
    id: "request-1",
    number: "REQ-20260101-0001",
    clientId: "client-1",
    status: RequestStatus.NEW,
    priority: RequestPriority.NORMAL,
    type: "auto",
    flags: null,
    deletedAt: null,
    createdById: "user-1",
    points: [],
    cargoItems: [],
    trips: [],
  };

  const mockRequestWithRelations = {
    ...mockRequest,
    client: mockClient,
    filial: null,
    assignedTo: null,
    createdBy: mockUser,
    points: [],
    cargoItems: [],
    trips: [],
    statusHistory: [],
    comments: [],
    order: null,
    _count: { trips: 0, comments: 0 },
    cargoTypeId: null,
    orderId: null,
    totalWeight: null,
    totalVolume: null,
    totalPieces: null,
    temperatureFrom: null,
    temperatureTo: null,
    notes: null,
    estimatedPrice: null,
    calculatedAt: null,
    confirmedAt: null,
    completedAt: null,
    filialId: null,
    assignedToId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockPrismaService = {
      request: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      client: {
        findUnique: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
      },
      point: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      cargoItem: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      comment: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      requestStatusHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockAuditService = {
      log: jest.fn(),
      logCreate: jest.fn(),
      logDelete: jest.fn(),
    };

    const mockNotificationsService = {
      notifyRequestCreated: jest.fn(),
      notifyRequestUpdated: jest.fn(),
      notifyRequestStatusChanged: jest.fn(),
      notifyCommentAdded: jest.fn(),
      notifyFlagAdded: jest.fn(),
      notifyFlagRemoved: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    prismaService = module.get(PrismaService);
    auditService = module.get(AuditService);
  });

  describe("findAll", () => {
    it("should return paginated requests", async () => {
      prismaService.request.count.mockResolvedValueOnce(1);
      prismaService.request.findMany.mockResolvedValueOnce([mockRequest]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.total).toBe(1);
      expect(result.requests).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should filter by status", async () => {
      prismaService.request.count.mockResolvedValueOnce(0);
      prismaService.request.findMany.mockResolvedValueOnce([]);

      await service.findAll({ status: RequestStatus.NEW });

      expect(prismaService.request.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: RequestStatus.NEW,
          }),
        }),
      );
    });

    it("should filter by clientId", async () => {
      prismaService.request.count.mockResolvedValueOnce(0);
      prismaService.request.findMany.mockResolvedValueOnce([]);

      await service.findAll({ clientId: "client-1" });

      expect(prismaService.request.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientId: "client-1",
          }),
        }),
      );
    });

    it("should search by query string", async () => {
      prismaService.request.count.mockResolvedValueOnce(0);
      prismaService.request.findMany.mockResolvedValueOnce([]);

      await service.findAll({ q: "test" });

      expect(prismaService.request.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe("findOne", () => {
    it("should return request with all relations", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        client: mockClient,
        flags: null,
      });

      const result = await service.findOne("request-1");

      expect(result.id).toBe("request-1");
      expect(result.client).toBeDefined();
      expect(result.points).toBeDefined();
      expect(result.trips).toBeDefined();
    });

    it("should throw NotFoundException if request not found", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should parse flags JSON", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        flags: '["URGENT","HAZMAT"]',
      });

      const result = await service.findOne("request-1");

      expect(result.flags).toEqual(["URGENT", "HAZMAT"]);
    });
  });

  describe("create", () => {
    const createDto = {
      clientId: "client-1",
      type: RequestType.AUTO,
      priority: RequestPriority.NORMAL,
      points: [
        { type: "pickup", sequence: 1, address: "Address 1" },
        { type: "delivery", sequence: 2, address: "Address 2" },
      ],
    };

    it("should create request with status history", async () => {
      prismaService.client.findUnique.mockResolvedValueOnce(mockClient);
      prismaService.request.create.mockResolvedValueOnce({
        ...mockRequest,
        ...createDto,
      });
      prismaService.requestStatusHistory.create.mockResolvedValueOnce(
        {} as any,
      );
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        ...createDto,
        flags: null,
      });

      const result = await service.create(createDto, "user-1");

      expect(prismaService.request.create).toHaveBeenCalled();
      expect(prismaService.requestStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: RequestStatus.NEW,
          changedById: "user-1",
        }),
      });
    });

    it("should throw NotFoundException if client not found", async () => {
      prismaService.client.findUnique.mockResolvedValueOnce(null);

      await expect(service.create(createDto, "user-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException if less than 2 points", async () => {
      prismaService.client.findUnique.mockResolvedValueOnce(mockClient);

      await expect(
        service.create(
          {
            ...createDto,
            points: [{ type: "pickup", sequence: 1, address: "Address 1" }],
          },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if no pickup point", async () => {
      prismaService.client.findUnique.mockResolvedValueOnce(mockClient);

      await expect(
        service.create(
          {
            ...createDto,
            points: [
              { type: "delivery", sequence: 1, address: "Address 1" },
              { type: "delivery", sequence: 2, address: "Address 2" },
            ],
          },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("changeStatus", () => {
    it("should change status from NEW to CONFIRMED", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        status: RequestStatus.NEW,
      });
      prismaService.request.update.mockResolvedValueOnce({
        ...mockRequest,
        status: RequestStatus.CONFIRMED,
      });
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        status: RequestStatus.CONFIRMED,
        flags: null,
      });

      const result = await service.changeStatus(
        "request-1",
        { status: RequestStatus.CONFIRMED },
        "user-1",
      );

      expect(prismaService.request.update).toHaveBeenCalled();
    });

    it("should add a visible comment when status comment is provided", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        status: RequestStatus.NEW,
      });
      prismaService.request.update.mockResolvedValueOnce({
        ...mockRequest,
        status: RequestStatus.IN_PROGRESS,
      });
      prismaService.request.findUnique
        .mockResolvedValueOnce({
          ...mockRequest,
          status: RequestStatus.IN_PROGRESS,
          flags: null,
        })
        .mockResolvedValueOnce({
          ...mockRequest,
          status: RequestStatus.IN_PROGRESS,
          flags: null,
        });
      prismaService.comment.create.mockResolvedValueOnce({
        id: "comment-1",
        text: "Need to update docs",
        author: mockUser,
      } as any);

      await service.changeStatus(
        "request-1",
        { status: RequestStatus.IN_PROGRESS, comment: "Need to update docs" },
        "user-1",
      );

      expect(prismaService.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            text: "Need to update docs",
            entityType: "request",
            entityId: "request-1",
          }),
        }),
      );
    });

    it("should throw BadRequestException for invalid transition", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        status: RequestStatus.NEW,
      });

      await expect(
        service.changeStatus(
          "request-1",
          { status: RequestStatus.COMPLETED },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when completed request is changed", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        status: RequestStatus.COMPLETED,
      });

      await expect(
        service.changeStatus(
          "request-1",
          { status: RequestStatus.NEW },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if request not found", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.changeStatus(
          "non-existent",
          { status: RequestStatus.CONFIRMED },
          "user-1",
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("addFlag", () => {
    it("should add flag to request", async () => {
      const updatedRequest = {
        ...mockRequestWithRelations,
        flags: '["URGENT"]',
      };

      prismaService.request.findUnique
        .mockResolvedValueOnce({
          ...mockRequest,
          flags: null,
        })
        .mockResolvedValueOnce({
          ...mockRequest,
          flags: null,
        })
        .mockResolvedValueOnce(updatedRequest);
      prismaService.request.update.mockResolvedValueOnce({
        ...mockRequest,
        flags: '["URGENT"]',
      });
      prismaService.comment.create.mockResolvedValueOnce({} as any);

      const result = await service.addFlag(
        "request-1",
        { flag: "URGENT" },
        "user-1",
      );

      expect(prismaService.request.update).toHaveBeenCalled();
    });

    it("should throw ConflictException if flag already exists", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        flags: '["URGENT"]',
      });

      await expect(
        service.addFlag("request-1", { flag: "URGENT" }, "user-1"),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("removeFlag", () => {
    it("should remove flag from request", async () => {
      const updatedRequest = {
        ...mockRequestWithRelations,
        flags: '["HAZMAT"]',
      };

      prismaService.request.findUnique
        .mockResolvedValueOnce({
          ...mockRequest,
          flags: '["URGENT","HAZMAT"]',
        })
        .mockResolvedValueOnce({
          ...mockRequest,
          flags: '["URGENT","HAZMAT"]',
        })
        .mockResolvedValueOnce(updatedRequest);
      prismaService.request.update.mockResolvedValueOnce({
        ...mockRequest,
        flags: '["HAZMAT"]',
      });
      prismaService.comment.create.mockResolvedValueOnce({} as any);

      await service.removeFlag("request-1", { flag: "URGENT" }, "user-1");

      expect(prismaService.request.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException if flag not found", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        flags: '["URGENT"]',
      });

      await expect(
        service.removeFlag("request-1", { flag: "NONEXISTENT" }, "user-1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should soft delete request", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        trips: [],
      });
      prismaService.request.update.mockResolvedValueOnce({
        ...mockRequest,
        deletedAt: new Date(),
      });

      const result = await service.delete("request-1", "user-1");

      expect(result.success).toBe(true);
      expect(prismaService.request.update).toHaveBeenCalledWith({
        where: { id: "request-1" },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it("should throw BadRequestException if request has active trips", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        trips: [{ id: "trip-1", status: "in_transit" }],
      });

      await expect(service.delete("request-1", "user-1")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("addComment", () => {
    it("should add comment to request", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce(mockRequest);
      prismaService.comment.create.mockResolvedValueOnce({
        id: "comment-1",
        text: "Test comment",
        author: mockUser,
      } as any);

      const result = await service.addComment(
        "request-1",
        { text: "Test comment" },
        "user-1",
      );

      expect(result.text).toBe("Test comment");
    });

    it("should throw NotFoundException if request not found", async () => {
      prismaService.request.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.addComment("non-existent", { text: "Test" }, "user-1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getStats", () => {
    it("should return request statistics", async () => {
      prismaService.request.count.mockResolvedValueOnce(10);
      prismaService.request.groupBy
        .mockResolvedValueOnce([
          { status: RequestStatus.NEW, _count: { id: 5 } },
          { status: RequestStatus.CONFIRMED, _count: { id: 3 } },
        ])
        .mockResolvedValueOnce([
          { priority: RequestPriority.NORMAL, _count: { id: 8 } },
        ]);
      prismaService.request.findMany.mockResolvedValueOnce([]);

      const result = await service.getStats();

      expect(result.total).toBe(10);
      expect(result.byStatus).toHaveProperty(RequestStatus.NEW);
    });
  });
});
