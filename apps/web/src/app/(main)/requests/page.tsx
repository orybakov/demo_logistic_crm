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
import { StatusBadge, FlagBadge, PriorityBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, NoResults } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MapPin, FileText, Eye, Edit, MoreHorizontal } from 'lucide-react';
import { requestsApi } from '@/lib/api/requests';
import {
  Request,
  RequestStatus,
  RequestPriority,
  statusLabels,
  type RequestFilters,
} from '@/lib/api/requests/types';
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
  { label: 'Новая', value: RequestStatus.NEW },
  { label: 'Подтверждена', value: RequestStatus.CONFIRMED },
  { label: 'В работе', value: RequestStatus.IN_PROGRESS },
  { label: 'Завершена', value: RequestStatus.COMPLETED },
  { label: 'Отменена', value: RequestStatus.CANCELLED },
  { label: 'На паузе', value: RequestStatus.ON_HOLD },
];

const priorityFilterOptions = [
  { label: 'Любая', value: 'all' },
  { label: 'Низкий', value: RequestPriority.LOW },
  { label: 'Обычный', value: RequestPriority.NORMAL },
  { label: 'Высокий', value: RequestPriority.HIGH },
  { label: 'Срочный', value: RequestPriority.URGENT },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function getPickupPoint(points?: Request['points']): string | null {
  return points?.find((p) => p.type === 'pickup')?.city || null;
}

function getDeliveryPoint(points?: Request['points']): string | null {
  return points?.find((p) => p.type === 'delivery')?.city || null;
}

function RequestsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number> } | null>(
    null
  );

  const currentPage = Number(searchParams.get('page')) || 1;
  const statusFilter = searchParams.get('status') || 'all';
  const priorityFilter = searchParams.get('priority') || 'all';
  const searchQuery = searchParams.get('q') || '';

  const canCreate = hasPermission('requests', 'create');
  const canEdit = hasPermission('requests', 'update');
  const canManage = hasPermission('requests', 'manage');

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

      router.push(`/requests?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: RequestFilters = {
        page: currentPage,
        limit: DEFAULT_PAGE_SIZE,
        status: statusFilter as RequestStatus | 'all',
        priority: priorityFilter as RequestPriority | 'all',
        q: searchQuery || undefined,
      };

      const [requestsResponse, statsResponse] = await Promise.all([
        requestsApi.getList(filters),
        requestsApi.getStats(),
      ]);

      setRequests(requestsResponse.requests);
      setTotalItems(requestsResponse.total);
      setStats(statsResponse);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Не удалось загрузить список заявок');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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

  const handlePriorityFilter = useCallback(
    (value: string) => {
      updateSearchParams({ priority: value, page: null });
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
    router.push('/requests');
  }, [router]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [statusFilter, priorityFilter, searchQuery]);

  const totalPages = Math.ceil(totalItems / DEFAULT_PAGE_SIZE);

  const getStatusFromCount = (status: RequestStatus): number => {
    return stats?.byStatus?.[status] || 0;
  };

  if (error) {
    return <ErrorState title="Ошибка загрузки" message={error} onRetry={fetchRequests} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div
          className={cn(
            'cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50',
            statusFilter === 'all' && !searchQuery && 'ring-2 ring-primary'
          )}
          onClick={() => handleStatusFilter('all')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Всего заявок</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        {Object.entries(RequestStatus).map(([key, value]) => {
          const count = getStatusFromCount(value as RequestStatus);
          if (count === 0 && value !== RequestStatus.NEW) return null;
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
                    {statusLabels[value as RequestStatus]}
                  </p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <StatusBadge status={statusLabels[value as RequestStatus]} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Заявки на перевозку</h1>
        {canCreate && (
          <Button asChild>
            <Link href="/requests/new">
              <Plus className="mr-2 h-4 w-4" />
              Новая заявка
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
              label: 'Статус',
              options: statusFilterOptions,
              value: statusFilter,
              onChange: handleStatusFilter,
            },
            {
              key: 'priority',
              label: 'Приоритет',
              options: priorityFilterOptions,
              value: priorityFilter,
              onChange: handlePriorityFilter,
            },
          ]}
          onRefresh={fetchRequests}
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
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </DataTable>
      )}

      {!loading && requests?.length === 0 && (
        <NoResults searchQuery={searchQuery} onClearSearch={handleClearFilters} />
      )}

      {!loading && requests?.length > 0 && (
        <DataTable>
          <div className="divide-y divide-border">
            {requests.map((request) => (
              <DataTableRow key={request.id} onClick={() => router.push(`/requests/${request.id}`)}>
                <DataTableCell className="w-32">
                  <span className="font-mono font-medium">{request.number}</span>
                </DataTableCell>
                <DataTableCell>
                  <div>
                    <p className="font-medium">{request.client?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {request._count?.trips || 0} рейсов
                    </p>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {getPickupPoint(request.points) || '—'}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground">
                      {getDeliveryPoint(request.points) || '—'}
                    </span>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <StatusBadge status={statusLabels[request.status]} />
                </DataTableCell>
                <DataTableCell>
                  <PriorityBadge
                    priority={
                      request.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent'
                    }
                  />
                </DataTableCell>
                <DataTableCell className="w-40">
                  <div className="flex flex-wrap gap-1">
                    {request.flags.slice(0, 3).map((flag) => (
                      <FlagBadge key={flag} flag={flag} />
                    ))}
                    {request.flags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{request.flags.length - 3}
                      </Badge>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell className="w-32">
                  <div className="text-sm text-muted-foreground">
                    <p>{formatDate(request.createdAt)}</p>
                    {request.assignedTo && (
                      <p className="text-xs">
                        {request.assignedTo.lastName} {request.assignedTo.firstName?.[0]}.
                      </p>
                    )}
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
                        <DropdownMenuItem onClick={() => router.push(`/requests/${request.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Просмотр
                        </DropdownMenuItem>
                        {(canEdit || canManage) && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/requests/${request.id}/edit`)}
                          >
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

export default function RequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg border bg-card" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      }
    >
      <RequestsListContent />
    </Suspense>
  );
}
