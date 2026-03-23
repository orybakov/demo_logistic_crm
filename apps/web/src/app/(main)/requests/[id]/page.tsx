'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
  ErrorState,
} from '@/components/ui';
import { StatusBadge, FlagBadge, PriorityBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/auth-context';
import { requestsApi } from '@/lib/api/requests';
import { DocumentsPanel } from '@/components/documents/documents-panel';
import {
  Request,
  RequestStatus,
  RequestPriority,
  RequestType,
  statusLabels,
  priorityLabels,
  typeLabels,
} from '@/lib/api/requests/types';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Truck,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  MessageSquare,
  History,
  Flag,
  Plus,
  X,
  ChevronRight,
  Package,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Pause,
  XCircle,
} from 'lucide-react';

const statusFlow: RequestStatus[] = [
  RequestStatus.NEW,
  RequestStatus.CONFIRMED,
  RequestStatus.IN_PROGRESS,
  RequestStatus.COMPLETED,
];

const statusIcons: Record<RequestStatus, typeof CheckCircle2> = {
  [RequestStatus.NEW]: AlertCircle,
  [RequestStatus.CONFIRMED]: CheckCircle2,
  [RequestStatus.IN_PROGRESS]: Truck,
  [RequestStatus.COMPLETED]: CheckCircle2,
  [RequestStatus.CANCELLED]: XCircle,
  [RequestStatus.ON_HOLD]: Pause,
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getNextStatuses(currentStatus: RequestStatus): RequestStatus[] {
  switch (currentStatus) {
    case RequestStatus.NEW:
      return [RequestStatus.CONFIRMED, RequestStatus.CANCELLED];
    case RequestStatus.CONFIRMED:
      return [RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED, RequestStatus.ON_HOLD];
    case RequestStatus.IN_PROGRESS:
      return [RequestStatus.COMPLETED, RequestStatus.ON_HOLD];
    case RequestStatus.ON_HOLD:
      return [RequestStatus.IN_PROGRESS];
    case RequestStatus.COMPLETED:
    case RequestStatus.CANCELLED:
      return [];
    default:
      return [];
  }
}

interface StatusTimelineProps {
  currentStatus: RequestStatus;
  statusHistory: Request['statusHistory'];
  onStatusChange?: (status: RequestStatus) => void;
  canChangeStatus?: boolean;
}

function StatusTimeline({
  currentStatus,
  statusHistory,
  onStatusChange,
  canChangeStatus = false,
}: StatusTimelineProps) {
  const nextStatuses = getNextStatuses(currentStatus);

  const getStatusDate = (status: RequestStatus): string | null => {
    const entry = statusHistory.find((h) => h.status === status);
    return entry?.changedAt || null;
  };

  const isStatusReached = (status: RequestStatus): boolean => {
    const statusIndex = statusFlow.indexOf(status);
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentStatus === RequestStatus.CANCELLED) {
      return status === RequestStatus.NEW || status === RequestStatus.CANCELLED;
    }
    return statusIndex <= currentIndex;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Жизненный цикл
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute bottom-2.5 left-[17px] top-2.5 w-0.5 bg-border" />
          <div className="space-y-6">
            {statusFlow.map((status, index) => {
              const Icon = statusIcons[status];
              const isReached = isStatusReached(status);
              const isCurrent = status === currentStatus;
              const statusDate = getStatusDate(status);

              return (
                <div key={status} className="relative flex items-start gap-4 pl-10">
                  <div
                    className={cn(
                      'absolute left-2 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-background',
                      isCurrent && 'border-primary ring-2 ring-primary/20',
                      isReached && !isCurrent && 'border-green-500 bg-green-500',
                      !isReached && 'border-muted-foreground/30'
                    )}
                  >
                    {isReached && !isCurrent && <CheckCircle2 className="h-3 w-3 text-white" />}
                    {isCurrent && <Icon className="h-3 w-3 text-primary" />}
                  </div>

                  <div className={cn('flex-1', !isReached && 'opacity-50')}>
                    <div className="flex items-center justify-between">
                      <span className={cn('font-medium', isCurrent && 'text-primary')}>
                        {statusLabels[status]}
                      </span>
                      {statusDate && (
                        <span className="text-sm text-muted-foreground">
                          {formatShortDate(statusDate)}
                        </span>
                      )}
                    </div>
                    {statusHistory.find((h) => h.status === status)?.changedBy && (
                      <p className="text-sm text-muted-foreground">
                        {statusHistory.find((h) => h.status === status)?.changedBy?.firstName}{' '}
                        {statusHistory.find((h) => h.status === status)?.changedBy?.lastName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {currentStatus === RequestStatus.CANCELLED && (
              <div className="relative flex items-start gap-4 pl-10">
                <div className="absolute left-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-destructive bg-destructive">
                  <XCircle className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-destructive">Отменена</span>
                  {statusHistory.find((h) => h.status === RequestStatus.CANCELLED) && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(
                          statusHistory.find((h) => h.status === RequestStatus.CANCELLED)
                            ?.changedAt || null
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {
                          statusHistory.find((h) => h.status === RequestStatus.CANCELLED)?.changedBy
                            ?.firstName
                        }{' '}
                        {
                          statusHistory.find((h) => h.status === RequestStatus.CANCELLED)?.changedBy
                            ?.lastName
                        }
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {canChangeStatus && nextStatuses.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Перейти в статус:</p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange?.(status)}
                  className={cn(
                    status === RequestStatus.CANCELLED && 'border-destructive text-destructive'
                  )}
                >
                  {statusLabels[status]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FlagsManagerProps {
  flags: string[];
  onAddFlag?: (flag: string) => void;
  onRemoveFlag?: (flag: string) => void;
  canManage?: boolean;
  availableFlags?: string[];
}

const availableFlagsList = [
  { value: 'urgent', label: 'Срочная' },
  { value: 'oversize', label: 'Негабарит' },
  { value: 'fragile', label: 'Хрупкий' },
  { value: 'temp', label: 'Температурный' },
  { value: 'hazmat', label: 'Опасный' },
  { value: 'express', label: 'Экспресс' },
];

function FlagsManager({ flags, onAddFlag, onRemoveFlag, canManage = false }: FlagsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState('');

  const unusedFlags = availableFlagsList.filter((f) => !flags.includes(f.value));

  const handleAdd = () => {
    if (selectedFlag) {
      onAddFlag?.(selectedFlag);
      setSelectedFlag('');
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Флаги
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {flags.map((flag) => (
            <Badge key={flag} variant="secondary" className="pr-1">
              <FlagBadge flag={flag} className="mr-1" />
              {canManage && (
                <button
                  onClick={() => onRemoveFlag?.(flag)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}

          {flags.length === 0 && <span className="text-sm text-muted-foreground">Нет флагов</span>}

          {canManage && !isAdding && unusedFlags.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="h-6">
              <Plus className="mr-1 h-3 w-3" />
              Добавить
            </Button>
          )}
        </div>

        {isAdding && (
          <div className="mt-3 flex gap-2">
            <Select value={selectedFlag} onValueChange={setSelectedFlag}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Выберите флаг" />
              </SelectTrigger>
              <SelectContent>
                {unusedFlags.map((flag) => (
                  <SelectItem key={flag.value} value={flag.value}>
                    {flag.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={!selectedFlag}>
              Добавить
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Отмена
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CommentsSectionProps {
  comments: Request['comments'];
  onAddComment?: (text: string) => void;
  canComment?: boolean;
}

function CommentsSection({ comments, onAddComment, canComment = false }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddComment?.(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Комментарии
          <Badge variant="secondary" className="ml-auto">
            {comments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {canComment && (
          <div className="mb-4 space-y-2">
            <Textarea
              placeholder="Добавить комментарий..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
              >
                Отправить
              </Button>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                  {comment.isSystem && (
                    <Badge variant="outline" className="text-xs">
                      Системный
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm">{comment.text}</p>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">Нет комментариев</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: RequestStatus;
  targetStatus: RequestStatus;
  onConfirm: (comment?: string) => void;
  isLoading?: boolean;
}

function StatusChangeModal({
  isOpen,
  onClose,
  currentStatus,
  targetStatus,
  onConfirm,
  isLoading = false,
}: StatusChangeModalProps) {
  const [comment, setComment] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изменение статуса</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={statusLabels[currentStatus]} />
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <StatusBadge status={statusLabels[targetStatus]} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-comment">Комментарий (необязательно)</Label>
            <Textarea
              id="status-comment"
              placeholder="Укажите причину изменения статуса..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={() => onConfirm(comment)} disabled={isLoading}>
            {isLoading ? 'Сохранение...' : 'Подтвердить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex justify-between', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function RequestDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [targetStatus, setTargetStatus] = useState<RequestStatus | null>(null);

  const canView = hasPermission('requests', 'read');
  const canEdit = hasPermission('requests', 'update');
  const canDelete = hasPermission('requests', 'delete');
  const canManage = hasPermission('requests', 'manage');
  const canChangeStatus = canEdit || canManage;
  const canComment = canView;

  const fetchRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, commentsResponse] = await Promise.all([
        requestsApi.getById(id),
        requestsApi.getComments(id),
      ]);
      setRequest({ ...data, comments: commentsResponse.comments });
    } catch (err) {
      console.error('Error fetching request:', err);
      setError('Не удалось загрузить данные заявки');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleStatusChange = (status: RequestStatus) => {
    setTargetStatus(status);
  };

  const handleStatusConfirm = async (comment?: string) => {
    if (!targetStatus || !request) return;

    setIsChangingStatus(true);
    try {
      await requestsApi.changeStatus(request.id, {
        status: targetStatus,
        comment,
      });
      toast({
        title: 'Статус изменен',
        description: `Заявка переведена в статус: ${statusLabels[targetStatus]}`,
      });
      setTargetStatus(null);
      await fetchRequest();
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err?.message || 'Не удалось изменить статус',
        variant: 'destructive',
      });
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleAddFlag = async (flag: string) => {
    if (!request) return;
    try {
      await requestsApi.addFlag(request.id, flag);
      fetchRequest();
      toast({ title: 'Флаг добавлен' });
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err?.message || 'Не удалось добавить флаг',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFlag = async (flag: string) => {
    if (!request) return;
    try {
      await requestsApi.removeFlag(request.id, flag);
      fetchRequest();
      toast({ title: 'Флаг удален' });
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err?.message || 'Не удалось удалить флаг',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async (text: string) => {
    if (!request) return;

    const pendingComment = text.trim();
    try {
      await requestsApi.addComment(request.id, pendingComment);
      const commentsResponse = await requestsApi.getComments(request.id);
      setRequest((current) =>
        current ? { ...current, comments: commentsResponse.comments } : current
      );
      toast({ title: 'Комментарий добавлен' });
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err?.message || 'Не удалось добавить комментарий',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <ErrorState
        title="Ошибка загрузки"
        message={error || 'Заявка не найдена'}
        onRetry={fetchRequest}
      />
    );
  }

  const points = Array.isArray(request.points) ? request.points : [];
  const pickupPoints = points.filter((p) => p.type === 'pickup');
  const deliveryPoints = points.filter((p) => p.type === 'delivery');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{request.number}</h1>
            <StatusBadge status={statusLabels[request.status]} />
            <PriorityBadge
              priority={request.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent'}
            />
          </div>
          <p className="text-muted-foreground">{request.client?.name || 'Клиент не указан'}</p>
        </div>
        <div className="flex gap-2">
          {(canEdit || canManage) && (
            <Button variant="outline" asChild>
              <Link href={`/requests/${request.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <StatusTimeline
            currentStatus={request.status}
            statusHistory={request.statusHistory}
            onStatusChange={handleStatusChange}
            canChangeStatus={canChangeStatus}
          />

          <FlagsManager
            flags={request.flags}
            onAddFlag={handleAddFlag}
            onRemoveFlag={handleRemoveFlag}
            canManage={canManage}
          />

          <InfoCard title="Время" icon={Clock}>
            <InfoRow label="Создана" value={formatDate(request.createdAt)} />
            <InfoRow label="Обновлена" value={formatDate(request.updatedAt)} />
            {request.confirmedAt && (
              <InfoRow label="Подтверждена" value={formatDate(request.confirmedAt)} />
            )}
            {request.completedAt && (
              <InfoRow label="Завершена" value={formatDate(request.completedAt)} />
            )}
          </InfoCard>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard title="Основная информация" icon={FileText}>
              <InfoRow
                label="Клиент"
                value={<span className="font-medium">{request.client?.name || '—'}</span>}
              />
              <InfoRow
                label="Тип"
                value={typeLabels[request.type as RequestType] || request.type}
              />
              <InfoRow label="Приоритет" value={priorityLabels[request.priority]} />
              {request.assignedTo && (
                <InfoRow
                  label="Ответственный"
                  value={`${request.assignedTo.firstName} ${request.assignedTo.lastName}`}
                />
              )}
              {request.createdBy && (
                <InfoRow
                  label="Создал"
                  value={`${request.createdBy.firstName} ${request.createdBy.lastName}`}
                />
              )}
            </InfoCard>

            <InfoCard title="Груз" icon={Package}>
              <InfoRow
                label="Вес"
                value={request.totalWeight ? `${request.totalWeight} кг` : '—'}
              />
              <InfoRow
                label="Объём"
                value={request.totalVolume ? `${request.totalVolume} м³` : '—'}
              />
              <InfoRow label="Мест" value={request.totalPieces || '—'} />
              {request.cargoItems.length > 0 && (
                <InfoRow label="Позиций" value={request.cargoItems.length} />
              )}
              {(request.temperatureFrom !== null || request.temperatureTo !== null) && (
                <InfoRow
                  label="Температура"
                  value={
                    request.temperatureFrom !== null && request.temperatureTo !== null
                      ? `${request.temperatureFrom}°C - ${request.temperatureTo}°C`
                      : request.temperatureFrom !== null
                        ? `от ${request.temperatureFrom}°C`
                        : request.temperatureTo !== null
                          ? `до ${request.temperatureTo}°C`
                          : '—'
                  }
                />
              )}
            </InfoCard>
          </div>

          <InfoCard title="Маршрут" icon={MapPin}>
            <div className="space-y-4">
              <div>
                <p className="mb-2 font-medium">Погрузка ({pickupPoints.length})</p>
                {pickupPoints.map((point) => (
                  <div key={point.id} className="rounded-lg border p-3">
                    <p className="font-medium">{point.address}</p>
                    {point.city && <p className="text-sm text-muted-foreground">{point.city}</p>}
                    {point.plannedDate && (
                      <p className="text-sm text-muted-foreground">
                        План: {formatShortDate(point.plannedDate)}
                      </p>
                    )}
                  </div>
                ))}
                {pickupPoints.length === 0 && (
                  <p className="text-sm text-muted-foreground">Нет точек погрузки</p>
                )}
              </div>

              <Separator />

              <div>
                <p className="mb-2 font-medium">Выгрузка ({deliveryPoints.length})</p>
                {deliveryPoints.map((point) => (
                  <div key={point.id} className="rounded-lg border p-3">
                    <p className="font-medium">{point.address}</p>
                    {point.city && <p className="text-sm text-muted-foreground">{point.city}</p>}
                    {point.plannedDate && (
                      <p className="text-sm text-muted-foreground">
                        План: {formatShortDate(point.plannedDate)}
                      </p>
                    )}
                  </div>
                ))}
                {deliveryPoints.length === 0 && (
                  <p className="text-sm text-muted-foreground">Нет точек выгрузки</p>
                )}
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Рейсы и транспорт" icon={Truck}>
            {request.trips.length > 0 ? (
              <div className="space-y-3">
                {request.trips.map((trip) => (
                  <div key={trip.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{trip.number}</span>
                      <StatusBadge status={trip.status} />
                    </div>
                    {trip.vehicle && (
                      <p className="mt-1 text-sm">
                        {trip.vehicle.plateNumber} {trip.vehicle.brand && `- ${trip.vehicle.brand}`}
                      </p>
                    )}
                    {trip.driver && (
                      <p className="text-sm text-muted-foreground">
                        {trip.driver.firstName} {trip.driver.lastName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет связанных рейсов</p>
            )}
          </InfoCard>

          {request.order && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Связанный заказ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{request.order.number}</p>
                    <p className="text-sm text-muted-foreground">
                      Сумма: {request.order.total?.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <StatusBadge status={request.order.paymentStatus} />
                </div>
              </CardContent>
            </Card>
          )}

          {request.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Примечания</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{request.notes}</p>
              </CardContent>
            </Card>
          )}

          <CommentsSection
            comments={request.comments}
            onAddComment={handleAddComment}
            canComment={canComment}
          />

          <DocumentsPanel entityType="request" entityId={request.id} />
        </div>
      </div>

      <StatusChangeModal
        isOpen={!!targetStatus}
        onClose={() => setTargetStatus(null)}
        currentStatus={request.status}
        targetStatus={targetStatus || request.status}
        onConfirm={handleStatusConfirm}
        isLoading={isChangingStatus}
      />
    </div>
  );
}

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  return <RequestDetailContent id={params.id} />;
}
