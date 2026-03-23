import { AdminService } from "./admin.service";

describe("AdminService", () => {
  const prisma = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    permission: { findMany: jest.fn() },
    userRole: { deleteMany: jest.fn() },
    auditLog: { count: jest.fn(), findMany: jest.fn() },
    systemSetting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as any;

  const audit = {
    log: jest.fn(),
    logUpdate: jest.fn(),
    logDelete: jest.fn(),
  } as any;
  const service = new AdminService(prisma, audit);

  beforeEach(() => jest.clearAllMocks());

  it("lists users", async () => {
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findMany.mockResolvedValue([{ roles: [], filial: null }]);

    const res = await service.getUsers({ page: 1, take: 20 });
    expect(res.total).toBe(1);
  });

  it("returns reference catalog", () => {
    expect(service.getReferenceCatalog().sections.length).toBeGreaterThan(0);
  });

  it("creates a user with the default operator role", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.role.findMany.mockResolvedValue([
      { id: "role-1", code: "OPERATOR" },
    ]);
    prisma.user.create.mockResolvedValue({
      id: "user-1",
      email: "new@test.com",
      roles: [],
    });
    const bcrypt = await import("bcrypt");
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password" as never);

    await service.createUser(
      {
        email: "new@test.com",
        password: "password123",
        firstName: "New",
        lastName: "User",
      } as any,
      "admin-id",
    );

    expect(prisma.role.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: { in: ["OPERATOR"] } },
      }),
    );
  });

  it("rejects duplicate emails", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "existing" });

    await expect(
      service.createUser(
        {
          email: "exists@test.com",
          password: "password123",
          firstName: "Existing",
          lastName: "User",
        } as any,
        "admin-id",
      ),
    ).rejects.toBeDefined();
  });

  it("creates a new system setting when missing", async () => {
    prisma.systemSetting.findUnique.mockResolvedValue(null);
    prisma.systemSetting.create.mockResolvedValue({
      id: "setting-1",
      key: "ops.swagger",
      value: true,
    });

    const setting = await service.updateSetting(
      "ops.swagger",
      { title: "Swagger", value: true } as any,
      "admin-id",
    );

    expect(setting.key).toBe("ops.swagger");
    expect(prisma.systemSetting.create).toHaveBeenCalled();
  });

  it("updates an existing system setting", async () => {
    prisma.systemSetting.findUnique.mockResolvedValue({
      id: "setting-1",
      key: "ops.swagger",
      value: false,
    });
    prisma.systemSetting.update.mockResolvedValue({
      id: "setting-1",
      key: "ops.swagger",
      value: true,
    });

    await service.updateSetting(
      "ops.swagger",
      { title: "Swagger", value: true } as any,
      "admin-id",
    );

    expect(prisma.systemSetting.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "ops.swagger" },
      }),
    );
  });

  it("returns filtered audit logs", async () => {
    prisma.auditLog.count.mockResolvedValue(1);
    prisma.auditLog.findMany.mockResolvedValue([{ id: "log-1", user: null }]);

    const result = await service.getAuditLogs({
      page: 1,
      take: 20,
      userId: "user-1",
      dateFrom: "2026-03-01",
      dateTo: "2026-03-21",
    } as any);

    expect(result.total).toBe(1);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
      }),
    );
  });
});
