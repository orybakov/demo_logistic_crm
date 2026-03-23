import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class FilialsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    isActive?: boolean;
    orderBy?: Prisma.FilialOrderByWithRelationInput;
  }) {
    const { skip, take, search, isActive, orderBy } = params;

    const where: Prisma.FilialWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    };

    const [total, filials] = await Promise.all([
      this.prisma.filial.count({ where }),
      this.prisma.filial.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: "desc" },
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              vehicles: true,
              drivers: true,
              orders: true,
              requests: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      filials: filials.map((filial) => ({
        ...filial,
        usersCount: filial._count.users,
        clientsCount: filial._count.clients,
        vehiclesCount: filial._count.vehicles,
        driversCount: filial._count.drivers,
        ordersCount: filial._count.orders,
        requestsCount: filial._count.requests,
        _count: undefined,
      })),
    };
  }

  async findOne(id: string) {
    const filial = await this.prisma.filial.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: {
            users: true,
            clients: true,
            vehicles: true,
            drivers: true,
            contracts: true,
            requests: true,
            orders: true,
            locations: true,
            warehouses: true,
            tariffs: true,
            recipients: true,
          },
        },
      },
    });

    if (!filial) {
      throw new NotFoundException("Филиал не найден");
    }

    return {
      ...filial,
      usersCount: filial._count.users,
      clientsCount: filial._count.clients,
      vehiclesCount: filial._count.vehicles,
      driversCount: filial._count.drivers,
      contractsCount: filial._count.contracts,
      requestsCount: filial._count.requests,
      ordersCount: filial._count.orders,
      locationsCount: filial._count.locations,
      warehousesCount: filial._count.warehouses,
      tariffsCount: filial._count.tariffs,
      recipientsCount: filial._count.recipients,
      _count: undefined,
    };
  }

  async findByCode(code: string) {
    return this.prisma.filial.findUnique({
      where: { code },
    });
  }

  async create(data: {
    name: string;
    code: string;
    shortName?: string;
    address?: string;
    phone?: string;
    email?: string;
    isHead?: boolean;
    isActive?: boolean;
  }) {
    const existingFilial = await this.prisma.filial.findUnique({
      where: { code: data.code },
    });

    if (existingFilial) {
      throw new ConflictException("Филиал с таким кодом уже существует");
    }

    return this.prisma.filial.create({
      data,
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      code: string;
      shortName: string;
      address: string;
      phone: string;
      email: string;
      isHead: boolean;
      isActive: boolean;
    }>,
  ) {
    const filial = await this.prisma.filial.findUnique({ where: { id } });
    if (!filial) {
      throw new NotFoundException("Филиал не найден");
    }

    if (data.code && data.code !== filial.code) {
      const existingFilial = await this.prisma.filial.findUnique({
        where: { code: data.code },
      });
      if (existingFilial) {
        throw new ConflictException("Филиал с таким кодом уже существует");
      }
    }

    return this.prisma.filial.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const filial = await this.prisma.filial.findUnique({ where: { id } });
    if (!filial) {
      throw new NotFoundException("Филиал не найден");
    }

    return this.prisma.filial.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleActive(id: string) {
    const filial = await this.prisma.filial.findUnique({ where: { id } });
    if (!filial) {
      throw new NotFoundException("Филиал не найден");
    }

    return this.prisma.filial.update({
      where: { id },
      data: { isActive: !filial.isActive },
    });
  }
}
