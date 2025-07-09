/**
 * Cohort Table Utilities
 *
 * Safe utility functions for cohort table operations following TraffBoard linting patterns.
 * Implements security-safe property access and performance optimizations.
 */

import type { CohortData, CohortMetric, CohortCell } from "@/types/reports";

// Safe breakpoint value access following security patterns
export function getBreakpointValueSafe(
  breakpointValues: Record<number, number | null>,
  breakpoint: number,
): number | null {
  if (typeof breakpoint !== "number" || !Number.isInteger(breakpoint) || breakpoint < 0) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(breakpointValues, breakpoint)) {
    // eslint-disable-next-line security/detect-object-injection
    return breakpointValues[breakpoint];
  }

  return null;
}

// Safe metric configuration access
export function getMetricConfigSafe<T extends Record<string, unknown>>(
  configs: T,
  metric: string,
): T[keyof T] | undefined {
  if (typeof metric !== "string") {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(configs, metric)) {
    return configs[metric as keyof T];
  }

  return undefined;
}

// Validate breakpoint key for security
export function validateBreakpointKey(key: unknown): key is number {
  return typeof key === "number" && Number.isInteger(key) && key > 0;
}

// Calculate heatmap intensity for color scaling
export function calculateHeatmapIntensity(value: number | null, min: number, max: number): number {
  if (value === null || min === max) {
    return 0;
  }

  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return normalizedValue;
}

// Generate heatmap CSS class based on intensity
export function generateHeatmapClass(intensity: number, metric: CohortMetric): string {
  const intensityLevel = Math.floor(intensity * 10);
  const clampedLevel = Math.max(0, Math.min(9, intensityLevel));

  return `heatmap-${metric}-${clampedLevel}`;
}

// Format value display for cohort cells
export function formatCohortValue(value: number | null, metric: CohortMetric): string {
  if (value === null) {
    return "-";
  }

  switch (metric) {
    case "dep2cost": {
      return `$${value.toFixed(2)}`;
    }
    case "roas": {
      return `${(value * 100).toFixed(1)}%`;
    }
    case "avg_deposit_sum": {
      return `$${value.toLocaleString()}`;
    }
    case "retention_rate": {
      return `${value.toFixed(1)}%`;
    }
    default: {
      const _exhaustive: never = metric;
      throw new Error(`Unhandled metric: ${String(_exhaustive)}`);
    }
  }
}

// Create cohort cell data with heatmap information
export function createCohortCell(
  cohortData: CohortData,
  breakpoint: number,
  metric: CohortMetric,
  minValue: number,
  maxValue: number,
): CohortCell {
  const value = getBreakpointValueSafe(cohortData.breakpointValues, breakpoint);
  const isEmpty = value === null;

  if (isEmpty) {
    return {
      value: null,
      displayValue: "-",
      heatmapClass: "heatmap-empty",
      isEmpty: true,
    };
  }

  const intensity = calculateHeatmapIntensity(value, minValue, maxValue);
  const heatmapClass = generateHeatmapClass(intensity, metric);
  const displayValue = formatCohortValue(value, metric);

  return {
    value,
    displayValue,
    heatmapClass,
    isEmpty: false,
  };
}

// Generate triangular column visibility for cohort layout
export function generateTriangularColumns(breakpoints: readonly number[], cohortIndex: number): readonly number[] {
  // In triangular layout, cohort N can only show breakpoints 0 to N
  const maxBreakpointIndex = Math.min(cohortIndex, breakpoints.length - 1);
  return breakpoints.slice(0, maxBreakpointIndex + 1);
}

// Calculate min/max values for heatmap scaling
export function calculateMetricRange(cohorts: readonly CohortData[]): { min: number; max: number } {
  const values: number[] = [];

  for (const cohort of cohorts) {
    const breakpointEntries = Object.entries(cohort.breakpointValues);

    for (const [breakpointStr, value] of breakpointEntries) {
      const breakpoint = Number(breakpointStr);

      if (validateBreakpointKey(breakpoint) && typeof value === "number") {
        values.push(value);
      }
    }
  }

  if (values.length === 0) {
    return { min: 0, max: 1 };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

// Sort cohorts by date for proper display order
export function sortCohortsByDate(cohorts: CohortData[]): CohortData[] {
  return cohorts.toSorted((a, b) => {
    const dateA = new Date(a.cohortDate);
    const dateB = new Date(b.cohortDate);
    return dateB.getTime() - dateA.getTime(); // Most recent first
  });
}

// Generate column definitions for triangular layout
export function generateBreakpointColumns(
  breakpoints: readonly number[],
): { id: string; header: string; accessor: string }[] {
  return breakpoints.map((breakpoint) => ({
    id: `breakpoint-${breakpoint}`,
    header: `Day ${breakpoint}`,
    accessor: `breakpoint_${breakpoint}`,
  }));
}

// Performance optimization: Memoized cell creation
const cellCache = new Map<string, CohortCell>();

export function createCohortCellMemoized(
  cohortData: CohortData,
  breakpoint: number,
  metric: CohortMetric,
  minValue: number,
  maxValue: number,
): CohortCell {
  const cacheKey = `${cohortData.cohortDate}-${breakpoint}-${metric}-${minValue}-${maxValue}`;

  if (cellCache.has(cacheKey)) {
    const cachedCell = cellCache.get(cacheKey);
    if (cachedCell) {
      return cachedCell;
    }
  }

  const cell = createCohortCell(cohortData, breakpoint, metric, minValue, maxValue);
  cellCache.set(cacheKey, cell);

  return cell;
}

// Clear cache when data changes
export function clearCohortCellCache(): void {
  cellCache.clear();
}

// Validate cohort data structure
export function validateCohortData(data: unknown): data is CohortData {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const cohort = data as Record<string, unknown>;

  return (
    typeof cohort.cohortDate === "string" &&
    typeof cohort.ftdCount === "number" &&
    typeof cohort.breakpointValues === "object" &&
    cohort.breakpointValues !== null
  );
}

// Get visible breakpoints for specific cohort in triangular layout
export function getVisibleBreakpoints(
  allBreakpoints: readonly number[],
  cohortIndex: number,
  maxBreakpoints?: number,
): readonly number[] {
  const triangularBreakpoints = generateTriangularColumns(allBreakpoints, cohortIndex);

  if (maxBreakpoints && triangularBreakpoints.length > maxBreakpoints) {
    return triangularBreakpoints.slice(0, maxBreakpoints);
  }

  return triangularBreakpoints;
}
