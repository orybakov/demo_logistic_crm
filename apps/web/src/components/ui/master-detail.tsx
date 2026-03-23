'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from './button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Skeleton } from './skeleton';
import { ErrorState } from './error-state';
import { EmptyState } from './empty-state';
import { ChevronLeft, MoreHorizontal, X } from 'lucide-react';
import Link from 'next/link';

interface MasterDetailAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  icon?: React.ElementType;
  disabled?: boolean;
}

interface MasterDetailMasterProps {
  title: string;
  description?: string;
  actions?: MasterDetailAction[];
  filters?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function MasterDetailMaster({
  title,
  description,
  actions,
  filters,
  children,
  isLoading,
  error,
  onRetry,
}: MasterDetailMasterProps) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {filters && <div className="rounded-lg border border-border bg-card p-4">{filters}</div>}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

interface MasterDetailDetailProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  actions?: MasterDetailAction[];
  tabs?: {
    label: string;
    value: string;
    content: React.ReactNode;
  }[];
  children?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function MasterDetailDetail({
  isOpen,
  onClose,
  title,
  subtitle,
  badges,
  actions,
  tabs,
  children,
  isLoading,
  className,
}: MasterDetailDetailProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 z-50 w-full max-w-3xl border-l border-border bg-background shadow-xl transition-all duration-300',
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {badges && <div className="flex gap-1">{badges}</div>}
          </div>
          <div className="flex items-center gap-2">
            {actions?.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </Button>
              );
            })}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {tabs && tabs.length > 0 ? (
          <Tabs defaultValue={tabs[0].value} className="flex-1 overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b px-6">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex-1 overflow-y-auto p-6">
              {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                  {tab.content}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              children
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface MasterDetailItemProps {
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MasterDetailItem({
  children,
  isSelected,
  onClick,
  className,
}: MasterDetailItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer border-b border-border px-4 py-3 transition-colors hover:bg-muted/50',
        isSelected && 'bg-muted',
        className
      )}
    >
      {children}
    </div>
  );
}

interface MasterDetailFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function MasterDetailFooter({ children, className }: MasterDetailFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4',
        className
      )}
    >
      {children}
    </div>
  );
}
