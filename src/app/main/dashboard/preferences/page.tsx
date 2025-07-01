import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AccountProfile } from "./_components/account-profile";
import { LayoutSettings } from "./_components/layout-settings";
import { SecuritySettings } from "./_components/security-settings";
import { ThemeSettings } from "./_components/theme-settings";

export default function SettingsPage() {
  return (
    <div className="@container/main flex flex-col gap-4">
      <Tabs defaultValue="account" className="w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

          <TabsList className="grid h-10 grid-cols-4">
            <TabsTrigger value="account" className="text-sm">
              Account
            </TabsTrigger>
            <TabsTrigger value="security" className="text-sm">
              Security
            </TabsTrigger>
            <TabsTrigger value="layout" className="text-sm">
              Layout
            </TabsTrigger>
            <TabsTrigger value="theme" className="text-sm">
              Theme
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content под табами */}
        <div className="mt-4">
          <TabsContent value="account" className="mt-0">
            <AccountProfile />
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="layout" className="mt-0">
            <LayoutSettings />
          </TabsContent>

          <TabsContent value="theme" className="mt-0">
            <ThemeSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
