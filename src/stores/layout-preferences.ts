"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SidebarVariant, SidebarCollapsible, ContentLayout } from "@/lib/layout-preferences";
import { setValueToCookie } from "@/server/server-actions";

// Layout preferences state
interface LayoutPreferencesState {
  sidebarVariant: SidebarVariant;
  sidebarCollapsible: SidebarCollapsible;
  contentLayout: ContentLayout;
  hasHydrated: boolean;
}

interface LayoutPreferencesActions {
  setSidebarVariant: (variant: SidebarVariant) => void;
  setSidebarCollapsible: (collapsible: SidebarCollapsible) => void;
  setContentLayout: (layout: ContentLayout) => void;
  setHasHydrated: (state: boolean) => void;
  initializeFromCookies: () => void;
}

export type LayoutPreferencesStore = LayoutPreferencesState & LayoutPreferencesActions;

// Default values (match existing defaults)
export const DEFAULT_LAYOUT_PREFERENCES: LayoutPreferencesState = {
  sidebarVariant: "sidebar",
  sidebarCollapsible: "icon",
  contentLayout: "full-width",
  hasHydrated: false,
};

// Get value from cookie (used only once during initialization)
const getValueFromCookie = (name: string): string | null => {
  if (typeof document !== "undefined") {
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1];
    return value ?? null;
  }
  
};

// Layout preferences store
export const useLayoutPreferencesStore = create<LayoutPreferencesStore>()(
  persist(
    (set) => ({
      ...DEFAULT_LAYOUT_PREFERENCES,

      setSidebarVariant: async (sidebarVariant) => {
        set({ sidebarVariant });
        // Sync to cookies for SSR compatibility
        await setValueToCookie("sidebar_variant", sidebarVariant);
      },

      setSidebarCollapsible: async (sidebarCollapsible) => {
        set({ sidebarCollapsible });
        // Sync to cookies for SSR compatibility
        await setValueToCookie("sidebar_collapsible", sidebarCollapsible);
      },

      setContentLayout: async (contentLayout) => {
        set({ contentLayout });
        // Sync to cookies for SSR compatibility
        await setValueToCookie("content_layout", contentLayout);
      },

      setHasHydrated: (state) => set({ hasHydrated: state }),

      initializeFromCookies: () => {
        // Read cookies once during initialization
        const sidebarVariant = getValueFromCookie("sidebar_variant");
        const sidebarCollapsible = getValueFromCookie("sidebar_collapsible");
        const contentLayout = getValueFromCookie("content_layout");

        set({
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          sidebarVariant: (sidebarVariant as SidebarVariant) || "sidebar",
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          sidebarCollapsible: (sidebarCollapsible as SidebarCollapsible) || "icon",
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          contentLayout: (contentLayout as ContentLayout) || "full-width",
          hasHydrated: true,
        });
      },
    }),
    {
      name: "layout-preferences",
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Initialize from cookies on hydration
          state.initializeFromCookies();
        }
      },
      // Persist layout preferences
      partialize: (state) => ({
        sidebarVariant: state.sidebarVariant,
        sidebarCollapsible: state.sidebarCollapsible,
        contentLayout: state.contentLayout,
      }),
    },
  ),
);

// Selector helpers for performance
export const layoutSelectors = {
  sidebarVariant: (state: LayoutPreferencesStore) => state.sidebarVariant,
  sidebarCollapsible: (state: LayoutPreferencesStore) => state.sidebarCollapsible,
  contentLayout: (state: LayoutPreferencesStore) => state.contentLayout,
  isHydrated: (state: LayoutPreferencesStore) => state.hasHydrated,
  all: (state: LayoutPreferencesStore) => ({
    sidebarVariant: state.sidebarVariant,
    sidebarCollapsible: state.sidebarCollapsible,
    contentLayout: state.contentLayout,
  }),
};
