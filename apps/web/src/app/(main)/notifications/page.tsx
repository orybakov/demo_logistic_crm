'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  ErrorState,
} from '@/components/ui';
import { DataTablePagination } from '@/components/ui';
import { notificationsApi } from '@/lib/api/notifications';
import {
  Notification,
  NotificationType,
  notificationTypeLabels,
  type NotificationSettings,
  type NotificationTypeInfo,
} from '@/lib/api/notifications/types';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  Truck,
  Receipt,
  MessageSquare,
  Flag,
  AlertTriangle,
  Info,
  Settings,
  X,
  Filter,
} from 'lucide-react';

const DEFAULT_PAGE_SIZE = 20;

const typeIcons: Record<string, typeof FileText> = {
  request_created: FileText,
  request_status_changed: FileText,
  request_assigned: FileText,
  request_completed: FileText,
  trip_created: Truck,
  trip_status_changed: Truck,
  trip_assigned: Truck,
  trip_started: Truck,
  trip_completed: Truck,
  trip_delayed: AlertTriangle,
  order_created: Receipt,
  order_status_changed: Receipt,
  order_payment_received: Receipt,
  order_overdue: AlertTriangle,
  checkpoint_completed: FileText,
  checkpoint_delayed: AlertTriangle,
  comment_added: MessageSquare,
  flag_added: Flag,
  flag_removed: Flag,
  vehicle_maintenance_due: Truck,
  driver_license_expires: AlertTriangle,
  system_announcement: Info,
};

