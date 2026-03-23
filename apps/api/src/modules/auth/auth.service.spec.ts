import { Test, type TestingModule } from "@nestjs/testing";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../database/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

describe("AuthService", () => {
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    session: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  } as any;
  const jwtService = { signAsync: jest.fn() } as any;
  jwtService.verify = jest.fn();
  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        "jwt.secret": "test-secret",
        "jwt.accessTokenExpiresIn": "15m",
        "jwt.refreshTokenExpiresIn": "7d",
      };
      return values[key];
    }),
  } as any;

  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(JwtService)
      .useValue(jwtService)
      .overrideProvider(ConfigService)
      .useValue(configService)
      .compile();

    service = moduleRef.get(AuthService);
  });

  it("rejects invalid credentials", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: "bad@example.com", password: "x" } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("returns tokens on successful login", async () => {
    const bcrypt = await import("bcrypt");
    const compareSpy = jest.spyOn(bcrypt, "compare") as any;
    const hashSpy = jest.spyOn(bcrypt, "hash") as any;
    compareSpy.mockResolvedValue(true);
    hashSpy.mockResolvedValue("hashed-refresh");

    prisma.user.findUnique.mockResolvedValue({
      id: "user-id",
      email: "admin@logistics.local",
      passwordHash: "hash",
      firstName: "Admin",
      lastName: "User",
      isActive: true,
      roles: [{ role: { code: "ADMIN" } }],
    });
    jwtService.signAsync
      .mockResolvedValueOnce("access-token")
      .mockResolvedValueOnce("refresh-token");

    const result = await service.login({
      email: "admin@logistics.local",
      password: "password123",
    } as any);

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(prisma.session.create).toHaveBeenCalled();
  });

  it("rejects duplicate registration", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "existing" });
    await expect(
      service.register({
        email: "exists@example.com",
        password: "x",
        firstName: "A",
        lastName: "B",
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("refreshes tokens when session is valid", async () => {
    jwtService.verify.mockReturnValue({
      sub: "user-id",
      email: "admin@test.com",
    });
    prisma.session.findFirst.mockResolvedValue({ id: "session-id" });
    jwtService.signAsync
      .mockResolvedValueOnce("new-access-token")
      .mockResolvedValueOnce("new-refresh-token");
    const bcrypt = await import("bcrypt");
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-refresh" as never);

    const result = await service.refreshTokens({
      refreshToken: "refresh",
    } as any);

    expect(result.accessToken).toBe("new-access-token");
    expect(result.refreshToken).toBe("new-refresh-token");
    expect(prisma.session.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "session-id" },
      }),
    );
  });

  it("rejects refresh tokens when session is missing", async () => {
    jwtService.verify.mockReturnValue({
      sub: "user-id",
      email: "admin@test.com",
    });
    prisma.session.findFirst.mockResolvedValue(null);

    await expect(
      service.refreshTokens({ refreshToken: "refresh" } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("returns a hydrated user profile", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-id",
      email: "admin@test.com",
      firstName: "Admin",
      lastName: "User",
      filialId: "filial-id",
      isSuperadmin: true,
      isActive: true,
      roles: [
        {
          role: {
            code: "ADMIN",
            permissions: [
              {
                permission: {
                  subject: "users",
                  action: "manage",
                },
              },
            ],
          },
        },
      ],
    });

    const profile = await service.validateUser("user-id");

    expect(profile?.roles).toEqual(["ADMIN"]);
    expect(profile?.permissions).toEqual([
      { subject: "users", action: "manage" },
    ]);
  });

  it("terminates active sessions on logout", async () => {
    await service.logout("user-id");
    expect(prisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-id", terminatedAt: null },
      }),
    );
  });
});
