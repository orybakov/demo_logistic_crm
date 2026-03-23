import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.VehicleWhereInput;
    orderBy?: Prisma.VehicleOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [total, vehicles] = await Promise.all([
      this.prisma.vehicle.count({ where: { ...where, deletedAt: null } }),
      this.prisma.vehicle.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy: orderBy || { createdAt: "desc" },
        include: { filial: true },
      }),
    ]);

    return { total, vehicles };
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        filial: true,
        trips: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });

    if (!vehicle) {
      throw new NotFoundException("Транспортное средство не найдено");
    }

    return vehicle;
  }

  async findAvailable(filialId?: string) {
    return this.prisma.vehicle.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        status: "available",
        ...(filialId && { filialId }),
      },
      include: { filial: true },
      orderBy: { plateNumber: "asc" },
    });
  }

  async create(data: {
    plateNumber: string;
    brand: string;
    model?: string;
    year?: number;
    bodyType: string;
    capacityKg: Prisma.Decimal;
    capacityM3?: Prisma.Decimal;
    lengthM?: Prisma.Decimal;
    widthM?: Prisma.Decimal;
    heightM?: Prisma.Decimal;
    fuelType?: string;
    vin?: string;
    trailerNumber?: string;
    temperatureControl?: boolean;
    temperatureFrom?: Prisma.Decimal;
    temperatureTo?: Prisma.Decimal;
    mileage?: Prisma.Decimal;
    nextMaintenance?: Date;
    insuranceNumber?: string;
    insuranceExpires?: Date;
    photoUrl?: string;
    filialId?: string;
  }) {
    return this.prisma.vehicle.create({
      data,
      include: { filial: true },
    });
  }

  async update(
    id: string,
    data: Partial<{
      plateNumber: string;
      brand: string;
      model: string;
      year: number;
      bodyType: string;
      capacityKg: Prisma.Decimal;
      capacityM3: Prisma.Decimal;
      lengthM: Prisma.Decimal;
      widthM: Prisma.Decimal;
      heightM: Prisma.Decimal;
      fuelType: string;
      vin: string;
      trailerNumber: string;
      temperatureControl: boolean;
      temperatureFrom: Prisma.Decimal;
      temperatureTo: Prisma.Decimal;
      status: string;
      mileage: Prisma.Decimal;
      nextMaintenance: Date;
      insuranceNumber: string;
      insuranceExpires: Date;
      photoUrl: string;
      filialId: string;
      isActive: boolean;
    }>,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException("Транспортное средство не найдено");
    }

    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: { filial: true },
    });
  }

  async delete(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException("Транспортное средство не найдено");
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, status: "inactive" },
    });
  }
}
