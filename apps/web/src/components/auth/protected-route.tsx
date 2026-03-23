'use client';

import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';
import { usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/login', '/auth'];

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, roles, fallback }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
    }
    return null;
  }

  if (roles && !hasRole(roles)) {
    return (
      fallback || (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Доступ запрещён</h1>
          <p className="text-muted-foreground">У вас нет прав для просмотра этой страницы</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return null;
  }

  return <>{children}</>;
}
