'use client';

import { cn } from '@/lib/utils';
import { useState, createContext, useContext } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

interface LayoutContextType {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (value: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (value: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

interface AppLayoutProps {
  children: React.ReactNode;
  defaultSidebarCollapsed?: boolean;
}

export function AppLayout({ children, defaultSidebarCollapsed = false }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(defaultSidebarCollapsed);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <LayoutContext.Provider
      value={{
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
      }}
    >
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar isCollapsed={isSidebarCollapsed} />

        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        <div className={cn('flex flex-1 min-w-0 flex-col transition-all duration-300')}>
          <Topbar
            onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            isSidebarOpen={isMobileSidebarOpen}
          />

          <main className="flex-1 min-w-0 overflow-y-auto">
            <div className="container-main py-6">{children}</div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}

interface ContentAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentArea({ children, className }: ContentAreaProps) {
  return <div className={cn('animate-in', className)}>{children}</div>;
}
