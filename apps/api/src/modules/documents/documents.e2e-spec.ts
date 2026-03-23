import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from "@nestjs/common";
import * as request from "supertest";
import { promises as fs } from "fs";
import { join } from "path";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../database/prisma.service";

describe("Documents (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken = "";
  let driverToken = "";
  let requestId = "";
  let fileId = "";
  let tempPath = "";
  let badPath = "";
  let driverUserId = "";
  let tempRequestId = "";

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: "1",
      prefix: "v",
    });
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);

    const login = async (email: string, password: string) => {
      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email, password })
        .expect(200);
      return res.body.accessToken as string;
    };

    adminToken = await login("admin@logistics.local", "password123");

    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@logistics.local" },
    });
    if (!adminUser) throw new Error("Admin user not found");

    const driverRole = await prisma.role.findUnique({
      where: { code: "DRIVER" },
    });
    if (!driverRole) throw new Error("DRIVER role not found");

    const driverUser = await prisma.user.create({
      data: {
        email: `driver-${Date.now()}@example.com`,
        passwordHash: "client-password-hash",
        firstName: "Driver",
        lastName: "User",
        roles: { create: { roleId: driverRole.id } },
      },
    });
    driverUserId = driverUser.id;

    const bcrypt = await import("bcrypt");
    await prisma.user.update({
      where: { id: driverUser.id },
      data: { passwordHash: await bcrypt.hash("password123", 10) },
    });
    driverToken = await login(driverUser.email, "password123");

    const client = await prisma.client.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!client) throw new Error("No client seed found");

    const createdRequest = await prisma.request.create({
      data: {
        number: `E2E-REQ-${Date.now()}`,
        clientId: client.id,
        createdById: adminUser.id,
        status: "new",
        priority: "normal",
        flags: [],
      },
    });
    tempRequestId = createdRequest.id;
    requestId = createdRequest.id;

    tempPath = join(process.cwd(), "test-document.txt");
    await fs.writeFile(tempPath, "document content");

    badPath = join(process.cwd(), "test-document.bin");
    await fs.writeFile(badPath, "binary-ish content");
  });

  afterAll(async () => {
    if (fileId)
      await prisma.file
        .delete({ where: { id: fileId } })
        .catch(() => undefined);
    if (driverUserId)
      await prisma.user
        .delete({ where: { id: driverUserId } })
        .catch(() => undefined);
    if (tempRequestId)
      await prisma.request
        .delete({ where: { id: tempRequestId } })
        .catch(() => undefined);
    if (tempPath) await fs.unlink(tempPath).catch(() => undefined);
    if (badPath) await fs.unlink(badPath).catch(() => undefined);
    await app.close();
  });

  it("uploads and lists attachments for a request", async () => {
    const upload = await request(app.getHttpServer())
      .post("/api/v1/documents/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("entityType", "request")
      .field("entityId", requestId)
      .field("title", "E2E document")
      .attach("file", tempPath)
      .expect(201);

    fileId = upload.body.id;
    expect(upload.body.title).toBe("E2E document");

    const list = await request(app.getHttpServer())
      .get(`/api/v1/documents?entityType=request&entityId=${requestId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(list.body.total).toBeGreaterThan(0);
  });

  it("denies document access for unauthorized client role", async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/documents/${fileId}/download`)
      .set("Authorization", `Bearer ${driverToken}`)
      .expect(403);
  });

  it("rejects unsupported upload formats", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/documents/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("entityType", "request")
      .field("entityId", requestId)
      .field("title", "Bad file")
      .attach("file", badPath)
      .expect(400);
  });

  it("rejects invalid document ids", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/documents/not-a-uuid")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);
  });
});
