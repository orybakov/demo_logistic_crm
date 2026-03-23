'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormActions, FormField } from '@/components/ui/form';
import { ErrorBanner } from '@/components/ui/error-state';
import { tripsApi } from '@/lib/api/trips';
import { requestsApi } from '@/lib/api/requests';
import type { Request as RequestSummary } from '@/lib/api/requests/types';
import { useFormSubmitError } from '@/lib/hooks/use-form-submit-error';

interface TripFormState {
  requestId: string;
  plannedStart: string;
  plannedEnd: string;
  plannedDistance: string;
  plannedDuration: string;
  plannedFuel: string;
  notes: string;
}

const initialState: TripFormState = {
  requestId: '',
  plannedStart: '',
  plannedEnd: '',
  plannedDistance: '',
  plannedDuration: '',
  plannedFuel: '',
  notes: '',
};

export default function NewTripPage() {
  const router = useRouter();
  const [form, setForm] = useState<TripFormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof TripFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const { submitError, clearSubmitError, setSubmitErrorFromUnknown } =
    useFormSubmitError('Не удалось создать рейс');

  useEffect(() => {
    let mounted = true;
    setRequestsLoading(true);

    requestsApi
      .getList({ page: 1, limit: 100 })
      .then((response) => {
        if (!mounted) return;
        setRequests(response.requests);
      })
      .catch(() => {
        if (!mounted) return;
        setRequestsError('Не удалось загрузить список заявок');
      })
      .finally(() => {
        if (!mounted) return;
        setRequestsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedRequest = Array.isArray(requests)
    ? requests.find((item) => item.id === form.requestId)
    : undefined;

  const validate = () => {
    const nextErrors: Partial<Record<keyof TripFormState, string>> = {};
    if (!form.requestId.trim()) nextErrors.requestId = 'Заявка обязательна';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    clearSubmitError();
    try {
      const created = await tripsApi.create({
        requestId: form.requestId,
        plannedStart: form.plannedStart || undefined,
        plannedEnd: form.plannedEnd || undefined,
        plannedDistance: form.plannedDistance ? Number(form.plannedDistance) : undefined,
        plannedDuration: form.plannedDuration ? Number(form.plannedDuration) : undefined,
        plannedFuel: form.plannedFuel ? Number(form.plannedFuel) : undefined,
        notes: form.notes || undefined,
      });

      router.push(`/trips/${created.id}`);
    } catch (error) {
      setSubmitErrorFromUnknown(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trips">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Новый рейс</h1>
          <p className="text-muted-foreground">Создание рейса на основе заявки</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && <ErrorBanner message={submitError} />}

        <Card>
          <CardHeader>
            <CardTitle>Основа рейса</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Заявка" required error={errors.requestId}>
              <Select
                value={form.requestId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, requestId: value }))}
                disabled={requestsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={requestsLoading ? 'Загрузка заявок...' : 'Выберите заявку'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(requests) ? requests : []).map((req) => (
                    <SelectItem key={req.id} value={req.id}>
                      {req.number}
                      {req.client ? ` • ${req.client.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {requestsError && <p className="text-sm text-destructive">{requestsError}</p>}
              {selectedRequest?.client && (
                <p className="text-xs text-muted-foreground">
                  Клиент: {selectedRequest.client.name}
                </p>
              )}
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Плановое начало">
                <DatePickerInput
                  type="datetime-local"
                  value={form.plannedStart}
                  onChange={(e) => setForm((prev) => ({ ...prev, plannedStart: e.target.value }))}
                />
              </FormField>
              <FormField label="Плановое завершение">
                <DatePickerInput
                  type="datetime-local"
                  value={form.plannedEnd}
                  onChange={(e) => setForm((prev) => ({ ...prev, plannedEnd: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Плановый пробег (км)">
                <Input
                  type="number"
                  value={form.plannedDistance}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, plannedDistance: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Плановая длительность (мин)">
                <Input
                  type="number"
                  value={form.plannedDuration}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, plannedDuration: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Плановое топливо (л)">
                <Input
                  type="number"
                  value={form.plannedFuel}
                  onChange={(e) => setForm((prev) => ({ ...prev, plannedFuel: e.target.value }))}
                />
              </FormField>
            </div>

            <FormField label="Комментарий">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={5}
                placeholder="План, комментарий или ограничения"
              />
            </FormField>
          </CardContent>
        </Card>

        <FormActions>
          <Link href="/trips">
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            Создать рейс
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
