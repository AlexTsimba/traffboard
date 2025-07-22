import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "~/components/app-sidebar";
import { SharedHeader } from "~/components/shared-header";
import {
  SidebarInset,
  SidebarProvider,
} from "~/components/ui/sidebar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SharedHeader />
        <main className="flex-1 p-4 pt-0" data-content-wrapper>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}