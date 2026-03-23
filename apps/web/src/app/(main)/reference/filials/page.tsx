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
import { EmptyState, NoResults } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Building2, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/auth/api';

interface Filial {
  id: string;
  code: string;
  name: string;
  shortName: string;
  address: string;
  phone: string;
  email: string;
  isHead: boolean;
  isActive: boolean;
}

interface FilialsResponse {
  filials: Filial[];
  total: number;
  page: number;
  limit: number;
}

const statusOptions = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'true' },
  { label: 'Неактивные', value: 'false' },
];

export default function FilialsPage() {
  const router = useRouter();
  const [filials, setFilials] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  const fetchFilials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (searchQuery) {
        params.append('q', searchQuery);
      }

      if (statusFilter !== 'all') {
        params.append('isActive', statusFilter);
      }

      const response = await apiClient.get<FilialsResponse>(`/filials?${params.toString()}`);
      setFilials(Array.isArray(response.filials) ? response.filials : []);
      setTotalItems(response.total);
    } catch (error) {
      console.error('Error fetching filials:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchFilials();
  }, [fetchFilials]);

  const handleDeleteFilial = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот филиал?')) return;

    try {
      await apiClient.delete(`/filials/${id}`);
      setFilials((prev) => (Array.isArray(prev) ? prev.filter((f) => f.id !== id) : []));
      setTotalItems((prev) => prev - 1);
    } catch (error) {
      console.error('Error deleting filial:', error);
      alert('Не удалось удалить филиал');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Филиалы"
        description="Справочник филиалов и подразделений"
        actions={[
          {
            label: 'Новый филиал',
            icon: Plus,
            href: '/reference/filials/new',
          },
        ]}
      />

      <DataTableFilters
        searchPlaceholder="Поиск по названию или коду..."
        onSearch={setSearchQuery}
        filters={[
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
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      ) : filials.length === 0 ? (
        <NoResults searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
      ) : (
        <DataTable>
          <div className="divide-y divide-border">
            {filials.map((filial) => (
              <DataTableRow
                key={filial.id}
                onClick={() => router.push(`/reference/filials/${filial.id}`)}
              >
                <DataTableCell className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{filial.name}</p>
                    <p className="text-sm text-muted-foreground">Код: {filial.code}</p>
                  </div>
                </DataTableCell>
                <DataTableCell className="hidden md:table-cell">
                  <span className="text-sm">{filial.shortName || '-'}</span>
                </DataTableCell>
                <DataTableCell className="hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">{filial.address || '-'}</span>
                </DataTableCell>
                <DataTableCell className="hidden md:flex">
                  <div className="flex items-center gap-4">
                    {filial.phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {filial.phone}
                      </div>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell className="w-24">
                  <StatusBadge status={filial.isActive ? 'Активен' : 'Неактивен'} />
                </DataTableCell>
                <DataTableCell className="w-32 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/reference/filials/${filial.id}`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFilial(filial.id);
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
            totalItems={totalItems}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </DataTable>
      )}
    </div>
  );
}
