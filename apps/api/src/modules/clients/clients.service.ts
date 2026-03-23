import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ClientWhereInput;
    orderBy?: Prisma.ClientOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [total, clients] = await Promise.all([
      this.prisma.client.count({ where: { ...where, deletedAt: null } }),
      this.prisma.client.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy: orderBy || { createdAt: "desc" },
        include: {
          filial: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return { total, clients };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        filial: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        orders: { take: 5, orderBy: { createdAt: "desc" } },
        requests: { take: 5, orderBy: { createdAt: "desc" } },
        contracts: { where: { deletedAt: null } },
      },
    });

    if (!client) {
      throw new NotFoundException("Клиент не найден");
    }

    return client;
  }

  async findByInn(inn: string) {
    return this.prisma.client.findUnique({
      where: { inn },
    });
  }

  async create(data: {
    type: string;
    name: string;
    inn: string;
    kpp?: string;
    ogrn?: string;
    legalAddress?: string;
    postalAddress?: string;
    phone?: string;
    email?: string;
    website?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    clientGroup?: string;
    creditLimit?: Prisma.Decimal;
    paymentDays?: number;
    filialId?: string;
    createdById: string;
  }) {
    return this.prisma.client.create({
      data,
      include: {
        filial: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      type: string;
      name: string;
      inn: string;
      kpp: string;
      ogrn: string;
      legalAddress: string;
      postalAddress: string;
      phone: string;
      email: string;
      website: string;
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      clientGroup: string;
      creditLimit: Prisma.Decimal;
      paymentDays: number;
      filialId: string;
      isActive: boolean;
    }>,
  ) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException("Клиент не найден");
    }

    return this.prisma.client.update({
      where: { id },
      data,
      include: {
        filial: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException("Клиент не найден");
    }

    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
