'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
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
import { StatusBadge } from '@/components/ui/status-badge';
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
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-context';
import { ordersApi } from '@/lib/api/orders';
import { requestsApi } from '@/lib/api/requests';
import { DocumentsPanel } from '@/components/documents/documents-panel';
import {
  Order,
  OrderStatus,
  PaymentStatus,
  orderStatusLabels,
  paymentStatusLabels,
} from '@/lib/api/orders/types';
import type { Request as RequestModel } from '@/lib/api/requests/types';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  FileText,
  DollarSign,
  Building2,
  User,
  Calendar,
  Clock,
  Plus,
  Package,
  Receipt,
  Link2,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const statusFlow: OrderStatus[] = [
  OrderStatus.DRAFT,
  OrderStatus.CONFIRMED,
  OrderStatus.INVOICED,
  OrderStatus.PARTIALLY_PAID,
  OrderStatus.PAID,
];

const statusIcons: Record<OrderStatus, typeof CheckCircle2> = {
  [OrderStatus.DRAFT]: FileText,
  [OrderStatus.CONFIRMED]: CheckCircle2,
  [OrderStatus.INVOICED]: Receipt,
  [OrderStatus.PARTIALLY_PAID]: DollarSign,
  [OrderStatus.PAID]: CheckCircle2,
  [OrderStatus.CANCELLED]: XCircle,
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  switch (currentStatus) {
    case OrderStatus.DRAFT:
      return [OrderStatus.CONFIRMED, OrderStatus.CANCELLED];
    case OrderStatus.CONFIRMED:
      return [OrderStatus.INVOICED, OrderStatus.CANCELLED];
    case OrderStatus.INVOICED:
      return [OrderStatus.PARTIALLY_PAID, OrderStatus.PAID, OrderStatus.CANCELLED];
    case OrderStatus.PARTIALLY_PAID:
      return [OrderStatus.PAID, OrderStatus.CANCELLED];
    case OrderStatus.PAID:
    case OrderStatus.CANCELLED:
      return [];
    default:
      return [];
  }
}

interface InfoCardProps {
  title: string;
  icon: typeof FileText;
  children: React.ReactNode;
}

