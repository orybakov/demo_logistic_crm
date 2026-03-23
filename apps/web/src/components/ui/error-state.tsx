import { cn } from '@/lib/utils';
import { Button } from './button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Что-то пошло не так',
  message = 'При загрузке данных произошла ошибка. Попробуйте обновить страницу.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-destructive">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">{message}</p>
      <div className="flex gap-2">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Повторить
          </Button>
        )}
        <Button variant="ghost" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            На главную
          </Link>
        </Button>
      </div>
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onDismiss, className }: ErrorBannerProps) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-destructive hover:text-destructive/80">
          ✕
        </button>
      )}
    </div>
  );
}
