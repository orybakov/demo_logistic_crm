'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormActions, FormField } from '@/components/ui/form';
import { ErrorState } from '@/components/ui/error-state';
import { requestsApi } from '@/lib/api/requests';
import {
  RequestPriority,
  RequestType,
  priorityLabels,
  typeLabels,
  type Request as RequestModel,
} from '@/lib/api/requests/types';
import { useFormSubmitError } from '@/lib/hooks/use-form-submit-error';

interface RequestFormState {
  type: RequestType;
  priority: RequestPriority;
  notes: string;
}

const emptyForm: RequestFormState = {
  type: RequestType.AUTO,
  priority: RequestPriority.NORMAL,
  notes: '',
};

export default function EditRequestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [request, setRequest] = useState<RequestModel | null>(null);
  const [form, setForm] = useState<RequestFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RequestFormState, string>>>(
    {}
  );
  const { submitError, clearSubmitError, setSubmitErrorFromUnknown } = useFormSubmitError(
    'Не удалось сохранить заявку'
  );

  useEffect(() => {
    let mounted = true;

    requestsApi
      .getById(params.id)
      .then((requestData) => {
        if (!mounted) return;
        setRequest(requestData);
        setForm({
          type: (requestData.type as RequestType) || RequestType.AUTO,
          priority: (requestData.priority as RequestPriority) || RequestPriority.NORMAL,
          notes: requestData.notes ?? '',
        });
      })
      .catch(() => {
        if (!mounted) return;
        setError('Не удалось загрузить данные заявки');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [params.id]);

  const validate = () => {
    const nextErrors: Partial<Record<keyof RequestFormState, string>> = {};
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    clearSubmitError();
    try {
      await requestsApi.update(params.id, {
        type: form.type,
        priority: form.priority,
        notes: form.notes || undefined,
      });
      router.push(`/requests/${params.id}`);
    } catch (error) {
      setSubmitErrorFromUnknown(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Загрузка...</div>;
  }

  if (error || !request) {
    return (
      <ErrorState
        title="Ошибка загрузки"
        message={error || 'Заявка не найдена'}
        onRetry={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/requests/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Редактирование заявки</h1>
          <p className="text-muted-foreground">{request.number}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Основные данные</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Клиент</p>
              <p className="text-muted-foreground">{request.client?.name || '—'}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Тип заявки">
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, type: value as RequestType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Приоритет">
                <Select
                  value={form.priority}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, priority: value as RequestPriority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField label="Комментарий">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={5}
              />
            </FormField>
          </CardContent>
        </Card>

        <FormActions>
          <Link href={`/requests/${params.id}`}>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Сохранить
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
