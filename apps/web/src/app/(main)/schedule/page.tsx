'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  ErrorState,
} from '@/components/ui';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { tripsApi } from '@/lib/api/trips';
import { ScheduleSlot, ScheduleFilters, tripStatusLabels, TripStatus } from '@/lib/api/trips/types';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Truck,
  User,
  Filter,
  List,
  Grid3X3,
} from 'lucide-react';

type ViewMode = 'list' | 'day' | 'week';

interface DaySchedule {
  date: Date;
  slots: ScheduleSlot[];
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  });
}

function getMonthName(date: Date): string {
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

function getWeekDays(date: Date): Date[] {
  const days: Date[] = [];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1);

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

interface ScheduleSlotCardProps {
  slot: ScheduleSlot;
}

function ScheduleSlotCard({ slot }: ScheduleSlotCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors hover:bg-muted/50',
        slot.isCompleted &&
          'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={slot.type === 'loading' ? 'default' : 'secondary'} className="text-xs">
              {slot.type === 'loading' ? 'Загрузка' : 'Выгрузка'}
            </Badge>
            {slot.isCompleted && (
              <Badge variant="success" className="text-xs">
                Выполнено
              </Badge>
            )}
          </div>
          <p className="font-medium text-sm truncate">{slot.requestNumber}</p>
          <p className="text-xs text-muted-foreground truncate">{slot.address}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(slot.plannedTime)}
            </span>
            {slot.vehiclePlate && (
              <span className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                {slot.vehiclePlate}
              </span>
            )}
            {slot.driverName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {slot.driverName}
              </span>
            )}
          </div>
        </div>
        <StatusBadge
          status={tripStatusLabels[slot.status as TripStatus] || slot.status}
          className="text-xs"
        />
      </div>
    </div>
  );
}

interface DayViewProps {
  date: Date;
  slots: ScheduleSlot[];
  onSlotClick?: (slot: ScheduleSlot) => void;
}

