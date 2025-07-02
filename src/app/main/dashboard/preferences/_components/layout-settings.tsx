"use client";

import { Settings, Sidebar, Maximize2, Monitor, Grid } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SidebarVariant, SidebarCollapsible, ContentLayout } from "@/lib/layout-preferences";
import { setValueToCookie } from "@/server/server-actions";

export function LayoutSettings() {
  const [variant, setVariant] = useState<SidebarVariant>("sidebar");
  const [collapsible, setCollapsible] = useState<SidebarCollapsible>("icon");
  const [contentLayout, setContentLayout] = useState<ContentLayout>("full-width");

  useEffect(() => {
    const getValueFromCookie = (name: string) => {
      if (typeof document !== "undefined") {
        const value = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${name}=`))
          ?.split("=")[1];
        return value;
      }
    };

    const updateValues = () => {
      const sidebarVariant = getValueFromCookie("sidebar_variant");
      const sidebarCollapsible = getValueFromCookie("sidebar_collapsible");
      const contentLayoutValue = getValueFromCookie("content_layout");

      setVariant(sidebarVariant as SidebarVariant);
      setCollapsible(sidebarCollapsible as SidebarCollapsible);
      setContentLayout(contentLayoutValue as ContentLayout);
    };

    updateValues();
    const interval = setInterval(updateValues, 300);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleValueChange = async (key: string, value: string) => {
    await setValueToCookie(key, value);
    if (key === "sidebar_variant") setVariant(value as SidebarVariant);
    if (key === "sidebar_collapsible") setCollapsible(value as SidebarCollapsible);
    if (key === "content_layout") setContentLayout(value as ContentLayout);
  };

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Left Column */}
      <div className="space-y-3">
        {/* Current Configuration Preview */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4" />
              Current Layout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-1">
              <Badge className="text-xs" variant="secondary">
                {variant.charAt(0).toUpperCase() + variant.slice(1)}
              </Badge>
              <Badge className="text-xs" variant="secondary">
                {collapsible === "icon" ? "Icon" : "Off-canvas"}
              </Badge>
              <Badge className="text-xs" variant="secondary">
                {contentLayout === "centered" ? "Centered" : "Full Width"}
              </Badge>
            </div>

            {/* Visual Preview */}
            <div className="bg-muted/30 rounded-md border p-2">
              <div className="flex h-10 gap-1">
                <div
                  className={`bg-muted border-muted-foreground/30 rounded-sm border ${
                    variant === "floating" ? "border-dashed" : ""
                  } ${variant === "inset" ? "ml-0.5" : ""} ${collapsible === "icon" ? "w-2" : "w-5"}`}
                />
                <div
                  className={`bg-background border-muted-foreground/20 flex-1 rounded-sm border ${
                    contentLayout === "centered" ? "mx-auto max-w-16" : "w-full"
                  }`}
                >
                  <div className="border-muted-foreground/30 flex h-full items-center justify-center rounded-sm border border-dashed">
                    <Grid className="text-muted-foreground h-2 w-2" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Behavior */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4" />
              Sidebar Behavior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              className="grid w-full grid-cols-2 gap-2"
              size="sm"
              type="single"
              value={collapsible}
              variant="outline"
              onValueChange={(value) => void handleValueChange("sidebar_collapsible", value)}
            >
              <ToggleGroupItem aria-label="Icon collapse" className="h-8" value="icon">
                <div className="text-center">
                  <div className="text-xs font-medium">Icon</div>
                  <div className="text-muted-foreground text-xs">Shows icons</div>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="Off-canvas collapse" className="h-8" value="offcanvas">
                <div className="text-center">
                  <div className="text-xs font-medium">Off-canvas</div>
                  <div className="text-muted-foreground text-xs">Hides completely</div>
                </div>
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-3">
        {/* Sidebar Style */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sidebar className="h-4 w-4" />
              Sidebar Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              className="grid w-full grid-cols-3 gap-1"
              size="sm"
              type="single"
              value={variant}
              variant="outline"
              onValueChange={(value) => void handleValueChange("sidebar_variant", value)}
            >
              <ToggleGroupItem aria-label="Inset sidebar" className="h-8" value="inset">
                <div className="text-center">
                  <div className="text-xs font-medium">Inset</div>
                  <div className="text-muted-foreground text-xs">Within</div>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="Standard sidebar" className="h-8" value="sidebar">
                <div className="text-center">
                  <div className="text-xs font-medium">Standard</div>
                  <div className="text-muted-foreground text-xs">Classic</div>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="Floating sidebar" className="h-8" value="floating">
                <div className="text-center">
                  <div className="text-xs font-medium">Floating</div>
                  <div className="text-muted-foreground text-xs">Overlay</div>
                </div>
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>

        {/* Content Layout */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Maximize2 className="h-4 w-4" />
              Content Width
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              className="grid w-full grid-cols-2 gap-2"
              size="sm"
              type="single"
              value={contentLayout}
              variant="outline"
              onValueChange={(value) => void handleValueChange("content_layout", value)}
            >
              <ToggleGroupItem aria-label="Centered layout" className="h-8" value="centered">
                <div className="text-center">
                  <div className="text-xs font-medium">Centered</div>
                  <div className="text-muted-foreground text-xs">Constrained</div>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="Full width layout" className="h-8" value="full-width">
                <div className="text-center">
                  <div className="text-xs font-medium">Full Width</div>
                  <div className="text-muted-foreground text-xs">All space</div>
                </div>
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
