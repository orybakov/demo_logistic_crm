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
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { ordersApi } from '@/lib/api/orders';
import type { Order as OrderModel, PaymentStatus } from '@/lib/api/orders/types';
import { paymentStatusLabels, PaymentStatus as PaymentStatusEnum } from '@/lib/api/orders/types';
import { useFormSubmitError } from '@/lib/hooks/use-form-submit-error';

interface OrderFormState {
  orderDate: string;
  subtotal: string;
  vatRate: string;
  paymentStatus: PaymentStatus;
  paymentDeadline: string;
  paymentType: string;
  notes: string;
}

const emptyForm: OrderFormState = {
  orderDate: '',
  subtotal: '',
  vatRate: '',
  paymentStatus: PaymentStatusEnum.UNPAID,
  paymentDeadline: '',
  paymentType: '',
  notes: '',
};

function toDateTimeInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function EditOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderModel | null>(null);
  const [form, setForm] = useState<OrderFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof OrderFormState, string>>>({});
  const { submitError, clearSubmitError, setSubmitErrorFromUnknown } = useFormSubmitError(
    'Не удалось сохранить заказ'
  );

  useEffect(() => {
    let mounted = true;

    ordersApi
      .getById(params.id)
      .then((data) => {
        if (!mounted) return;
        setOrder(data);
        setForm({
          orderDate: toDateTimeInput(data.orderDate),
          subtotal: String(data.subtotal ?? ''),
          vatRate: String(data.vatRate ?? ''),
          paymentStatus: data.paymentStatus,
          paymentDeadline: toDateInput(data.paymentDeadline),
          paymentType: data.paymentType ?? '',
          notes: data.notes ?? '',
        });
      })
      .catch(() => {
        if (!mounted) return;
        setError('Не удалось загрузить данные заказа');
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
    const nextErrors: Partial<Record<keyof OrderFormState, string>> = {};
    if (form.subtotal && Number.isNaN(Number(form.subtotal)))
      nextErrors.subtotal = 'Сумма должна быть числом';
    if (form.vatRate && Number.isNaN(Number(form.vatRate)))
      nextErrors.vatRate = 'НДС должен быть числом';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    clearSubmitError();
    try {
      await ordersApi.update(params.id, {
        orderDate: form.orderDate || undefined,
        subtotal: form.subtotal ? Number(form.subtotal) : undefined,
        vatRate: form.vatRate ? Number(form.vatRate) : undefined,
        paymentStatus: form.paymentStatus,
        paymentDeadline: form.paymentDeadline || undefined,
        paymentType: form.paymentType || undefined,
        notes: form.notes || undefined,
      });
      router.push(`/orders/${params.id}`);
    } catch (error) {
      setSubmitErrorFromUnknown(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Загрузка...</div>;

  if (error || !order) {
    return (
      <ErrorState
        title="Ошибка загрузки"
        message={error || 'Заказ не найден'}
        onRetry={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/orders/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Редактирование заказа</h1>
          <p className="text-muted-foreground">{order.number}</p>
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
            <FormField label="Дата заказа">
              <DatePickerInput
                type="date"
                value={form.orderDate}
                onChange={(e) => setForm((prev) => ({ ...prev, orderDate: e.target.value }))}
              />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Сумма без НДС" required error={fieldErrors.subtotal}>
                <Input
                  type="number"
                  value={form.subtotal}
                  onChange={(e) => setForm((prev) => ({ ...prev, subtotal: e.target.value }))}
                />
              </FormField>

              <FormField label="Ставка НДС" error={fieldErrors.vatRate}>
                <Input
                  type="number"
                  value={form.vatRate}
                  onChange={(e) => setForm((prev) => ({ ...prev, vatRate: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                    {Object.entries(paymentStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <FormField label="Способ оплаты">
              <Input
                value={form.paymentType}
                onChange={(e) => setForm((prev) => ({ ...prev, paymentType: e.target.value }))}
                placeholder="Безналичный / наличный"
              />
            </FormField>

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
          <Link href={`/orders/${params.id}`}>
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
