import { Separator } from '~/components/ui/separator';
import { SidebarTrigger } from '~/components/ui/sidebar';
import { DynamicBreadcrumbs } from './dynamic-breadcrumbs';

export function SharedHeader() {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <DynamicBreadcrumbs />
      </div>
    </header>
  );
}