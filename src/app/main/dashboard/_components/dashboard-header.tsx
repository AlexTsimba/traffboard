"use client";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { SearchDialog } from "./sidebar/search-dialog";

function FilterButton() {
  return (
    <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2">Filters</button>
  );
}

export function DashboardHeader() {
  const pathname = usePathname();
  const rightContent = useMemo(() => {
    if (pathname.includes("/conversions")) return <FilterButton />;
    // Overview — ничего
    return null;
  }, [pathname]);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className={cn("flex w-full items-center justify-between px-4 lg:px-6")}>
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator className="mx-2 data-[orientation=vertical]:h-4" orientation="vertical" />
          <SearchDialog />
        </div>
        <div className="flex items-center gap-2">{rightContent}</div>
      </div>
    </header>
  );
}
