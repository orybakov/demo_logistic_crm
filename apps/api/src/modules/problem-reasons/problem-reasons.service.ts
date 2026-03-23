import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "@prisma/client";
import type { CreateProblemReasonDto, UpdateProblemReasonDto } from "./dto";

@Injectable()
export class ProblemReasonsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProblemReasonWhereInput;
    orderBy?: Prisma.ProblemReasonOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [total, reasons] = await Promise.all([
      this.prisma.problemReason.count({ where }),
      this.prisma.problemReason.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || [{ severity: "desc" }, { name: "asc" }],
      }),
    ]);

    return { total, reasons };
  }

  async findOne(id: string) {
    const reason = await this.prisma.problemReason.findUnique({
      where: { id },
    });

    if (!reason) {
      throw new NotFoundException("Причина проблемы не найдена");
    }

    return reason;
  }

  async create(data: CreateProblemReasonDto) {
    const existing = await this.prisma.problemReason.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException(
        "Причина проблемы с таким кодом уже существует",
      );
    }

    return this.prisma.problemReason.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category,
        severity: data.severity ?? "medium",
        requiresApproval: data.requiresApproval ?? false,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateProblemReasonDto) {
    const reason = await this.prisma.problemReason.findUnique({
      where: { id },
    });
    if (!reason) {
      throw new NotFoundException("Причина проблемы не найдена");
    }

    if (data.code && data.code !== reason.code) {
      const existing = await this.prisma.problemReason.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new ConflictException(
          "Причина проблемы с таким кодом уже существует",
        );
      }
    }

    return this.prisma.problemReason.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const reason = await this.prisma.problemReason.findUnique({
      where: { id },
    });
    if (!reason) {
      throw new NotFoundException("Причина проблемы не найдена");
    }

    return this.prisma.problemReason.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleActive(id: string) {
    const reason = await this.prisma.problemReason.findUnique({
      where: { id },
    });
    if (!reason) {
      throw new NotFoundException("Причина проблемы не найдена");
    }

    return this.prisma.problemReason.update({
      where: { id },
      data: { isActive: !reason.isActive },
    });
  }
}
