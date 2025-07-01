import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AccountProfile } from "./_components/account-profile";
import AppearanceSettings from "./_components/appearance-settings";
import { SecuritySettings } from "./_components/security-settings";

export default function SettingsPage() {
  return (
    <div className="@container/main flex flex-col gap-4">
      <Tabs className="w-full" defaultValue="account">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent className="pt-2" value="account">
          <AccountProfile />
        </TabsContent>
        <TabsContent className="pt-2" value="security">
          <SecuritySettings />
        </TabsContent>
        <TabsContent className="pt-2" value="appearance">
          <AppearanceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
