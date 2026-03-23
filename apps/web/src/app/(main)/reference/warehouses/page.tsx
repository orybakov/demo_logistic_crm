'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  StatCard,
  DataTable,
  DataTableFilters,
  DataTablePagination,
  DataTableRow,
  DataTableCell,
} from '@/components/ui';
import { NoResults } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { apiClient } from '@/lib/auth/api';
import { Plus, Warehouse, MapPin, Clock, BarChart3, Edit, Trash2, Eye } from 'lucide-react';

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  region: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  capacity: number;
  currentLoad: number;
  workingHours: string;
  isActive: boolean;
}

interface WarehousesResponse {
  warehouses: Warehouse[];
  total: number;
  page: number;
  limit: number;
}

const statusOptions = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'true' },
  { label: 'Неактивные', value: 'false' },
];

export default function WarehousesPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
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

      const response = await apiClient.get<WarehousesResponse>(`/warehouses?${params.toString()}`);
      setWarehouses(Array.isArray(response.warehouses) ? response.warehouses : []);
      setTotalItems(response.total);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, statusFilter]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот склад?')) {
      return;
    }

    try {
      await apiClient.delete(`/warehouses/${id}`);
      fetchWarehouses();
    } catch (error) {
      console.error('Failed to delete warehouse:', error);
    }
  };

  const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];
  const activeWarehouses = safeWarehouses.filter((w) => w.isActive).length;
  const totalCapacity = safeWarehouses.reduce((sum, w) => sum + w.capacity, 0);
  const totalLoad = safeWarehouses.reduce((sum, w) => sum + w.currentLoad, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Всего складов" value={safeWarehouses.length} icon={Warehouse} />
        <StatCard label="Активных" value={activeWarehouses} icon={BarChart3} />
        <StatCard
          label="Общая вместимость"
          value={`${totalCapacity.toLocaleString()} м²`}
          icon={BarChart3}
        />
        <StatCard
          label="Текущая загрузка"
          value={`${((totalLoad / totalCapacity) * 100 || 0).toFixed(1)}%`}
          icon={BarChart3}
        />
      </div>

      <div>
        <PageHeader
          title="Склады"
          description="Справочник складов и складских помещений"
          actions={[
            {
              label: 'Новый склад',
              icon: Plus,
              href: '/reference/warehouses/new',
            },
          ]}
        />

        <DataTableFilters
          searchPlaceholder="Поиск по названию, коду, адресу..."
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
          onRefresh={fetchWarehouses}
        />

        {!isLoading && safeWarehouses.length === 0 ? (
          <NoResults searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
        ) : (
          <DataTable>
            <div className="divide-y divide-border">
              {safeWarehouses.map((warehouse) => (
                <DataTableRow
                  key={warehouse.id}
                  onClick={() => router.push(`/reference/warehouses/${warehouse.id}`)}
                >
                  <DataTableCell className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{warehouse.name}</p>
                      <p className="text-sm text-muted-foreground">Код: {warehouse.code}</p>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="hidden md:flex">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {warehouse.address}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="hidden lg:flex">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {warehouse.city}, {warehouse.region}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="hidden sm:flex">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <BarChart3 className="h-3 w-3" />
                      {warehouse.capacity.toLocaleString()} м²
                    </div>
                  </DataTableCell>
                  <DataTableCell className="hidden md:flex">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {warehouse.workingHours}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="w-24">
                    <StatusBadge status={warehouse.isActive ? 'Активен' : 'Неактивен'} />
                  </DataTableCell>
                  <DataTableCell className="w-32 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/reference/warehouses/${warehouse.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/reference/warehouses/${warehouse.id}?edit=true`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWarehouse(warehouse.id);
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
    </div>
  );
}
