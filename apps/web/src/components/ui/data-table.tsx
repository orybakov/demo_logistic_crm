'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Search, Filter, Download, RefreshCw, Plus } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface FilterOption {
  label: string;
  value: string;
}

interface DataTableFiltersProps {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  filters?: Array<{
    key: string;
    label: string;
    options: FilterOption[];
    value?: string;
    onChange?: (value: string) => void;
  }>;
  onExport?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export function DataTableFilters({
  searchPlaceholder = 'Поиск...',
  onSearch,
  filters,
  onExport,
  onRefresh,
  className,
}: DataTableFiltersProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center', className)}>
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters?.map((filter) => (
          <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return <div className={cn('rounded-lg border border-border bg-card', className)}>{children}</div>;
}

interface DataTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableHeader({ children, className }: DataTableHeaderProps) {
  return <div className={cn('border-b border-border px-4 py-3', className)}>{children}</div>;
}

interface DataTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableBody({ children, className }: DataTableBodyProps) {
  return <div className={cn('divide-y divide-border', className)}>{children}</div>;
}

interface DataTableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DataTableRow({ children, onClick, className }: DataTableRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center px-4 py-3 hover:bg-muted/50',
        onClick && 'cursor-pointer transition-colors',
        className
      )}
    >
      {children}
    </div>
  );
}

interface DataTableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableCell({ children, className }: DataTableCellProps) {
  return <div className={cn('flex-1', className)}>{children}</div>;
}

interface DataTablePaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function DataTablePagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  className,
}: DataTablePaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div
      className={cn(
        'flex items-center justify-between border-t border-border px-4 py-3',
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Показано {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)}{' '}
        из {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Предыдущая
        </Button>
        <span className="text-sm text-muted-foreground">
          Страница {currentPage} из {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Следующая
        </Button>
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
