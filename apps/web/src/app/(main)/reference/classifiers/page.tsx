'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  DataTable,
  DataTableFilters,
  DataTablePagination,
  DataTableRow,
  DataTableCell,
  StatCard,
} from '@/components/ui';
import { EmptyState, NoResults } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, Search, Tags, Edit, Trash2, Eye } from 'lucide-react';
import { apiClient } from '@/lib/auth/api';

interface Classifier {
  id: string;
  type: 'delay_reason' | 'cancellation_category' | 'cargo_type_category';
  code: string;
  name: string;
  description: string;
  value: string;
  parentId: string | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface ClassifiersResponse {
  classifiers: Classifier[];
  total: number;
  page: number;
  limit: number;
}

const typeLabels: Record<Classifier['type'], string> = {
  delay_reason: 'Причина задержки',
  cancellation_category: 'Категория отмены',
  cargo_type_category: 'Категория груза',
};

const statusOptions = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'true' },
  { label: 'Неактивные', value: 'false' },
];

const typeOptions = [
  { label: 'Все типы', value: 'all' },
  { label: 'Причина задержки', value: 'delay_reason' },
  { label: 'Категория отмены', value: 'cancellation_category' },
  { label: 'Категория груза', value: 'cargo_type_category' },
];

export default function ClassifiersPage() {
  const router = useRouter();
  const [classifiers, setClassifiers] = useState<Classifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const safeClassifiers = Array.isArray(classifiers) ? classifiers : [];

  useEffect(() => {
    fetchClassifiers();
  }, [currentPage, searchQuery, typeFilter, statusFilter]);

  const fetchClassifiers = async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10',
      });
      if (searchQuery) params.append('q', searchQuery);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);
      const data = await apiClient.get<ClassifiersResponse>(`/classifiers?${params.toString()}`);
      setClassifiers(Array.isArray(data.classifiers) ? data.classifiers : []);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch classifiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/classifiers/${id}`);
      setClassifiers(classifiers.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error('Failed to delete classifier:', error);
    }
  };

  const filteredClassifiers = safeClassifiers.filter((classifier) => {
    const matchesSearch =
      classifier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classifier.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || classifier.type === typeFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'true' && classifier.isActive) ||
      (statusFilter === 'false' && !classifier.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  const activeCount = safeClassifiers.filter((c) => c.isActive).length;
  const systemCount = safeClassifiers.filter((c) => c.isSystem).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Всего классификаторов" value={classifiers.length} icon={Tags} />
        <StatCard label="Активных" value={activeCount} icon={Tags} />
        <StatCard label="Системных" value={systemCount} icon={Tags} />
      </div>

      <div>
        <PageHeader
          title="Классификаторы"
          description="Справочник классификаторов"
          actions={[
            {
              label: 'Новый классификатор',
              icon: Plus,
              onClick: () => router.push('/reference/classifiers/new'),
            },
          ]}
        />

        <DataTableFilters
          searchPlaceholder="Поиск по коду или названию..."
          onSearch={setSearchQuery}
          filters={[
            {
              key: 'type',
              label: 'Тип',
              options: typeOptions,
              value: typeFilter,
              onChange: setTypeFilter,
            },
            {
              key: 'status',
              label: 'Статус',
              options: statusOptions,
              value: statusFilter,
              onChange: setStatusFilter,
            },
          ]}
        />

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : filteredClassifiers.length === 0 ? (
          <NoResults searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
        ) : (
          <DataTable>
            <div className="divide-y divide-border">
              {filteredClassifiers.map((classifier) => (
                <DataTableRow key={classifier.id}>
                  <DataTableCell className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Tags className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{classifier.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {typeLabels[classifier.type]} • {classifier.code}
                      </p>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="hidden md:table-cell">
                    <p className="text-sm text-muted-foreground">{classifier.description || '-'}</p>
                  </DataTableCell>
                  <DataTableCell className="w-24">
                    <StatusBadge status={classifier.isActive ? 'Активен' : 'Неактивен'} />
                  </DataTableCell>
                  <DataTableCell className="w-32 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/reference/classifiers/${classifier.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/reference/classifiers/${classifier.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!classifier.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(classifier.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
    </div>
  );
}
