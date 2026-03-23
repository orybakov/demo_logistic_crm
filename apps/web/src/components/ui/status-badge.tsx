import { cn } from '@/lib/utils';
import { Badge, type BadgeProps } from './badge';

type StatusVariant = NonNullable<BadgeProps['variant']>;

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  label?: string;
  className?: string;
}

const statusVariantsMap: Record<string, StatusVariant> = {
  Новая: 'info',
  'В работе': 'default',
  Завершена: 'success',
  Отменена: 'destructive',
  Черновик: 'secondary',
  'На рассмотрении': 'warning',
  Подтверждена: 'success',
  Выполняется: 'default',
  Просрочена: 'destructive',
  Оплачен: 'success',
  'Частично оплачен': 'warning',
  'Не оплачен': 'destructive',
  Запланирован: 'info',
  'В пути': 'default',
  'На погрузке': 'warning',
  'На выгрузке': 'warning',
  Активен: 'success',
  Неактивен: 'secondary',
  Срочная: 'destructive',
};

export function StatusBadge({ status, variant, label, className }: StatusBadgeProps) {
  const resolvedVariant = variant || statusVariantsMap[status] || 'secondary';

  return (
    <Badge variant={resolvedVariant} className={cn('font-medium', className)}>
      <span
        className={cn(
          'mr-1 inline-block h-1.5 w-1.5 rounded-full',
          resolvedVariant === 'success' && 'bg-green-600 dark:bg-green-400',
          resolvedVariant === 'warning' && 'bg-yellow-600 dark:bg-yellow-400',
          resolvedVariant === 'destructive' && 'bg-red-600 dark:bg-red-400',
          resolvedVariant === 'info' && 'bg-blue-600 dark:bg-blue-400',
          resolvedVariant === 'default' && 'bg-gray-600 dark:bg-gray-400',
          resolvedVariant === 'secondary' && 'bg-gray-500 dark:bg-gray-500'
        )}
      />
      {label || status}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variants: Record<string, StatusVariant> = {
    low: 'secondary',
    medium: 'info',
    high: 'warning',
    urgent: 'destructive',
  };

  const labels: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    urgent: 'Срочный',
  };

  return (
    <StatusBadge status={labels[priority]} variant={variants[priority]} className={className} />
  );
}

interface FlagBadgeProps {
  flag: string;
  className?: string;
}

const flagLabels: Record<string, string> = {
  urgent: 'Срочная',
  oversize: 'Негабарит',
  fragile: 'Хрупкий',
  temp: 'Температурный',
  hazmat: 'Опасный',
  express: 'Экспресс',
};

const flagVariants: Record<string, StatusVariant> = {
  urgent: 'destructive',
  oversize: 'warning',
  fragile: 'info',
  temp: 'info',
  hazmat: 'destructive',
  express: 'warning',
};

export function FlagBadge({ flag, className }: FlagBadgeProps) {
  return (
    <StatusBadge
      status={flagLabels[flag] || flag}
      variant={flagVariants[flag] || 'secondary'}
      className={className}
    />
  );
}
