"use client";

import { useEffect } from "react";

import { useLayoutPreferencesStore } from "@/stores/layout-preferences";

/**
 * PreferencesInitializer ensures both theme and layout stores are properly initialized
 * and preferences are applied on the client side.
 * Should be included in the app layout for global access.
 */
export function PreferencesInitializer() {
  const layoutStore = useLayoutPreferencesStore();

  useEffect(() => {
    // Force rehydration if needed (handles SSR edge cases)
    if (!layoutStore.hasHydrated) {
      layoutStore.initializeFromCookies();
    }
  }, [layoutStore]);

  return null; // This component doesn't render anything
}
