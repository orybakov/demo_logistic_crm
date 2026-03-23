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
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { Plus, Search, AlertCircle, Edit, Trash2, Eye } from 'lucide-react';
import { apiClient } from '@/lib/auth/api';

interface ProblemReason {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  isActive: boolean;
}

interface ProblemReasonsResponse {
  reasons: ProblemReason[];
  total: number;
  page: number;
  limit: number;
}

const categoryOptions = [
  { label: 'Все категории', value: 'all' },
  { label: 'Задержка', value: 'delay' },
  { label: 'Отмена', value: 'cancellation' },
  { label: 'Проблема с грузом', value: 'cargo_issue' },
  { label: 'Финансовая', value: 'financial' },
  { label: 'Документация', value: 'documentation' },
];

const statusOptions = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'true' },
  { label: 'Неактивные', value: 'false' },
];

export default function ProblemReasonsPage() {
  const router = useRouter();
  const [reasons, setReasons] = useState<ProblemReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchReasons();
  }, [currentPage, searchQuery, categoryFilter, statusFilter]);

  const fetchReasons = async () => {
    try {
      const params = new URLSearchParams({
        skip: String((currentPage - 1) * 10),
        take: '10',
      });
      if (searchQuery) params.append('q', searchQuery);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);
      const data = await apiClient.get<ProblemReasonsResponse>(
        `/problem-reasons?${params.toString()}`
      );
      setReasons(Array.isArray(data.reasons) ? data.reasons : []);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch problem reasons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/problem-reasons/${id}`);
      setReasons(reasons.filter((r) => r.id !== id));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error('Failed to delete problem reason:', error);
    }
  };

  const safeReasons = Array.isArray(reasons) ? reasons : [];

  const filteredReasons = safeReasons.filter((reason) => {
    const matchesSearch =
      reason.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reason.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || reason.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'true' && reason.isActive) ||
      (statusFilter === 'false' && !reason.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeCount = safeReasons.filter((r) => r.isActive).length;
  const approvalCount = safeReasons.filter((r) => r.requiresApproval).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Всего причин" value={reasons.length} icon={AlertCircle} />
        <StatCard label="Активных" value={activeCount} icon={AlertCircle} />
        <StatCard label="Требуют одобрения" value={approvalCount} icon={AlertCircle} />
      </div>

      <div>
        <PageHeader
          title="Причины проблем"
          description="Справочник причин возникновения проблем"
          actions={[
            {
              label: 'Новая причина',
              icon: Plus,
              onClick: () => router.push('/reference/problem-reasons/new'),
            },
          ]}
        />

        <DataTableFilters
          searchPlaceholder="Поиск по коду или названию..."
          onSearch={setSearchQuery}
          filters={[
            {
              key: 'category',
              label: 'Категория',
              options: categoryOptions,
              value: categoryFilter,
              onChange: setCategoryFilter,
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
        ) : filteredReasons.length === 0 ? (
          <NoResults searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
        ) : (
          <DataTable>
            <div className="divide-y divide-border">
              {filteredReasons.map((reason) => (
                <DataTableRow key={reason.id}>
                  <DataTableCell className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{reason.name}</p>
                      <p className="text-sm text-muted-foreground">{reason.code}</p>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="hidden md:table-cell">
                    <p className="text-sm text-muted-foreground">{reason.description || '-'}</p>
                  </DataTableCell>
                  <DataTableCell className="hidden lg:table-cell">
                    <PriorityBadge priority={reason.severity} />
                  </DataTableCell>
                  <DataTableCell className="w-24">
                    <StatusBadge status={reason.isActive ? 'Активен' : 'Неактивен'} />
                  </DataTableCell>
                  <DataTableCell className="w-32 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/reference/problem-reasons/${reason.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/reference/problem-reasons/${reason.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(reason.id)}
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
    </div>
  );
}
