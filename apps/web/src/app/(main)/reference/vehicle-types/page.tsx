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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormSection, FormActions } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Truck, Edit, Trash2, Search, ChevronRight, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/auth/api';

interface VehicleType {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  capacityKg: number;
  capacityM3: number;
  hasTrailer: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface VehicleTypesResponse {
  vehicleTypes: VehicleType[];
  total: number;
  page: number;
  limit: number;
}

interface VehicleTypeFormData {
  code: string;
  name: string;
  description: string;
  category: string;
  capacityKg: string;
  capacityM3: string;
  hasTrailer: boolean;
  isActive: boolean;
  sortOrder: string;
}

const vehicleCategories = [
  { value: 'light', label: 'Легкий транспорт' },
  { value: 'medium', label: 'Средний транспорт' },
  { value: 'heavy', label: 'Тяжелый транспорт' },
  { value: 'special', label: 'Специальный транспорт' },
];

const statusOptions = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'true' },
  { label: 'Неактивные', value: 'false' },
];

const initialFormData: VehicleTypeFormData = {
  code: '',
  name: '',
  description: '',
  category: 'medium',
  capacityKg: '',
  capacityM3: '',
  hasTrailer: false,
  isActive: true,
  sortOrder: '0',
};

export default function VehicleTypesPage() {
  const router = useRouter();
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | null>(null);
  const [formData, setFormData] = useState<VehicleTypeFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof VehicleTypeFormData, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageSize = 10;

  const fetchVehicleTypes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await apiClient.get<VehicleTypesResponse>(
        `/vehicle-types?${params.toString()}`
      );
      setVehicleTypes(Array.isArray(response.vehicleTypes) ? response.vehicleTypes : []);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch vehicle types:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  const safeVehicleTypes = Array.isArray(vehicleTypes) ? vehicleTypes : [];

  const filteredVehicleTypes = safeVehicleTypes.filter((vt) => {
    const matchesSearch =
      vt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vt.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'true' && vt.isActive) ||
      (statusFilter === 'false' && !vt.isActive);
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

  const handleEditClick = (vehicleType: VehicleType) => {
    setSelectedVehicleType(vehicleType);
    setFormData({
      code: vehicleType.code,
      name: vehicleType.name,
      description: vehicleType.description || '',
      category: vehicleType.category,
      capacityKg: vehicleType.capacityKg?.toString() || '',
      capacityM3: vehicleType.capacityM3?.toString() || '',
      hasTrailer: vehicleType.hasTrailer || false,
      isActive: vehicleType.isActive,
      sortOrder: vehicleType.sortOrder?.toString() || '0',
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (vehicleType: VehicleType) => {
    setSelectedVehicleType(vehicleType);
    setIsDeleteDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof VehicleTypeFormData, string>> = {};

    if (!formData.code.trim()) {
      errors.code = 'Код обязателен';
    }
    if (!formData.name.trim()) {
      errors.name = 'Название обязательно';
    }
    if (formData.capacityKg && isNaN(Number(formData.capacityKg))) {
      errors.capacityKg = 'Должно быть числом';
    }
    if (formData.capacityM3 && isNaN(Number(formData.capacityM3))) {
      errors.capacityM3 = 'Должно быть числом';
    }
    if (formData.sortOrder && isNaN(Number(formData.sortOrder))) {
      errors.sortOrder = 'Должно быть числом';
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
        category: formData.category,
        capacityKg: formData.capacityKg ? Number(formData.capacityKg) : undefined,
        capacityM3: formData.capacityM3 ? Number(formData.capacityM3) : undefined,
        hasTrailer: formData.hasTrailer,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder ? Number(formData.sortOrder) : 0,
      };

      if (isNew) {
        await apiClient.post('/vehicle-types', payload);
      } else if (selectedVehicleType) {
        await apiClient.put(`/vehicle-types/${selectedVehicleType.id}`, payload);
      }

      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      resetForm();
      fetchVehicleTypes();
    } catch (error) {
      console.error('Failed to save vehicle type:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicleType) return;

    setIsSubmitting(true);
    try {
      await apiClient.delete(`/vehicle-types/${selectedVehicleType.id}`);
      setIsDeleteDialogOpen(false);
      setSelectedVehicleType(null);
      fetchVehicleTypes();
    } catch (error) {
      console.error('Failed to delete vehicle type:', error);
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
          <h1 className="text-2xl font-bold tracking-tight">Типы транспорта</h1>
          <p className="text-muted-foreground">Управление типами транспортных средств</p>
        </div>
      </div>

      <PageHeader
        title=""
        actions={[
          {
            label: 'Новый тип',
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

      {filteredVehicleTypes.length === 0 && !loading ? (
        <NoResults searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
      ) : (
        <DataTable>
          <div className="divide-y divide-border">
            {filteredVehicleTypes.map((vehicleType) => (
              <DataTableRow key={vehicleType.id}>
                <DataTableCell className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{vehicleType.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicleType.code} •{' '}
                      {vehicleCategories.find((c) => c.value === vehicleType.category)?.label ||
                        vehicleType.category}
                    </p>
                  </div>
                </DataTableCell>
                <DataTableCell className="hidden md:flex">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Грузоподъемность: {vehicleType.capacityKg || '-'} кг</span>
                    <span>Объем: {vehicleType.capacityM3 || '-'} м³</span>
                    {vehicleType.hasTrailer && <span>Прицеп</span>}
                  </div>
                </DataTableCell>
                <DataTableCell className="w-24">
                  <StatusBadge status={vehicleType.isActive ? 'Активен' : 'Неактивен'} />
                </DataTableCell>
                <DataTableCell className="w-32 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(vehicleType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(vehicleType)}
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
            <DialogTitle>Новый тип транспорта</DialogTitle>
            <DialogDescription>Добавление нового типа транспортного средства</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Код" required error={formErrors.code}>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="TRUCK"
                />
              </FormField>
              <FormField label="Категория">
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Название" required error={formErrors.name}>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Грузовой автомобиль"
              />
            </FormField>
            <FormField label="Описание">
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание типа транспорта..."
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Грузоподъемность (кг)" error={formErrors.capacityKg}>
                <Input
                  type="number"
                  value={formData.capacityKg}
                  onChange={(e) => setFormData({ ...formData, capacityKg: e.target.value })}
                  placeholder="5000"
                />
              </FormField>
              <FormField label="Объем (м³)" error={formErrors.capacityM3}>
                <Input
                  type="number"
                  value={formData.capacityM3}
                  onChange={(e) => setFormData({ ...formData, capacityM3: e.target.value })}
                  placeholder="20"
                />
              </FormField>
            </div>
            <FormField label="Порядок сортировки" error={formErrors.sortOrder}>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                placeholder="0"
              />
            </FormField>
            <div className="flex items-center gap-4">
              <Checkbox
                id="hasTrailer"
                checked={formData.hasTrailer}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasTrailer: checked as boolean })
                }
              />
              <Label htmlFor="hasTrailer" className="cursor-pointer">
                Возможен прицеп
              </Label>
            </div>
            <div className="flex items-center gap-4">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
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
            <DialogTitle>Редактирование типа транспорта</DialogTitle>
            <DialogDescription>Изменение данных типа транспортного средства</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Код" required error={formErrors.code}>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="TRUCK"
                />
              </FormField>
              <FormField label="Категория">
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Название" required error={formErrors.name}>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Грузовой автомобиль"
              />
            </FormField>
            <FormField label="Описание">
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание типа транспорта..."
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Грузоподъемность (кг)" error={formErrors.capacityKg}>
                <Input
                  type="number"
                  value={formData.capacityKg}
                  onChange={(e) => setFormData({ ...formData, capacityKg: e.target.value })}
                  placeholder="5000"
                />
              </FormField>
              <FormField label="Объем (м³)" error={formErrors.capacityM3}>
                <Input
                  type="number"
                  value={formData.capacityM3}
                  onChange={(e) => setFormData({ ...formData, capacityM3: e.target.value })}
                  placeholder="20"
                />
              </FormField>
            </div>
            <FormField label="Порядок сортировки" error={formErrors.sortOrder}>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                placeholder="0"
              />
            </FormField>
            <div className="flex items-center gap-4">
              <Checkbox
                id="hasTrailerEdit"
                checked={formData.hasTrailer}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasTrailer: checked as boolean })
                }
              />
              <Label htmlFor="hasTrailerEdit" className="cursor-pointer">
                Возможен прицеп
              </Label>
            </div>
            <div className="flex items-center gap-4">
              <Checkbox
                id="isActiveEdit"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked as boolean })
                }
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
            <DialogTitle>Удалить тип транспорта</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить тип транспорта &quot;{selectedVehicleType?.name}&quot;?
              Это действие нельзя отменить.
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
