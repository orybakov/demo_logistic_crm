'use client';

import { useToast } from '@/components/ui/use-toast';

export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`mb-2 rounded-lg border p-4 shadow-lg ${
            toast.variant === 'destructive'
              ? 'border-red-500 bg-red-50 text-red-900'
              : toast.variant === 'success'
              ? 'border-green-500 bg-green-50 text-green-900'
              : 'border bg-background text-foreground'
          }`}
        >
          {toast.title && <div className="font-semibold">{toast.title}</div>}
          {toast.description && <div className="text-sm">{toast.description}</div>}
        </div>
      ))}
    </div>
  );
}
