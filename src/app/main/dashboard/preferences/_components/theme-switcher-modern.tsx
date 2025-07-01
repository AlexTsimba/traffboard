"use client";
import { useState, useEffect } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "next-themes";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

export function ThemeSwitcherModern() {
  const { theme, setTheme } = useTheme();
  const [selected, setSelected] = useState(theme ?? "light");

  useEffect(() => {
    setSelected(theme ?? "light");
  }, [theme]);

  return (
    <ToggleGroup
      className="flex gap-2"
      size="lg"
      type="single"
      value={selected}
      onValueChange={(value) => {
        setTheme(value);
        setSelected(value);
      }}
    >
      {THEMES.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          aria-label={label}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent/60 flex h-16 w-20 flex-col items-center justify-center rounded-lg border shadow-sm transition-all"
          value={value}
        >
          <Icon className="mb-1 h-6 w-6" />
          <span className="text-xs font-medium">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
