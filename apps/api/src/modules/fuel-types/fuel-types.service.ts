import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { CreateFuelTypeDto, UpdateFuelTypeDto } from "./dto";

@Injectable()
export class FuelTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const { skip = 0, take = 20, search, isActive } = params;

    const where: any = {
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    };

    const [total, fuelTypes] = await Promise.all([
      this.prisma.fuelType.count({ where }),
      this.prisma.fuelType.findMany({
        skip,
        take,
        where,
        orderBy: { name: "asc" },
      }),
    ]);

    return { total, fuelTypes };
  }

  async findOne(id: string) {
    const fuelType = await this.prisma.fuelType.findUnique({
      where: { id },
    });

    if (!fuelType) {
      throw new NotFoundException("Тип топлива не найден");
    }

    return fuelType;
  }

  async create(data: CreateFuelTypeDto) {
    const existing = await this.prisma.fuelType.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException("Тип топлива с таким кодом уже существует");
    }

    return this.prisma.fuelType.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateFuelTypeDto) {
    const fuelType = await this.prisma.fuelType.findUnique({ where: { id } });
    if (!fuelType) {
      throw new NotFoundException("Тип топлива не найден");
    }

    if (data.code && data.code !== fuelType.code) {
      const existing = await this.prisma.fuelType.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new ConflictException("Тип топлива с таким кодом уже существует");
      }
    }

    return this.prisma.fuelType.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const fuelType = await this.prisma.fuelType.findUnique({ where: { id } });
    if (!fuelType) {
      throw new NotFoundException("Тип топлива не найден");
    }

    return this.prisma.fuelType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleActive(id: string) {
    const fuelType = await this.prisma.fuelType.findUnique({ where: { id } });
    if (!fuelType) {
      throw new NotFoundException("Тип топлива не найден");
    }

    return this.prisma.fuelType.update({
      where: { id },
      data: { isActive: !fuelType.isActive },
    });
  }
}
