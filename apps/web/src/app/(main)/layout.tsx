import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout';

export const metadata: Metadata = {
  title: 'Logistics CRM',
  description: 'Enterprise logistics management system',
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
