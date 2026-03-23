'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FormField, FormActions } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/auth/api';
import { ArrowLeft, Save } from 'lucide-react';

interface WarehouseFormData {
  code: string;
  name: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  contactName: string;
  contactPhone: string;
  capacity: string;
  currentLoad: string;
  workingHours: string;
  isActive: boolean;
}

const initialFormData: WarehouseFormData = {
  code: '',
  name: '',
  address: '',
  city: '',
  region: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  contactName: '',
  contactPhone: '',
  capacity: '',
  currentLoad: '',
  workingHours: '09:00-18:00',
  isActive: true,
};

interface FormErrors {
  [key: string]: string;
}

export default function WarehouseCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<WarehouseFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Код склада обязателен';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Название склада обязательно';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Адрес обязателен';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Город обязателен';
    }

    if (!formData.region.trim()) {
      newErrors.region = 'Регион обязателен';
    }

    if (formData.capacity && isNaN(Number(formData.capacity))) {
      newErrors.capacity = 'Вместимость должна быть числом';
    }

    if (formData.currentLoad && isNaN(Number(formData.currentLoad))) {
      newErrors.currentLoad = 'Текущая загрузка должна быть числом';
    }

    if (formData.latitude && isNaN(Number(formData.latitude))) {
      newErrors.latitude = 'Широта должна быть числом';
    }

    if (formData.longitude && isNaN(Number(formData.longitude))) {
      newErrors.longitude = 'Долгота должна быть числом';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof WarehouseFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        region: formData.region.trim(),
        postalCode: formData.postalCode.trim() || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        contactName: formData.contactName.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : 0,
        currentLoad: formData.currentLoad ? parseInt(formData.currentLoad, 10) : 0,
        workingHours: formData.workingHours.trim(),
        isActive: formData.isActive,
      };

      await apiClient.post('/warehouses', payload);

      toast({
        title: 'Успешно',
        description: 'Склад успешно создан',
      });

      router.push('/reference/warehouses');
    } catch (error) {
      console.error('Failed to create warehouse:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать склад',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Новый склад"
          breadcrumbs={[
            { label: 'Справочники', href: '/' as '/reference' },
            { label: 'Склады', href: '/reference/warehouses' as '/reference/warehouses' },
            { label: 'Новый склад' },
          ]}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Код склада" required error={errors.code}>
                  <Input
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="WH-001"
                  />
                </FormField>

                <FormField label="Название" required error={errors.name}>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Центральный склад"
                  />
                </FormField>
              </div>

              <FormField label="Адрес" required error={errors.address}>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="г. Москва, ул. Промышленная, д. 15"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Город" required error={errors.city}>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Москва"
                  />
                </FormField>

                <FormField label="Регион / Область" required error={errors.region}>
                  <Input
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    placeholder="Московская область"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Почтовый индекс" error={errors.postalCode}>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="123456"
                  />
                </FormField>

                <FormField label="Часы работы" error={errors.workingHours}>
                  <Input
                    value={formData.workingHours}
                    onChange={(e) => handleInputChange('workingHours', e.target.value)}
                    placeholder="09:00-18:00"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Геолокация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Широта" error={errors.latitude}>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    placeholder="55.7558"
                  />
                </FormField>

                <FormField label="Долгота" error={errors.longitude}>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    placeholder="37.6173"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Контактная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Контактное лицо" error={errors.contactName}>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    placeholder="Иванов Иван Иванович"
                  />
                </FormField>

                <FormField label="Телефон" error={errors.contactPhone}>
                  <Input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+7 (495) 123-45-67"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Вместимость</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Общая вместимость (м²)" error={errors.capacity}>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="1000"
                  />
                </FormField>

                <FormField label="Текущая загрузка (м²)" error={errors.currentLoad}>
                  <Input
                    type="number"
                    value={formData.currentLoad}
                    onChange={(e) => handleInputChange('currentLoad', e.target.value)}
                    placeholder="0"
                  />
                </FormField>
              </div>

              {formData.capacity && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Загрузка склада</p>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          (parseInt(formData.currentLoad || '0', 10) /
                            parseInt(formData.capacity, 10)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(
                      (parseInt(formData.currentLoad || '0', 10) /
                        parseInt(formData.capacity, 10)) *
                        100 || 0
                    ).toFixed(1)}
                    % заполнено
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Статус</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked as boolean)}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Склад активен
                  </Label>
                </div>
              </FormField>
            </CardContent>
          </Card>

          <Separator />

          <FormActions>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Создание...' : 'Создать'}
            </Button>
          </FormActions>
        </div>
      </form>
    </div>
  );
}
