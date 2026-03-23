import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "@prisma/client";
import type { CreateRecipientDto, UpdateRecipientDto } from "./dto";

@Injectable()
export class RecipientsService {
  constructor(private prisma: PrismaService) {}

  private normalizeInput<T extends Record<string, any>>(data: T) {
    const trim = (value: unknown) =>
      typeof value === "string" ? value.trim() : value;

    return {
      ...data,
      code: trim(data.code),
      name: trim(data.name),
      inn: trim(data.inn),
      kpp: trim(data.kpp),
      address: trim(data.address),
      city: trim(data.city),
      region: trim(data.region),
      postalCode: trim(data.postalCode),
      contactName: trim(data.contactName),
      contactPhone: trim(data.contactPhone),
      contactEmail: trim(data.contactEmail),
      notes: trim(data.notes),
      filialId: trim(data.filialId) || undefined,
    };
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.RecipientWhereInput;
    orderBy?: Prisma.RecipientOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [total, recipients] = await Promise.all([
      this.prisma.recipient.count({ where }),
      this.prisma.recipient.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: "desc" },
        include: {
          filial: true,
        },
      }),
    ]);

    return { total, recipients };
  }

  async findOne(id: string) {
    const recipient = await this.prisma.recipient.findUnique({
      where: { id },
      include: {
        filial: true,
      },
    });

    if (!recipient) {
      throw new NotFoundException("Грузополучатель не найден");
    }

    return recipient;
  }

  async findByCode(code: string) {
    return this.prisma.recipient.findUnique({
      where: { code },
    });
  }

  async create(data: CreateRecipientDto) {
    const normalized = this.normalizeInput(data);
    const existing = await this.prisma.recipient.findUnique({
      where: { code: normalized.code },
    });

    if (existing) {
      throw new ConflictException(
        "Грузополучатель с таким кодом уже существует",
      );
    }

    return this.prisma.recipient.create({
      data: normalized,
      include: {
        filial: true,
      },
    });
  }

  async update(id: string, data: UpdateRecipientDto) {
    const normalized = this.normalizeInput(data);
    const recipient = await this.prisma.recipient.findUnique({ where: { id } });
    if (!recipient) {
      throw new NotFoundException("Грузополучатель не найден");
    }

    if (normalized.code && normalized.code !== recipient.code) {
      const existing = await this.prisma.recipient.findUnique({
        where: { code: normalized.code },
      });
      if (existing) {
        throw new ConflictException(
          "Грузополучатель с таким кодом уже существует",
        );
      }
    }

    return this.prisma.recipient.update({
      where: { id },
      data: normalized,
      include: {
        filial: true,
      },
    });
  }

  async delete(id: string) {
    const recipient = await this.prisma.recipient.findUnique({ where: { id } });
    if (!recipient) {
      throw new NotFoundException("Грузополучатель не найден");
    }

    return this.prisma.recipient.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleActive(id: string) {
    const recipient = await this.prisma.recipient.findUnique({ where: { id } });
    if (!recipient) {
      throw new NotFoundException("Грузополучатель не найден");
    }

    return this.prisma.recipient.update({
      where: { id },
      data: { isActive: !recipient.isActive },
      include: {
        filial: true,
      },
    });
  }
}
