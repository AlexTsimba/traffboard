"use client";

import {
  useLayoutPreferencesStore,
  layoutSelectors,
  DEFAULT_LAYOUT_PREFERENCES,
  type LayoutPreferencesStore,
} from "@/stores/layout-preferences";

// Generic SSR-safe hook for layout preferences
function useSSRSafeLayout<T>(
  selector: (state: LayoutPreferencesStore) => T,
  defaultValue: T,
): { data: T; isHydrated: boolean } {
  const storeValue = useLayoutPreferencesStore(selector);
  const isHydrated = useLayoutPreferencesStore(layoutSelectors.isHydrated);

  return {
    data: isHydrated ? storeValue : defaultValue,
    isHydrated,
  };
}

// Individual layout preference hooks
export function useSidebarVariant() {
  return useSSRSafeLayout(layoutSelectors.sidebarVariant, DEFAULT_LAYOUT_PREFERENCES.sidebarVariant);
}

export function useSidebarCollapsible() {
  return useSSRSafeLayout(layoutSelectors.sidebarCollapsible, DEFAULT_LAYOUT_PREFERENCES.sidebarCollapsible);
}

export function useContentLayout() {
  return useSSRSafeLayout(layoutSelectors.contentLayout, DEFAULT_LAYOUT_PREFERENCES.contentLayout);
}

// Combined hook for all layout preferences
export function useAllLayoutPreferences() {
  return useSSRSafeLayout(layoutSelectors.all, {
    sidebarVariant: DEFAULT_LAYOUT_PREFERENCES.sidebarVariant,
    sidebarCollapsible: DEFAULT_LAYOUT_PREFERENCES.sidebarCollapsible,
    contentLayout: DEFAULT_LAYOUT_PREFERENCES.contentLayout,
  });
}

// Action hooks
export function useLayoutActions() {
  return {
    setSidebarVariant: useLayoutPreferencesStore((state) => state.setSidebarVariant),
    setSidebarCollapsible: useLayoutPreferencesStore((state) => state.setSidebarCollapsible),
    setContentLayout: useLayoutPreferencesStore((state) => state.setContentLayout),
  };
}

// Individual action hooks for better performance
export function useSetSidebarVariant() {
  return useLayoutPreferencesStore((state) => state.setSidebarVariant);
}

export function useSetSidebarCollapsible() {
  return useLayoutPreferencesStore((state) => state.setSidebarCollapsible);
}

export function useSetContentLayout() {
  return useLayoutPreferencesStore((state) => state.setContentLayout);
}

// Hydration status hook
export function useLayoutHydration() {
  return useLayoutPreferencesStore(layoutSelectors.isHydrated);
}
