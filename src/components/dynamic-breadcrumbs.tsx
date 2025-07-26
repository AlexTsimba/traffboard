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
  landings: 'Landing Pages',
  settings: 'Settings',
  user: 'User Settings',
  account: 'Account',
  security: 'Security',
  preferences: 'Preferences',
  administration: 'Administration',
  admin: 'Administration',
  users: 'User Management',
  data: 'Data Management',
  general: 'General'
};

// Routes that don't have actual pages - these should not be clickable
const nonRoutableSegments = new Set([
  'settings', // redirects to /settings/user/account
  'user',     // doesn't exist as a page, just structural
  'admin'     // structural, actual pages are /admin/users, /admin/data
]);

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Filter out redundant segments - skip 'user' in settings paths since it's redundant
  const filteredSegments = segments.filter((segment, index) => {
    // Skip 'user' segment in /settings/user/* paths to avoid "Settings > User Settings" duplication
    if (segment === 'user' && segments[index - 1] === 'settings') {
      return false;
    }
    return true;
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {filteredSegments.map((segment, index) => {
          const isLastSegment = index === filteredSegments.length - 1;
          const isNonRoutable = nonRoutableSegments.has(segment);
          const originalIndex = segments.indexOf(segment);
          
          return (
            <div key={`${segment}-${originalIndex}`} className="contents">
              <BreadcrumbItem>
                {isLastSegment ? (
                  <BreadcrumbPage>{routeLabels[segment] ?? segment}</BreadcrumbPage>
                ) : isNonRoutable ? (
                  <span className="text-muted-foreground">
                    {routeLabels[segment] ?? segment}
                  </span>
                ) : (
                  <BreadcrumbLink href={`/${segments.slice(0, originalIndex + 1).join('/')}`}>
                    {routeLabels[segment] ?? segment}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < filteredSegments.length - 1 && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}