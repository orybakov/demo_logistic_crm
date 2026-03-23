import { DocumentsService } from "./documents.service";

describe("DocumentsService", () => {
  const prisma = {
    file: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    request: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
    trip: { findUnique: jest.fn() },
  } as any;
  const audit = { log: jest.fn(), logDelete: jest.fn() } as any;
  const service = new DocumentsService(prisma, audit);

  beforeEach(() => jest.clearAllMocks());

  it("rejects oversized files", async () => {
    expect(() =>
      (service as any).validateFile(
        "test.pdf",
        "application/pdf",
        20 * 1024 * 1024,
      ),
    ).toThrow();
  });

  it("parses tags from csv or json", () => {
    expect((service as any).parseTags("a, b , c")).toEqual(["a", "b", "c"]);
    expect((service as any).parseTags('["a","b"]')).toEqual(["a", "b"]);
  });

  it("rejects invalid file names and types", () => {
    expect(() =>
      (service as any).validateFile("bad.exe", "application/pdf", 10),
    ).toThrow();
    expect(() =>
      (service as any).validateFile("../secret.txt", "text/plain", 10),
    ).toThrow();
  });

  it("returns a file when the current user owns the entity", async () => {
    prisma.file.findUnique.mockResolvedValue({
      id: "file-1",
      title: "Doc",
      fileName: "doc.txt",
      originalName: "doc.txt",
      storagePath: "/tmp/doc.txt",
      mimeType: "text/plain",
      size: 10,
      checksum: "sum",
      url: "/api/v1/documents/file-1/download",
      entityType: "request",
      entityId: "request-1",
      documentType: null,
      category: null,
      tags: [],
      metadata: {},
      description: null,
      isConfidential: false,
      uploadedBy: null,
      createdAt: new Date(),
    });
    prisma.request.findUnique.mockResolvedValue({
      id: "request-1",
      createdById: "user-1",
      assignedToId: null,
    });

    const result = await service.findOne("file-1", {
      id: "user-1",
      isSuperadmin: false,
      permissions: [],
    } as any);

    expect(result.id).toBe("file-1");
  });

  it("blocks access to another user's entity", async () => {
    prisma.file.findUnique.mockResolvedValue({
      id: "file-1",
      title: "Doc",
      fileName: "doc.txt",
      originalName: "doc.txt",
      storagePath: "/tmp/doc.txt",
      mimeType: "text/plain",
      size: 10,
      checksum: "sum",
      url: "/api/v1/documents/file-1/download",
      entityType: "request",
      entityId: "request-1",
      documentType: null,
      category: null,
      tags: [],
      metadata: {},
      description: null,
      isConfidential: false,
      uploadedBy: null,
      createdAt: new Date(),
    });
    prisma.request.findUnique.mockResolvedValue({
      id: "request-1",
      createdById: "owner-1",
      assignedToId: null,
    });

    await expect(
      service.findOne("file-1", {
        id: "user-2",
        isSuperadmin: false,
        permissions: [],
      } as any),
    ).rejects.toBeDefined();
  });
});
