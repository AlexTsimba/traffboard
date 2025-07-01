"use client";

import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SidebarVariant, SidebarCollapsible, ContentLayout } from "@/lib/layout-preferences";
import { setValueToCookie } from "@/server/server-actions";

interface LayoutControlsProps {
  readonly variant: SidebarVariant;
  readonly collapsible: SidebarCollapsible;
  readonly contentLayout: ContentLayout;
}

export function LayoutControls({ variant, collapsible, contentLayout }: LayoutControlsProps) {
  const handleValueChange = async (key: string, value: string) => {
    await setValueToCookie(key, value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon">
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <h4 className="text-sm leading-none font-medium">Layout Settings</h4>
            <p className="text-muted-foreground text-xs">Customize your dashboard layout preferences.</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Sidebar Variant</Label>
              <ToggleGroup
                className="w-full"
                size="sm"
                type="single"
                value={variant}
                variant="outline"
                onValueChange={(value) => handleValueChange("sidebar_variant", value)}
              >
                <ToggleGroupItem aria-label="Toggle inset" className="text-xs" value="inset">
                  Inset
                </ToggleGroupItem>
                <ToggleGroupItem aria-label="Toggle sidebar" className="text-xs" value="sidebar">
                  Sidebar
                </ToggleGroupItem>
                <ToggleGroupItem aria-label="Toggle floating" className="text-xs" value="floating">
                  Floating
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Sidebar Collapsible</Label>
              <ToggleGroup
                className="w-full"
                size="sm"
                type="single"
                value={collapsible}
                variant="outline"
                onValueChange={(value) => handleValueChange("sidebar_collapsible", value)}
              >
                <ToggleGroupItem aria-label="Toggle icon" className="text-xs" value="icon">
                  Icon
                </ToggleGroupItem>
                <ToggleGroupItem aria-label="Toggle offcanvas" className="text-xs" value="offcanvas">
                  OffCanvas
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Content Layout</Label>
              <ToggleGroup
                className="w-full"
                size="sm"
                type="single"
                value={contentLayout}
                variant="outline"
                onValueChange={(value) => handleValueChange("content_layout", value)}
              >
                <ToggleGroupItem aria-label="Toggle centered" className="text-xs" value="centered">
                  Centered
                </ToggleGroupItem>
                <ToggleGroupItem aria-label="Toggle full-width" className="text-xs" value="full-width">
                  Full Width
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
