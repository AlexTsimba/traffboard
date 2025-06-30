import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdministrationPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">Manage data imports, user accounts, and system administration</p>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-6">
          <div className="rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">CSV Data Import</h3>
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="mx-auto max-w-sm">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
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

        <TabsContent value="users" className="space-y-6">
          <div className="rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">User Management</h3>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Manage user accounts and permissions</p>
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2">
                Add User
              </button>
            </div>

            <div className="text-muted-foreground py-12 text-center">
              <p className="text-lg">User management interface</p>
              <p className="text-sm">Create, edit, and manage user accounts and roles</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
