import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "@prisma/client";
import type { CreateWarehouseDto, UpdateWarehouseDto } from "./dto";

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.WarehouseWhereInput;
    orderBy?: Prisma.WarehouseOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [total, warehouses] = await Promise.all([
      this.prisma.warehouse.count({ where }),
      this.prisma.warehouse.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: "desc" },
        include: {
          filial: true,
        },
      }),
    ]);

    return { total, warehouses };
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        filial: true,
      },
    });

    if (!warehouse) {
      throw new NotFoundException("Склад не найден");
    }

    return warehouse;
  }

  async findByCode(code: string) {
    return this.prisma.warehouse.findUnique({
      where: { code },
    });
  }

  async create(data: CreateWarehouseDto) {
    const existing = await this.prisma.warehouse.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException("Склад с таким кодом уже существует");
    }

    return this.prisma.warehouse.create({
      data,
      include: {
        filial: true,
      },
    });
  }

  async update(id: string, data: UpdateWarehouseDto) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException("Склад не найден");
    }

    if (data.code && data.code !== warehouse.code) {
      const existing = await this.prisma.warehouse.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new ConflictException("Склад с таким кодом уже существует");
      }
    }

    return this.prisma.warehouse.update({
      where: { id },
      data,
      include: {
        filial: true,
      },
    });
  }

  async delete(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException("Склад не найден");
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleActive(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException("Склад не найден");
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: { isActive: !warehouse.isActive },
      include: {
        filial: true,
      },
    });
  }
}
