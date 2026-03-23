import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  PermissionAction,
  PermissionSubject,
  RoleCode,
} from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../database/audit.service";
import {
  AdminAuditQueryDto,
  AdminRoleUpdateDto,
  AdminSettingUpdateDto,
  AdminUserCreateDto,
  AdminUserQueryDto,
  AdminUserRolesDto,
  AdminUserUpdateDto,
} from "./dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getUsers(query: AdminUserQueryDto) {
    const page = query.page || 1;
    const take = query.take || 20;
    const skip = (page - 1) * take;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.q && {
        OR: [
          { email: { contains: query.q, mode: "insensitive" } },
          { firstName: { contains: query.q, mode: "insensitive" } },
          { lastName: { contains: query.q, mode: "insensitive" } },
        ],
      }),
      ...(query.filialId && { filialId: query.filialId }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.roleCode && {
        roles: { some: { role: { code: query.roleCode } } },
      }),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          filial: true,
          roles: { include: { role: true, filial: true } },
          _count: {
            select: { sessions: true, notifications: true, auditLogs: true },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      take,
      totalPages: Math.max(1, Math.ceil(total / take)),
      users: users.map((user) => ({
        ...user,
        roles: user.roles.map((userRole) => ({
          id: userRole.id,
          code: userRole.role.code,
          name: userRole.role.name,
          filialId: userRole.filialId,
          filialName: userRole.filial?.name || null,
        })),
      })),
    };
  }

  async createUser(dto: AdminUserCreateDto, userId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser)
      throw new BadRequestException(
        "Пользователь с таким email уже существует",
      );

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const roleCodes = dto.roleCodes?.length
      ? dto.roleCodes
      : [RoleCode.OPERATOR];
    const roles = await this.prisma.role.findMany({
      where: { code: { in: roleCodes } },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName,
        phone: dto.phone,
        filialId: dto.filialId,
        roles: {
          create: roles.map((role) => ({
            roleId: role.id,
            filialId: dto.filialId,
          })),
        },
      },
      include: {
        filial: true,
        roles: { include: { role: true, filial: true } },
      },
    });

    await this.auditService.log(
      "create",
      "user",
      user.id,
      { userId },
      undefined,
      { email: user.email },
    );
    return user;
  }

  async updateUser(id: string, dto: AdminUserUpdateDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Пользователь не найден");

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: {
        filial: true,
        roles: { include: { role: true, filial: true } },
      },
    });

    await this.auditService.logUpdate("user", id, user as any, dto as any, {
      userId,
    });
    return updated;
  }

  async updateUserPassword(id: string, newPassword: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Пользователь не найден");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    await this.auditService.log(
      "password_change",
      "user",
      id,
      { userId },
      undefined,
      { changed: true },
    );
    return { success: true };
  }

  async assignUserRoles(id: string, dto: AdminUserRolesDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Пользователь не найден");

    await this.prisma.userRole.deleteMany({ where: { userId: id } });
    const roles = await this.prisma.role.findMany({
      where: { code: { in: dto.roleCodes } },
    });

    await this.prisma.user.update({
      where: { id },
      data: {
        roles: {
          create: roles.map((role) => ({
            roleId: role.id,
            filialId: dto.filialId || user.filialId,
          })),
        },
      },
    });

    await this.auditService.log(
      "assign_roles",
      "user",
      id,
      { userId },
      undefined,
      { roleCodes: dto.roleCodes },
    );
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        filial: true,
        roles: { include: { role: true, filial: true } },
      },
    });
  }

  async deleteUser(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Пользователь не найден");

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.auditService.logDelete("user", user as any, { userId });
    return { success: true };
  }

  async getRoles() {
    const [roles, permissions] = await Promise.all([
      this.prisma.role.findMany({
        orderBy: [{ isSystem: "desc" }, { code: "asc" }],
        include: {
          users: true,
          permissions: { include: { permission: true } },
        },
      }),
      this.prisma.permission.findMany({
        orderBy: [{ subject: "asc" }, { action: "asc" }],
      }),
    ]);

    return {
      roles: roles.map((role) => ({
        ...role,
        permissions: role.permissions.map((rp) => ({
          subject: rp.permission.subject,
          action: rp.permission.action,
          name: rp.permission.name,
        })),
        usersCount: role.users.length,
      })),
      permissions,
    };
  }

  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ subject: "asc" }, { action: "asc" }],
    });
  }

  async updateRole(code: RoleCode, dto: AdminRoleUpdateDto, userId: string) {
    const role = await this.prisma.role.findUnique({
      where: { code },
      include: { permissions: true },
    });
    if (!role) throw new NotFoundException("Роль не найдена");

    const permissionPairs = dto.permissions || [];
    const permissions = permissionPairs.length
      ? await this.prisma.permission.findMany({
          where: {
            OR: permissionPairs.map((p) => ({
              subject: p.subject,
              action: p.action,
            })),
          },
        })
      : [];

    await this.prisma.role.update({
      where: { code },
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
        permissions: {
          deleteMany: {},
          create: permissions.map((permission) => ({
            permissionId: permission.id,
          })),
        },
      },
    });

    await this.auditService.log(
      "update",
      "role",
      role.id,
      { userId },
      role as any,
      dto as any,
    );
    return this.prisma.role.findUnique({
      where: { code },
      include: { permissions: { include: { permission: true } }, users: true },
    });
  }

  async getAuditLogs(query: AdminAuditQueryDto) {
    const page = query.page || 1;
    const take = query.take || 20;
    const skip = (page - 1) * take;
    const from = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const to = query.dateTo ? new Date(query.dateTo) : undefined;

    const where: Prisma.AuditLogWhereInput = {
      ...(query.userId && { userId: query.userId }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(query.action && { action: query.action }),
      ...(from || to
        ? {
            createdAt: {
              ...(from && { gte: from }),
              ...(to && { lte: to }),
            },
          }
        : {}),
    };

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      take,
      totalPages: Math.max(1, Math.ceil(total / take)),
      logs,
    };
  }

  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: [{ section: "asc" }, { title: "asc" }],
    });
    return { settings };
  }

  async updateSetting(key: string, dto: AdminSettingUpdateDto, userId: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    const setting = existing
      ? await this.prisma.systemSetting.update({
          where: { key },
          data: { ...dto, value: dto.value as Prisma.InputJsonValue },
        })
      : await this.prisma.systemSetting.create({
          data: { key, ...dto, value: dto.value as Prisma.InputJsonValue },
        });

    await this.auditService.log(
      existing ? "update" : "create",
      "system_setting",
      setting.id,
      { userId },
      existing as any,
      setting as any,
    );
    return setting;
  }

  getReferenceCatalog() {
    return {
      sections: [
        { key: "statuses", title: "Статусы", path: "/reference/statuses" },
        { key: "flags", title: "Флаги", path: "/reference/flags" },
        {
          key: "classifiers",
          title: "Классификаторы",
          path: "/reference/classifiers",
        },
        {
          key: "problemReasons",
          title: "Причины проблем",
          path: "/reference/problem-reasons",
        },
        {
          key: "vehicleTypes",
          title: "Типы ТС",
          path: "/reference/vehicle-types",
        },
        {
          key: "fuelTypes",
          title: "Типы топлива",
          path: "/reference/fuel-types",
        },
        { key: "filials", title: "Филиалы", path: "/reference/filials" },
        { key: "warehouses", title: "Склады", path: "/reference/warehouses" },
        {
          key: "recipients",
          title: "Получатели",
          path: "/reference/recipients",
        },
      ],
    };
  }
}
