'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Truck,
  FileText,
  MapPin,
  Package,
  Building2,
  ChevronRight,
  UserCircle,
  CreditCard,
  Boxes,
  Tag,
  Flag,
} from 'lucide-react';

const referenceItems = [
  {
    title: 'Грузополучатели',
    description: 'Получатели грузов',
    icon: Package,
    href: '/reference/recipients',
    count: null,
  },
  {
    title: 'Клиенты',
    description: 'Клиенты и контрагенты',
    icon: Building2,
    href: '/reference/clients',
    count: null,
  },
  {
    title: 'Договоры',
    description: 'Договоры с клиентами',
    icon: FileText,
    href: '/reference/contracts',
    count: null,
  },
  {
    title: 'Точки',
    description: 'Адреса и локации',
    icon: MapPin,
    href: '/reference/locations',
    count: null,
  },
  {
    title: 'Типы грузов',
    description: 'Классификация грузов',
    icon: Package,
    href: '/reference/cargo-types',
    count: null,
  },
  {
    title: 'Тарифы',
    description: 'Расценки и прайсы',
    icon: CreditCard,
    href: '/reference/tariffs',
    count: null,
  },
  {
    title: 'Склады',
    description: 'Склады и терминалы',
    icon: Boxes,
    href: '/reference/warehouses',
    count: null,
  },
  {
    title: 'Статусы',
    description: 'Статусы заявок, рейсов и заказов',
    icon: Tag,
    href: '/reference/statuses',
    count: null,
  },
  {
    title: 'Флаги',
    description: 'Флаги для заявок, рейсов и заказов',
    icon: Flag,
    href: '/reference/flags',
    count: null,
  },
];

export default function ReferencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Справочники</h1>
        <p className="text-muted-foreground">Управление справочными данными системы</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {referenceItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="rounded-lg bg-muted p-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
