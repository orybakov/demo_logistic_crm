'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
  ErrorState,
  Badge,
} from '@/components/ui';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { tripsApi } from '@/lib/api/trips';
import { Trip, TripComment, TripStatus, tripStatusLabels, Checkpoint } from '@/lib/api/trips/types';
import { DocumentsPanel } from '@/components/documents/documents-panel';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { ErrorBanner } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/error';
import {
  ArrowLeft,
  Edit,
  Truck,
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Package,
  Navigation,
  Fuel,
  MessageSquare,
  History,
  Plus,
} from 'lucide-react';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(dateStr: string | null | undefined): string {
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

interface StatusTimelineProps {
  currentStatus: string;
  statusHistory: Trip['statusHistory'];
  onStatusChange?: (status: TripStatus) => void;
  canChangeStatus?: boolean;
}

const statusFlow: TripStatus[] = [
  TripStatus.SCHEDULED,
  TripStatus.ASSIGNED,
  TripStatus.LOADING,
  TripStatus.IN_PROGRESS,
  TripStatus.UNLOADING,
  TripStatus.COMPLETED,
];

const statusIcons: Record<TripStatus, typeof CheckCircle2> = {
  [TripStatus.SCHEDULED]: Clock,
  [TripStatus.ASSIGNED]: User,
  [TripStatus.LOADING]: Package,
  [TripStatus.IN_PROGRESS]: Navigation,
  [TripStatus.UNLOADING]: Package,
  [TripStatus.COMPLETED]: CheckCircle2,
  [TripStatus.CANCELLED]: XCircle,
  [TripStatus.DELAYED]: Clock,
};

function StatusTimeline({
  currentStatus,
  statusHistory,
  onStatusChange,
  canChangeStatus = false,
}: StatusTimelineProps) {
  const currentStatusEnum = currentStatus as TripStatus;
  const currentIndex = statusFlow.indexOf(currentStatusEnum);

  const getNextStatuses = (): TripStatus[] => {
    switch (currentStatusEnum) {
      case TripStatus.SCHEDULED:
        return [TripStatus.ASSIGNED, TripStatus.CANCELLED];
      case TripStatus.ASSIGNED:
        return [TripStatus.LOADING, TripStatus.CANCELLED];
      case TripStatus.LOADING:
        return [TripStatus.IN_PROGRESS, TripStatus.DELAYED, TripStatus.CANCELLED];
      case TripStatus.IN_PROGRESS:
        return [TripStatus.UNLOADING, TripStatus.DELAYED, TripStatus.CANCELLED];
      case TripStatus.UNLOADING:
        return [TripStatus.COMPLETED];
      case TripStatus.DELAYED:
        return [TripStatus.IN_PROGRESS, TripStatus.UNLOADING];
      default:
        return [];
    }
  };

  const nextStatuses = getNextStatuses();

  const getStatusDate = (status: TripStatus): string | null => {
    const entry = statusHistory?.find((h) => h.status === status);
    return entry?.changedAt || null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
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
              const isReached = index <= currentIndex;
              const isCurrent = status === currentStatusEnum;
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
                        {tripStatusLabels[status]}
                      </span>
                      {statusDate && (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(statusDate)}
                        </span>
                      )}
                    </div>
                    {statusHistory?.find((h) => h.status === status)?.changedBy && (
                      <p className="text-sm text-muted-foreground">
                        {statusHistory.find((h) => h.status === status)?.changedBy?.firstName}{' '}
                        {statusHistory.find((h) => h.status === status)?.changedBy?.lastName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {currentStatusEnum === TripStatus.CANCELLED && (
              <div className="relative flex items-start gap-4 pl-10">
                <div className="absolute left-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-destructive bg-destructive">
                  <XCircle className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-destructive">Отменён</span>
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
                    status === TripStatus.CANCELLED && 'border-destructive text-destructive'
                  )}
                >
                  {tripStatusLabels[status]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CheckpointsListProps {
  checkpoints: Checkpoint[];
  tripStatus: TripStatus;
  onUpdateCheckpoint?: (checkpointId: string, isCompleted: boolean) => void;
  canUpdate?: boolean;
}

function CheckpointsList({
  checkpoints,
  tripStatus,
  onUpdateCheckpoint,
  canUpdate = false,
}: CheckpointsListProps) {
  const progress =
    checkpoints.length > 0
      ? Math.round((checkpoints.filter((c) => c.isCompleted).length / checkpoints.length) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Контрольные точки ({checkpoints.length})
          </CardTitle>
          <span className="text-sm text-muted-foreground">{progress}% выполнено</span>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        {checkpoints.length > 0 ? (
          <div className="space-y-3">
            {checkpoints.map((checkpoint, index) => (
              <div
                key={checkpoint.id}
                className={cn(
                  'flex items-start justify-between rounded-lg border p-4',
                  checkpoint.isCompleted &&
                    'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2',
                      checkpoint.isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {checkpoint.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={checkpoint.type === 'loading' ? 'default' : 'secondary'}>
                        {checkpoint.type === 'loading' ? 'Загрузка' : 'Выгрузка'}
                      </Badge>
                      <span className="font-medium">{checkpoint.name}</span>
                    </div>
                    {checkpoint.address && (
                      <p className="text-sm text-muted-foreground">{checkpoint.address}</p>
                    )}
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      {checkpoint.plannedTime && (
                        <span>План: {formatDateTime(checkpoint.plannedTime)}</span>
                      )}
                      {checkpoint.actualTime && (
                        <span className="text-green-600">
                          Факт: {formatDateTime(checkpoint.actualTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {canUpdate && !checkpoint.isCompleted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateCheckpoint?.(checkpoint.id, true)}
                  >
                    Выполнено
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Нет контрольных точек</p>
        )}
      </CardContent>
    </Card>
  );
}

interface CommentsSectionProps {
  comments: TripComment[];
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
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Комментарии ({comments.length})
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
                    {formatDateTime(comment.createdAt)}
                  </span>
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
  currentStatus: TripStatus;
  targetStatus: TripStatus;
  onConfirm: (comment?: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

function StatusChangeModal({
  isOpen,
  onClose,
  currentStatus,
  targetStatus,
  onConfirm,
  isLoading = false,
  errorMessage,
}: StatusChangeModalProps) {
  const [comment, setComment] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изменение статуса</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {errorMessage && <ErrorBanner message={errorMessage} />}
          <div className="flex items-center gap-2">
            <StatusBadge status={tripStatusLabels[currentStatus]} />
            <span className="text-muted-foreground">→</span>
            <StatusBadge status={tripStatusLabels[targetStatus]} />
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

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

function CancelModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  errorMessage,
}: CancelModalProps) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отмена рейса</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {errorMessage && <ErrorBanner message={errorMessage} />}
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Причина отмены *</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Укажите причину отмены рейса..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? 'Отмена...' : 'Отменить рейс'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TripDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [comments, setComments] = useState<TripComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TripStatus | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canEdit = hasPermission('trips', 'update');
  const canManage = hasPermission('trips', 'manage');
  const canChangeStatus = canEdit || canManage;

  const fetchTrip = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, commentsResponse] = await Promise.all([
        tripsApi.getById(id),
        tripsApi.getComments(id),
      ]);
      setTrip(data);
      setComments(commentsResponse.comments);
    } catch (err) {
      console.error('Error fetching trip:', err);
      setError('Не удалось загрузить данные рейса');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const handleStatusChange = (status: TripStatus) => {
    setActionError(null);
    setTargetStatus(status);
  };

  const handleStatusConfirm = async (comment?: string) => {
    if (!targetStatus || !trip) return;

    setIsChangingStatus(true);
    setActionError(null);
    try {
      await tripsApi.changeStatus(trip.id, {
        status: targetStatus,
        comment,
      });
      toast({
        title: 'Статус изменен',
        description: `Рейс переведён в статус: ${tripStatusLabels[targetStatus]}`,
      });
      setTargetStatus(null);
      fetchTrip();
    } catch (err: any) {
      console.error('Error changing status:', err);
      const message = getApiErrorMessage(err, 'Не удалось изменить статус рейса');
      setActionError(message);
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleCancel = async (reason: string) => {
    if (!trip) return;

    setIsChangingStatus(true);
    setActionError(null);
    try {
      await tripsApi.cancel(trip.id, reason);
      toast({
        title: 'Рейс отменён',
        description: 'Рейс был успешно отменён',
      });
      setShowCancelModal(false);
      fetchTrip();
    } catch (err: any) {
      console.error('Error cancelling trip:', err);
      const message = getApiErrorMessage(err, 'Не удалось отменить рейс');
      setActionError(message);
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleUpdateCheckpoint = async (checkpointId: string, isCompleted: boolean) => {
    if (!trip) return;

    try {
      await tripsApi.updateCheckpoint(trip.id, checkpointId, {
        actualTime: isCompleted ? new Date().toISOString() : undefined,
      });
      toast({
        title: 'Точка выполнена',
        description: 'Контрольная точка отмечена как выполненная',
      });
      fetchTrip();
    } catch (err: any) {
      console.error('Error updating checkpoint:', err);
      toast({
        title: 'Ошибка',
        description: err?.message || 'Не удалось обновить контрольную точку',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async (text: string) => {
    if (!trip) return;

    try {
      const comment = await tripsApi.addComment(trip.id, { text });
      setComments((current) => [comment, ...current]);
      toast({
        title: 'Комментарий добавлен',
      });
    } catch (err: any) {
      console.error('Error adding comment:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить комментарий',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <ErrorState title="Ошибка загрузки" message={error || 'Рейс не найден'} onRetry={fetchTrip} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/trips">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{trip.number}</h1>
              <StatusBadge status={tripStatusLabels[trip.status as TripStatus] || trip.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {trip.request && (
                <>
                  Заявка: {trip.request.number}
                  {trip.request.client && ` • ${trip.request.client.name}`}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canChangeStatus &&
            trip.status !== TripStatus.COMPLETED &&
            trip.status !== TripStatus.CANCELLED &&
            (!trip.vehicleId || !trip.driverId) && (
              <Button variant="outline" asChild>
                <Link href={`/trips/${trip.id}/assign`}>
                  <User className="mr-2 h-4 w-4" />
                  Назначить
                </Link>
              </Button>
            )}
          {canChangeStatus &&
            trip.status !== TripStatus.COMPLETED &&
            trip.status !== TripStatus.CANCELLED && (
              <>
                {[
                  'scheduled',
                  'assigned',
                  'loading',
                  'in_progress',
                  'unloading',
                  'delayed',
                ].includes(trip.status) && (
                  <Button variant="destructive" onClick={() => setShowCancelModal(true)}>
                    Отменить
                  </Button>
                )}
              </>
            )}
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/trips/${trip.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CheckpointsList
            checkpoints={trip.checkpoints || []}
            tripStatus={trip.status as TripStatus}
            onUpdateCheckpoint={handleUpdateCheckpoint}
            canUpdate={canChangeStatus}
          />

          <CommentsSection
            comments={comments}
            onAddComment={handleAddComment}
            canComment={canChangeStatus}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Водитель
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trip.driver ? (
                <div className="space-y-2">
                  <p className="font-medium">
                    {trip.driver.firstName} {trip.driver.lastName}
                  </p>
                  {trip.driver.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {trip.driver.phone}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Водитель не назначен</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5" />
                Транспорт
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trip.vehicle ? (
                <div className="space-y-2">
                  <p className="font-medium">{trip.vehicle.plateNumber}</p>
                  {trip.vehicle.brand && (
                    <p className="text-sm text-muted-foreground">
                      {trip.vehicle.brand} {trip.vehicle.model}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Транспорт не назначен</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Расписание
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">План. начало</span>
                <span className="font-medium">
                  {trip.plannedStart ? formatDateTime(trip.plannedStart) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">План. конец</span>
                <span className="font-medium">
                  {trip.plannedEnd ? formatDateTime(trip.plannedEnd) : '—'}
                </span>
              </div>
              {trip.actualStart && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Факт. начало</span>
                  <span className="font-medium text-green-600">
                    {formatDateTime(trip.actualStart)}
                  </span>
                </div>
              )}
              {trip.actualEnd && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Факт. конец</span>
                  <span className="font-medium text-green-600">
                    {formatDateTime(trip.actualEnd)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Расстояние</span>
                <span className="font-medium">
                  {trip.plannedDistance ? `${trip.plannedDistance} км` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Топливо</span>
                <span className="font-medium">
                  {trip.plannedFuel ? `${trip.plannedFuel} л` : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <StatusTimeline
            currentStatus={trip.status}
            statusHistory={trip.statusHistory}
            onStatusChange={handleStatusChange}
            canChangeStatus={canChangeStatus}
          />

          <div className="lg:sticky lg:top-6">
            <DocumentsPanel entityType="trip" entityId={trip.id} />
          </div>
        </div>
      </div>

      <StatusChangeModal
        isOpen={!!targetStatus}
        onClose={() => setTargetStatus(null)}
        currentStatus={trip.status as TripStatus}
        targetStatus={targetStatus || (trip.status as TripStatus)}
        onConfirm={handleStatusConfirm}
        isLoading={isChangingStatus}
        errorMessage={actionError}
      />

      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        isLoading={isChangingStatus}
        errorMessage={actionError}
      />
    </div>
  );
}

export default function TripDetailPage({ params }: { params: { id: string } }) {
  return <TripDetailContent id={params.id} />;
}
