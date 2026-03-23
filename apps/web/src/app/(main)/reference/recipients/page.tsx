'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  StatCard,
  DataTable,
  DataTableFilters,
  DataTablePagination,
  DataTableRow,
  DataTableCell,
  Button,
  StatusBadge,
} from '@/components/ui';
import { NoResults, Spinner } from '@/components/ui';
import { Building2, Plus, Search, Edit, Trash2, Phone, Mail, Package, Users } from 'lucide-react';
import { apiClient } from '@/lib/auth/api';

interface Recipient {
  id: string;
  code: string;
  name: string;
  inn: string;
  kpp: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  filialId: string;
  isActive: boolean;
}

interface RecipientsResponse {
  recipients: Recipient[];
  total: number;
  page: number;
  limit: number;
}

const statusOptions = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'true' },
  { label: 'Неактивные', value: 'false' },
];

export default function RecipientsPage() {
  const router = useRouter();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  const fetchRecipients = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
      });
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      if (statusFilter !== 'all') {
        params.append('isActive', statusFilter);
      }

      const response = await apiClient.get<RecipientsResponse>(`/recipients?${params.toString()}`);
      setRecipients(Array.isArray(response.recipients) ? response.recipients : []);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch recipients:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, limit]);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого грузополучателя?')) return;
    try {
      await apiClient.delete(`/recipients/${id}`);
      fetchRecipients();
    } catch (error) {
      console.error('Failed to delete recipient:', error);
    }
  };

  const activeCount = Array.isArray(recipients) ? recipients.filter((r) => r.isActive).length : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Всего грузополучателей" value={total} icon={Building2} />
        <StatCard label="Активных" value={activeCount} icon={Users} />
        <StatCard label="Записей на странице" value={recipients.length} icon={Package} />
      </div>

      <div>
        <PageHeader
          title="Грузополучатели"
          description="Справочник грузополучателей"
          actions={[
            {
              label: 'Новый грузополучатель',
              icon: Plus,
              href: '/reference/recipients/new',
            },
          ]}
        />

        <DataTableFilters
          searchPlaceholder="Поиск по названию или ИНН..."
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
          onRefresh={fetchRecipients}
        />

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : recipients.length === 0 ? (
          <NoResults searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
        ) : (
          <DataTable>
            <div className="divide-y divide-border">
              {recipients.map((recipient) => (
                <DataTableRow key={recipient.id}>
                  <DataTableCell className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {recipient.code} | ИНН: {recipient.inn}
                        {recipient.kpp && ` / КПП: ${recipient.kpp}`}
                      </p>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="hidden lg:flex">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {recipient.city && <p>{recipient.city}</p>}
                      {recipient.address && <p>{recipient.address}</p>}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="hidden md:flex">
                    <div className="space-y-1">
                      {recipient.contactName && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {recipient.contactName}
                        </div>
                      )}
                      {recipient.contactPhone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {recipient.contactPhone}
                        </div>
                      )}
                      {recipient.contactEmail && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {recipient.contactEmail}
                        </div>
                      )}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="w-24">
                    <StatusBadge status={recipient.isActive ? 'Активен' : 'Неактивен'} />
                  </DataTableCell>
                  <DataTableCell className="w-32 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/reference/recipients/${recipient.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(recipient.id)}
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
              pageSize={limit}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </DataTable>
        )}
      </div>
    </div>
  );
}
