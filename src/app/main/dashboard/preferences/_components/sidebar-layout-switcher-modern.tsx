"use client";
import { Sidebar, Columns, Layout } from "lucide-react";
import { useState, useEffect } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const SIDEBAR_VARIANTS = [
  { value: "inset", label: "Inset", icon: Columns },
  { value: "sidebar", label: "Sidebar", icon: Sidebar },
  { value: "floating", label: "Floating", icon: Layout },
];

function setCookie(name: string, value: string) {
  if (typeof document !== "undefined") {
    // eslint-disable-next-line unicorn/no-document-cookie
    document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document !== "undefined") {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1];
  }
  return undefined;
}

export function SidebarLayoutSwitcherModern() {
  const [selected, setSelected] = useState("sidebar");

  useEffect(() => {
    const value = getCookie("sidebar_variant") ?? "sidebar";
    setSelected(value);
  }, []);

  const handleChange = (value: string) => {
    setCookie("sidebar_variant", value);
    setSelected(value);
    globalThis.location.reload();
  };

  return (
    <ToggleGroup className="flex gap-2" size="lg" type="single" value={selected} onValueChange={handleChange}>
      {SIDEBAR_VARIANTS.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          aria-label={label}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent/60 flex h-16 w-24 flex-col items-center justify-center rounded-lg border shadow-sm transition-all"
          value={value}
        >
          <Icon className="mb-1 h-6 w-6" />
          <span className="text-xs font-medium">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
