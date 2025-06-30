"use client";

import { useState, useEffect } from "react";

import { Label } from "@/components/ui/label";
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

    const sidebarVariant = getValueFromCookie("sidebar_variant") as SidebarVariant;
    const sidebarCollapsible = getValueFromCookie("sidebar_collapsible") as SidebarCollapsible;
    const contentLayoutValue = getValueFromCookie("content_layout") as ContentLayout;

    if (sidebarVariant) setVariant(sidebarVariant);
    if (sidebarCollapsible) setCollapsible(sidebarCollapsible);
    if (contentLayoutValue) setContentLayout(contentLayoutValue);
  }, []);

  const handleValueChange = async (key: string, value: string) => {
    await setValueToCookie(key, value);
    // Update local state
    if (key === "sidebar_variant") setVariant(value as SidebarVariant);
    if (key === "sidebar_collapsible") setCollapsible(value as SidebarCollapsible);
    if (key === "content_layout") setContentLayout(value as ContentLayout);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Sidebar Variant</Label>
        <ToggleGroup
          className="w-full justify-start"
          size="sm"
          variant="outline"
          type="single"
          value={variant}
          onValueChange={(value) => handleValueChange("sidebar_variant", value)}
        >
          <ToggleGroupItem value="inset" aria-label="Toggle inset">
            Inset
          </ToggleGroupItem>
          <ToggleGroupItem value="sidebar" aria-label="Toggle sidebar">
            Sidebar
          </ToggleGroupItem>
          <ToggleGroupItem value="floating" aria-label="Toggle floating">
            Floating
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Sidebar Collapsible</Label>
        <ToggleGroup
          className="w-full justify-start"
          size="sm"
          variant="outline"
          type="single"
          value={collapsible}
          onValueChange={(value) => handleValueChange("sidebar_collapsible", value)}
        >
          <ToggleGroupItem value="icon" aria-label="Toggle icon">
            Icon
          </ToggleGroupItem>
          <ToggleGroupItem value="offcanvas" aria-label="Toggle offcanvas">
            OffCanvas
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Content Layout</Label>
        <ToggleGroup
          className="w-full justify-start"
          size="sm"
          variant="outline"
          type="single"
          value={contentLayout}
          onValueChange={(value) => handleValueChange("content_layout", value)}
        >
          <ToggleGroupItem value="centered" aria-label="Toggle centered">
            Centered
          </ToggleGroupItem>
          <ToggleGroupItem value="full-width" aria-label="Toggle full-width">
            Full Width
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
