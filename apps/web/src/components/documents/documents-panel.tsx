'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { documentsApi } from '@/lib/api/documents';
import type { DocumentEntityType, DocumentListItem } from '@/lib/api/documents/types';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Upload, Download, Eye, Trash2, Shield } from 'lucide-react';

export function DocumentsPanel({
  entityType,
  entityId,
}: {
  entityType: DocumentEntityType;
  entityId: string;
}) {
  const [files, setFiles] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '',
    description: '',
    documentType: '',
    category: '',
    tags: '',
    isConfidential: false,
  });

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentsApi.list(entityType, entityId, { take: 100 });
      setFiles(res.files);
    } catch (error) {
      toast({
        title: 'Документы',
        description: error instanceof Error ? error.message : 'Не удалось загрузить вложения',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, toast]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  async function upload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await documentsApi.upload(selectedFile, {
        entityType,
        entityId,
        title: form.title || selectedFile.name,
        description: form.description || undefined,
        documentType: form.documentType || undefined,
        category: form.category || undefined,
        tags: form.tags || undefined,
        isConfidential: form.isConfidential,
      });
      setSelectedFile(null);
      setForm({
        title: '',
        description: '',
        documentType: '',
        category: '',
        tags: '',
        isConfidential: false,
      });
      toast({ title: 'Документ загружен' });
      await loadFiles();
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: error instanceof Error ? error.message : 'Не удалось загрузить файл',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  async function openBlob(kind: 'download' | 'preview', file: DocumentListItem) {
    const blob =
      kind === 'download'
        ? await documentsApi.downloadBlob(file.id)
        : await documentsApi.previewBlob(file.id);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  async function remove(id: string) {
    await documentsApi.delete(id);
    await loadFiles();
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Вложения
        </CardTitle>
        <CardDescription>Файлы, привязанные к этому объекту</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.35fr]">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Добавить файл</p>
                <p className="text-xs text-muted-foreground">Заполните поля и выберите документ</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {selectedFile ? 'Файл выбран' : 'Черновик'}
              </Badge>
            </div>
            <div className="space-y-3">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Название документа"
              />
              <Input
                value={form.documentType}
                onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                placeholder="Тип документа"
              />
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Категория"
              />
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Теги (json или строка)"
              />
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Описание"
              />
              <label className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <Checkbox
                  checked={form.isConfidential}
                  onCheckedChange={(checked) => setForm({ ...form, isConfidential: !!checked })}
                />
                Конфиденциальный файл
              </label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
              />
              <Button className="w-full" onClick={upload} disabled={!selectedFile || uploading}>
                <Upload className="mr-2 h-4 w-4" />
                Загрузить
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{loading ? 'Загрузка...' : `${files.length} файлов`}</span>
                <span>•</span>
                <span>Общий размер: {formatSize(totalSize)}</span>
              </div>
              <Badge variant="secondary">Хранилище</Badge>
            </div>
            <Separator />
            <div className="mt-4 space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group rounded-xl border bg-background p-3 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{file.title}</p>
                        {file.isConfidential && (
                          <Badge variant="destructive">
                            <Shield className="mr-1 h-3 w-3" />
                            Конф.
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{file.originalName}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{formatSize(file.size)}</Badge>
                        <Badge variant="outline">{file.documentType || 'Тип не указан'}</Badge>
                        <Badge variant="outline">
                          {new Date(file.createdAt).toLocaleDateString('ru-RU')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1 sm:justify-end">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openBlob('preview', file)}
                        aria-label={`Открыть ${file.title}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openBlob('download', file)}
                        aria-label={`Скачать ${file.title}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(file.downloadUrl)}
                        aria-label={`Скопировать ссылку на ${file.title}`}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => remove(file.id)}
                        aria-label={`Удалить ${file.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {files.length === 0 && (
                <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                  Вложений пока нет
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
