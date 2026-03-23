'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormActions, FormField } from '@/components/ui/form';
import { ErrorState } from '@/components/ui/error-state';
import { tripsApi } from '@/lib/api/trips';
import type { AvailableResources, Trip } from '@/lib/api/trips/types';
import { useFormSubmitError } from '@/lib/hooks/use-form-submit-error';

interface AssignFormState {
  vehicleId: string;
  driverId: string;
}

const emptyForm: AssignFormState = {
  vehicleId: '',
  driverId: '',
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AssignTripPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [resources, setResources] = useState<AvailableResources | null>(null);
  const [form, setForm] = useState<AssignFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AssignFormState, string>>>(
    {}
  );
  const { submitError, clearSubmitError, setSubmitErrorFromUnknown } = useFormSubmitError(
    'Не удалось назначить транспорт и водителя'
  );

  useEffect(() => {
    let mounted = true;

    tripsApi
      .getById(params.id)
      .then(async (tripData) => {
        if (!mounted) return;
        setTrip(tripData);
        setForm({
          vehicleId: tripData.vehicleId || '',
          driverId: tripData.driverId || '',
        });

        if (!tripData.plannedStart || !tripData.plannedEnd) {
          setResources({ vehicles: [], drivers: [] });
          return;
        }

        const available = await tripsApi.getAvailableResources(
          tripData.plannedStart,
          tripData.plannedEnd,
          params.id
        );
        if (!mounted) return;
        setResources(available);
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
    const nextErrors: Partial<Record<keyof AssignFormState, string>> = {};
    if (!form.vehicleId) nextErrors.vehicleId = 'Выберите транспорт';
    if (!form.driverId) nextErrors.driverId = 'Выберите водителя';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    clearSubmitError();
    try {
      await tripsApi.assignResources(params.id, {
        vehicleId: form.vehicleId,
        driverId: form.driverId,
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
          <h1 className="text-2xl font-bold tracking-tight">Назначение ресурсов</h1>
          <p className="text-muted-foreground">{trip.number}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>План рейса</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <p className="text-muted-foreground">Заявка</p>
            <p className="font-medium">{trip.request?.number || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Клиент</p>
            <p className="font-medium">{trip.request?.client?.name || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Плановое начало</p>
            <p className="font-medium">{formatDateTime(trip.plannedStart)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Плановое завершение</p>
            <p className="font-medium">{formatDateTime(trip.plannedEnd)}</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {!trip.plannedStart || !trip.plannedEnd ? (
          <ErrorState
            title="Нельзя назначить ресурсы"
            message="Сначала заполните плановое начало и завершение рейса"
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Выбор ресурсов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Транспорт" required error={fieldErrors.vehicleId}>
                <Select
                  value={form.vehicleId}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, vehicleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите транспорт" />
                  </SelectTrigger>
                  <SelectContent>
                    {(resources?.vehicles || []).map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plateNumber}
                        {vehicle.brand
                          ? ` • ${vehicle.brand}${vehicle.model ? ` ${vehicle.model}` : ''}`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Водитель" required error={fieldErrors.driverId}>
                <Select
                  value={form.driverId}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, driverId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите водителя" />
                  </SelectTrigger>
                  <SelectContent>
                    {(resources?.drivers || []).map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName}
                        {driver.phone ? ` • ${driver.phone}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <div className="text-sm text-muted-foreground">
                Доступно транспорта: {resources?.vehicles?.length || 0}, водителей:{' '}
                {resources?.drivers?.length || 0}
              </div>
            </CardContent>
          </Card>
        )}

        <FormActions>
          <Link href={`/trips/${params.id}`}>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </Link>
          <Button type="submit" disabled={saving || !trip.plannedStart || !trip.plannedEnd}>
            <Save className="mr-2 h-4 w-4" />
            Назначить
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
