import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import * as request from "supertest";
import { promises as fs } from "fs";
import { join } from "path";
import { RoleCode } from "@prisma/client";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

describe("DocumentsController (integration)", () => {
  let app: INestApplication;
  let currentUser: any;
  let tempPath = "";

  const service = {
    list: jest.fn().mockResolvedValue({ total: 0, files: [] }),
    upload: jest.fn().mockResolvedValue({ id: "file-1" }),
    findOne: jest.fn().mockResolvedValue({ id: "file-1" }),
    updateMetadata: jest.fn().mockResolvedValue({ id: "file-1" }),
    remove: jest.fn().mockResolvedValue({ success: true }),
    streamFile: jest.fn().mockResolvedValue({
      path: "/tmp/doc.txt",
      mimeType: "text/plain",
      disposition: "attachment; filename*=UTF-8''doc.txt",
    }),
  } as any;

  beforeEach(async () => {
    currentUser = {
      id: "user-id",
      isSuperadmin: false,
      roles: [RoleCode.ADMIN],
      permissions: [],
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: service },
        RolesGuard,
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          context.switchToHttp().getRequest().user = currentUser;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    tempPath = join(process.cwd(), "documents-integration.txt");
    await fs.writeFile(tempPath, "document content");
  });

  afterEach(async () => {
    await app.close();
    await fs.unlink(tempPath).catch(() => undefined);
    jest.clearAllMocks();
  });

  it("lists documents for the current user", async () => {
    await request(app.getHttpServer())
      .get(
        "/api/v1/documents?entityType=request&entityId=123e4567-e89b-12d3-a456-426614174000",
      )
      .expect(200);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: "request" }),
      expect.objectContaining({ id: "user-id" }),
    );
  });

  it("uploads a document and passes the file to the service", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/documents/upload")
      .field("entityType", "request")
      .field("entityId", "123e4567-e89b-12d3-a456-426614174000")
      .field("title", "Integration doc")
      .attach("file", tempPath)
      .expect(201);

    expect(service.upload).toHaveBeenCalledWith(
      expect.objectContaining({ originalname: "documents-integration.txt" }),
      expect.objectContaining({ title: "Integration doc" }),
      expect.objectContaining({ id: "user-id" }),
    );
  });

  it("rejects invalid document ids before the service", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/documents/not-a-uuid")
      .expect(400);
  });
});
