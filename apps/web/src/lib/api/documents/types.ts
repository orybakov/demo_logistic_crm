export type DocumentEntityType = 'request' | 'order' | 'trip';

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
  uploadedBy?: { id: string; firstName: string; lastName: string; email: string } | null;
  createdAt: string;
  downloadUrl: string;
  previewUrl: string;
}

export interface DocumentListResponse {
  total: number;
  page: number;
  take: number;
  totalPages: number;
  files: DocumentListItem[];
}

export interface DocumentUploadDto {
  entityType: DocumentEntityType;
  entityId: string;
  title: string;
  description?: string;
  documentType?: string;
  category?: string;
  tags?: string;
  isConfidential?: boolean;
}

export interface DocumentMetadataDto {
  title?: string;
  description?: string;
  documentType?: string;
  category?: string;
  tags?: string;
  isConfidential?: boolean;
}
