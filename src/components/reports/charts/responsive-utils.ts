/**
 * Responsive Utilities for Chart Components
 *
 * Provides utilities for handling responsive behavior in charts,
 * including data reduction for mobile devices and breakpoint detection.
 */

/**
 * Reduces data complexity and improves performance on smaller screens
 */
export function formatChartDataForMobile<T extends Record<string, unknown>>(data: T[], maxDataPoints = 10): T[] {
  if (data.length <= maxDataPoints) {
    return data;
  }

  // Use simple sampling for large datasets
  const step = Math.ceil(data.length / maxDataPoints);
  return data.filter((_, index) => index % step === 0);
}

/**
 * Determines if the current viewport is mobile-sized
 */
export function isMobileViewport(): boolean {
  if (typeof globalThis === "undefined") return false;
  return window.innerWidth < 768;
}

/**
 * Gets responsive chart dimensions based on container size
 */
export function getResponsiveChartDimensions(
  containerWidth: number,
  containerHeight: number,
): {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
} {
  const isMobile = containerWidth < 768;

  return {
    width: containerWidth,
    height: Math.min(containerHeight, isMobile ? 300 : 400),
    margin: {
      top: isMobile ? 10 : 20,
      right: isMobile ? 10 : 30,
      bottom: isMobile ? 40 : 60,
      left: isMobile ? 40 : 60,
    },
  };
}

/**
 * Formats large numbers for display in charts
 */
export function formatNumberForChart(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Gets optimal number of ticks for axes based on chart size
 */
export function getOptimalTickCount(chartWidth: number, isMobile = false): number {
  if (isMobile) {
    return Math.max(3, Math.floor(chartWidth / 100));
  }
  return Math.max(5, Math.floor(chartWidth / 80));
}

/**
 * Truncates long labels for mobile displays
 */
export function truncateLabelForMobile(label: string, maxLength = 8): string {
  if (typeof globalThis !== "undefined" && window.innerWidth < 768) {
    return label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
  }
  return label;
}

/**
 * Color palette that works well on both light and dark themes
 */
export const responsiveColors = {
  primary: "#2563eb",
  secondary: "#7c3aed",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#0891b2",
  muted: "#6b7280",
  accent: "#ec4899",
};

/**
 * Cohort-specific color palette for consistent chart coloring
 */
export const cohortColorPalette = [
  "#ef4444", // red
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#ef4444", // red (repeat for more cohorts)
];

/**
 * Gets appropriate color for a cohort based on its index
 */
export function getCohortColor(index: number): string {
  return cohortColorPalette[index % cohortColorPalette.length];
}

/**
 * Hook for detecting window resize and updating chart dimensions
 */
export function useResponsiveChart() {
  const [dimensions, setDimensions] = React.useState(() => {
    if (!globalThis.window) {
      return { width: 800, height: 400 };
    }
    return {
      width: globalThis.window.innerWidth,
      height: globalThis.window.innerHeight,
    };
  });

  React.useEffect(() => {
    if (!globalThis.window) return;

    const handleResize = () => {
      setDimensions({
        width: globalThis.window.innerWidth,
        height: globalThis.window.innerHeight,
      });
    };

    globalThis.window.addEventListener("resize", handleResize);
    return () => {
      globalThis.window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isMobile = dimensions.width < 768;
  const chartDimensions = getResponsiveChartDimensions(
    Math.min(dimensions.width - 64, 1200), // Max width with padding
    400,
  );

  return { isMobile, chartDimensions };
}

// Add React import for the hook
import React from "react";
