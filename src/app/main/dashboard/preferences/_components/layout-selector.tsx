"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { getSidebarVariant, getSidebarCollapsible, getContentLayout } from "@/lib/layout-preferences";

export function LayoutSelector() {
  const [sidebarVariant, setSidebarVariant] = useState<"inset" | "sidebar" | "floating">("sidebar");
  const [sidebarCollapsible, setSidebarCollapsible] = useState<"icon" | "offcanvas">("icon");
  const [contentLayout, setContentLayout] = useState<"centered" | "full-width">("full-width");

  useEffect(() => {
    // Load current settings
    const loadSettings = async () => {
      setSidebarVariant(await getSidebarVariant());
      setSidebarCollapsible(await getSidebarCollapsible());
      setContentLayout(await getContentLayout());
    };
    loadSettings();
  }, []);

  const handleSidebarVariantChange = async (variant: "inset" | "sidebar" | "floating") => {
    setSidebarVariant(variant);
    // Set cookie for persistence
    document.cookie = `sidebar_variant=${variant}; path=/; max-age=31536000`;
    window.location.reload(); // Reload to apply changes
  };

  const handleSidebarCollapsibleChange = async (collapsible: "icon" | "offcanvas") => {
    setSidebarCollapsible(collapsible);
    document.cookie = `sidebar_collapsible=${collapsible}; path=/; max-age=31536000`;
    window.location.reload();
  };

  const handleContentLayoutChange = async (layout: "centered" | "full-width") => {
    setContentLayout(layout);
    document.cookie = `content_layout=${layout}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-3 block text-sm font-medium">Sidebar Variant</label>
        <div className="flex gap-2">
          <Button
            variant={sidebarVariant === "inset" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSidebarVariantChange("inset")}
          >
            Inset
          </Button>
          <Button
            variant={sidebarVariant === "sidebar" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSidebarVariantChange("sidebar")}
          >
            Sidebar
          </Button>
          <Button
            variant={sidebarVariant === "floating" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSidebarVariantChange("floating")}
          >
            Floating
          </Button>
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium">Sidebar Collapsible</label>
        <div className="flex gap-2">
          <Button
            variant={sidebarCollapsible === "icon" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSidebarCollapsibleChange("icon")}
          >
            Icon
          </Button>
          <Button
            variant={sidebarCollapsible === "offcanvas" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSidebarCollapsibleChange("offcanvas")}
          >
            OffCanvas
          </Button>
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium">Content Layout</label>
        <div className="flex gap-2">
          <Button
            variant={contentLayout === "centered" ? "default" : "outline"}
            size="sm"
            onClick={() => handleContentLayoutChange("centered")}
          >
            Centered
          </Button>
          <Button
            variant={contentLayout === "full-width" ? "default" : "outline"}
            size="sm"
            onClick={() => handleContentLayoutChange("full-width")}
          >
            Full Width
          </Button>
        </div>
      </div>
    </div>
  );
}
