import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.DriverWhereInput;
    orderBy?: Prisma.DriverOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [total, drivers] = await Promise.all([
      this.prisma.driver.count({ where: { ...where, deletedAt: null } }),
      this.prisma.driver.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy: orderBy || { createdAt: "desc" },
        include: { filial: true },
      }),
    ]);

    return { total, drivers };
  }

  async findOne(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        filial: true,
        trips: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });

    if (!driver) {
      throw new NotFoundException("Водитель не найден");
    }

    return driver;
  }

  async findAvailable(filialId?: string) {
    return this.prisma.driver.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        status: "available",
        licenseExpires: { gt: new Date() },
        ...(filialId && { filialId }),
      },
      include: { filial: true },
      orderBy: { lastName: "asc" },
    });
  }

  async create(data: {
    employeeId: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    birthDate?: Date;
    phone: string;
    email?: string;
    photoUrl?: string;
    licenseNumber: string;
    licenseCategory: string;
    licenseExpires: Date;
    medicalCardNumber?: string;
    medicalCardExpires?: Date;
    notes?: string;
    filialId?: string;
  }) {
    return this.prisma.driver.create({
      data,
      include: { filial: true },
    });
  }

  async update(
    id: string,
    data: Partial<{
      employeeId: string;
      firstName: string;
      lastName: string;
      middleName: string;
      birthDate: Date;
      phone: string;
      email: string;
      photoUrl: string;
      licenseNumber: string;
      licenseCategory: string;
      licenseExpires: Date;
      medicalCardNumber: string;
      medicalCardExpires: Date;
      status: string;
      rating: Prisma.Decimal;
      notes: string;
      filialId: string;
      isActive: boolean;
    }>,
  ) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      throw new NotFoundException("Водитель не найден");
    }

    return this.prisma.driver.update({
      where: { id },
      data,
      include: { filial: true },
    });
  }

  async delete(id: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      throw new NotFoundException("Водитель не найден");
    }

    return this.prisma.driver.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, status: "inactive" },
    });
  }
}
