import { Suspense } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getUsersAction } from "./_actions/user-actions";
import { UserManagement } from "./_components/user-management";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdByUser: { name: string | null; email: string } | null;
  lastModifiedByUser: { name: string | null; email: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface AdministrationPageProps {
  readonly searchParams?: Promise<{
    readonly page?: string;
    readonly search?: string;
    readonly role?: string;
  }>;
}

export default async function AdministrationPage({ searchParams }: AdministrationPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const search = resolvedSearchParams?.search ?? "";
  const role = resolvedSearchParams?.role ?? "";

  // Load users server-side
  const usersResult = await getUsersAction(page, 10, search, role);

  // Extract values with proper type guards
  let initialUsers: User[] = [];
  let initialPagination: Pagination = { page: 1, limit: 10, total: 0, pages: 0 };

  if (usersResult.success) {
    initialUsers = usersResult.users as User[];
    initialPagination = usersResult.pagination as Pagination;
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">Manage data imports, user accounts, and system administration</p>
      </div>

      <Tabs className="w-full" defaultValue="data">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="data">
          <div className="rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">CSV Data Import</h3>
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="mx-auto max-w-sm">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Upload CSV Files</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Drag and drop your conversion data files here, or click to browse
                  </p>
                  <button className="bg-primary hover:bg-primary/90 mt-4 inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm">
                    Choose Files
                  </button>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium">Recent Uploads</h4>
                <div className="text-muted-foreground text-sm">No files uploaded yet</div>
              </div>
            </div>
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
                initialUsers={initialUsers}
                initialPagination={initialPagination}
                initialSearch={search}
                initialRole={role}
              />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
