'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, RefreshCw } from 'lucide-react';

export interface AnalyticsOption {
  label: string;
  value: string;
}

export interface AnalyticsFiltersState {
  dateFrom: string;
  dateTo: string;
  filialId: string;
  status: string;
  assignedToId: string;
}

interface AnalyticsFiltersProps {
  filters: AnalyticsFiltersState;
  filialOptions: AnalyticsOption[];
  statusOptions?: AnalyticsOption[];
  executorOptions?: AnalyticsOption[];
  showStatus?: boolean;
  showExecutor?: boolean;
  onChange: (next: AnalyticsFiltersState) => void;
  onRefresh: () => void;
  onExportCsv?: () => void;
  onExportXlsx?: () => void;
}

export function AnalyticsFilters({
  filters,
  filialOptions,
  statusOptions,
  executorOptions,
  showStatus = false,
  showExecutor = false,
  onChange,
  onRefresh,
  onExportCsv,
  onExportXlsx,
}: AnalyticsFiltersProps) {
  const update = (patch: Partial<AnalyticsFiltersState>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 lg:grid-cols-6">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase text-muted-foreground">С</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase text-muted-foreground">По</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase text-muted-foreground">Филиал</label>
          <Select
            value={filters.filialId || 'all'}
            onValueChange={(value) => update({ filialId: value === 'all' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все филиалы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все филиалы</SelectItem>
              {filialOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {showStatus && statusOptions && (
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase text-muted-foreground">Статус</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => update({ status: value === 'all' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {showExecutor && executorOptions && (
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase text-muted-foreground">
              Исполнитель
            </label>
            <Select
              value={filters.assignedToId || 'all'}
              onValueChange={(value) => update({ assignedToId: value === 'all' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все исполнители" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все исполнители</SelectItem>
                {executorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-end gap-2 lg:justify-end">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
          {onExportCsv && (
            <Button variant="outline" onClick={onExportCsv}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          )}
          {onExportXlsx && (
            <Button variant="outline" onClick={onExportXlsx}>
              <Download className="mr-2 h-4 w-4" />
              XLSX
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
