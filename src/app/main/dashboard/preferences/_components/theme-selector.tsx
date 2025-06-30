"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Theme</Label>
      <ToggleGroup
        className="w-full justify-start"
        size="sm"
        variant="outline"
        type="single"
        value={theme}
        onValueChange={(value) => setTheme(value)}
      >
        <ToggleGroupItem value="light" aria-label="Light theme">
          <Sun className="mr-2 h-4 w-4" />
          Light
        </ToggleGroupItem>
        <ToggleGroupItem value="dark" aria-label="Dark theme">
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </ToggleGroupItem>
        <ToggleGroupItem value="system" aria-label="System theme">
          <Monitor className="mr-2 h-4 w-4" />
          System
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
