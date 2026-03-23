import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  BadRequestException,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  Body,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import type { Response } from "express";
import { extname, join, basename } from "path";
import { mkdirSync } from "fs";
import { RoleCode } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { DocumentsService } from "./documents.service";
import {
  DocumentMetadataDto,
  DocumentQueryDto,
  DocumentUploadDto,
  DOCUMENT_MAX_SIZE,
} from "./dto";

function sanitize(name: string) {
  const ext = extname(name);
  const base = basename(name, ext)
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return `${base || "file"}${ext.toLowerCase()}`;
}

@Controller({ path: "documents", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  RoleCode.ADMIN,
  RoleCode.MANAGER,
  RoleCode.DISPATCHER,
  RoleCode.SALES,
  RoleCode.OPERATOR,
  RoleCode.DRIVER,
  RoleCode.CLIENT,
)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list(@Query() query: DocumentQueryDto, @CurrentUser() user: any) {
    return this.documentsService.list(query, user);
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const body = req.body as any;
          const folder = join(
            process.cwd(),
            "uploads",
            "documents",
            body.entityType || "misc",
            body.entityId || "temp",
          );
          mkdirSync(folder, { recursive: true });
          cb(null, folder);
        },
        filename: (req: any, file: any, cb: any) =>
          cb(null, sanitize(file.originalname)),
      }),
      limits: { fileSize: DOCUMENT_MAX_SIZE, files: 1 },
      fileFilter: (req: any, file: any, cb: any) => {
        const allowed = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/webp",
          "text/plain",
          "text/csv",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "application/zip",
          "application/x-zip-compressed",
        ];
        if (!allowed.includes(file.mimetype))
          return cb(
            new BadRequestException("Неподдерживаемый формат файла"),
            false,
          );
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: any,
    @Body() dto: DocumentUploadDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.upload(file, dto, user);
  }

  @Get(":id")
  getOne(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.documentsService.findOne(id, user);
  }

  @Put(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: DocumentMetadataDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.updateMetadata(id, dto, user);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.documentsService.remove(id, user);
  }

  @Get(":id/download")
  async download(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const file = await this.documentsService.streamFile(id, user, false);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", file.disposition);
    return res.sendFile(file.path);
  }

  @Get(":id/preview")
  async preview(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const file = await this.documentsService.streamFile(id, user, true);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", file.disposition);
    return res.sendFile(file.path);
  }
}
