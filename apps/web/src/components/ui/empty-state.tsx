import { cn } from '@/lib/utils';
import { Button } from './button';
import { FileX, Inbox, Search, AlertCircle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-4 rounded-full bg-muted p-4">
        {icon || <Inbox className="h-10 w-10 text-muted-foreground" />}
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      {description && <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action &&
        (action.href ? (
          <Button asChild>
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        ))}
    </div>
  );
}

interface NoResultsProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function NoResults({ searchQuery, onClearSearch }: NoResultsProps) {
  return (
    <EmptyState
      icon={<Search className="h-10 w-10" />}
      title="Ничего не найдено"
      description={
        searchQuery
          ? `По запросу "${searchQuery}" ничего не найдено. Попробуйте изменить параметры поиска.`
          : 'По заданным параметрам ничего не найдено.'
      }
      action={
        onClearSearch
          ? {
              label: 'Сбросить фильтры',
              onClick: onClearSearch,
            }
          : undefined
      }
    />
  );
}

interface NoDataProps {
  entityName?: string;
}

export function NoData({ entityName = 'данных' }: NoDataProps) {
  return (
    <EmptyState
      icon={<FileX className="h-10 w-10" />}
      title={`Нет ${entityName}`}
      description={`Здесь будут отображаться ${entityName}.`}
    />
  );
}
