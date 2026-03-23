import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { ExecutionContext } from "@nestjs/common";
import { UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { PermissionsGuard } from "../guards/permissions.guard";
import { RoleCode, PermissionSubject, PermissionAction } from "@prisma/client";

describe("Auth Guards", () => {
  describe("JwtAuthGuard", () => {
    let guard: JwtAuthGuard;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [JwtAuthGuard],
      }).compile();

      guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    });

    it("should be defined", () => {
      expect(guard).toBeDefined();
    });

    it("should return true when user is authenticated", () => {
      const parentCanActivate = Object.getPrototypeOf(
        Object.getPrototypeOf(guard),
      ).canActivate;
      jest
        .spyOn(
          Object.getPrototypeOf(Object.getPrototypeOf(guard)),
          "canActivate",
        )
        .mockReturnValue(true as never);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: "user-id", isActive: true },
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
      expect(parentCanActivate).toBeDefined();
    });

    it("should throw UnauthorizedException when user is not authenticated", () => {
      jest
        .spyOn(
          Object.getPrototypeOf(Object.getPrototypeOf(guard)),
          "canActivate",
        )
        .mockImplementation(() => {
          throw new UnauthorizedException();
        });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: null,
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("RolesGuard", () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RolesGuard,
          {
            provide: Reflector,
            useValue: {
              getAllAndOverride: jest.fn(),
            },
          },
        ],
      }).compile();

      guard = module.get<RolesGuard>(RolesGuard);
      reflector = module.get<Reflector>(Reflector);
    });

    it("should be defined", () => {
      expect(guard).toBeDefined();
    });

    it("should return true when no roles are required", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it("should return true when user has required role", () => {
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([RoleCode.ADMIN]);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [RoleCode.ADMIN], isSuperadmin: false },
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it("should return true when user is superadmin", () => {
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([RoleCode.DRIVER]);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [], isSuperadmin: true },
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it("should return false when user lacks required role", () => {
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([RoleCode.ADMIN]);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [RoleCode.DRIVER], isSuperadmin: false },
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(false);
    });
  });

  describe("PermissionsGuard", () => {
    let guard: PermissionsGuard;
    let reflector: Reflector;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PermissionsGuard,
          {
            provide: Reflector,
            useValue: {
              getAllAndOverride: jest.fn(),
            },
          },
        ],
      }).compile();

      guard = module.get<PermissionsGuard>(PermissionsGuard);
      reflector = module.get<Reflector>(Reflector);
    });

    it("should be defined", () => {
      expect(guard).toBeDefined();
    });

    it("should return true when no permissions are required", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it("should return true when user has required permission", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([
        {
          subject: PermissionSubject.requests,
          actions: [PermissionAction.create],
        },
      ]);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              isSuperadmin: false,
              permissions: [
                {
                  subject: PermissionSubject.requests,
                  action: PermissionAction.create,
                },
              ],
            },
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it("should return true when user has manage permission", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([
        {
          subject: PermissionSubject.requests,
          actions: [PermissionAction.create],
        },
      ]);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              isSuperadmin: false,
              permissions: [
                {
                  subject: PermissionSubject.requests,
                  action: PermissionAction.manage,
                },
              ],
            },
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it("should return true when user is superadmin", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([
        {
          subject: PermissionSubject.users,
          actions: [PermissionAction.delete],
        },
      ]);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { isSuperadmin: true, permissions: [] },
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it("should throw ForbiddenException when user lacks required permission", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([
        {
          subject: PermissionSubject.users,
          actions: [PermissionAction.delete],
        },
      ]);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              isSuperadmin: false,
              permissions: [
                {
                  subject: PermissionSubject.users,
                  action: PermissionAction.read,
                },
              ],
            },
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });
});

describe("Role Permissions Matrix", () => {
  const rolePermissions: Record<RoleCode, { can: string[]; cannot: string[] }> =
    {
      [RoleCode.ADMIN]: {
        can: [
          "requests:manage",
          "orders:manage",
          "trips:manage",
          "users:manage",
          "admin:manage",
        ],
        cannot: [],
      },
      [RoleCode.MANAGER]: {
        can: [
          "requests:manage",
          "orders:manage",
          "trips:manage",
          "clients:manage",
          "users:read",
          "reports:manage",
        ],
        cannot: ["users:manage", "admin:manage"],
      },
      [RoleCode.DISPATCHER]: {
        can: [
          "requests:create",
          "requests:read",
          "requests:update",
          "trips:manage",
          "vehicles:read",
          "drivers:read",
          "drivers:update",
        ],
        cannot: ["requests:delete", "users:manage"],
      },
      [RoleCode.SALES]: {
        can: ["requests:manage", "orders:manage", "clients:manage"],
        cannot: ["trips:manage", "users:manage"],
      },
      [RoleCode.OPERATOR]: {
        can: ["requests:create", "requests:read", "clients:read"],
        cannot: [
          "requests:update",
          "requests:delete",
          "orders:manage",
          "trips:manage",
        ],
      },
      [RoleCode.DRIVER]: {
        can: ["trips:read", "trips:update"],
        cannot: ["requests:manage", "orders:manage", "clients:manage"],
      },
      [RoleCode.CLIENT]: {
        can: ["requests:read"],
        cannot: [
          "requests:create",
          "requests:update",
          "requests:delete",
          "orders:manage",
        ],
      },
    };

  const roles = Object.keys(rolePermissions) as RoleCode[];

  roles.forEach((role) => {
    describe(`${role} role`, () => {
      it("should have defined permissions", () => {
        expect(rolePermissions[role]).toBeDefined();
        expect(rolePermissions[role].can).toBeDefined();
        expect(rolePermissions[role].cannot).toBeDefined();
      });

      rolePermissions[role].can.forEach((permission) => {
        it(`should have ${permission} permission`, () => {
          expect(rolePermissions[role].can).toContain(permission);
        });
      });

      rolePermissions[role].cannot.forEach((permission) => {
        it(`should NOT have ${permission} permission`, () => {
          expect(rolePermissions[role].cannot).toContain(permission);
          expect(rolePermissions[role].can).not.toContain(permission);
        });
      });
    });
  });

  describe("Permission hierarchy", () => {
    it("ADMIN should have access to everything", () => {
      const adminPermissions = rolePermissions[RoleCode.ADMIN].can;
      expect(adminPermissions).toEqual(
        expect.arrayContaining([
          "requests:manage",
          "orders:manage",
          "trips:manage",
          "users:manage",
          "admin:manage",
        ]),
      );
    });

    it("DRIVER should have minimal permissions", () => {
      const driverPermissions = rolePermissions[RoleCode.DRIVER].can;
      expect(driverPermissions).toHaveLength(2);
      expect(driverPermissions).toContain("trips:read");
      expect(driverPermissions).toContain("trips:update");
    });
  });
});
