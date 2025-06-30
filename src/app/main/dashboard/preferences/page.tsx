import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LayoutSelector } from "./_components/layout-selector";
import { ThemeSelector } from "./_components/theme-selector";

export default function PreferencesPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground">Customize your TraffBoard experience and appearance settings</p>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-1 lg:w-[400px]">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <div className="rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">Theme & Layout</h3>
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium">Theme</label>
                <ThemeSelector />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium">Layout Settings</label>
                <LayoutSelector />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
