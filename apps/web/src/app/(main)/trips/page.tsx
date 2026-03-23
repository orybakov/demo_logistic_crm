'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, DataTableFilters, DataTablePagination } from '@/components/ui';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NoResults } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { tripsApi } from '@/lib/api/trips';
import { Trip, TripStatus, tripStatusLabels, type TripFilters } from '@/lib/api/trips/types';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';
import {
  Plus,
  Eye,
  Edit,
  Truck,
  MapPin,
  Clock,
  User,
  Navigation,
  Fuel,
  MoreHorizontal,
  Play,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const DEFAULT_PAGE_SIZE = 20;

const statusFilterOptions = [
  { label: 'Все статусы', value: 'all' },
  { label: 'Запланирован', value: TripStatus.SCHEDULED },
  { label: 'Назначен', value: TripStatus.ASSIGNED },
  { label: 'На погрузке', value: TripStatus.LOADING },
  { label: 'В пути', value: TripStatus.IN_PROGRESS },
  { label: 'На выгрузке', value: TripStatus.UNLOADING },
  { label: 'Завершён', value: TripStatus.COMPLETED },
  { label: 'Отменён', value: TripStatus.CANCELLED },
  { label: 'Задерживается', value: TripStatus.DELAYED },
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
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

function getTripProgress(trip: Trip): number {
  if (!trip.checkpoints || trip.checkpoints.length === 0) return 0;
  const completed = trip.checkpoints.filter((c) => c.isCompleted).length;
  return Math.round((completed / trip.checkpoints.length) * 100);
}

function getRouteFromRequest(trip: Trip): { from?: string; to?: string } {
  if (!trip.request?.points || trip.request.points.length === 0) {
    return {};
  }
  const pickup = trip.request.points.find((p) => p.type === 'pickup');
  const delivery = trip.request.points.find((p) => p.type === 'delivery' || p.type === 'delivery');
  return {
    from: pickup?.city || pickup?.address,
    to: delivery?.city || delivery?.address,
  };
}

function TripCard({ trip, onView }: { trip: Trip; onView: () => void }) {
  const route = getRouteFromRequest(trip);
  const progress = getTripProgress(trip);
  const canManage = [
    'scheduled',
    'assigned',
    'loading',
    'in_progress',
    'unloading',
    'delayed',
  ].includes(trip.status);

  return (
    <Card className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold font-mono">{trip.number}</span>
              </div>
              {trip.request && (
                <span className="text-sm text-muted-foreground">→ {trip.request.number}</span>
              )}
              <StatusBadge status={tripStatusLabels[trip.status as TripStatus] || trip.status} />
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span>{route.from || '—'}</span>
                <span className="mx-1 text-muted-foreground">→</span>
                <span>{route.to || '—'}</span>
              </div>
              {trip.plannedDistance && (
                <div className="text-muted-foreground">{trip.plannedDistance} км</div>
              )}
            </div>

            <div className="flex items-center gap-6">
              {trip.driver ? (
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-muted p-1">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="text-sm">
                    {trip.driver.firstName} {trip.driver.lastName}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="text-sm">Не назначен</span>
                </div>
              )}
              {trip.vehicle ? (
                <div className="flex items-center gap-2">
                  <Truck className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{trip.vehicle.plateNumber}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-3 w-3" />
                  <span className="text-sm">Не назначен</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {trip.plannedEnd
                    ? `Завершение: ${formatTime(trip.plannedEnd)}`
                    : 'Время не указано'}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {canManage && (
              <>
                {trip.status === TripStatus.SCHEDULED && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/trips/${trip.id}/assign`}>
                      <User className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {['assigned', 'loading', 'delayed'].includes(trip.status) && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/trips/${trip.id}/start`}>
                      <Play className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {trip.status === TripStatus.IN_PROGRESS && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/trips/${trip.id}/complete`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/trips/${trip.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/trips/${trip.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TripsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<{
    active: number;
    completedToday: number;
    scheduled: number;
  } | null>(null);

  const currentPage = Number(searchParams.get('page')) || 1;
  const statusFilter = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('q') || '';

  const canCreate = hasPermission('trips', 'create');
  const canEdit = hasPermission('trips', 'update');
  const canManage = hasPermission('trips', 'manage');

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

      router.push(`/trips?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: TripFilters = {
        page: currentPage,
        limit: DEFAULT_PAGE_SIZE,
        status: statusFilter as TripStatus | 'all',
        q: searchQuery || undefined,
      };

      const [tripsResponse, statsResponse] = await Promise.all([
        tripsApi.getList(filters),
        tripsApi.getStats(),
      ]);

      setTrips(tripsResponse.data);
      setTotalItems(tripsResponse.total);
      setStats(statsResponse);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Не удалось загрузить список рейсов');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

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

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({ page: page.toString() });
    },
    [updateSearchParams]
  );

  const handleClearFilters = useCallback(() => {
    router.push('/trips');
  }, [router]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [statusFilter, searchQuery]);

  if (error) {
    return <ErrorState title="Ошибка загрузки" message={error} onRetry={fetchTrips} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={cn(
            'cursor-pointer transition-colors',
            statusFilter === 'all' && 'ring-2 ring-primary'
          )}
          onClick={() => handleStatusFilter('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего рейсов</p>
                <p className="text-2xl font-bold">{stats?.scheduled || 0}</p>
              </div>
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-colors',
            statusFilter === TripStatus.IN_PROGRESS && 'ring-2 ring-primary'
          )}
          onClick={() => handleStatusFilter(TripStatus.IN_PROGRESS)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">В пути</p>
                <p className="text-2xl font-bold">{stats?.active || 0}</p>
              </div>
              <Navigation className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-colors',
            statusFilter === TripStatus.COMPLETED && 'ring-2 ring-primary'
          )}
          onClick={() => handleStatusFilter(TripStatus.COMPLETED)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Завершено сегодня</p>
                <p className="text-2xl font-bold">{stats?.completedToday || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-colors',
            statusFilter === TripStatus.DELAYED && 'ring-2 ring-primary'
          )}
          onClick={() => handleStatusFilter(TripStatus.DELAYED)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Задерживаются</p>
                <p className="text-2xl font-bold text-red-600">—</p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Рейсы</h1>
        {canCreate && (
          <Button asChild>
            <Link href="/trips/new">
              <Plus className="mr-2 h-4 w-4" />
              Новый рейс
            </Link>
          </Button>
        )}
      </div>

      <DataTableFilters
        searchPlaceholder="Поиск по номеру, клиенту или водителю..."
        onSearch={handleSearch}
        filters={[
          {
            key: 'status',
            label: 'Статус',
            options: statusFilterOptions,
            value: statusFilter,
            onChange: handleStatusFilter,
          },
        ]}
        onRefresh={fetchTrips}
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

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {!loading && trips.length === 0 && (
        <NoResults searchQuery={searchQuery} onClearSearch={handleClearFilters} />
      )}

      {!loading && trips.length > 0 && (
        <div className="space-y-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onView={() => router.push(`/trips/${trip.id}`)} />
          ))}
        </div>
      )}

      {!loading && trips.length > 0 && (
        <DataTablePagination
          totalItems={totalItems}
          pageSize={DEFAULT_PAGE_SIZE}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <TripsListContent />
    </Suspense>
  );
}
