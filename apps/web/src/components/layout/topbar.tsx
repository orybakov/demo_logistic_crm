'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Search, Bell, Menu, X, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth';
import { notificationsApi } from '@/lib/api/notifications';
import type { Notification } from '@/lib/api/notifications/types';

interface TopbarProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

export function Topbar({ onMenuClick, isSidebarOpen }: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [list, unread] = await Promise.all([
          notificationsApi.getList({ limit: 5 }),
          notificationsApi.getUnreadCount(),
        ]);
        setNotifications(list.data);
        setUnreadCount(unread);
      } catch {
        setNotifications([]);
      }
    };

    load();
  }, []);

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-4">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent lg:hidden"
      >
        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Поиск по заявкам, рейсам, клиентам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="hidden sm:flex"
          aria-label="Переключить тему"
        >
          {mounted && resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Уведомления</span>
              <Link
                href="/notifications"
                className="text-xs font-normal text-primary hover:underline"
              >
                Все уведомления
              </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 p-3"
              >
                <div className="flex w-full items-center gap-2">
                  {!notification.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                  <span className={cn('text-sm', notification.isRead && 'text-muted-foreground')}>
                    {notification.title}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <UserMenu />
      </div>
    </header>
  );
}
