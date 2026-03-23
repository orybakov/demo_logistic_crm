'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader, ErrorBanner, DataTablePagination } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AnalyticsFilters,
  type AnalyticsFiltersState,
} from '@/components/analytics/analytics-filters';
import {
  analyticsApi,
  type AnalyticsOrdersReportRow,
  type AnalyticsRequestsReportRow,
} from '@/lib/api/analytics';
import { apiClient } from '@/lib/auth/api';
import { paymentStatusLabels as dashboardPaymentStatusLabels } from '@/lib/api/dashboard/types';
import { orderStatusLabels } from '@/lib/api/orders/types';
import { priorityLabels, statusLabels as requestStatusLabels } from '@/lib/api/requests/types';

type Option = { label: string; value: string };
type ReportEntity = 'requests' | 'orders';

const today = new Date();
const defaultTo = today.toISOString().slice(0, 10);
const defaultFrom = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const requestStatusOptions: Option[] = Object.entries(requestStatusLabels).map(
  ([value, label]) => ({ value, label })
);
const orderStatusOptions: Option[] = Object.entries(orderStatusLabels).map(([value, label]) => ({
  value,
  label,
}));

export default function ReportsPage() {
  const [entity, setEntity] = useState<ReportEntity>('requests');
  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    dateFrom: defaultFrom,
    dateTo: defaultTo,
    filialId: '',
    status: '',
    assignedToId: '',
  });
  const [rows, setRows] = useState<Array<AnalyticsRequestsReportRow | AnalyticsOrdersReportRow>>(
    []
  );
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filials, setFilials] = useState<Option[]>([]);
  const [executors, setExecutors] = useState<Option[]>([]);

  const filialOptions = useMemo(() => filials, [filials]);
  const executorOptions = useMemo(() => executors, [executors]);
  const statusOptions = entity === 'requests' ? requestStatusOptions : orderStatusOptions;

  useEffect(() => {
    let mounted = true;

    Promise.all([
      apiClient.get<{ filials: Array<{ id: string; name: string; code: string }> }>(
        '/filials?limit=200'
      ),
      apiClient.get<Array<{ id: string; firstName: string; lastName: string; email?: string }>>(
        '/analytics/executors'
      ),
    ])
      .then(([filialResponse, userResponse]) => {
        if (!mounted) return;
        setFilials(
          filialResponse.filials.map((item) => ({
            value: item.id,
            label: `${item.name} (${item.code})`,
          }))
        );
        setExecutors(
          userResponse.map((item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          }))
        );
      })
      .catch(() => {
        if (mounted) {
          setFilials([]);
          setExecutors([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const requestFilters = {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      filialId: filters.filialId || undefined,
      status: filters.status || undefined,
      assignedToId: filters.assignedToId || undefined,
      page,
      limit,
    };

    const loader =
      entity === 'requests'
        ? analyticsApi.getRequestsReport(requestFilters)
        : analyticsApi.getOrdersReport(requestFilters);

    loader
      .then((data) => {
        if (!mounted) return;
        setRows(data.rows as Array<AnalyticsRequestsReportRow | AnalyticsOrdersReportRow>);
        setSummary(data.summary);
        setTotal(data.total);
      })
      .catch((err) => mounted && setError(err?.message || 'Не удалось загрузить отчёт'))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [entity, filters, page, limit]);

  const updateFilters = (next: AnalyticsFiltersState) => {
    setPage(1);
    setFilters(next);
  };

  const exportReport = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await analyticsApi.exportReport(
        entity,
        {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          filialId: filters.filialId || undefined,
          status: filters.status || undefined,
          assignedToId: filters.assignedToId || undefined,
        },
        format
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entity}-report.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось экспортировать отчёт');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Отчёты" description="Табличные отчёты по заявкам и заказам" />

      <Tabs
        value={entity}
        onValueChange={(value) => {
          setEntity(value as ReportEntity);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="requests">Заявки</TabsTrigger>
          <TabsTrigger value="orders">Заказы</TabsTrigger>
        </TabsList>

        <TabsContent value={entity} className="space-y-6">
          <AnalyticsFilters
            filters={filters}
            filialOptions={filialOptions}
            executorOptions={executorOptions}
            statusOptions={statusOptions}
            showStatus
            showExecutor
            onChange={updateFilters}
            onRefresh={() => setFilters({ ...filters })}
            onExportCsv={() => exportReport('csv')}
            onExportXlsx={() => exportReport('xlsx')}
          />

          {error && <ErrorBanner message={error} />}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {entity === 'requests' ? 'Отчёт по заявкам' : 'Отчёт по заказам'}
              </CardTitle>
              <Badge variant="outline">{total} строк</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-sm text-muted-foreground">Загрузка...</div>
              ) : entity === 'requests' ? (
                <RequestsTable rows={rows as AnalyticsRequestsReportRow[]} />
              ) : (
                <OrdersTable rows={rows as AnalyticsOrdersReportRow[]} />
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Показано {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} из{' '}
              {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLimit(20);
                  setPage(1);
                }}
                disabled={limit === 20}
              >
                20
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLimit(50);
                  setPage(1);
                }}
                disabled={limit === 50}
              >
                50
              </Button>
            </div>
          </div>

          <DataTablePagination
            totalItems={total}
            pageSize={limit}
            currentPage={page}
            onPageChange={setPage}
          />

          <SummaryBar entity={entity} summary={summary} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestsTable({ rows }: { rows: AnalyticsRequestsReportRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>№</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Филиал</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Приоритет</TableHead>
          <TableHead>Исполнитель</TableHead>
          <TableHead>Создана</TableHead>
          <TableHead>Заказ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link className="font-medium hover:underline" href={`/requests/${row.id}`}>
                {row.number}
              </Link>
            </TableCell>
            <TableCell>{row.clientName}</TableCell>
            <TableCell>{row.filialName || '—'}</TableCell>
            <TableCell>
              {requestStatusLabels[row.status as keyof typeof requestStatusLabels] || row.status}
            </TableCell>
            <TableCell>
              {priorityLabels[row.priority as keyof typeof priorityLabels] || row.priority}
            </TableCell>
            <TableCell>{row.assignedToName || '—'}</TableCell>
            <TableCell>{formatDate(row.createdAt)}</TableCell>
            <TableCell>{row.orderNumber || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OrdersTable({ rows }: { rows: AnalyticsOrdersReportRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>№</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Филиал</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Оплата</TableHead>
          <TableHead>Исполнитель</TableHead>
          <TableHead>Дата</TableHead>
          <TableHead className="text-right">Сумма</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link className="font-medium hover:underline" href={`/orders/${row.id}`}>
                {row.number}
              </Link>
            </TableCell>
            <TableCell>{row.clientName}</TableCell>
            <TableCell>{row.filialName || '—'}</TableCell>
            <TableCell>
              {orderStatusLabels[row.status as keyof typeof orderStatusLabels] || row.status}
            </TableCell>
            <TableCell>
              {dashboardPaymentStatusLabels[
                row.paymentStatus as keyof typeof dashboardPaymentStatusLabels
              ] || row.paymentStatus}
            </TableCell>
            <TableCell>{row.assignedToName || '—'}</TableCell>
            <TableCell>{formatDate(row.orderDate)}</TableCell>
            <TableCell className="text-right">{formatMoney(row.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SummaryBar({
  entity,
  summary,
}: {
  entity: ReportEntity;
  summary: Record<string, number>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {entity === 'requests' ? (
        <>
          <MiniStat label="Новых" value={summary.new || 0} />
          <MiniStat label="В работе" value={summary.in_progress || 0} />
          <MiniStat label="Завершено" value={summary.completed || 0} />
          <MiniStat label="Связаны с заказами" value={summary.linkedToOrders || 0} />
        </>
      ) : (
        <>
          <MiniStat label="Сумма" value={formatMoney(summary.totalAmount || 0)} />
          <MiniStat label="Оплачено" value={formatMoney(summary.paidAmount || 0)} />
          <MiniStat label="Просрочено" value={summary.overdueCount || 0} />
          <MiniStat label="Не оплачено" value={formatMoney(summary.unpaidAmount || 0)} />
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ru-RU');
}
