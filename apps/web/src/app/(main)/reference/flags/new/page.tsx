'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button, FormField, FormSection, FormActions } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/auth/api';
import { Save } from 'lucide-react';

const entityTypeOptions = [
  { label: 'Заявка', value: 'request' },
  { label: 'Рейс', value: 'trip' },
  { label: 'Заказ', value: 'order' },
];

export default function NewFlagPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '#EF4444',
    icon: '',
    entityType: 'request' as 'request' | 'trip' | 'order',
    isSystem: false,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.code.trim()) newErrors.code = 'Код обязателен';
    if (!formData.name.trim()) newErrors.name = 'Название обязательно';
    if (!formData.color.trim()) newErrors.color = 'Цвет обязателен';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await apiClient.post('/flags', {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color.trim() || undefined,
        icon: formData.icon.trim() || undefined,
        entityType: formData.entityType,
        isSystem: formData.isSystem,
        isActive: formData.isActive,
      });
      router.push('/reference/flags');
    } catch (error) {
      console.error('Failed to create flag:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Новый флаг"
        description="Создание нового флага"
        breadcrumbs={[
          { label: 'Справочники', href: '/reference' },
          { label: 'Флаги', href: '/reference/flags' },
          { label: 'Новый' },
        ]}
      />

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="space-y-6">
          <FormSection title="Основная информация">
            <FormField label="Код" required error={errors.code}>
              <Input
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="URGENT"
              />
            </FormField>

            <FormField label="Название" required error={errors.name}>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Срочный"
              />
            </FormField>

            <FormField label="Тип сущности" required>
              <Select
                value={formData.entityType}
                onValueChange={(value) => handleChange('entityType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Описание" className="col-span-2">
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Описание флага..."
                rows={3}
              />
            </FormField>
          </FormSection>

          <FormSection title="Визуальные настройки">
            <FormField label="Цвет" required error={errors.color}>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-20"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  placeholder="#EF4444"
                  className="flex-1"
                />
              </div>
            </FormField>

            <FormField label="Иконка">
              <Input
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                placeholder="flame, star, alert-triangle..."
              />
            </FormField>
          </FormSection>

          <FormSection title="Настройки">
            <FormField>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
                <Label htmlFor="isActive" className="cursor-pointer font-normal">
                  Активен
                </Label>
              </div>
            </FormField>
          </FormSection>
        </div>

        <FormActions>
          <Button variant="outline" onClick={() => router.back()}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Создание...' : 'Создать'}
          </Button>
        </FormActions>
      </div>
    </div>
  );
}
