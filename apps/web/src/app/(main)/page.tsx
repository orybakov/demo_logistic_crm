'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth/auth-context';
import { dashboardApi } from '@/lib/api/dashboard';
import {
  DashboardResult,
  QuickSearchResult,
  flagLabels,
  flagColors,
  paymentStatusLabels,
  requestStatusLabels,
  orderStatusLabels,
} from '@/lib/api/dashboard/types';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  Truck,
  FileText,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  MapPin,
  Clock,
  ArrowRight,
  X,
  Loader2,
  Calendar,
  TruckIcon,
  Package2,
  RefreshCw,
  Settings,
  LayoutDashboard,
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  className,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  className?: string;
  trend?: 'up' | 'down';
}) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div
            className={cn(
              'rounded-lg p-3',
              trend === 'up' && 'bg-green-500/10',
              trend === 'down' && 'bg-red-500/10',
              !trend && 'bg-primary/10'
            )}
          >
            <Icon
              className={cn(
                'h-6 w-6',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                !trend && 'text-primary'
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await dashboardApi.search(searchQuery);
      setResults(data);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleSelect = (result: QuickSearchResult) => {
    setIsOpen(false);
    setQuery('');
    switch (result.type) {
      case 'request':
        router.push(`/requests/${result.id}`);
        break;
      case 'order':
        router.push(`/orders/${result.id}`);
        break;
      case 'trip':
        router.push(`/trips/${result.id}`);
        break;
    }
  };

  const getTypeIcon = (type: QuickSearchResult['type']) => {
    switch (type) {
      case 'request':
        return <FileText className="h-4 w-4" />;
      case 'order':
        return <DollarSign className="h-4 w-4" />;
      case 'trip':
        return <Truck className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Быстрый поиск (заявка, заказ, рейс)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-background shadow-lg">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className="flex w-full items-center gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted"
            >
              <div className="rounded-lg bg-muted p-2">{getTypeIcon(result.type)}</div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{result.number}</span>
                  <Badge variant="outline" className="text-xs">
                    {result.type === 'request' && 'Заявка'}
                    {result.type === 'order' && 'Заказ'}
                    {result.type === 'trip' && 'Рейс'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.clientName}
                  {result.total && ` • ${formatCurrency(result.total)}`}
                </p>
              </div>
              <StatusBadge
                status={
                  result.type === 'request'
                    ? requestStatusLabels[result.status] || result.status
                    : result.type === 'order'
                      ? orderStatusLabels[result.status] || result.status
                      : result.status
                }
              />
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-background p-4 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">Ничего не найдено</p>
        </div>
      )}
    </div>
  );
}

