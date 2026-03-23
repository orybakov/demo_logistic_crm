'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Truck,
  CalendarDays,
  BookOpen,
  BarChart3,
  Target,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Users,
  Circle,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Главная',
    href: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Заказы',
    href: '/orders',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Заявки',
    href: '/requests',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Рейсы',
    href: '/trips',
    icon: <Truck className="h-5 w-5" />,
  },
  {
    label: 'Расписание',
    href: '/schedule',
    icon: <CalendarDays className="h-5 w-5" />,
  },
];

const referenceItems: NavItem[] = [
  {
    label: 'Клиенты',
    href: '/reference/clients',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Грузополучатели',
    href: '/reference/recipients',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Склады',
    href: '/reference/warehouses',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Типы ТС',
    href: '/reference/vehicle-types',
    icon: <Truck className="h-5 w-5" />,
  },
  {
    label: 'Типы топлива',
    href: '/reference/fuel-types',
    icon: <Circle className="h-5 w-5" />,
  },
  {
    label: 'Статусы',
    href: '/reference/statuses',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    label: 'Флаги',
    href: '/reference/flags',
    icon: <Bell className="h-5 w-5" />,
  },
  {
    label: 'Классификаторы',
    href: '/reference/classifiers',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    label: 'Причины проблем',
    href: '/reference/problem-reasons',
    icon: <Bell className="h-5 w-5" />,
  },
];

const analyticsItems: NavItem[] = [
  {
    label: 'Отчёты',
    href: '/reports',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: 'KPI',
    href: '/kpi',
    icon: <Target className="h-5 w-5" />,
  },
];

const adminItems: NavItem[] = [
  {
    label: 'Уведомления',
    href: '/notifications',
    icon: <Bell className="h-5 w-5" />,
  },
  {
    label: 'Администрирование',
    href: '/admin',
    icon: <Settings className="h-5 w-5" />,
  },
];

interface SidebarSectionProps {
  title?: string;
  items: NavItem[];
  isOpen?: boolean;
  defaultOpen?: boolean;
}

function SidebarSection({ title, items, defaultOpen = true }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {title && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {title}
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      )}
      {isOpen && (
        <div className="space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href as '/'}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                )}
              >
                <span className={cn(isActive && 'text-sidebar-ring')}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b border-sidebar-border px-4',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">LogisticsCRM</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <SidebarSection items={navigationItems} />

        <div className="my-4 h-px bg-sidebar-border" />

        <SidebarSection title="Справочники" items={referenceItems} />

        <div className="my-4 h-px bg-sidebar-border" />

        <SidebarSection title="Аналитика" items={analyticsItems} />

        <div className="my-4 h-px bg-sidebar-border" />

        <SidebarSection title="Система" items={adminItems} />
      </nav>

      {!isCollapsed && (
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-muted-foreground">© 2026 LogisticsCRM</p>
        </div>
      )}
    </aside>
  );
}
