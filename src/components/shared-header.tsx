import { Separator } from '~/components/ui/separator';
import { SidebarTrigger } from '~/components/ui/sidebar';
import { ModeToggle } from '~/components/layout/ThemeToggle/theme-toggle';
import { ThemeSelector } from '~/components/theme-selector';
import { DynamicBreadcrumbs } from './dynamic-breadcrumbs';

export function SharedHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <DynamicBreadcrumbs />
      </div>
      <div className="ml-auto flex items-center gap-2 px-4">
        <ThemeSelector />
        <ModeToggle />
      </div>
    </header>
  );
}