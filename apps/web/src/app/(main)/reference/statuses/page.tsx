'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  DataTable,
  DataTableFilters,
  DataTablePagination,
  DataTableRow,
  DataTableCell,
} from '@/components/ui';
import { NoResults } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/auth/api';
import { Plus, Tag, Edit, Trash2 } from 'lucide-react';

interface Status {
  id: string;
  entityType: 'request' | 'trip' | 'order';
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface StatusesResponse {
  statuses: Status[];
  total: number;
  page: number;
  limit: number;
}

const mockStatuses: Status[] = [
  {
    id: '1',
    entityType: 'request',
    code: 'NEW',
    name: 'Новая',
    description: 'Новая заявка',
    color: '#3B82F6',
    icon: 'sparkles',
    isSystem: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: '2',
    entityType: 'request',
    code: 'IN_PROGRESS',
    name: 'В работе',
    description: 'Заявка в обработке',
    color: '#F59E0B',
    icon: 'clock',
    isSystem: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: '3',
    entityType: 'trip',
    code: 'LOADING',
    name: 'На погрузке',
    description: 'Транспорт на погрузке',
    color: '#8B5CF6',
    icon: 'arrow-down-to-line',
    isSystem: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: '4',
    entityType: 'trip',
    code: 'IN_TRANSIT',
    name: 'В пути',
    description: 'Транспорт в пути',
    color: '#10B981',
    icon: 'truck',
    isSystem: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: '5',
    entityType: 'order',
    code: 'PAID',
    name: 'Оплачен',
    description: 'Заказ оплачен',
    color: '#22C55E',
    icon: 'check-circle',
    isSystem: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: '6',
    entityType: 'order',
    code: 'PARTIAL',
    name: 'Частично оплачен',
    description: 'Частичная оплата',
    color: '#F97316',
    icon: 'circle-half-stroked',
    isSystem: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: '7',
    entityType: 'request',
    code: 'CANCELLED',
    name: 'Отменена',
    description: 'Заявка отменена',
    color: '#EF4444',
    icon: 'x-circle',
    isSystem: false,
    isActive: false,
    sortOrder: 99,
  },
];

const entityTypeOptions = [
  { label: 'Все типы', value: 'all' },
  { label: 'Заявки', value: 'request' },
  { label: 'Рейсы', value: 'trip' },
  { label: 'Заказы', value: 'order' },
];

const isActiveOptions = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'true' },
  { label: 'Неактивные', value: 'false' },
];

export default function StatusesPage() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<Status | null>(null);

  const fetchStatuses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      });
      if (searchQuery) params.append('q', searchQuery);
      if (entityTypeFilter !== 'all') params.append('entityType', entityTypeFilter);
      if (isActiveFilter !== 'all') params.append('isActive', isActiveFilter);

      const response = await apiClient.get<StatusesResponse>(`/statuses?${params.toString()}`);
      setStatuses(Array.isArray(response.statuses) ? response.statuses : []);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, entityTypeFilter, isActiveFilter, pageSize, searchQuery]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const safeStatuses = Array.isArray(statuses) ? statuses : [];

  const filteredStatuses = safeStatuses.filter((status) => {
    const matchesSearch =
      status.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      status.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEntityType = entityTypeFilter === 'all' || status.entityType === entityTypeFilter;
    const matchesIsActive =
      isActiveFilter === 'all' ||
      (isActiveFilter === 'true' && status.isActive) ||
      (isActiveFilter === 'false' && !status.isActive);
    return matchesSearch && matchesEntityType && matchesIsActive;
  });

  const handleDeleteStatus = async () => {
    if (statusToDelete) {
      try {
        await apiClient.delete(`/statuses/${statusToDelete.id}`);
        setIsDeleteDialogOpen(false);
        setStatusToDelete(null);
        fetchStatuses();
      } catch (error) {
        console.error('Failed to delete status:', error);
      }
    }
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      request: 'Заявка',
      trip: 'Рейс',
      order: 'Заказ',
    };
    return labels[type] || type;
  };

  const activeCount = safeStatuses.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Статусы"
          description="Управление статусами для заявок, рейсов и заказов"
          breadcrumbs={[{ label: 'Справочники', href: '/reference' }, { label: 'Статусы' }]}
          actions={[
            {
              label: 'Новый статус',
              icon: Plus,
              href: '/reference/statuses/new',
            },
          ]}
        />

        <DataTableFilters
          searchPlaceholder="Поиск по названию или коду..."
          onSearch={setSearchQuery}
          filters={[
            {
              key: 'entityType',
              label: 'Тип сущности',
              options: entityTypeOptions,
              value: entityTypeFilter,
              onChange: setEntityTypeFilter,
            },
            {
              key: 'isActive',
              label: 'Статус',
              options: isActiveOptions,
              value: isActiveFilter,
              onChange: setIsActiveFilter,
            },
          ]}
        />

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : filteredStatuses.length === 0 ? (
          <NoResults searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
        ) : (
          <DataTable>
            <div className="divide-y divide-border">
              {filteredStatuses.map((status) => (
                <DataTableRow
                  key={status.id}
                  onClick={() => router.push(`/reference/statuses/${status.id}`)}
                >
                  <DataTableCell className="flex items-center gap-3">
                    <div
                      className="rounded-lg p-2"
                      style={{ backgroundColor: `${status.color}20` }}
                    >
                      <Tag className="h-4 w-4" style={{ color: status.color }} />
                    </div>
                    <div>
                      <p className="font-medium">{status.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {status.code} • {getEntityTypeLabel(status.entityType)}
                      </p>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="hidden md:flex">
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {status.description}
                    </p>
                  </DataTableCell>
                  <DataTableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={status.isActive ? 'Активен' : 'Неактивен'} />
                      {status.isSystem && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          Системный
                        </span>
                      )}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="w-32 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/reference/statuses/${status.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatusToDelete(status);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </div>
            <DataTablePagination
              totalItems={total}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </DataTable>
        )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить статус</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить статус &quot;{statusToDelete?.name}&quot;? Это действие
              нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteStatus}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