function FreeRequestsWidget({
  data,
  loading,
}: {
  data?: DashboardResult['blocks']['freeRequests'];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Свободные заявки
          </CardTitle>
          <CardDescription>Не назначенные на менеджера</CardDescription>
        </div>
        {data && (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600">
            {data.total} заявок
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {data?.requests && data.requests.length > 0 ? (
          <div className="space-y-2">
            {data.requests.slice(0, 5).map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono">{request.number}</span>
                    <Badge
                      variant={request.priority === 'urgent' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {request.priority === 'urgent' ? 'Срочный' : request.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{request.clientName}</p>
                  {(request.pickupCity || request.deliveryCity) && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {request.pickupCity} → {request.deliveryCity}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {data.total > 5 && (
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/requests?status=new&assigned=false">
                  Все свободные заявки ({data.total})
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">Нет свободных заявок</p>
        )}
      </CardContent>
    </Card>
  );
}

function ProblemFlagsWidget({
  data,
  loading,
}: {
  data?: DashboardResult['blocks']['problemFlags'];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const problemFlags = ['urgent', 'hazmat', 'temp', 'oversize', 'fragile', 'express'];
  const hasProblems = problemFlags.some((flag) => (data?.byFlag?.[flag] || 0) > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Заявки с проблемными флагами
          </CardTitle>
          <CardDescription>Требуют внимания</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {data && Object.keys(data.byFlag).length > 0 && hasProblems ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {problemFlags.map((flag) => {
                const count = data.byFlag?.[flag] || 0;
                return (
                  <div
                    key={flag}
                    className={cn(
                      'rounded-lg border p-2 text-center',
                      count > 0 ? flagColors[flag] : 'bg-muted/50 opacity-50'
                    )}
                  >
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs">{flagLabels[flag] || flag}</p>
                  </div>
                );
              })}
            </div>

            {data.requests.length > 0 && (
              <div className="space-y-2">
                {data.requests.slice(0, 5).map((request) => (
                  <Link
                    key={request.id}
                    href={`/requests/${request.id}`}
                    className="flex items-center justify-between rounded-lg border p-2 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{request.number}</span>
                      <div className="flex gap-1">
                        {Array.isArray(request.flags) &&
                          request.flags.slice(0, 2).map((flag) => (
                            <Badge
                              key={flag}
                              variant="outline"
                              className={cn('text-xs px-1 py-0', flagColors[flag] || '')}
                            >
                              {flagLabels[flag] || flag}
                            </Badge>
                          ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{request.clientName}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">
            Нет заявок с проблемными флагами
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ProblemOrdersWidget({
  data,
  loading,
}: {
  data?: DashboardResult['blocks']['problemOrders'];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasProblems = data?.orders && data.orders.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            Проблемные заказы
          </CardTitle>
          <CardDescription>Просроченная оплата</CardDescription>
        </div>
        {data && hasProblems && (
          <Badge variant="destructive">
            {Array.isArray(data.orders)
              ? data.orders.filter((o) => o.overdueDays && o.overdueDays > 0).length
              : 0}{' '}
            просрочено
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {hasProblems ? (
          <div className="space-y-2">
            {(Array.isArray(data?.orders) ? data.orders : []).slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{order.number}</span>
                    {order.overdueDays && order.overdueDays > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {order.overdueDays} дн.
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{order.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(order.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                  </p>
                </div>
              </Link>
            ))}
            {data!.orders.length > 5 && (
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/orders/list?paymentStatus=not_paid">
                  Все проблемные заказы
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">Нет проблемных заказов</p>
        )}
      </CardContent>
    </Card>
  );
}

function TodayOperationsWidget({
  data,
  loading,
  type,
}: {
  data?: DashboardResult['blocks']['todayOperations'];
  loading: boolean;
  type: 'loadings' | 'deliveries';
}) {
  const items = data?.[type] || [];
  const stats = data?.stats;
  const Icon = type === 'loadings' ? Package2 : Package;
  const title = type === 'loadings' ? 'Загрузки' : 'Выгрузки';
  const subtitle = type === 'loadings' ? 'загрузок' : 'выгрузок';
  const countKey = type === 'loadings' ? 'totalLoadings' : 'totalDeliveries';
  const completedKey = type === 'loadings' ? 'completedLoadings' : 'completedDeliveries';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Сегодняшние {title.toLowerCase()}
          </CardTitle>
        </div>
        {stats && (
          <Badge variant="outline" className="bg-primary/10">
            {stats[completedKey]}/{stats[countKey]} выполнено
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.slice(0, 5).map((item, index) => (
              <Link
                key={`${item.id}-${index}`}
                href={`/requests/${item.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{item.requestNumber}</span>
                    <StatusBadge status={item.status === 'in_progress' ? 'В пути' : item.status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{item.address}</p>
                </div>
                <div className="text-right">
                  {item.plannedTime && (
                    <p className="text-sm font-medium">{formatTime(item.plannedTime)}</p>
                  )}
                  {item.vehiclePlate && (
                    <p className="text-xs text-muted-foreground">{item.vehiclePlate}</p>
                  )}
                </div>
              </Link>
            ))}
            {items.length > 5 && (
              <Button variant="ghost" className="w-full" asChild>
                <Link href={`/schedule?type=${type === 'loadings' ? 'loading' : 'unloading'}`}>
                  Все {subtitle} ({items.length})
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">
            Нет {subtitle} на сегодня
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await dashboardApi.getDashboard();
      setDashboardData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить данные дашборда',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Добро пожаловать, {user?.firstName || 'Пользователь'}
          </h1>
          <p className="text-muted-foreground capitalize">{today}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <QuickSearch />

          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="hidden text-xs text-muted-foreground sm:block">
                Обновлено: {formatTime(lastUpdate.toISOString())}
              </span>
            )}
            <Button variant="outline" size="icon" onClick={fetchDashboard} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Заявок сегодня"
          value={dashboardData?.blocks?.stats?.requestsToday ?? '—'}
          icon={FileText}
          subtitle="новых заявок"
        />
        <StatCard
          title="Активные рейсы"
          value={dashboardData?.blocks?.stats?.tripsActive ?? '—'}
          icon={Truck}
          subtitle="в работе"
        />
        <StatCard
          title="Заказов в работе"
          value={dashboardData?.blocks?.stats?.ordersPending ?? '—'}
          icon={DollarSign}
          subtitle="ожидают оплаты"
        />
        <StatCard
          title="Выручка за день"
          value={
            dashboardData?.blocks?.stats?.revenueToday
              ? formatCurrency(dashboardData.blocks.stats.revenueToday)
              : '—'
          }
          icon={CheckCircle2}
          subtitle="сегодня"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FreeRequestsWidget data={dashboardData?.blocks?.freeRequests} loading={loading} />
        <ProblemFlagsWidget data={dashboardData?.blocks?.problemFlags} loading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProblemOrdersWidget data={dashboardData?.blocks?.problemOrders} loading={loading} />
        <TodayOperationsWidget
          data={dashboardData?.blocks?.todayOperations}
          loading={loading}
          type="loadings"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TodayOperationsWidget
          data={dashboardData?.blocks?.todayOperations}
          loading={loading}
          type="deliveries"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Быстрые действия
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/requests/new">
                <Plus className="mr-2 h-4 w-4" />
                Новая заявка
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/trips/new">
                <Truck className="mr-2 h-4 w-4" />
                Новый рейс
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/orders/new">
                <DollarSign className="mr-2 h-4 w-4" />
                Новый заказ
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/schedule">
                <Calendar className="mr-2 h-4 w-4" />
                Расписание
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
