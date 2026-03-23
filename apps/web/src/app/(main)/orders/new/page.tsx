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
import { ordersApi } from '@/lib/api/orders';
import { clientsApi, type ClientSummary } from '@/lib/api/clients';
import { useFormSubmitError } from '@/lib/hooks/use-form-submit-error';
import { PaymentStatus, paymentStatusLabels } from '@/lib/api/orders/types';

interface OrderFormState {
  clientId: string;
  subtotal: string;
  vatRate: string;
  orderDate: string;
  paymentDeadline: string;
  paymentStatus: PaymentStatus;
  notes: string;
}

const initialState: OrderFormState = {
  clientId: '',
  subtotal: '',
  vatRate: '20',
  orderDate: new Date().toISOString().slice(0, 10),
  paymentDeadline: '',
  paymentStatus: PaymentStatus.UNPAID,
  notes: '',
};

export default function NewOrderPage() {
  const router = useRouter();
  const [form, setForm] = useState<OrderFormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const { submitError, clearSubmitError, setSubmitErrorFromUnknown } = useFormSubmitError(
    'Не удалось создать заказ'
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
    const nextErrors: Partial<Record<keyof OrderFormState, string>> = {};

    if (!form.clientId.trim()) nextErrors.clientId = 'Клиент обязателен';
    if (!form.subtotal.trim() || Number.isNaN(Number(form.subtotal))) {
      nextErrors.subtotal = 'Subtotal must be a number';
    }
    if (form.vatRate && Number.isNaN(Number(form.vatRate))) {
      nextErrors.vatRate = 'VAT rate must be a number';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    clearSubmitError();
    try {
      const created = await ordersApi.create({
        clientId: form.clientId.trim(),
        subtotal: Number(form.subtotal),
        vatRate: form.vatRate ? Number(form.vatRate) : undefined,
        orderDate: form.orderDate || undefined,
        paymentStatus: form.paymentStatus,
        paymentDeadline: form.paymentDeadline || undefined,
        notes: form.notes || undefined,
      });

      router.push(`/orders/${created.id}`);
    } catch (error) {
      setSubmitErrorFromUnknown(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/orders/list')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Новый заказ</h1>
          <p className="text-muted-foreground">Создание коммерческого заказа</p>
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
              <FormField label="Дата заказа">
                <DatePickerInput
                  type="date"
                  value={form.orderDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, orderDate: e.target.value }))}
                />
              </FormField>

              <FormField label="Срок оплаты">
                <DatePickerInput
                  type="date"
                  value={form.paymentDeadline}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, paymentDeadline: e.target.value }))
                  }
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Сумма без НДС" required error={errors.subtotal}>
                <Input
                  type="number"
                  value={form.subtotal}
                  onChange={(e) => setForm((prev) => ({ ...prev, subtotal: e.target.value }))}
                  placeholder="100000"
                />
              </FormField>

              <FormField label="Ставка НДС" error={errors.vatRate}>
                <Input
                  type="number"
                  value={form.vatRate}
                  onChange={(e) => setForm((prev) => ({ ...prev, vatRate: e.target.value }))}
                  placeholder="20"
                />
              </FormField>
            </div>

            <FormField label="Статус оплаты">
              <Select
                value={form.paymentStatus}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, paymentStatus: value as PaymentStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {paymentStatusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Комментарий">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Дополнительные детали заказа"
                rows={5}
              />
            </FormField>
          </CardContent>
        </Card>

        <FormActions>
          <Link href="/orders/list">
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            Создать заказ
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
