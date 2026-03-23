import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { CreateVehicleTypeDto, UpdateVehicleTypeDto } from "./dto";

@Injectable()
export class VehicleTypesService {
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

    const [total, vehicleTypes] = await Promise.all([
      this.prisma.vehicleType.count({ where }),
      this.prisma.vehicleType.findMany({
        skip,
        take,
        where,
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return { total, vehicleTypes };
  }

  async findOne(id: string) {
    const vehicleType = await this.prisma.vehicleType.findUnique({
      where: { id },
    });

    if (!vehicleType) {
      throw new NotFoundException("Тип транспортного средства не найден");
    }

    return vehicleType;
  }

  async create(data: CreateVehicleTypeDto) {
    const existing = await this.prisma.vehicleType.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException(
        "Тип транспортного средства с таким кодом уже существует",
      );
    }

    return this.prisma.vehicleType.create({
      data: {
        ...data,
        category: data.category || "general",
        hasTrailer: data.hasTrailer ?? false,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, data: UpdateVehicleTypeDto) {
    const vehicleType = await this.prisma.vehicleType.findUnique({
      where: { id },
    });
    if (!vehicleType) {
      throw new NotFoundException("Тип транспортного средства не найден");
    }

    if (data.code && data.code !== vehicleType.code) {
      const existing = await this.prisma.vehicleType.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new ConflictException(
          "Тип транспортного средства с таким кодом уже существует",
        );
      }
    }

    return this.prisma.vehicleType.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const vehicleType = await this.prisma.vehicleType.findUnique({
      where: { id },
    });
    if (!vehicleType) {
      throw new NotFoundException("Тип транспортного средства не найден");
    }

    return this.prisma.vehicleType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleActive(id: string) {
    const vehicleType = await this.prisma.vehicleType.findUnique({
      where: { id },
    });
    if (!vehicleType) {
      throw new NotFoundException("Тип транспортного средства не найден");
    }

    return this.prisma.vehicleType.update({
      where: { id },
      data: { isActive: !vehicleType.isActive },
    });
  }
}