const typeColors: Record<string, string> = {
  request_created: 'bg-blue-500/10 text-blue-600',
  request_status_changed: 'bg-blue-500/10 text-blue-600',
  request_assigned: 'bg-blue-500/10 text-blue-600',
  request_completed: 'bg-green-500/10 text-green-600',
  trip_created: 'bg-orange-500/10 text-orange-600',
  trip_status_changed: 'bg-orange-500/10 text-orange-600',
  trip_assigned: 'bg-orange-500/10 text-orange-600',
  trip_started: 'bg-orange-500/10 text-orange-600',
  trip_completed: 'bg-green-500/10 text-green-600',
  trip_delayed: 'bg-red-500/10 text-red-600',
  order_created: 'bg-purple-500/10 text-purple-600',
  order_status_changed: 'bg-purple-500/10 text-purple-600',
  order_payment_received: 'bg-green-500/10 text-green-600',
  order_overdue: 'bg-red-500/10 text-red-600',
  checkpoint_completed: 'bg-green-500/10 text-green-600',
  checkpoint_delayed: 'bg-red-500/10 text-red-600',
  comment_added: 'bg-gray-500/10 text-gray-600',
  flag_added: 'bg-yellow-500/10 text-yellow-600',
  flag_removed: 'bg-gray-500/10 text-gray-600',
  vehicle_maintenance_due: 'bg-yellow-500/10 text-yellow-600',
  driver_license_expires: 'bg-red-500/10 text-red-600',
  system_announcement: 'bg-blue-500/10 text-blue-600',
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function NotificationCard({
  notification,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || 'bg-gray-500/10 text-gray-600';

  return (
    <div
      className={cn(
        'group relative flex items-start gap-4 rounded-lg border p-4 transition-colors',
        !notification.isRead && 'bg-primary/5 border-primary/20',
        notification.isRead && 'hover:bg-muted/50'
      )}
    >
      <div className={cn('rounded-lg p-2', colorClass)}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className={cn('font-medium', !notification.isRead && 'font-semibold')}>
              {notification.title}
            </p>
            {notification.body && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
            )}
          </div>
          {!notification.isRead && (
            <Badge variant="default" className="shrink-0">
              Новое
            </Badge>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDate(notification.createdAt)}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {notification.isRead ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => onMarkUnread(notification.id)}
              >
                <BellOff className="h-4 w-4 mr-1" />
                Отметить непрочитанным
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => onMarkRead(notification.id)}
              >
                <Check className="h-4 w-4 mr-1" />
                Прочитано
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-destructive hover:text-destructive"
              onClick={() => onDelete(notification.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);

  const currentPage = Number(searchParams.get('page')) || 1;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: any = {
        page: currentPage,
        limit: DEFAULT_PAGE_SIZE,
      };

      if (typeFilter !== 'all') {
        filters.types = [typeFilter];
      }

      const response = await notificationsApi.getList(filters);
      setNotifications(Array.isArray(response.data) ? response.data : []);
      setTotalItems(response.total);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
    }
  }, [currentPage, typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast({ title: 'Уведомление отмечено как прочитанное' });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkUnread = async (id: string) => {
    try {
      await notificationsApi.markAsUnread(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
      setUnreadCount((prev) => prev + 1);
      toast({ title: 'Уведомление отмечено как непрочитанное' });
    } catch (err) {
      console.error('Error marking notification as unread:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast({ title: 'Все уведомления отмечены как прочитанные' });
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setTotalItems((prev) => prev - 1);
      toast({ title: 'Уведомление удалено' });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await notificationsApi.deleteAll(30);
      toast({ title: 'Устаревшие уведомления удалены' });
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting old notifications:', err);
    }
  };

  const typeOptions = [
    { label: 'Все типы', value: 'all' },
    { label: 'Заявки', value: 'request' },
    { label: 'Рейсы', value: 'trip' },
    { label: 'Заказы', value: 'order' },
    { label: 'Комментарии', value: 'comment' },
    { label: 'Флаги', value: 'flag' },
    { label: 'Системные', value: 'system' },
  ];

  if (error) {
    return <ErrorState title="Ошибка" message={error} onRetry={fetchNotifications} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Уведомления</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `У вас ${unreadCount} непрочитанных уведомлений`
              : 'У вас нет новых уведомлений'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Прочитать все
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDeleteAll}>
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить старые
          </Button>
          <Button
            variant={showSettings ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Настройки
          </Button>
        </div>
      </div>

      {showSettings && <NotificationSettings onClose={() => setShowSettings(false)} />}

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {typeOptions.map((option) => (
            <Button
              key={option.value}
              variant={typeFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(option.value)}
              className="shrink-0"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Нет уведомлений</p>
            <p className="text-sm text-muted-foreground">
              Здесь будут отображаться уведомления о важных событиях
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) =>
            notification.link ? (
              <Link key={notification.id} href={notification.link}>
                <NotificationCard
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onMarkUnread={handleMarkUnread}
                  onDelete={handleDelete}
                />
              </Link>
            ) : (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onMarkUnread={handleMarkUnread}
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <DataTablePagination
          totalItems={totalItems}
          pageSize={DEFAULT_PAGE_SIZE}
          currentPage={currentPage}
          onPageChange={(page) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', page.toString());
            window.location.href = `/notifications?${params.toString()}`;
          }}
        />
      )}
    </div>
  );
}

function NotificationSettings({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [availableTypes, setAvailableTypes] = useState<NotificationTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, typesRes] = await Promise.all([
          notificationsApi.getSettings(),
          notificationsApi.getAvailableTypes(),
        ]);
        setSettings(settingsRes);
        setAvailableTypes(typesRes);
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggle = (type: string) => {
    if (!settings) return;

    const enabledTypes = settings.enabledTypes.includes(type)
      ? settings.enabledTypes.filter((t) => t !== type)
      : [...settings.enabledTypes, type];

    setSettings({ ...settings, enabledTypes });
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await notificationsApi.updateSettings(settings);
      toast({ title: 'Настройки сохранены' });
      onClose();
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const groupedTypes = availableTypes.reduce(
    (acc, type) => {
      const category = type.type.split('_')[0];
      if (!acc[category]) acc[category] = [];
      acc[category].push(type);
      return acc;
    },
    {} as Record<string, NotificationTypeInfo[]>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Настройки уведомлений</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {Object.entries(groupedTypes).map(([category, types]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase">
                    {category === 'request' && 'Заявки'}
                    {category === 'trip' && 'Рейсы'}
                    {category === 'order' && 'Заказы'}
                    {category === 'checkpoint' && 'Точки'}
                    {category === 'comment' && 'Комментарии'}
                    {category === 'flag' && 'Флаги'}
                    {category === 'vehicle' && 'Транспорт'}
                    {category === 'driver' && 'Водители'}
                    {category === 'system' && 'Системные'}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {types.map((type) => (
                      <label
                        key={type.type}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                          settings?.enabledTypes.includes(type.type)
                            ? 'bg-primary/5 border-primary/20'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={settings?.enabledTypes.includes(type.type) ?? false}
                          onChange={() => handleToggle(type.type)}
                          className="h-4 w-4 rounded border-input"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{type.label}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {type.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
