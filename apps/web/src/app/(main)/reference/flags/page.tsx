'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from '@/components/ui/dialog';
import { Plus, Flag, Edit, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/auth/api';

interface Flag {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  entityType: 'request' | 'trip' | 'order';
  isSystem: boolean;
  isActive: boolean;
}

interface FlagsResponse {
  flags: Flag[];
  total: number;
  page: number;
  limit: number;
}

const mockFlags: Flag[] = [
  {
    id: '1',
    code: 'URGENT',
    name: 'Срочный',
    description: 'Срочная заявка',
    color: '#EF4444',
    icon: 'flame',
    entityType: 'request',
    isSystem: true,
    isActive: true,
  },
  {
    id: '2',
    code: 'VIP',
    name: 'VIP клиент',
    description: 'VIP-клиент',
    color: '#F59E0B',
    icon: 'star',
    entityType: 'request',
    isSystem: false,
    isActive: true,
  },
  {
    id: '3',
    code: 'HAZMAT',
    name: 'Опасный груз',
    description: 'Требуется разрешение на опасный груз',
    color: '#DC2626',
    icon: 'alert-triangle',
    entityType: 'trip',
    isSystem: true,
    isActive: true,
  },
  {
    id: '4',
    code: 'REFRIGERATED',
    name: 'Рефрижератор',
    description: 'Требуется рефрижераторный транспорт',
    color: '#06B6D4',
    icon: 'snowflake',
    entityType: 'trip',
    isSystem: true,
    isActive: true,
  },
  {
    id: '5',
    code: 'FRAGILE',
    name: 'Хрупкий груз',
    description: 'Обращаться с осторожностью',
    color: '#8B5CF6',
    icon: 'package',
    entityType: 'order',
    isSystem: false,
    isActive: true,
  },
  {
    id: '6',
    code: 'OVERSIZED',
    name: 'Крупногабаритный',
    description: 'Негабаритный груз',
    color: '#F97316',
    icon: 'maximize-2',
    entityType: 'trip',
    isSystem: true,
    isActive: false,
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

export default function FlagsPage() {
  const router = useRouter();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [flagToDelete, setFlagToDelete] = useState<Flag | null>(null);

  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      });
      if (searchQuery) params.append('q', searchQuery);
      if (entityTypeFilter !== 'all') params.append('entityType', entityTypeFilter);
      if (isActiveFilter !== 'all') params.append('isActive', isActiveFilter);

      const response = await apiClient.get<FlagsResponse>(`/flags?${params.toString()}`);
      setFlags(Array.isArray(response.flags) ? response.flags : []);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch flags:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, entityTypeFilter, isActiveFilter, pageSize, searchQuery]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const safeFlags = Array.isArray(flags) ? flags : [];

  const filteredFlags = safeFlags.filter((flag) => {
    const matchesSearch =
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEntityType = entityTypeFilter === 'all' || flag.entityType === entityTypeFilter;
    const matchesIsActive =
      isActiveFilter === 'all' ||
      (isActiveFilter === 'true' && flag.isActive) ||
      (isActiveFilter === 'false' && !flag.isActive);
    return matchesSearch && matchesEntityType && matchesIsActive;
  });

  const handleDeleteFlag = async () => {
    if (flagToDelete) {
      try {
        await apiClient.delete(`/flags/${flagToDelete.id}`);
        setIsDeleteDialogOpen(false);
        setFlagToDelete(null);
        fetchFlags();
      } catch (error) {
        console.error('Failed to delete flag:', error);
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

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Флаги"
          description="Управление флагами для заявок, рейсов и заказов"
          breadcrumbs={[{ label: 'Справочники', href: '/reference' }, { label: 'Флаги' }]}
          actions={[
            {
              label: 'Новый флаг',
              icon: Plus,
              href: '/reference/flags/new',
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
        ) : filteredFlags.length === 0 ? (
          <NoResults searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
        ) : (
          <DataTable>
            <div className="divide-y divide-border">
              {filteredFlags.map((flag) => (
                <DataTableRow
                  key={flag.id}
                  onClick={() => router.push(`/reference/flags/${flag.id}`)}
                >
                  <DataTableCell className="flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: `${flag.color}20` }}>
                      <Flag className="h-4 w-4" style={{ color: flag.color }} />
                    </div>
                    <div>
                      <p className="font-medium">{flag.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {flag.code} • {getEntityTypeLabel(flag.entityType)}
                      </p>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="hidden md:flex">
                    <p className="text-sm text-muted-foreground line-clamp-1">{flag.description}</p>
                  </DataTableCell>
                  <DataTableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={flag.name} />
                      {flag.isSystem && (
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
                          router.push(`/reference/flags/${flag.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlagToDelete(flag);
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
              pageSize={10}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </DataTable>
        )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить флаг</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить флаг &quot;{flagToDelete?.name}&quot;? Это действие
              нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteFlag}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
