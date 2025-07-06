import { Suspense } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdminPageAuth } from "@/lib/auth/page-protection";
import { getUsers } from "@/lib/data/users";

import { CsvUploadClient } from "./_components/csv-upload-client";
import { DataManagementSummary } from "./_components/data-management-summary";
import { SystemStatus } from "./_components/system-status";
import { UserManagement } from "./_components/user-management";

interface AdministrationPageProps {
  readonly searchParams?: Promise<{
    readonly page?: string;
    readonly search?: string;
    readonly role?: string;
  }>;
}

export default async function AdministrationPage({ searchParams }: AdministrationPageProps) {
  // SECURITY: Require admin authentication at page level
  await requireAdminPageAuth();

  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const search = resolvedSearchParams?.search ?? "";

  // Load users server-side using secure Data Access Layer
  const { users, totalCount } = await getUsers(page, 10, search || undefined);

  const pagination = {
    page,
    limit: 10,
    total: totalCount,
    pages: Math.ceil(totalCount / 10),
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">Manage data imports, user accounts, and system administration</p>
      </div>

      <Tabs className="w-full" defaultValue="data">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Status</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="data">
          <div className="rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">CSV Data Import</h3>
            <CsvUploadClient />
          </div>

          <div className="rounded-lg border p-6">
            <DataManagementSummary />
          </div>
        </TabsContent>

        <TabsContent className="space-y-6" value="users">
          <div className="rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">User Management</h3>
            <p className="text-muted-foreground mb-6 text-sm">Manage user accounts and permissions</p>
            <Suspense
              fallback={
                <div className="text-muted-foreground flex h-32 items-center justify-center">Loading users...</div>
              }
            >
              <UserManagement
                initialUsers={users}
                initialPagination={pagination}
                initialSearch={search}
                initialRole=""
              />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent className="space-y-6" value="system">
          <div className="rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">System Status</h3>
            <p className="text-muted-foreground mb-6 text-sm">Monitor database connectivity and system health</p>
            <Suspense
              fallback={
                <div className="text-muted-foreground flex h-32 items-center justify-center">
                  Loading system status...
                </div>
              }
            >
              <SystemStatus />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
