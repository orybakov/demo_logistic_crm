'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader, StatusBadge } from '@/components/ui';
import {
  DataTable,
  DataTableFilters,
  DataTableRow,
  DataTableCell,
  DataTablePagination,
} from '@/components/ui/data-table';
import { NoResults } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormField, FormSection, FormActions } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Fuel, Edit, Trash2, Search, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/auth/api';

interface FuelType {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface FuelTypesResponse {
  fuelTypes: FuelType[];
  total: number;
  page: number;
  limit: number;
}

interface FuelTypeFormData {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

const initialFormData: FuelTypeFormData = {
  code: '',
  name: '',
  description: '',
  isActive: true,
};

const statusOptions = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'true' },
  { label: 'Неактивные', value: 'false' },
];

export default function FuelTypesPage() {
  const router = useRouter();
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | null>(null);
  const [formData, setFormData] = useState<FuelTypeFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FuelTypeFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageSize = 10;

  const fetchFuelTypes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await apiClient.get<FuelTypesResponse>(`/fuel-types?${params.toString()}`);
      setFuelTypes(Array.isArray(response.fuelTypes) ? response.fuelTypes : []);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch fuel types:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    fetchFuelTypes();
  }, [fetchFuelTypes]);

  const safeFuelTypes = Array.isArray(fuelTypes) ? fuelTypes : [];

  const filteredFuelTypes = safeFuelTypes.filter((ft) => {
    const matchesSearch =
      ft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ft.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'true' && ft.isActive) ||
      (statusFilter === 'false' && !ft.isActive);
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleCreateClick = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEditClick = (fuelType: FuelType) => {
    setSelectedFuelType(fuelType);
    setFormData({
      code: fuelType.code,
      name: fuelType.name,
      description: fuelType.description || '',
      isActive: fuelType.isActive,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (fuelType: FuelType) => {
    setSelectedFuelType(fuelType);
    setIsDeleteDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FuelTypeFormData, string>> = {};

    if (!formData.code.trim()) {
      errors.code = 'Код обязателен';
    }
    if (!formData.name.trim()) {
      errors.name = 'Название обязательно';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (isNew: boolean) => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        isActive: formData.isActive,
      };

      if (isNew) {
        await apiClient.post('/fuel-types', payload);
      } else if (selectedFuelType) {
        await apiClient.put(`/fuel-types/${selectedFuelType.id}`, payload);
      }

      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      resetForm();
      fetchFuelTypes();
    } catch (error) {
      console.error('Failed to save fuel type:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFuelType) return;

    setIsSubmitting(true);
    try {
      await apiClient.delete(`/fuel-types/${selectedFuelType.id}`);
      setIsDeleteDialogOpen(false);
      setSelectedFuelType(null);
      fetchFuelTypes();
    } catch (error) {
      console.error('Failed to delete fuel type:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reference">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Типы топлива</h1>
          <p className="text-muted-foreground">Управление типами топлива и ГСМ</p>
        </div>
      </div>

      <PageHeader
        title=""
        actions={[
          {
            label: 'Новый тип топлива',
            icon: Plus,
            onClick: handleCreateClick,
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

      {filteredFuelTypes.length === 0 && !loading ? (
        <NoResults searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
      ) : (
        <DataTable>
          <div className="divide-y divide-border">
            {filteredFuelTypes.map((fuelType) => (
              <DataTableRow key={fuelType.id}>
                <DataTableCell className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{fuelType.name}</p>
                    <p className="text-sm text-muted-foreground">{fuelType.code}</p>
                  </div>
                </DataTableCell>
                <DataTableCell className="hidden md:flex">
                  <span className="text-sm text-muted-foreground">
                    {fuelType.description || '-'}
                  </span>
                </DataTableCell>
                <DataTableCell className="w-24">
                  <StatusBadge status={fuelType.isActive ? 'Активен' : 'Неактивен'} />
                </DataTableCell>
                <DataTableCell className="w-32 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(fuelType)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(fuelType)}
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Новый тип топлива</DialogTitle>
            <DialogDescription>Добавление нового типа топлива или ГСМ</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField label="Код" required error={formErrors.code}>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="A95"
              />
            </FormField>
            <FormField label="Название" required error={formErrors.name}>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Бензин АИ-95"
              />
            </FormField>
            <FormField label="Описание">
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание типа топлива..."
              />
            </FormField>
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="isActiveCreate"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActiveCreate" className="cursor-pointer">
                Активен
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактирование типа топлива</DialogTitle>
            <DialogDescription>Изменение данных типа топлива</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField label="Код" required error={formErrors.code}>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="A95"
              />
            </FormField>
            <FormField label="Название" required error={formErrors.name}>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Бензин АИ-95"
              />
            </FormField>
            <FormField label="Описание">
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание типа топлива..."
              />
            </FormField>
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="isActiveEdit"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActiveEdit" className="cursor-pointer">
                Активен
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить тип топлива</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить тип топлива &quot;{selectedFuelType?.name}&quot;? Это
              действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
