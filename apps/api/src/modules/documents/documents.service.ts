import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { createReadStream } from "fs";
import { mkdir, unlink, stat } from "fs/promises";
import { join, basename, extname } from "path";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../database/audit.service";
import {
  DOCUMENT_MIME_ALLOWLIST,
  DocumentEntityType,
  DocumentMetadataDto,
  DocumentQueryDto,
  DocumentUploadDto,
} from "./dto";

type CurrentUser = {
  id: string;
  roles?: string[];
  permissions?: Array<{ subject: string; action: string }>;
  isSuperadmin?: boolean;
};

export interface DocumentListItem {
  id: string;
  title: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum?: string | null;
  url: string;
  entityType?: string | null;
  entityId?: string | null;
  documentType?: string | null;
  category?: string | null;
  tags?: unknown;
  metadata?: unknown;
  description?: string | null;
  isConfidential: boolean;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  downloadUrl: string;
  previewUrl: string;
}

@Injectable()
export class DocumentsService {
  private readonly uploadRoot = join(process.cwd(), "uploads", "documents");

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: DocumentQueryDto, user: CurrentUser) {
    if (!query.entityType || !query.entityId) {
      throw new BadRequestException("entityType and entityId are required");
    }

    await this.assertEntityAccess(
      query.entityType,
      query.entityId,
      user,
      "read",
    );

    const page = query.page || 1;
    const take = query.take || 20;
    const skip = (page - 1) * take;

    const where: Prisma.FileWhereInput = {
      entityType: query.entityType,
      entityId: query.entityId,
      ...(query.q && {
        OR: [
          { title: { contains: query.q, mode: "insensitive" } },
          { originalName: { contains: query.q, mode: "insensitive" } },
          { description: { contains: query.q, mode: "insensitive" } },
        ],
      }),
    };

    const [total, files] = await Promise.all([
      this.prisma.file.count({ where }),
      this.prisma.file.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      take,
      totalPages: Math.max(1, Math.ceil(total / take)),
      files: files.map((file) => this.mapFile(file)),
    };
  }

  async upload(file: any, dto: DocumentUploadDto, user: CurrentUser) {
    if (!file) throw new BadRequestException("Файл не загружен");
    await this.assertEntityAccess(dto.entityType, dto.entityId, user, "create");

    this.validateFile(file.originalname, file.mimetype, file.size);

    const ext = extname(file.originalname).toLowerCase();
    const folder = join(this.uploadRoot, dto.entityType, dto.entityId);
    await mkdir(folder, { recursive: true });

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const storagePath = join(folder, fileName);
    if (file.path && file.path !== storagePath) {
      // Multer already persisted the file; keep path.
    }

    const checksum = await this.computeChecksum(file.path || storagePath);
    const record = await this.prisma.file.create({
      data: {
        title: dto.title,
        fileName,
        originalName: file.originalname,
        storagePath: file.path || storagePath,
        mimeType: file.mimetype,
        size: file.size,
        checksum,
        url: `/api/v1/documents/pending/download`,
        entityType: dto.entityType,
        entityId: dto.entityId,
        documentType: dto.documentType,
        category: dto.category,
        tags: dto.tags ? this.parseTags(dto.tags) : undefined,
        metadata: {
          uploadedById: user.id,
          source: "web",
        },
        description: dto.description,
        isConfidential: dto.isConfidential || false,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.auditService.log(
      "create",
      "file",
      record.id,
      { userId: user.id },
      undefined,
      { title: record.title },
    );
    const updated = await this.prisma.file.update({
      where: { id: record.id },
      data: { url: `/api/v1/documents/${record.id}/download` },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    return this.mapFile(updated);
  }

  async findOne(id: string, user: CurrentUser) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!file) throw new NotFoundException("Файл не найден");
    if (file.entityType && file.entityId) {
      await this.assertEntityAccess(
        file.entityType as DocumentEntityType,
        file.entityId,
        user,
        "read",
      );
    }
    return this.mapFile(file);
  }

  async updateMetadata(
    id: string,
    dto: DocumentMetadataDto,
    user: CurrentUser,
  ) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException("Файл не найден");
    if (file.entityType && file.entityId) {
      await this.assertEntityAccess(
        file.entityType as DocumentEntityType,
        file.entityId,
        user,
        "update",
      );
    }

    const updated = await this.prisma.file.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.documentType !== undefined && {
          documentType: dto.documentType,
        }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.tags !== undefined && { tags: this.parseTags(dto.tags) }),
        ...(dto.isConfidential !== undefined && {
          isConfidential: dto.isConfidential,
        }),
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.auditService.log(
      "update",
      "file",
      id,
      { userId: user.id },
      file as any,
      updated as any,
    );
    return this.mapFile(updated);
  }

  async remove(id: string, user: CurrentUser) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException("Файл не найден");
    if (file.entityType && file.entityId) {
      await this.assertEntityAccess(
        file.entityType as DocumentEntityType,
        file.entityId,
        user,
        "delete",
      );
    }

    await this.prisma.file.delete({ where: { id } });
    await unlink(file.storagePath).catch(() => undefined);
    await this.auditService.logDelete("file", file as any, { userId: user.id });
    return { success: true };
  }

  async streamFile(id: string, user: CurrentUser, inline = false) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException("Файл не найден");
    if (file.entityType && file.entityId) {
      await this.assertEntityAccess(
        file.entityType as DocumentEntityType,
        file.entityId,
        user,
        "read",
      );
    }

    const exists = await stat(file.storagePath).catch(() => null);
    if (!exists) throw new NotFoundException("Файл не найден на диске");

    return {
      path: file.storagePath,
      mimeType: file.mimeType,
      disposition: `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
      file: this.mapFile(file),
    };
  }

  private validateFile(originalName: string, mimeType: string, size: number) {
    if (size > 15 * 1024 * 1024) {
      throw new BadRequestException("Максимальный размер файла — 15 МБ");
    }
    const ext = extname(originalName).toLowerCase();
    const allowedExtensions = DOCUMENT_MIME_ALLOWLIST[mimeType];
    if (!allowedExtensions || !allowedExtensions.includes(ext)) {
      throw new BadRequestException("Неподдерживаемый формат файла");
    }
    if (/\.\./.test(originalName) || /[\\/]/.test(originalName)) {
      throw new BadRequestException("Некорректное имя файла");
    }
  }

  private parseTags(tags: string) {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }

  private async computeChecksum(path: string) {
    return new Promise<string>((resolve, reject) => {
      const hash = createHash("sha256");
      const stream = createReadStream(path);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  private mapFile(file: any): DocumentListItem {
    return {
      id: file.id,
      title: file.title,
      fileName: file.fileName,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      checksum: file.checksum,
      url: file.url,
      entityType: file.entityType,
      entityId: file.entityId,
      documentType: file.documentType,
      category: file.category,
      tags: file.tags,
      metadata: file.metadata,
      description: file.description,
      isConfidential: file.isConfidential,
      uploadedBy: file.uploadedBy || null,
      createdAt: file.createdAt.toISOString(),
      downloadUrl: `/api/v1/documents/${file.id}/download`,
      previewUrl: `/api/v1/documents/${file.id}/preview`,
    };
  }

  private async assertEntityAccess(
    entityType: DocumentEntityType,
    entityId: string,
    user: CurrentUser,
    action: "read" | "create" | "update" | "delete",
  ) {
    if (user.isSuperadmin) return;

    const hasPermission = (subject: string) =>
      user.permissions?.some(
        (p) =>
          p.subject === subject &&
          (p.action === action ||
            p.action === "manage" ||
            (action === "read" && p.action === "create")),
      );

    if (entityType === DocumentEntityType.REQUEST) {
      const request = await this.prisma.request.findUnique({
        where: { id: entityId },
        select: { id: true, createdById: true, assignedToId: true },
      });
      if (!request) throw new NotFoundException("Заявка не найдена");
      if (
        hasPermission("requests") ||
        [request.createdById, request.assignedToId].includes(user.id)
      )
        return;
    }

    if (entityType === DocumentEntityType.ORDER) {
      const order = await this.prisma.order.findUnique({
        where: { id: entityId },
        select: { id: true, createdById: true, assignedToId: true },
      });
      if (!order) throw new NotFoundException("Заказ не найден");
      if (
        hasPermission("orders") ||
        [order.createdById, order.assignedToId].includes(user.id)
      )
        return;
    }

    if (entityType === DocumentEntityType.TRIP) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          driverId: true,
          assignedById: true,
          completedById: true,
          request: { select: { createdById: true, assignedToId: true } },
        },
      });
      if (!trip) throw new NotFoundException("Рейс не найден");
      const ownerMatches = [
        trip.driverId,
        trip.assignedById,
        trip.completedById,
        trip.request.createdById,
        trip.request.assignedToId,
      ].includes(user.id);
      if (hasPermission("trips") || ownerMatches) return;
    }

    throw new ForbiddenException("Недостаточно прав для доступа к документу");
  }
}
