'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient, authApi } from './api';

type Role = string;
type Subject = string;
type Action = string;

interface Permission {
  subject: Subject;
  action: Action;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isSuperadmin: boolean;
  roles: Role[];
  permissions: Permission[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
  hasPermission: (subject: Subject, action: Action) => boolean;
  can: (subject: Subject, action: Action) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login', '/auth'];

interface AuthMeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: Array<{ subject: string; action: string }>;
}

function mapToUser(data: AuthMeResponse): User {
  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    isActive: true,
    isSuperadmin: false,
    roles: data.roles,
    permissions: data.permissions,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadUser = useCallback(async () => {
    const token = apiClient.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authApi.me();
      setUser(mapToUser(userData));
    } catch {
      apiClient.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !user && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      router.push('/login');
    }
  }, [isLoading, user, pathname, router]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    apiClient.setTokens(response.accessToken, response.refreshToken);

    try {
      const userData = await authApi.me();
      setUser(mapToUser(userData));
    } catch {
      setUser({
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        isActive: true,
        isSuperadmin: false,
        roles: response.user.roles,
        permissions: [],
      });
    }

    router.push('/');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    apiClient.clearTokens();
    setUser(null);
    router.push('/login');
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    if (user.isSuperadmin) return true;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.some((role) => user.roles.includes(role));
  };

  const hasPermission = (subject: Subject, action: Action): boolean => {
    if (!user) return false;
    if (user.isSuperadmin) return true;

    return user.permissions.some(
      (p) => p.subject === subject && (p.action === action || p.action === 'manage')
    );
  };

  const can = hasPermission;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        hasPermission,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
