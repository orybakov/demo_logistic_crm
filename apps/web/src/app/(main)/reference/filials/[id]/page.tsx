'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormActions } from '@/components/ui/form';
import { ArrowLeft, Save } from 'lucide-react';
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

interface FilialFormData {
  code: string;
  name: string;
  shortName: string;
  address: string;
  phone: string;
  email: string;
  isHead: boolean;
  isActive: boolean;
}

export default function EditFilialPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [formData, setFormData] = useState<FilialFormData>({
    code: '',
    name: '',
    shortName: '',
    address: '',
    phone: '',
    email: '',
    isHead: false,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchFilial = async () => {
      try {
        const response = await apiClient.get<Filial>(`/filials/${params.id}`);
        setFormData({
          code: response.code || '',
          name: response.name || '',
          shortName: response.shortName || '',
          address: response.address || '',
          phone: response.phone || '',
          email: response.email || '',
          isHead: response.isHead || false,
          isActive: response.isActive ?? true,
        });
      } catch (error) {
        console.error('Error fetching filial:', error);
        alert('Не удалось загрузить данные филиала');
        router.push('/reference/filials');
      } finally {
        setFetching(false);
      }
    };

    fetchFilial();
  }, [params.id, router]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Код обязателен';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await apiClient.put(`/filials/${params.id}`, formData);
      router.push('/reference/filials');
    } catch (error) {
      console.error('Error updating filial:', error);
      alert('Не удалось обновить филиал');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FilialFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Редактирование филиала"
        description="Редактирование данных филиала"
        breadcrumbs={[
          { label: 'Справочники', href: '/reference' },
          { label: 'Филиалы', href: '/reference/filials' },
          { label: 'Редактирование' },
        ]}
        actions={[
          {
            label: 'Назад',
            icon: ArrowLeft,
            variant: 'outline',
            onClick: () => router.push('/reference/filials'),
          },
        ]}
      />

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField label="Код" required error={errors.code}>
            <Input
              placeholder="Например: ФИЛИАЛ-001"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
            />
          </FormField>

          <FormField label="Название" required error={errors.name}>
            <Input
              placeholder="Полное название филиала"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </FormField>

          <FormField label="Краткое название">
            <Input
              placeholder="Краткое название"
              value={formData.shortName}
              onChange={(e) => handleChange('shortName', e.target.value)}
            />
          </FormField>

          <div />

          <FormField label="Адрес" className="md:col-span-2">
            <Input
              placeholder="г. Москва, ул. ..."
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </FormField>

          <FormField label="Телефон">
            <Input
              placeholder="+7 (495) 123-45-67"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </FormField>

          <FormField label="Email">
            <Input
              type="email"
              placeholder="filial@company.ru"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </FormField>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isHead"
                checked={formData.isHead}
                onCheckedChange={(checked) => handleChange('isHead', checked === true)}
              />
              <label htmlFor="isHead" className="text-sm font-medium">
                Головной офис
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked === true)}
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Активен
              </label>
            </div>
          </div>
        </div>

        <FormActions>
          <Button variant="outline" onClick={() => router.push('/reference/filials')}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </FormActions>
      </div>
    </div>
  );
}
