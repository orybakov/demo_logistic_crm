import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1 text-sm', className)}>
      <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            {item.href && !isLast ? (
              <Link
                href={item.href as '/'}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'ml-1 font-medium',
                  isLast ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
