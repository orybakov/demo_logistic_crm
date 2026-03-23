import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class StatusesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    entityType?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const { skip, take, entityType, isActive, search } = params;

    const where: Prisma.StatusWhereInput = {
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

    const [total, statuses] = await Promise.all([
      this.prisma.status.count({ where }),
      this.prisma.status.findMany({
        skip,
        take,
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
    ]);

    return { total, statuses };
  }

  async findByEntity(entityType: string) {
    return this.prisma.status.findMany({
      where: { entityType, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async findOne(id: string) {
    const status = await this.prisma.status.findUnique({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException("Статус не найден");
    }

    return status;
  }

  async create(data: {
    entityType: string;
    code: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    isSystem?: boolean;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const existing = await this.prisma.status.findUnique({
      where: {
        entityType_code: { entityType: data.entityType, code: data.code },
      },
    });

    if (existing) {
      throw new BadRequestException(
        "Статус с таким кодом уже существует для данного типа сущности",
      );
    }

    return this.prisma.status.create({
      data: {
        entityType: data.entityType,
        code: data.code,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        isSystem: data.isSystem ?? false,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
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
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    const status = await this.prisma.status.findUnique({ where: { id } });
    if (!status) {
      throw new NotFoundException("Статус не найден");
    }

    return this.prisma.status.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const status = await this.prisma.status.findUnique({ where: { id } });
    if (!status) {
      throw new NotFoundException("Статус не найден");
    }

    return this.prisma.status.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleActive(id: string) {
    const status = await this.prisma.status.findUnique({ where: { id } });
    if (!status) {
      throw new NotFoundException("Статус не найден");
    }

    return this.prisma.status.update({
      where: { id },
      data: { isActive: !status.isActive },
    });
  }
}
