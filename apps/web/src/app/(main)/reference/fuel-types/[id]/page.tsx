'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormField, FormActions } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { apiClient } from '@/lib/auth/api';

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

export default function EditFuelTypePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<FuelTypeFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FuelTypeFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFuelType = async () => {
      try {
        const response = await apiClient.get<{
          id: string;
          code: string;
          name: string;
          description: string;
          isActive: boolean;
        }>(`/fuel-types/${id}`);

        setFormData({
          code: response.code,
          name: response.name,
          description: response.description || '',
          isActive: response.isActive,
        });
      } catch (error) {
        console.error('Failed to fetch fuel type:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchFuelType();
    }
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FuelTypeFormData, string>> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Код обязателен';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
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
        isActive: formData.isActive,
      };

      await apiClient.put(`/fuel-types/${id}`, payload);
      router.push('/reference/fuel-types');
    } catch (error) {
      console.error('Failed to update fuel type:', error);
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
        <Link href="/reference/fuel-types">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Редактирование типа топлива</h1>
          <p className="text-muted-foreground">Изменение данных типа топлива</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Код" required error={errors.code}>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="A95"
              />
            </FormField>

            <FormField label="Название" required error={errors.name}>
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
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Активен
              </Label>
            </div>
          </CardContent>
        </Card>

        <FormActions>
          <Link href="/reference/fuel-types">
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
