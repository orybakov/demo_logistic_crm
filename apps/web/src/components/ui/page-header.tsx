import { cn } from '@/lib/utils';
import { Button } from './button';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    icon?: LucideIcon;
    disabled?: boolean;
  }>;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 space-y-2', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Главная
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center">
              <span className="mx-1">/</span>
              {crumb.href ? (
                <Link href={crumb.href as '/'} className="hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              const buttonContent = (
                <>
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </>
              );

              if (action.href) {
                return (
                  <Button
                    key={index}
                    variant={action.variant || 'default'}
                    asChild
                    disabled={action.disabled}
                  >
                    <Link href={action.href as '/'}>{buttonContent}</Link>
                  </Button>
                );
              }

              return (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {buttonContent}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}

interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function CardGrid({ children, columns = 3, className }: CardGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return <div className={cn('grid gap-4', gridClasses[columns], className)}>{children}</div>;
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, change, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-bold">{value}</p>
        {change && (
          <span
            className={cn(
              'text-sm font-medium',
              change.trend === 'up' ? 'text-success' : 'text-destructive'
            )}
          >
            {change.trend === 'up' ? '+' : ''}
            {change.value}%
          </span>
        )}
      </div>
    </div>
  );
}

interface QuickActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function QuickActions({ children, className }: QuickActionsProps) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>;
}
