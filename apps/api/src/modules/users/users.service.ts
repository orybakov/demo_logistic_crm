import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma, RoleCode } from "@prisma/client";
import { User } from "@prisma/client";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    include?: Prisma.UserInclude;
  }) {
    const { skip, take, where, orderBy, include } = params;

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        skip,
        take,
        where,
        orderBy,
        include,
      }),
    ]);

    return { total, users };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        filial: true,
        roles: {
          include: { role: true, filial: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    phone?: string;
    filialId?: string;
    roleCodes?: RoleCode[];
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        "Пользователь с таким email уже существует",
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const roleConnections = data.roleCodes?.length
      ? {
          create: await Promise.all(
            data.roleCodes.map(async (code) => {
              const role = await this.prisma.role.findUnique({
                where: { code },
              });
              if (!role)
                throw new BadRequestException(`Роль ${code} не найдена`);
              return { roleId: role.id, filialId: data.filialId };
            }),
          ),
        }
      : undefined;

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        phone: data.phone,
        filialId: data.filialId,
        roles: roleConnections,
      },
      include: {
        filial: true,
        roles: { include: { role: true } },
      },
    });
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      middleName?: string;
      phone?: string;
      filialId?: string;
      isActive?: boolean;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        filial: true,
        roles: { include: { role: true } },
      },
    });
  }

  async updatePassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async assignRoles(id: string, roleCodes: RoleCode[], filialId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    await this.prisma.userRole.deleteMany({ where: { userId: id } });

    const roles = await this.prisma.role.findMany({
      where: { code: { in: roleCodes } },
    });

    return this.prisma.user.update({
      where: { id },
      data: {
        roles: {
          create: roles.map((role) => ({
            roleId: role.id,
            filialId: filialId || user.filialId,
          })),
        },
      },
      include: {
        roles: { include: { role: true } },
      },
    });
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async hardDelete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    await this.prisma.userRole.deleteMany({ where: { userId: id } });
    await this.prisma.session.deleteMany({ where: { userId: id } });
    await this.prisma.auditLog.deleteMany({ where: { userId: id } });

    return this.prisma.user.delete({ where: { id } });
  }
}
