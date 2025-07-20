'use client';

import { usePathname } from 'next/navigation';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator 
} from '~/components/ui/breadcrumb';

const routeLabels: Record<string, string> = {
  dashboard: 'Overview',
  reports: 'Reports',
  cohort: 'Cohort Analysis',
  conversions: 'Conversions',
  quality: 'Traffic Quality',
  landings: 'Landing Pages'
};

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => (
          <div key={segment} className="contents">
            <BreadcrumbItem>
              {index === segments.length - 1 ? (
                <BreadcrumbPage>{routeLabels[segment] || segment}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/${segments.slice(0, index + 1).join('/')}`}>
                  {routeLabels[segment] || segment}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < segments.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}