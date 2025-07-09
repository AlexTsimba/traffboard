/**
 * Enhanced Chart Components for Cohort Analysis
 *
 * Task 3.1: Universal UI Component Library - Chart Components
 *
 * This module exports specialized chart components for cohort analysis,
 * built on top of the existing ChartContainer system and Recharts infrastructure.
 *
 * Features:
 * - CohortHeatmapChart: Triangular heatmap visualization for cohort data
 * - MultiMetricChart: Compare multiple metrics (DEP2COST, ROAS, AVG DEPOSIT SUM, RETENTION RATE)
 * - BreakpointChart: Retention curves and breakpoint-specific analysis
 * - Responsive design utilities for all chart types
 *
 * Integration:
 * - Uses existing ChartContainer, ChartTooltip, ChartLegend from ui/chart.tsx
 * - Integrates with Report Factory Foundation types from types/reports.ts
 * - Supports all CohortMetric types and breakpoint configurations
 * - Compatible with Zustand stores and filter system
 */

// Core chart components
export { CohortHeatmapChart } from "./cohort-heatmap-chart";
export type { CohortHeatmapChartProps } from "./cohort-heatmap-chart";

export { MultiMetricChart } from "./multi-metric-chart";
export type { MultiMetricChartProps } from "./multi-metric-chart";

export { BreakpointChart } from "./breakpoint-chart";
export type { BreakpointChartProps } from "./breakpoint-chart";

// Responsive utilities
export * from "./responsive-utils";

// Re-export commonly used chart types from reports
export type { CohortData, CohortCell, CohortMetric, CohortConfig } from "@/types/reports";
export type { ChartConfig } from "@/components/ui/chart";

/**
 * Chart component registry for dynamic loading
 * Useful for plugin systems and dynamic chart selection
 */
export const CHART_REGISTRY = {
  "cohort-heatmap": {
    component: "CohortHeatmapChart",
    name: "Cohort Heatmap",
    description: "Triangular heatmap visualization for cohort analysis",
    metrics: ["retention_rate", "roas", "dep2cost", "avg_deposit_sum"] as const,
    features: ["heatmap", "triangular-layout", "interactive-cells", "metric-switching"],
  },
  "multi-metric": {
    component: "MultiMetricChart",
    name: "Multi-Metric Comparison",
    description: "Compare multiple cohort metrics in line or bar charts",
    metrics: ["retention_rate", "roas", "dep2cost", "avg_deposit_sum"] as const,
    features: ["line-chart", "bar-chart", "metric-toggles", "summary-stats", "comparison-table"],
  },
  breakpoint: {
    component: "BreakpointChart",
    name: "Breakpoint Analysis",
    description: "Retention curves and breakpoint-specific performance",
    metrics: ["retention_rate", "roas", "dep2cost", "avg_deposit_sum"] as const,
    features: ["retention-curves", "cohort-filtering", "average-line", "confidence-bands", "trend-analysis"],
  },
} as const;

/**
 * Chart type definitions for type safety
 */
export type ChartType = keyof typeof CHART_REGISTRY;

/**
 * Chart configuration for dynamic chart creation
 */
export interface ChartComponentConfig {
  type: ChartType;
  props: Record<string, unknown>;
  title?: string;
  description?: string;
}

/**
 * Utility function to get chart component information
 */
export function getChartInfo(type: ChartType) {
  return CHART_REGISTRY[type];
}

/**
 * Utility function to validate chart props based on type
 */
export function validateChartProps(type: ChartType, props: Record<string, unknown>): boolean {
  // Basic validation - ensure required props exist
  const requiredProps = ["data", "metric"];

  switch (type) {
    case "cohort-heatmap": {
      return [...requiredProps, "breakpoints"].every((prop) => prop in props);
    }
    case "multi-metric": {
      return [...requiredProps, "metrics", "breakpoint"].every((prop) => prop in props);
    }
    case "breakpoint": {
      return [...requiredProps, "breakpoints"].every((prop) => prop in props);
    }
    default: {
      return false;
    }
  }
}
