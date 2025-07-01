"use client";

import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SidebarVariant, SidebarCollapsible, ContentLayout } from "@/lib/layout-preferences";

export function LayoutPreview() {
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

    const updateValues = () => {
      const sidebarVariant = getValueFromCookie("sidebar_variant");
      const sidebarCollapsible = getValueFromCookie("sidebar_collapsible");
      const contentLayoutValue = getValueFromCookie("content_layout");

      setVariant(sidebarVariant as SidebarVariant);
      setCollapsible(sidebarCollapsible as SidebarCollapsible);
      setContentLayout(contentLayoutValue as ContentLayout);
    };

    // Initial load
    updateValues();

    // Listen for cookie changes with reduced interval
    const interval = setInterval(updateValues, 300);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const formatLabel = (key: string, value: string) => {
    switch (key) {
      case "variant":
        return `Sidebar: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
      case "collapsible":
        return `Collapse: ${value === "icon" ? "Icon" : "Off-canvas"}`;
      case "contentLayout":
        return `Content: ${value === "centered" ? "Centered" : "Full Width"}`;
      default:
        return value;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-base">Current Configuration</CardTitle>
        <CardDescription className="text-sm">Preview of active settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5 px-6 pt-0 pb-2">
        <div className="flex flex-wrap gap-1">
          <Badge className="px-2 py-0.5 text-xs" variant="secondary">
            {formatLabel("variant", variant)}
          </Badge>
          <Badge className="px-2 py-0.5 text-xs" variant="secondary">
            {formatLabel("collapsible", collapsible)}
          </Badge>
          <Badge className="px-2 py-0.5 text-xs" variant="secondary">
            {formatLabel("contentLayout", contentLayout)}
          </Badge>
        </div>

        {/* Compact visual representation */}
        <div className="rounded border p-2">
          <div className="flex h-10 gap-1">
            {/* Sidebar representation */}
            <div
              className={`bg-muted/60 border-muted-foreground/30 rounded-sm border ${
                variant === "floating" ? "border-muted-foreground/50 border-dashed" : ""
              } ${variant === "inset" ? "ml-0.5" : ""} ${collapsible === "icon" ? "w-3" : "w-6"}`}
            />
            {/* Content area */}
            <div
              className={`bg-background/50 border-muted-foreground/20 flex-1 rounded-sm border ${
                contentLayout === "centered" ? "mx-auto max-w-20" : "w-full"
              }`}
            >
              <div className="border-muted-foreground/30 h-full rounded-sm border border-dashed" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
