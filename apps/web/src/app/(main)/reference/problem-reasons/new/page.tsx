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

interface ProblemReasonFormData {
  code: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  isActive: boolean;
}

const categoryOptions = [
  { label: 'Задержка', value: 'delay' },
  { label: 'Отмена', value: 'cancellation' },
  { label: 'Проблема с грузом', value: 'cargo_issue' },
  { label: 'Финансовая', value: 'financial' },
  { label: 'Документация', value: 'documentation' },
];

const severityOptions = [
  { label: 'Низкий', value: 'low' },
  { label: 'Средний', value: 'medium' },
  { label: 'Высокий', value: 'high' },
];

export default function NewProblemReasonPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProblemReasonFormData>({
    code: '',
    name: '',
    description: '',
    category: 'delay',
    severity: 'medium',
    requiresApproval: false,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/problem-reasons', formData);
      router.push('/reference/problem-reasons');
    } catch (error) {
      console.error('Failed to create problem reason:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Новая причина проблемы</h1>
          <p className="text-muted-foreground">Создание новой причины</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Код" required>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="DELAY001"
                />
              </FormField>

              <FormField label="Название" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Задержка в пути"
                />
              </FormField>

              <FormField label="Категория" required>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Критичность" required>
                <Select
                  value={formData.severity}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      severity: value as ProblemReasonFormData['severity'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите уровень" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField label="Описание">
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание причины проблемы"
                rows={3}
              />
            </FormField>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresApproval: !!checked })
                  }
                />
                <Label htmlFor="requiresApproval">Требует одобрения</Label>
              </div>
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
