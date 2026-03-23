'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
import { FormField, FormSection, FormActions } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { apiClient } from '@/lib/auth/api';

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

export default function EditVehicleTypePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<VehicleTypeFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleTypeFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVehicleType = async () => {
      try {
        const response = await apiClient.get<{
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
        }>(`/vehicle-types/${id}`);

        setFormData({
          code: response.code,
          name: response.name,
          description: response.description || '',
          category: response.category,
          capacityKg: response.capacityKg?.toString() || '',
          capacityM3: response.capacityM3?.toString() || '',
          hasTrailer: response.hasTrailer || false,
          isActive: response.isActive,
          sortOrder: response.sortOrder?.toString() || '0',
        });
      } catch (error) {
        console.error('Failed to fetch vehicle type:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchVehicleType();
    }
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof VehicleTypeFormData, string>> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Код обязателен';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    if (formData.capacityKg && isNaN(Number(formData.capacityKg))) {
      newErrors.capacityKg = 'Должно быть числом';
    }
    if (formData.capacityM3 && isNaN(Number(formData.capacityM3))) {
      newErrors.capacityM3 = 'Должно быть числом';
    }
    if (formData.sortOrder && isNaN(Number(formData.sortOrder))) {
      newErrors.sortOrder = 'Должно быть числом';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      await apiClient.put(`/vehicle-types/${id}`, payload);
      router.push('/reference/vehicle-types');
    } catch (error) {
      console.error('Failed to update vehicle type:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reference/vehicle-types">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Редактирование типа транспорта</h1>
          <p className="text-muted-foreground">Изменение данных типа транспортного средства</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Код" required error={errors.code}>
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

            <FormField label="Название" required error={errors.name}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Характеристики</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Грузоподъемность (кг)" error={errors.capacityKg}>
                <Input
                  type="number"
                  value={formData.capacityKg}
                  onChange={(e) => setFormData({ ...formData, capacityKg: e.target.value })}
                  placeholder="5000"
                />
              </FormField>
              <FormField label="Объем (м³)" error={errors.capacityM3}>
                <Input
                  type="number"
                  value={formData.capacityM3}
                  onChange={(e) => setFormData({ ...formData, capacityM3: e.target.value })}
                  placeholder="20"
                />
              </FormField>
            </div>

            <FormField label="Порядок сортировки" error={errors.sortOrder}>
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
          </CardContent>
        </Card>

        <FormActions>
          <Link href="/reference/vehicle-types">
            <Button variant="outline" type="button">
              Отмена
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            Сохранить
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
