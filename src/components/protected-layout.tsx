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
  sessionProp?: {
    user: {
      id: string;
      name: string;
      email: string;
      role?: string | null;
    };
    session: {
      id: string;
      expiresAt: Date;
    };
  }; // Allow external session to be passed in
}

export async function ProtectedLayout({ children, sessionProp }: ProtectedLayoutProps) {
  // Use provided session or fetch new one
  const session = sessionProp ?? await auth.api.getSession({
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