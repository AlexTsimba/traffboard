import { cookies } from "next/headers";
import { type ReactNode } from "react";

import { AppSidebar } from "@/app/main/dashboard/_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requirePageAuth } from "@/lib/auth/page-protection";
import { getSidebarVariant, getSidebarCollapsible, getContentLayout } from "@/lib/layout-preferences";
import { cn } from "@/lib/utils";

import { SearchDialog } from "./_components/sidebar/search-dialog";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  // SECURITY: Page-level authentication check (replaces vulnerable middleware)
  const { user } = await requirePageAuth();

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const currentUser = {
    name: user.name ?? "User",
    email: user.email,
    avatar: "", // Avatar support will be added in future version
    role: user.role,
  };

  const sidebarVariant = await getSidebarVariant();
  const sidebarCollapsible = await getSidebarCollapsible();
  const contentLayout = await getContentLayout();

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar collapsible={sidebarCollapsible} variant={sidebarVariant} user={currentUser} />
      <SidebarInset className="relative flex h-screen flex-col">
        {/* Sticky Header */}
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator className="mx-2 data-[orientation=vertical]:h-4" orientation="vertical" />
              <SearchDialog />
            </div>
            <div className="flex items-center gap-2" />
          </div>
        </header>

        {/* Scrollable Content area */}
        <div className="flex-1 overflow-auto">
          <div className={cn("p-4 md:p-6", contentLayout === "centered" && "mx-auto w-full max-w-6xl")}>{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
