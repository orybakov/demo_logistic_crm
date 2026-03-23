'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
  DataTable,
  DataTableFilters,
  DataTablePagination,
  DataTableRow,
  DataTableCell,
} from '@/components/ui';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { EmptyState, NoResults } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Eye, Edit, MoreHorizontal, FileText, DollarSign } from 'lucide-react';
import { ordersApi } from '@/lib/api/orders';
import {
  Order,
  OrderStatus,
  PaymentStatus,
  orderStatusLabels,
  paymentStatusLabels,
  type OrderFilters,
} from '@/lib/api/orders/types';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DEFAULT_PAGE_SIZE = 20;

const statusFilterOptions = [
  { label: 'Все статусы', value: 'all' },
  { label: 'Черновик', value: OrderStatus.DRAFT },
  { label: 'Подтвержден', value: OrderStatus.CONFIRMED },
  { label: 'Выставлен счет', value: OrderStatus.INVOICED },
  { label: 'Частично оплачен', value: OrderStatus.PARTIALLY_PAID },
  { label: 'Оплачен', value: OrderStatus.PAID },
  { label: 'Отменен', value: OrderStatus.CANCELLED },
];

const paymentStatusFilterOptions = [
  { label: 'Любая оплата', value: 'all' },
  { label: 'Не оплачен', value: PaymentStatus.UNPAID },
  { label: 'Частично оплачен', value: PaymentStatus.PARTIALLY_PAID },
  { label: 'Оплачен', value: PaymentStatus.PAID },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function OrdersListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
  } | null>(null);

  const currentPage = Number(searchParams.get('page')) || 1;
  const statusFilter = searchParams.get('status') || 'all';
  const paymentStatusFilter = searchParams.get('paymentStatus') || 'all';
  const searchQuery = searchParams.get('q') || '';

  const canCreate = hasPermission('orders', 'create');
  const canEdit = hasPermission('orders', 'update');
  const canManage = hasPermission('orders', 'manage');

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'all') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      if (updates.page === null || (updates.page === undefined && !updates.page)) {
        params.delete('page');
      }

      router.push(`/orders/list?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: OrderFilters = {
        page: currentPage,
        limit: DEFAULT_PAGE_SIZE,
        status: statusFilter as OrderStatus | 'all',
        paymentStatus: paymentStatusFilter as PaymentStatus | 'all',
        q: searchQuery || undefined,
      };

      const [ordersResponse, statsResponse] = await Promise.all([
        ordersApi.getList(filters),
        ordersApi.getStats(),
      ]);

      setOrders(ordersResponse.data);
      setTotalItems(ordersResponse.total);
      setStats(statsResponse);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Не удалось загрузить список заказов');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, paymentStatusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = useCallback(
    (value: string) => {
      updateSearchParams({ q: value || null, page: null });
    },
    [updateSearchParams]
  );

  const handleStatusFilter = useCallback(
    (value: string) => {
      updateSearchParams({ status: value, page: null });
    },
    [updateSearchParams]
  );

  const handlePaymentStatusFilter = useCallback(
    (value: string) => {
      updateSearchParams({ paymentStatus: value, page: null });
    },
    [updateSearchParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({ page: page.toString() });
    },
    [updateSearchParams]
  );

  const handleClearFilters = useCallback(() => {
    router.push('/orders/list');
  }, [router]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (paymentStatusFilter !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [statusFilter, paymentStatusFilter, searchQuery]);

  const totalPages = Math.ceil(totalItems / DEFAULT_PAGE_SIZE);

  const getStatusFromCount = (status: OrderStatus): number => {
    return stats?.byStatus?.[status] || 0;
  };

  if (error) {
    return <ErrorState title="Ошибка загрузки" message={error} onRetry={fetchOrders} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <div
          className={cn(
            'cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50',
            statusFilter === 'all' && !searchQuery && 'ring-2 ring-primary'
          )}
          onClick={() => handleStatusFilter('all')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Всего заказов</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Сумма заказов</p>
              <p className="text-2xl font-bold">{formatCurrency(stats?.totalAmount || 0)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Оплачено</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.paidAmount || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">К оплате</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats?.unpaidAmount || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        {Object.entries(OrderStatus).map(([key, value]) => {
          const count = getStatusFromCount(value as OrderStatus);
          if (count === 0 && value !== OrderStatus.DRAFT) return null;
          return (
            <div
              key={key}
              className={cn(
                'cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50',
                statusFilter === value && 'ring-2 ring-primary'
              )}
              onClick={() => handleStatusFilter(value)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {orderStatusLabels[value as OrderStatus]}
                  </p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <StatusBadge status={orderStatusLabels[value as OrderStatus]} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Коммерческие заказы</h1>
        {canCreate && (
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Новый заказ
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <DataTableFilters
          searchPlaceholder="Поиск по номеру, клиенту..."
          onSearch={handleSearch}
          filters={[
            {
              key: 'status',
              label: 'Статус заказа',
              options: statusFilterOptions,
              value: statusFilter,
              onChange: handleStatusFilter,
            },
            {
              key: 'paymentStatus',
              label: 'Статус оплаты',
              options: paymentStatusFilterOptions,
              value: paymentStatusFilter,
              onChange: handlePaymentStatusFilter,
            },
          ]}
          onRefresh={fetchOrders}
        />

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Активных фильтров: {activeFiltersCount}
            </span>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Сбросить
            </Button>
          </div>
        )}
      </div>

      {loading && (
        <DataTable>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </DataTable>
      )}

      {!loading && orders?.length === 0 && (
        <NoResults searchQuery={searchQuery} onClearSearch={handleClearFilters} />
      )}

      {!loading && orders?.length > 0 && (
        <DataTable>
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <DataTableRow key={order.id} onClick={() => router.push(`/orders/${order.id}`)}>
                <DataTableCell className="w-36">
                  <span className="font-mono font-medium">{order.number}</span>
                </DataTableCell>
                <DataTableCell>
                  <div>
                    <p className="font-medium">{order.client?.name || '—'}</p>
                    {order.client?.inn && (
                      <p className="text-xs text-muted-foreground">ИНН: {order.client.inn}</p>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell className="w-32">
                  <div className="text-sm">
                    <p>{formatDate(order.orderDate)}</p>
                    {order.paymentDeadline && (
                      <p className="text-xs text-muted-foreground">
                        Срок: {formatDate(order.paymentDeadline)}
                      </p>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell className="w-28">
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.total)}</p>
                    {order.paidAmount > 0 && order.paidAmount < order.total && (
                      <p className="text-xs text-muted-foreground">
                        Опл: {formatCurrency(order.paidAmount)}
                      </p>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <StatusBadge status={orderStatusLabels[order.status]} />
                </DataTableCell>
                <DataTableCell>
                  <StatusBadge status={paymentStatusLabels[order.paymentStatus]} />
                </DataTableCell>
                <DataTableCell className="w-20">
                  <div className="text-sm text-muted-foreground">
                    <p>{order._count?.requests || 0} заявок</p>
                    <p>{order._count?.items || 0} поз.</p>
                  </div>
                </DataTableCell>
                <DataTableCell className="w-20 justify-end">
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Просмотр
                        </DropdownMenuItem>
                        {(canEdit || canManage) && (
                          <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Редактировать
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </DataTableCell>
              </DataTableRow>
            ))}
          </div>

          <DataTablePagination
            totalItems={totalItems}
            pageSize={DEFAULT_PAGE_SIZE}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </DataTable>
      )}
    </div>
  );
}

export default function OrdersListPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg border bg-card" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      }
    >
      <OrdersListContent />
    </Suspense>
  );
}
