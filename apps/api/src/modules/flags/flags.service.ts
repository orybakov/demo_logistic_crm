import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class FlagsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    entityType?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const { skip, take, entityType, isActive, search } = params;

    const where: Prisma.FlagWhereInput = {
      ...(entityType && { entityType }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, flags] = await Promise.all([
      this.prisma.flag.count({ where }),
      this.prisma.flag.findMany({
        skip,
        take,
        where,
        orderBy: { name: "asc" },
      }),
    ]);

    return { total, flags };
  }

  async findOne(id: string) {
    const flag = await this.prisma.flag.findUnique({
      where: { id },
    });

    if (!flag) {
      throw new NotFoundException("Флаг не найден");
    }

    return flag;
  }

  async create(data: {
    code: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    entityType?: string;
    isSystem?: boolean;
    isActive?: boolean;
  }) {
    const existing = await this.prisma.flag.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new BadRequestException("Флаг с таким кодом уже существует");
    }

    return this.prisma.flag.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        entityType: data.entityType ?? "",
        isSystem: data.isSystem ?? false,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      entityType?: string;
      isActive?: boolean;
    },
  ) {
    const flag = await this.prisma.flag.findUnique({ where: { id } });
    if (!flag) {
      throw new NotFoundException("Флаг не найден");
    }

    return this.prisma.flag.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const flag = await this.prisma.flag.findUnique({ where: { id } });
    if (!flag) {
      throw new NotFoundException("Флаг не найден");
    }

    return this.prisma.flag.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleActive(id: string) {
    const flag = await this.prisma.flag.findUnique({ where: { id } });
    if (!flag) {
      throw new NotFoundException("Флаг не найден");
    }

    return this.prisma.flag.update({
      where: { id },
      data: { isActive: !flag.isActive },
    });
  }
}
