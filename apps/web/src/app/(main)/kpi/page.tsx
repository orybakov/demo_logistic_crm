'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader, CardGrid, StatCard, ErrorBanner, Skeleton } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { analyticsApi, type AnalyticsKpiResponse } from '@/lib/api/analytics';
import { apiClient } from '@/lib/auth/api';
import {
  AnalyticsFilters,
  type AnalyticsFiltersState,
} from '@/components/analytics/analytics-filters';
import {
  FileText,
  Percent,
  CircleDollarSign,
  Landmark,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

type Option = { label: string; value: string };

const today = new Date();
const defaultTo = today.toISOString().slice(0, 10);
const defaultFrom = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    new: 'Новая',
    confirmed: 'Подтверждена',
    in_progress: 'В работе',
    completed: 'Завершена',
    cancelled: 'Отменена',
    on_hold: 'На паузе',
    draft: 'Черновик',
    invoiced: 'Счёт',
    partially_paid: 'Частично оплачен',
    paid: 'Оплачен',
  };
  return labels[status] || status;
}

export default function KpiPage() {
  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    dateFrom: defaultFrom,
    dateTo: defaultTo,
    filialId: '',
    status: '',
    assignedToId: '',
  });
  const [kpi, setKpi] = useState<AnalyticsKpiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filials, setFilials] = useState<Option[]>([]);

  const filialOptions = useMemo(() => filials, [filials]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await apiClient.get<{
          filials: Array<{ id: string; name: string; code: string }>;
        }>('/filials?limit=200');
        if (mounted) {
          setFilials(
            response.filials.map((item) => ({
              label: `${item.name} (${item.code})`,
              value: item.id,
            }))
          );
        }
      } catch {
        if (mounted) setFilials([]);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    analyticsApi
      .getKpi({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        filialId: filters.filialId || undefined,
      })
      .then((data) => mounted && setKpi(data))
      .catch((err) => mounted && setError(err?.message || 'Не удалось загрузить KPI'))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [filters]);

  return (
    <div className="space-y-6">
      <PageHeader title="KPI" description="Ключевые показатели по заявкам и заказам" />

      <AnalyticsFilters
        filters={filters}
        filialOptions={filialOptions}
        onChange={(next) => setFilters(next)}
        onRefresh={() => setFilters({ ...filters })}
      />

      {error && <ErrorBanner message={error} />}

      {loading || !kpi ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : (
        <>
          <CardGrid columns={4}>
            <StatCard label="Заявок" value={kpi.requests.total} icon={FileText} />
            <StatCard label="Завершено" value={kpi.requests.completed} icon={CheckCircle2} />
            <StatCard label="Конверсия" value={`${kpi.requests.completionRate}%`} icon={Percent} />
            <StatCard
              label="Связаны с заказами"
              value={kpi.requests.linkedToOrders}
              icon={Landmark}
            />
          </CardGrid>

          <CardGrid columns={4}>
            <StatCard label="Заказов" value={kpi.orders.total} icon={FileText} />
            <StatCard
              label="Сумма заказов"
              value={formatMoney(kpi.orders.totalAmount)}
              icon={CircleDollarSign}
            />
            <StatCard
              label="Оплачено"
              value={formatMoney(kpi.orders.paidAmount)}
              icon={CheckCircle2}
            />
            <StatCard label="Просрочено" value={kpi.orders.overdueCount} icon={AlertTriangle} />
          </CardGrid>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Заявки по статусам</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Кол-во</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(kpi.requests.byStatus).map(([status, count]) => (
                      <TableRow key={status}>
                        <TableCell>{statusLabel(status)}</TableCell>
                        <TableCell className="text-right font-medium">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Заказы по статусам</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Кол-во</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(kpi.orders.byStatus).map(([status, count]) => (
                      <TableRow key={status}>
                        <TableCell>{statusLabel(status)}</TableCell>
                        <TableCell className="text-right font-medium">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}