function InfoCard({ title, icon: Icon, children }: InfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
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

interface StatusTimelineProps {
  currentStatus: OrderStatus;
  statusHistory: Array<{
    status: string;
    changedAt: string | null;
    changedBy: { firstName: string; lastName: string } | null;
  }>;
  onStatusChange?: (status: OrderStatus) => void;
  canChangeStatus?: boolean;
}

function StatusTimeline({
  currentStatus,
  statusHistory,
  onStatusChange,
  canChangeStatus = false,
}: StatusTimelineProps) {
  const nextStatuses = getNextStatuses(currentStatus);

  const getStatusDate = (status: string): string | null => {
    const entry = statusHistory.find((h) => h.status === status);
    return entry?.changedAt || null;
  };

  const isStatusReached = (status: OrderStatus): boolean => {
    const statusIndex = statusFlow.indexOf(status);
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentStatus === OrderStatus.CANCELLED) {
      return status === OrderStatus.DRAFT || status === OrderStatus.CANCELLED;
    }
    return statusIndex <= currentIndex;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Жизненный цикл
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute bottom-2.5 left-[17px] top-2.5 w-0.5 bg-border" />
          <div className="space-y-6">
            {statusFlow.map((status) => {
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
                        {orderStatusLabels[status]}
                      </span>
                      {statusDate && (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(statusDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {currentStatus === OrderStatus.CANCELLED && (
              <div className="relative flex items-start gap-4 pl-10">
                <div className="absolute left-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-destructive bg-destructive">
                  <XCircle className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-destructive">Отменен</span>
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
                    status === OrderStatus.CANCELLED && 'border-destructive text-destructive'
                  )}
                >
                  {orderStatusLabels[status]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PaymentsSectionProps {
  payments: Order['payments'];
  paidAmount: number;
  total: number;
  onAddPayment?: () => void;
  canAddPayment?: boolean;
}

function PaymentsSection({
  payments,
  paidAmount,
  total,
  onAddPayment,
  canAddPayment = false,
}: PaymentsSectionProps) {
  const remainingAmount = total - paidAmount;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Платежи
          </CardTitle>
          {canAddPayment && remainingAmount > 0 && (
            <Button variant="outline" size="sm" onClick={onAddPayment}>
              <Plus className="mr-1 h-4 w-4" />
              Добавить платеж
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between rounded-lg bg-muted p-3">
          <div>
            <p className="text-sm text-muted-foreground">Оплачено</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Остаток</p>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(remainingAmount)}</p>
          </div>
        </div>

        {payments.length > 0 ? (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(payment.paymentDate)}
                    {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                  </p>
                </div>
                <StatusBadge
                  status={payment.status === 'completed' ? 'Оплачен' : 'В обработке'}
                  variant={payment.status === 'completed' ? 'success' : 'warning'}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Нет платежей</p>
        )}
      </CardContent>
    </Card>
  );
}

interface OrderItemsSectionProps {
  items: Order['items'];
}

function OrderItemsSection({ items }: OrderItemsSectionProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Позиции заказа
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Нет позиций в заказе</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Позиции заказа ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-2">Описание</th>
                <th className="pb-2 text-right">Кол-во</th>
                <th className="pb-2 text-right">Цена</th>
                <th className="pb-2 text-right">Сумма</th>
                <th className="pb-2 text-right">НДС</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="text-sm">
                  <td className="py-2">
                    <p className="font-medium">{item.description}</p>
                    {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                  </td>
                  <td className="py-2 text-right">
                    {item.quantity ? `${item.quantity} ${item.unit || 'шт.'}` : '—'}
                  </td>
                  <td className="py-2 text-right">{formatCurrency(item.pricePerUnit)}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                  <td className="py-2 text-right text-muted-foreground">
                    {item.vatRate ? `${item.vatRate}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface LinkedRequestsSectionProps {
  requests: Order['requests'];
  onLinkRequest?: () => void;
  canLink?: boolean;
}

function LinkedRequestsSection({
  requests,
  onLinkRequest,
  canLink = false,
}: LinkedRequestsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5" />
            Связанные заявки ({requests.length})
          </CardTitle>
          {canLink && (
            <Button variant="outline" size="sm" onClick={onLinkRequest}>
              <Plus className="mr-1 h-4 w-4" />
              Привязать заявку
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{request.number}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(request.createdAt)}</p>
                </div>
                <StatusBadge status={request.status} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Нет связанных заявок</p>
        )}
      </CardContent>
    </Card>
  );
}

interface LinkRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (requestId: string) => void;
  isLoading?: boolean;
  requests: Array<{ id: string; number: string; client?: { name: string } }>;
}

function LinkRequestModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  requests,
}: LinkRequestModalProps) {
  const [requestId, setRequestId] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Привязать заявку</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Заявка</Label>
            <Select value={requestId} onValueChange={setRequestId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите заявку" />
              </SelectTrigger>
              <SelectContent>
                {requests.map((request) => (
                  <SelectItem key={request.id} value={request.id}>
                    {request.number}
                    {request.client?.name ? ` • ${request.client.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={() => onConfirm(requestId)} disabled={!requestId || isLoading}>
            {isLoading ? 'Сохранение...' : 'Привязать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: OrderStatus;
  targetStatus: OrderStatus;
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
          <DialogTitle>Изменение статуса заказа</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={orderStatusLabels[currentStatus]} />
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <StatusBadge status={orderStatusLabels[targetStatus]} />
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

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }) => void;
  isLoading?: boolean;
  maxAmount: number;
}

function AddPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  maxAmount,
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState(maxAmount.toString());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    const amountNum = parseFloat(amount);
    if (amountNum <= 0 || amountNum > maxAmount) return;
    onConfirm({
      amount: amountNum,
      paymentDate,
      paymentMethod,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить платеж</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Сумма (максимум: {formatCurrency(maxAmount)})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Дата платежа</Label>
            <Input
              id="date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">Способ оплаты</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Безналичный перевод</SelectItem>
                <SelectItem value="cash">Наличные</SelectItem>
                <SelectItem value="card">Карта</SelectItem>
                <SelectItem value="other">Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              placeholder="Дополнительная информация..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Сохранение...' : 'Добавить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrderDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);
  const [showLinkRequestModal, setShowLinkRequestModal] = useState(false);
  const [isLinkingRequest, setIsLinkingRequest] = useState(false);
  const [availableRequests, setAvailableRequests] = useState<RequestModel[]>([]);

  const canEdit = hasPermission('orders', 'update');
  const canManage = hasPermission('orders', 'manage');
  const canChangeStatus = canEdit || canManage;

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getById(id);
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Не удалось загрузить данные заказа');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    let mounted = true;
    requestsApi
      .getList({ limit: 100 })
      .then((response) => {
        if (!mounted) return;
        const linkedIds = new Set((order?.requests || []).map((request) => request.id));
        setAvailableRequests(
          (response.requests || []).filter(
            (request) => !request.orderId && !linkedIds.has(request.id)
          )
        );
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [order]);

  const handleStatusChange = (status: OrderStatus) => {
    setTargetStatus(status);
  };

  const handleStatusConfirm = async (comment?: string) => {
    if (!targetStatus || !order) return;

    setIsChangingStatus(true);
    try {
      await ordersApi.changeStatus(order.id, {
        status: targetStatus,
        comment,
      });
      toast({
        title: 'Статус изменен',
        description: `Заказ переведен в статус: ${orderStatusLabels[targetStatus]}`,
      });
      setTargetStatus(null);
      fetchOrder();
    } catch (err) {
      console.error('Error changing status:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус заказа',
        variant: 'destructive',
      });
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleAddPayment = async (data: {
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }) => {
    if (!order) return;

    setIsAddingPayment(true);
    try {
      await ordersApi.addPayment(order.id, data);
      toast({
        title: 'Платеж добавлен',
        description: `Добавлен платеж на сумму ${formatCurrency(data.amount)}`,
      });
      fetchOrder();
    } catch (err) {
      console.error('Error adding payment:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить платеж',
        variant: 'destructive',
      });
    } finally {
      setIsAddingPayment(false);
    }
  };

  const handleLinkRequest = async (requestId: string) => {
    if (!order) return;

    setIsLinkingRequest(true);
    try {
      await ordersApi.linkRequest(order.id, requestId);
      toast({
        title: 'Заявка привязана',
      });
      setShowLinkRequestModal(false);
      fetchOrder();
    } catch (err) {
      console.error('Error linking request:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось привязать заявку',
        variant: 'destructive',
      });
    } finally {
      setIsLinkingRequest(false);
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

  if (error || !order) {
    return (
      <ErrorState
        title="Ошибка загрузки"
        message={error || 'Заказ не найден'}
        onRetry={fetchOrder}
      />
    );
  }

  const remainingAmount = order.total - order.paidAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/orders/list')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{order.number}</h1>
              <StatusBadge status={orderStatusLabels[order.status]} />
              <StatusBadge status={paymentStatusLabels[order.paymentStatus]} />
            </div>
            <p className="text-sm text-muted-foreground">
              от {formatDateTime(order.orderDate)}
              {order.filial && ` • ${order.filial.name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/orders/${order.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <OrderItemsSection items={order.items} />

          <LinkedRequestsSection
            requests={order.requests}
            canLink={canEdit || canManage}
            onLinkRequest={() => setShowLinkRequestModal(true)}
          />

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Примечания</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <InfoCard title="Сумма заказа" icon={DollarSign}>
            <div className="space-y-2">
              <InfoRow label="Подытог" value={formatCurrency(order.subtotal)} />
              <InfoRow label={`НДС (${order.vatRate}%)`} value={formatCurrency(order.vatAmount)} />
              <Separator />
              <InfoRow
                label="Итого"
                value={<span className="text-lg font-bold">{formatCurrency(order.total)}</span>}
              />
            </div>
          </InfoCard>

          <InfoCard title="Оплата" icon={Receipt}>
            <InfoRow label="Статус оплаты" value={paymentStatusLabels[order.paymentStatus]} />
            <InfoRow
              label="Оплачено"
              value={<span className="text-green-600">{formatCurrency(order.paidAmount)}</span>}
            />
            <InfoRow
              label="Остаток"
              value={
                <span className={cn(remainingAmount > 0 && 'text-yellow-600')}>
                  {formatCurrency(remainingAmount)}
                </span>
              }
            />
            {order.paymentDeadline && (
              <InfoRow label="Срок оплаты" value={formatDate(order.paymentDeadline)} />
            )}
            {order.paymentType && (
              <InfoRow
                label="Способ оплаты"
                value={order.paymentType === 'bank_transfer' ? 'Безналичный' : order.paymentType}
              />
            )}
          </InfoCard>

          <InfoCard title="Клиент" icon={Building2}>
            <div className="space-y-2">
              <p className="font-medium">{order.client?.name || '—'}</p>
              {order.client?.inn && (
                <p className="text-sm text-muted-foreground">ИНН: {order.client.inn}</p>
              )}
            </div>
          </InfoCard>

          <InfoCard title="Ответственные" icon={User}>
            {order.assignedTo && (
              <InfoRow
                label="Менеджер"
                value={`${order.assignedTo.firstName} ${order.assignedTo.lastName}`}
              />
            )}
            {order.createdBy && (
              <InfoRow
                label="Создал"
                value={`${order.createdBy.firstName} ${order.createdBy.lastName}`}
              />
            )}
          </InfoCard>

          <StatusTimeline
            currentStatus={order.status}
            statusHistory={[
              {
                status: order.status,
                changedAt: order.updatedAt,
                changedBy: order.createdBy
                  ? { firstName: order.createdBy.firstName, lastName: order.createdBy.lastName }
                  : null,
              },
            ]}
            onStatusChange={handleStatusChange}
            canChangeStatus={canChangeStatus}
          />

          <PaymentsSection
            payments={order.payments}
            paidAmount={order.paidAmount}
            total={order.total}
            onAddPayment={() => handleStatusChange(OrderStatus.PARTIALLY_PAID)}
            canAddPayment={canEdit || canManage}
          />

          <DocumentsPanel entityType="order" entityId={order.id} />
        </div>
      </div>

      <StatusChangeModal
        isOpen={!!targetStatus && targetStatus !== OrderStatus.PARTIALLY_PAID}
        onClose={() => setTargetStatus(null)}
        currentStatus={order.status}
        targetStatus={targetStatus || order.status}
        onConfirm={handleStatusConfirm}
        isLoading={isChangingStatus}
      />

      <LinkRequestModal
        isOpen={showLinkRequestModal}
        onClose={() => setShowLinkRequestModal(false)}
        onConfirm={handleLinkRequest}
        isLoading={isLinkingRequest}
        requests={availableRequests}
      />

      <AddPaymentModal
        isOpen={targetStatus === OrderStatus.PARTIALLY_PAID}
        onClose={() => setTargetStatus(null)}
        onConfirm={handleAddPayment}
        isLoading={isAddingPayment}
        maxAmount={remainingAmount}
      />
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetailContent id={params.id} />;
}
