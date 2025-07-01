"use client";
import { useState, useEffect } from "react";

import { Sidebar, Columns, Layout } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const SIDEBAR_VARIANTS = [
  { value: "inset", label: "Inset", icon: Columns },
  { value: "sidebar", label: "Sidebar", icon: Sidebar },
  { value: "floating", label: "Floating", icon: Layout },
];

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
}

export function SidebarLayoutSwitcherModern() {
  const [selected, setSelected] = useState("sidebar");

  useEffect(() => {
    const value =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("sidebar_variant="))
        ?.split("=")[1] ?? "sidebar";
    setSelected(value);
  }, []);

  const handleChange = (value: string) => {
    setCookie("sidebar_variant", value);
    setSelected(value);
    window.location.reload();
  };

  return (
    <ToggleGroup type="single" value={selected} onValueChange={handleChange} className="flex gap-2" size="lg">
      {SIDEBAR_VARIANTS.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent/60 flex h-16 w-24 flex-col items-center justify-center rounded-lg border shadow-sm transition-all"
        >
          <Icon className="mb-1 h-6 w-6" />
          <span className="text-xs font-medium">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