function DayView({ date, slots, onSlotClick }: DayViewProps) {
  const daySlots = slots.filter((s) => isSameDay(new Date(s.plannedTime), date));

  const loadings = daySlots.filter((s) => s.type === 'loading');
  const unloadings = daySlots.filter((s) => s.type === 'unloading');

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-lg font-medium">
          {date.toLocaleDateString('ru-RU', { weekday: 'long' })}
        </p>
        <p className="text-2xl font-bold">{date.getDate()}</p>
      </div>

      {daySlots.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">Нет операций</p>
      ) : (
        <div className="space-y-4">
          {loadings.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Загрузки ({loadings.length})
              </p>
              <div className="space-y-2">
                {loadings.map((slot) => (
                  <div
                    key={`${slot.tripId}-${slot.checkpointId}`}
                    onClick={() => onSlotClick?.(slot)}
                  >
                    <ScheduleSlotCard slot={slot} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {unloadings.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Выгрузки ({unloadings.length})
              </p>
              <div className="space-y-2">
                {unloadings.map((slot) => (
                  <div
                    key={`${slot.tripId}-${slot.checkpointId}`}
                    onClick={() => onSlotClick?.(slot)}
                  >
                    <ScheduleSlotCard slot={slot} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface WeekViewProps {
  currentDate: Date;
  slots: ScheduleSlot[];
  onSlotClick?: (slot: ScheduleSlot) => void;
}

function WeekView({ currentDate, slots, onSlotClick }: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day) => {
        const daySlots = slots.filter((s) => isSameDay(new Date(s.plannedTime), day));
        const isToday = isSameDay(day, today);

        return (
          <div
            key={day.toISOString()}
            className={cn('rounded-lg border p-2 min-h-[200px]', isToday && 'ring-2 ring-primary')}
          >
            <div className={cn('text-center mb-2', isToday && 'font-bold')}>
              <p className="text-xs text-muted-foreground">
                {day.toLocaleDateString('ru-RU', { weekday: 'short' })}
              </p>
              <p className={cn('text-lg', isToday && 'text-primary')}>{day.getDate()}</p>
            </div>

            <div className="space-y-1">
              {daySlots.slice(0, 5).map((slot) => (
                <div
                  key={`${slot.tripId}-${slot.checkpointId}`}
                  className={cn(
                    'rounded px-1 py-0.5 text-xs cursor-pointer truncate',
                    slot.type === 'loading'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-green-100 dark:bg-green-900/30',
                    slot.isCompleted && 'opacity-50'
                  )}
                  onClick={() => onSlotClick?.(slot)}
                  title={`${slot.type === 'loading' ? 'Загрузка' : 'Выгрузка'} ${slot.requestNumber}`}
                >
                  {formatTime(slot.plannedTime)} {slot.requestNumber}
                </div>
              ))}
              {daySlots.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{daySlots.length - 5} ещё
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ListViewProps {
  slots: ScheduleSlot[];
  onSlotClick?: (slot: ScheduleSlot) => void;
}

function ListView({ slots, onSlotClick }: ListViewProps) {
  const groupedByDate = slots.reduce(
    (acc, slot) => {
      const dateKey = new Date(slot.plannedTime).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    },
    {} as Record<string, ScheduleSlot[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([dateKey, dateSlots]) => {
        const date = new Date(dateKey);
        return (
          <div key={dateKey}>
            <h3 className="text-lg font-medium mb-3 sticky top-0 bg-background py-2">
              {date.toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {dateSlots.map((slot) => (
                <div
                  key={`${slot.tripId}-${slot.checkpointId}`}
                  onClick={() => onSlotClick?.(slot)}
                >
                  <ScheduleSlotCard slot={slot} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {slots.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Нет операций на выбранный период</p>
      )}
    </div>
  );
}

function ScheduleContent() {
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();

  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState<'all' | 'loading' | 'unloading'>('all');

  const canView = hasPermission('trips', 'read');

  const fetchSchedule = useCallback(async () => {
    if (!canView) {
      setError('Нет прав для просмотра расписания');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filters: ScheduleFilters = {
        dateFrom: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
        dateTo: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString(),
        type: typeFilter !== 'all' ? typeFilter : undefined,
      };

      const data = await tripsApi.getSchedule(filters);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Не удалось загрузить расписание');
    } finally {
      setLoading(false);
    }
  }, [currentDate, typeFilter, canView]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSlotClick = (slot: ScheduleSlot) => {
    window.location.href = `/trips/${slot.tripId}`;
  };

  const loadingsCount = slots.filter((s) => s.type === 'loading').length;
  const unloadingsCount = slots.filter((s) => s.type === 'unloading').length;
  const completedCount = slots.filter((s) => s.isCompleted).length;

  if (error) {
    return <ErrorState title="Ошибка загрузки" message={error} onRetry={fetchSchedule} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Расписание</h1>
          <p className="text-muted-foreground">{getMonthName(currentDate)}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleToday}>
            Сегодня
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[150px] text-center">
            {viewMode === 'day'
              ? currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
              : viewMode === 'week'
                ? `Неделя ${Math.ceil(currentDate.getDate() / 7)}`
                : getMonthName(currentDate)}
          </span>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            Все ({slots.length})
          </Button>
          <Button
            variant={typeFilter === 'loading' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('loading')}
          >
            Загрузки ({loadingsCount})
          </Button>
          <Button
            variant={typeFilter === 'unloading' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('unloading')}
          >
            Выгрузки ({unloadingsCount})
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего операций</p>
                <p className="text-2xl font-bold">{slots.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Выполнено</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Осталось</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {slots.length - completedCount}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          {viewMode === 'day' && (
            <DayView date={currentDate} slots={slots} onSlotClick={handleSlotClick} />
          )}
          {viewMode === 'week' && (
            <WeekView currentDate={currentDate} slots={slots} onSlotClick={handleSlotClick} />
          )}
          {viewMode === 'list' && <ListView slots={slots} onSlotClick={handleSlotClick} />}
        </>
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      }
    >
      <ScheduleContent />
    </Suspense>
  );
}
