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
import { ErrorBanner } from '@/components/ui/error-state';
import { requestsApi } from '@/lib/api/requests';
import { clientsApi, type ClientSummary } from '@/lib/api/clients';
import { useFormSubmitError } from '@/lib/hooks/use-form-submit-error';
import { RequestPriority, RequestType, priorityLabels, typeLabels } from '@/lib/api/requests/types';

interface RequestFormState {
  clientId: string;
  type: RequestType;
  priority: RequestPriority;
  pickupCity: string;
  pickupAddress: string;
  deliveryCity: string;
  deliveryAddress: string;
  notes: string;
}

const initialState: RequestFormState = {
  clientId: '',
  type: RequestType.AUTO,
  priority: RequestPriority.NORMAL,
  pickupCity: '',
  pickupAddress: '',
  deliveryCity: '',
  deliveryAddress: '',
  notes: '',
};

export default function NewRequestPage() {
  const router = useRouter();
  const [form, setForm] = useState<RequestFormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof RequestFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const { submitError, clearSubmitError, setSubmitErrorFromUnknown } = useFormSubmitError(
    'Не удалось создать заявку'
  );

  useEffect(() => {
    let mounted = true;
    setClientsLoading(true);

    clientsApi
      .getList({ take: 100, isActive: true })
      .then((response) => {
        if (!mounted) return;
        setClients(response.clients);
      })
      .catch(() => {
        if (!mounted) return;
        setClientsError('Не удалось загрузить список клиентов');
      })
      .finally(() => {
        if (!mounted) return;
        setClientsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const validate = () => {
    const nextErrors: Partial<Record<keyof RequestFormState, string>> = {};
    if (!form.clientId.trim()) nextErrors.clientId = 'Клиент обязателен';
    if (!form.pickupAddress.trim()) nextErrors.pickupAddress = 'Адрес отправки обязателен';
    if (!form.deliveryAddress.trim()) nextErrors.deliveryAddress = 'Адрес доставки обязателен';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    clearSubmitError();
    try {
      const created = await requestsApi.create({
        clientId: form.clientId.trim(),
        type: form.type,
        priority: form.priority,
        points: [
          {
            type: 'pickup',
            sequence: 1,
            address: form.pickupAddress.trim(),
            city: form.pickupCity.trim() || undefined,
          },
          {
            type: 'delivery',
            sequence: 2,
            address: form.deliveryAddress.trim(),
            city: form.deliveryCity.trim() || undefined,
          },
        ],
        notes: form.notes.trim() || undefined,
      });

      router.push(`/requests/${created.id}`);
    } catch (error) {
      setSubmitErrorFromUnknown(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Новая заявка</h1>
          <p className="text-muted-foreground">Создание заявки на перевозку</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && <ErrorBanner message={submitError} />}

        <Card>
          <CardHeader>
            <CardTitle>Основные данные</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Клиент" required error={errors.clientId}>
              <Select
                value={form.clientId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, clientId: value }))}
                disabled={clientsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={clientsLoading ? 'Загрузка клиентов...' : 'Выберите клиента'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                      {client.inn ? ` • ${client.inn}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clientsError && <p className="text-sm text-destructive">{clientsError}</p>}
            </FormField>

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
                    {Object.values(RequestType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {typeLabels[type]}
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
                    {Object.values(RequestPriority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priorityLabels[priority]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Маршрут</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Город отправки">
                <Input
                  value={form.pickupCity}
                  onChange={(e) => setForm((prev) => ({ ...prev, pickupCity: e.target.value }))}
                  placeholder="Москва"
                />
              </FormField>
              <FormField label="Адрес отправки" required error={errors.pickupAddress}>
                <Input
                  value={form.pickupAddress}
                  onChange={(e) => setForm((prev) => ({ ...prev, pickupAddress: e.target.value }))}
                  placeholder="Склад, улица, дом"
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Город доставки">
                <Input
                  value={form.deliveryCity}
                  onChange={(e) => setForm((prev) => ({ ...prev, deliveryCity: e.target.value }))}
                  placeholder="Санкт-Петербург"
                />
              </FormField>
              <FormField label="Адрес доставки" required error={errors.deliveryAddress}>
                <Input
                  value={form.deliveryAddress}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))
                  }
                  placeholder="Склад, улица, дом"
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Комментарий</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Дополнительная информация"
              rows={5}
            />
          </CardContent>
        </Card>

        <FormActions>
          <Link href="/requests">
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            Создать заявку
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
