import { AppSidebar } from "~/components/app-sidebar"
import { SharedHeader } from "~/components/shared-header"
import {
  SidebarInset,
  SidebarProvider,
} from "~/components/ui/sidebar"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SharedHeader />
        <main className="flex-1 p-4 pt-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}