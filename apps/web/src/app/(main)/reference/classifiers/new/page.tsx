'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { FormField, FormActions } from '@/components/ui/form';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { apiClient } from '@/lib/auth/api';

interface Classifier {
  id: string;
  type: 'delay_reason' | 'cancellation_category' | 'cargo_type_category';
  code: string;
  name: string;
  description: string;
  value: string;
  parentId: string | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface ClassifierFormData {
  type: Classifier['type'];
  code: string;
  name: string;
  description: string;
  value: string;
  parentId: string;
  isActive: boolean;
  sortOrder: number;
}

const typeOptions = [
  { label: 'Причина задержки', value: 'delay_reason' },
  { label: 'Категория отмены', value: 'cancellation_category' },
  { label: 'Категория груза', value: 'cargo_type_category' },
];

export default function NewClassifierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ClassifierFormData>({
    type: 'delay_reason',
    code: '',
    name: '',
    description: '',
    value: '',
    parentId: '',
    isActive: true,
    sortOrder: 0,
  });
  const [classifiers, setClassifiers] = useState<Classifier[]>([]);

  useEffect(() => {
    fetchClassifiers();
  }, []);

  const fetchClassifiers = async () => {
    try {
      const data = await apiClient.get<Classifier[]>('/classifiers');
      setClassifiers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch classifiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/classifiers', {
        ...formData,
        parentId: formData.parentId || null,
      });
      router.push('/reference/classifiers');
    } catch (error) {
      console.error('Failed to create classifier:', error);
    } finally {
      setSaving(false);
    }
  };

  const parentOptions = classifiers
    .filter((c) => c.type === formData.type)
    .map((c) => ({ label: c.name, value: c.id }));

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Новый классификатор</h1>
          <p className="text-muted-foreground">Создание нового классификатора</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Тип" required>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as Classifier['type'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Код" required>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="DR001"
                />
              </FormField>

              <FormField label="Название" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Задержка по вине перевозчика"
                />
              </FormField>

              <FormField label="Значение">
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Значение"
                />
              </FormField>

              <FormField label="Родительский классификатор">
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите родителя" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Нет</SelectItem>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Порядок сортировки">
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                />
              </FormField>
            </div>

            <FormField label="Описание">
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание классификатора"
                rows={3}
              />
            </FormField>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <Label htmlFor="isActive">Активен</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <FormActions>
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Отмена
          </Button>
          <Button type="submit" disabled={saving}>
            <Plus className="mr-2 h-4 w-4" />
            {saving ? 'Создание...' : 'Создать'}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
