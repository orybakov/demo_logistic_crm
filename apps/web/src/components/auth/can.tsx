'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';

type Role = string;
type Subject = string;
type Action = string;

interface CanProps {
  roles?: Role | Role[];
  subject?: Subject;
  action?: Action;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function Can({
  roles,
  subject,
  action,
  children,
  fallback = null,
  loadingFallback = null,
}: CanProps) {
  const { user, isLoading, hasRole, hasPermission } = useAuth();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  if (roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    if (!hasRole(roleArray as Role[])) {
      return <>{fallback}</>;
    }
  }

  if (subject && action) {
    if (!hasPermission(subject as Subject, action as Action)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

interface CanAnyProps {
  permissions: Array<{
    subject: Subject;
    action: Action;
  }>;
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function CanAny({
  permissions,
  children,
  fallback = null,
  requireAll = false,
}: CanAnyProps) {
  const { hasPermission } = useAuth();

  const checks = permissions.map((p) => hasPermission(p.subject, p.action));
  const hasAccess = requireAll ? checks.every(Boolean) : checks.some(Boolean);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface RequireAuthProps {
  children: ReactNode;
  roles?: Role | Role[];
  redirectTo?: string;
}

export function RequireAuth({ children, roles, redirectTo = '/login' }: RequireAuthProps) {
  const { isLoading, isAuthenticated, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return null;
  }

  if (roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    if (!hasRole(roleArray as Role[])) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Доступ запрещён</h1>
          <p className="text-muted-foreground">У вас нет прав для просмотра этой страницы</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}

interface PermissionGateProps {
  permission: {
    subject: Subject;
    action: Action;
  };
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { can } = useAuth();

  if (!can(permission.subject, permission.action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
