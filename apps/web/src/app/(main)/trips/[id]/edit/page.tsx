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
import { FormActions, FormField } from '@/components/ui/form';
import { ErrorState } from '@/components/ui/error-state';
import { tripsApi } from '@/lib/api/trips';
import type { Trip } from '@/lib/api/trips/types';
import { useFormSubmitError } from '@/lib/hooks/use-form-submit-error';

interface TripFormState {
  plannedStart: string;
  plannedEnd: string;
  plannedDistance: string;
  plannedDuration: string;
  plannedFuel: string;
  notes: string;
}

const emptyForm: TripFormState = {
  plannedStart: '',
  plannedEnd: '',
  plannedDistance: '',
  plannedDuration: '',
  plannedFuel: '',
  notes: '',
};

function toInputValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function EditTripPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [form, setForm] = useState<TripFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TripFormState, string>>>({});
  const { submitError, clearSubmitError, setSubmitErrorFromUnknown } = useFormSubmitError(
    'Не удалось сохранить рейс'
  );

  useEffect(() => {
    let mounted = true;

    tripsApi
      .getById(params.id)
      .then((data) => {
        if (!mounted) return;
        setTrip(data);
        setForm({
          plannedStart: toInputValue(data.plannedStart),
          plannedEnd: toInputValue(data.plannedEnd),
          plannedDistance: data.plannedDistance?.toString() ?? '',
          plannedDuration: data.plannedDuration?.toString() ?? '',
          plannedFuel: data.plannedFuel?.toString() ?? '',
          notes: data.notes ?? '',
        });
      })
      .catch(() => {
        if (!mounted) return;
        setError('Не удалось загрузить данные рейса');
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
    const nextErrors: Partial<Record<keyof TripFormState, string>> = {};
    if (form.plannedDistance && Number.isNaN(Number(form.plannedDistance))) {
      nextErrors.plannedDistance = 'Пробег должен быть числом';
    }
    if (form.plannedDuration && Number.isNaN(Number(form.plannedDuration))) {
      nextErrors.plannedDuration = 'Длительность должна быть числом';
    }
    if (form.plannedFuel && Number.isNaN(Number(form.plannedFuel))) {
      nextErrors.plannedFuel = 'Топливо должно быть числом';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    clearSubmitError();
    try {
      await tripsApi.update(params.id, {
        plannedStart: form.plannedStart || undefined,
        plannedEnd: form.plannedEnd || undefined,
        plannedDistance: form.plannedDistance ? Number(form.plannedDistance) : undefined,
        plannedDuration: form.plannedDuration ? Number(form.plannedDuration) : undefined,
        plannedFuel: form.plannedFuel ? Number(form.plannedFuel) : undefined,
        notes: form.notes || undefined,
      });
      router.push(`/trips/${params.id}`);
    } catch (error) {
      setSubmitErrorFromUnknown(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Загрузка...</div>;
  }

  if (error || !trip) {
    return (
      <ErrorState
        title="Ошибка загрузки"
        message={error || 'Рейс не найден'}
        onRetry={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/trips/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Редактирование рейса</h1>
          <p className="text-muted-foreground">{trip.number}</p>
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
            <CardTitle>План рейса</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trip.request && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                Заявка: {trip.request.number}
                {trip.request.client?.name ? ` • ${trip.request.client.name}` : ''}
              </div>
            )}

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
              <FormField label="Плановый пробег (км)" error={fieldErrors.plannedDistance}>
                <Input
                  type="number"
                  value={form.plannedDistance}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, plannedDistance: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Плановая длительность (мин)" error={fieldErrors.plannedDuration}>
                <Input
                  type="number"
                  value={form.plannedDuration}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, plannedDuration: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Плановое топливо (л)" error={fieldErrors.plannedFuel}>
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
              />
            </FormField>
          </CardContent>
        </Card>

        <FormActions>
          <Link href={`/trips/${params.id}`}>
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
