import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "@prisma/client";
import type { CreateClassifierDto, UpdateClassifierDto } from "./dto";

@Injectable()
export class ClassifiersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ClassifierWhereInput;
    orderBy?: Prisma.ClassifierOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [total, classifiers] = await Promise.all([
      this.prisma.classifier.count({ where }),
      this.prisma.classifier.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: {
          parent: { select: { id: true, code: true, name: true } },
          children: {
            where: { isActive: true },
            select: { id: true, code: true, name: true, sortOrder: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      }),
    ]);

    return { total, classifiers };
  }

  async findOne(id: string) {
    const classifier = await this.prisma.classifier.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, code: true, name: true, type: true } },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!classifier) {
      throw new NotFoundException("Классификатор не найден");
    }

    return classifier;
  }

  async findByType(type: string) {
    const classifiers = await this.prisma.classifier.findMany({
      where: { type, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return classifiers;
  }

  async getTree() {
    const allClassifiers = await this.prisma.classifier.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const roots = allClassifiers.filter((c) => !c.parentId);
    return roots;
  }

  async create(data: CreateClassifierDto) {
    const existing = await this.prisma.classifier.findUnique({
      where: { type_code: { type: data.type, code: data.code } },
    });

    if (existing) {
      throw new ConflictException(
        "Классификатор с таким типом и кодом уже существует",
      );
    }

    return this.prisma.classifier.create({
      data: {
        type: data.type,
        code: data.code,
        name: data.name,
        description: data.description,
        value: data.value,
        parentId: data.parentId,
        isSystem: data.isSystem ?? false,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
      include: {
        parent: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async update(id: string, data: UpdateClassifierDto) {
    const classifier = await this.prisma.classifier.findUnique({
      where: { id },
    });
    if (!classifier) {
      throw new NotFoundException("Классификатор не найден");
    }

    if (data.type && data.code) {
      const existing = await this.prisma.classifier.findUnique({
        where: { type_code: { type: data.type, code: data.code } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          "Классификатор с таким типом и кодом уже существует",
        );
      }
    }

    return this.prisma.classifier.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  async delete(id: string) {
    const classifier = await this.prisma.classifier.findUnique({
      where: { id },
    });
    if (!classifier) {
      throw new NotFoundException("Классификатор не найден");
    }

    return this.prisma.classifier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleActive(id: string) {
    const classifier = await this.prisma.classifier.findUnique({
      where: { id },
    });
    if (!classifier) {
      throw new NotFoundException("Классификатор не найден");
    }

    return this.prisma.classifier.update({
      where: { id },
      data: { isActive: !classifier.isActive },
    });
  }
}
