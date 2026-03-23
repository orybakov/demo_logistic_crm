'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  Button,
  Input,
  Textarea,
  FormField,
  FormSection,
  FormActions,
  Checkbox,
  Spinner,
} from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/auth/api';
import { ArrowLeft, Save } from 'lucide-react';

interface Filial {
  id: string;
  name: string;
}

interface FormData {
  code: string;
  name: string;
  inn: string;
  kpp: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  filialId: string;
  isActive: boolean;
}

interface FormErrors {
  code?: string;
  name?: string;
  inn?: string;
  address?: string;
}

export default function NewRecipientPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filials, setFilials] = useState<Filial[]>([]);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    inn: '',
    kpp: '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
    filialId: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const fetchFilials = async () => {
      try {
        const response = await apiClient.get<{ data: Filial[] }>('/filials?isActive=true');
        setFilials(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch filials:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilials();
  }, []);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.code.trim()) {
      newErrors.code = 'Код обязателен';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    if (!formData.inn.trim()) {
      newErrors.inn = 'ИНН обязателен';
    } else if (!/^\d{10}$|^\d{12}$/.test(formData.inn)) {
      newErrors.inn = 'ИНН должен содержать 10 или 12 цифр';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Адрес обязателен';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.trim(),
        name: formData.name.trim(),
        inn: formData.inn.trim(),
        kpp: formData.kpp.trim() || undefined,
        address: formData.address.trim(),
        city: formData.city.trim() || undefined,
        region: formData.region.trim() || undefined,
        postalCode: formData.postalCode.trim() || undefined,
        contactName: formData.contactName.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        filialId: formData.filialId || undefined,
      };

      await apiClient.post('/recipients', payload);
      toast({
        title: 'Успешно',
        description: 'Грузополучатель создан',
      });
      router.push('/reference/recipients');
    } catch (error) {
      console.error('Failed to create recipient:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать грузополучателя',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Новый грузополучатель"
        breadcrumbs={[
          { label: 'Справочники', href: '/reference' },
          { label: 'Грузополучатели', href: '/reference/recipients' },
          { label: 'Создание' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Основная информация">
          <FormField label="Код" required error={errors.code}>
            <Input
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="Код грузополучателя"
            />
          </FormField>
          <FormField label="Название" required error={errors.name}>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="ООО Название компании"
            />
          </FormField>
          <FormField label="ИНН" required error={errors.inn}>
            <Input
              value={formData.inn}
              onChange={(e) => handleChange('inn', e.target.value)}
              placeholder="7712345678"
              maxLength={12}
            />
          </FormField>
          <FormField label="КПП">
            <Input
              value={formData.kpp}
              onChange={(e) => handleChange('kpp', e.target.value)}
              placeholder="771201001"
              maxLength={9}
            />
          </FormField>
          <FormField label="Филиал">
            <Select
              value={formData.filialId}
              onValueChange={(value) => handleChange('filialId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите филиал" />
              </SelectTrigger>
              <SelectContent>
                {filials.map((filial) => (
                  <SelectItem key={filial.id} value={filial.id}>
                    {filial.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked as boolean)}
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Активен
              </label>
            </div>
          </FormField>
        </FormSection>

        <FormSection title="Адрес">
          <FormField label="Регион">
            <Input
              value={formData.region}
              onChange={(e) => handleChange('region', e.target.value)}
              placeholder="Московская область"
            />
          </FormField>
          <FormField label="Город">
            <Input
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Москва"
            />
          </FormField>
          <FormField label="Адрес" required error={errors.address}>
            <Input
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="ул. Промышленная, д. 15"
            />
          </FormField>
          <FormField label="Почтовый индекс">
            <Input
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              placeholder="123456"
              maxLength={6}
            />
          </FormField>
        </FormSection>

        <FormSection title="Контактная информация">
          <FormField label="Контактное лицо">
            <Input
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              placeholder="Иванов Иван Иванович"
            />
          </FormField>
          <FormField label="Телефон">
            <Input
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              placeholder="+7 (495) 123-45-67"
            />
          </FormField>
          <FormField label="Email">
            <Input
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              placeholder="email@company.ru"
              type="email"
            />
          </FormField>
        </FormSection>

        <FormSection title="Дополнительно">
          <FormField label="Примечания" className="sm:col-span-2">
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Дополнительная информация о грузополучателе..."
              rows={3}
            />
          </FormField>
        </FormSection>

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/reference/recipients')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Отмена
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Создание...' : 'Создать'}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
