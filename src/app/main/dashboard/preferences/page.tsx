import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AccountProfile } from "./_components/account-profile";
import { AppearanceSettings } from "./_components/appearance-settings";
import { SecuritySettings } from "./_components/security-settings";

export default function SettingsPage() {
  return (
    <div className="@container/main flex flex-col gap-4">
      <Tabs defaultValue="account" className="w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="account" className="pt-2">
          <AccountProfile />
        </TabsContent>
        <TabsContent value="security" className="pt-2">
          <SecuritySettings />
        </TabsContent>
        <TabsContent value="appearance" className="pt-2">
          <AppearanceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
