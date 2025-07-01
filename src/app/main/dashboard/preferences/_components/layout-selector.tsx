"use client";

import { useState, useEffect } from "react";

import { Settings, Sidebar, Maximize2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SidebarVariant, SidebarCollapsible, ContentLayout } from "@/lib/layout-preferences";
import { setValueToCookie } from "@/server/server-actions";

export function LayoutSelector() {
  const [variant, setVariant] = useState<SidebarVariant>("sidebar");
  const [collapsible, setCollapsible] = useState<SidebarCollapsible>("icon");
  const [contentLayout, setContentLayout] = useState<ContentLayout>("full-width");

  useEffect(() => {
    // Get values from cookies on client side
    const getValueFromCookie = (name: string) => {
      if (typeof document !== "undefined") {
        const value = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${name}=`))
          ?.split("=")[1];
        return value;
      }
      return null;
    };

    const sidebarVariant = getValueFromCookie("sidebar_variant");
    const sidebarCollapsible = getValueFromCookie("sidebar_collapsible");
    const contentLayoutValue = getValueFromCookie("content_layout");

    setVariant((sidebarVariant as SidebarVariant) ?? "sidebar");
    setCollapsible((sidebarCollapsible as SidebarCollapsible) ?? "icon");
    setContentLayout((contentLayoutValue as ContentLayout) ?? "full-width");
  }, []);

  const handleValueChange = async (key: string, value: string) => {
    await setValueToCookie(key, value);
    // Update local state
    if (key === "sidebar_variant") setVariant(value as SidebarVariant);
    if (key === "sidebar_collapsible") setCollapsible(value as SidebarCollapsible);
    if (key === "content_layout") setContentLayout(value as ContentLayout);
  };

  return (
    <div className="space-y-4">
      {/* Sidebar Style */}
      <div className="space-y-3">
        <div>
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Sidebar className="h-4 w-4" />
            Sidebar Style
          </Label>
          <p className="text-muted-foreground mt-1 text-xs">How the sidebar appears</p>
        </div>
        <ToggleGroup
          className="grid w-full grid-cols-1 gap-1 sm:grid-cols-3"
          size="sm"
          variant="outline"
          type="single"
          value={variant}
          onValueChange={(value) => handleValueChange("sidebar_variant", value)}
        >
          <ToggleGroupItem
            value="inset"
            aria-label="Inset sidebar"
            className="flex h-10 items-center justify-center px-3"
          >
            <div className="text-sm font-medium">Inset</div>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="sidebar"
            aria-label="Standard sidebar"
            className="flex h-10 items-center justify-center px-3"
          >
            <div className="text-sm font-medium">Sidebar</div>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="floating"
            aria-label="Floating sidebar"
            className="flex h-10 items-center justify-center px-3"
          >
            <div className="text-sm font-medium">Floating</div>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator />

      {/* Sidebar Behavior */}
      <div className="space-y-3">
        <div>
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            Sidebar Behavior
          </Label>
          <p className="text-muted-foreground mt-1 text-xs">Collapse behavior</p>
        </div>
        <ToggleGroup
          className="grid w-full grid-cols-1 gap-1 sm:grid-cols-2"
          size="sm"
          variant="outline"
          type="single"
          value={collapsible}
          onValueChange={(value) => handleValueChange("sidebar_collapsible", value)}
        >
          <ToggleGroupItem
            value="icon"
            aria-label="Icon collapse"
            className="flex h-10 items-center justify-center px-3"
          >
            <div className="text-sm font-medium">Icon</div>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="offcanvas"
            aria-label="Off-canvas collapse"
            className="flex h-10 items-center justify-center px-3"
          >
            <div className="text-sm font-medium">Off-canvas</div>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator />

      {/* Content Width */}
      <div className="space-y-3">
        <div>
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Maximize2 className="h-4 w-4" />
            Content Width
          </Label>
          <p className="text-muted-foreground mt-1 text-xs">Main content area width</p>
        </div>
        <ToggleGroup
          className="grid w-full grid-cols-1 gap-1 sm:grid-cols-2"
          size="sm"
          variant="outline"
          type="single"
          value={contentLayout}
          onValueChange={(value) => handleValueChange("content_layout", value)}
        >
          <ToggleGroupItem
            value="centered"
            aria-label="Centered layout"
            className="flex h-10 items-center justify-center px-3"
          >
            <div className="text-sm font-medium">Centered</div>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="full-width"
            aria-label="Full width layout"
            className="flex h-10 items-center justify-center px-3"
          >
            <div className="text-sm font-medium">Full Width</div>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
