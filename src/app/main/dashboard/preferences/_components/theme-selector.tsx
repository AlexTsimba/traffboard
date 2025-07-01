"use client";

import { Monitor, Moon, Sun, Palette } from "lucide-react";
import { useTheme } from "next-themes";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const getThemeDescription = () => {
    switch (theme) {
      case "light": {
        return "Light mode - easy on the eyes in bright environments";
      }
      case "dark": {
        return "Dark mode - perfect for low-light conditions";
      }
      case "system": {
        return "System mode - automatically matches your device settings";
      }
      case undefined: {
        return "Choose your preferred theme";
      }
      default: {
        return "Choose your preferred theme";
      }
    }
  };

  const getBackgroundClass = () => {
    switch (theme) {
      case "light": {
        return "bg-white";
      }
      case "dark": {
        return "bg-slate-900";
      }
      case "system":
      case undefined: {
        return "bg-gradient-to-r from-white to-slate-900";
      }
      default: {
        return "bg-gradient-to-r from-white to-slate-900";
      }
    }
  };

  const getElementClass = (lightClass: string, darkClass: string, gradientClass: string) => {
    switch (theme) {
      case "light": {
        return lightClass;
      }
      case "dark": {
        return darkClass;
      }
      case "system":
      case undefined: {
        return gradientClass;
      }
      default: {
        return gradientClass;
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Theme Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Current Theme
          </CardTitle>
          <CardDescription className="text-sm">{getThemeDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Theme Preview */}
          <div className="flex h-16 overflow-hidden rounded-lg border">
            <div className={`flex-1 ${getBackgroundClass()}`}>
              <div className="h-full space-y-1 p-2">
                <div
                  className={`h-2 w-8 rounded ${getElementClass("bg-slate-200", "bg-slate-700", "bg-gradient-to-r from-slate-200 to-slate-700")}`}
                />
                <div
                  className={`h-1.5 w-12 rounded ${getElementClass("bg-slate-300", "bg-slate-600", "bg-gradient-to-r from-slate-300 to-slate-600")}`}
                />
                <div
                  className={`h-1.5 w-6 rounded ${getElementClass("bg-slate-300", "bg-slate-600", "bg-gradient-to-r from-slate-300 to-slate-600")}`}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Theme Selection */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Color Scheme</Label>
          <p className="text-muted-foreground mt-1 text-xs">Choose how the interface should appear</p>
        </div>
        <ToggleGroup
          className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3"
          size="sm"
          type="single"
          value={theme}
          variant="outline"
          onValueChange={(value) => {
            setTheme(value);
          }}
        >
          <ToggleGroupItem
            aria-label="Light theme"
            className="flex h-10 items-center justify-center gap-2 px-3"
            value="light"
          >
            <Sun className="h-4 w-4" />
            <span className="text-sm font-medium">Light</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            aria-label="Dark theme"
            className="flex h-10 items-center justify-center gap-2 px-3"
            value="dark"
          >
            <Moon className="h-4 w-4" />
            <span className="text-sm font-medium">Dark</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            aria-label="System theme"
            className="flex h-10 items-center justify-center gap-2 px-3"
            value="system"
          >
            <Monitor className="h-4 w-4" />
            <span className="text-sm font-medium">System</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
