"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      <Button
        variant={theme === "light" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("light")}
        className="flex items-center gap-2"
      >
        <Sun className="h-4 w-4" />
        Light
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("dark")}
        className="flex items-center gap-2"
      >
        <Moon className="h-4 w-4" />
        Dark
      </Button>
      <Button
        variant={theme === "system" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("system")}
        className="flex items-center gap-2"
      >
        <Monitor className="h-4 w-4" />
        System
      </Button>
    </div>
  );
}
