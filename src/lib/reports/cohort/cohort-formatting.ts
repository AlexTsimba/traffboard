/**
 * Cohort Data Formatting
 *
 * Utilities for formatting cohort analysis results for UI consumption.
 * Handles triangular table structure, heatmap classes, and display formatting.
 */

import type { CohortData, CohortCell, CohortMetric } from "@/types/reports";

import { getMetricUnit } from "./cohort-metrics";

// =============================================================================
// HEATMAP COLOR CONFIGURATION
// =============================================================================

interface HeatmapRange {
  min: number;
  max: number;
  className: string;
}

/**
 * Heatmap color ranges based on demo requirements
 */
const HEATMAP_RANGES: HeatmapRange[] = [
  { min: 200, max: Infinity, className: "growth-200-up" },
  { min: 150, max: 199.99, className: "growth-150-199" },
  { min: 120, max: 149.99, className: "growth-120-149" },
  { min: 110, max: 119.99, className: "growth-110-119" },
  { min: 105, max: 109.99, className: "growth-105-109" },
  { min: 100, max: 104.99, className: "growth-100-104" },
  { min: 95, max: 99.99, className: "growth-95-99" },
  { min: 90, max: 94.99, className: "growth-90-94" },
  { min: 80, max: 89.99, className: "growth-80-89" },
  { min: 70, max: 79.99, className: "growth-70-79" },
  { min: 60, max: 69.99, className: "growth-60-69" },
  { min: 50, max: 59.99, className: "growth-50-59" },
  { min: 0, max: 49.99, className: "growth-below-50" },
];

// =============================================================================
// FORMATTING FUNCTIONS
// =============================================================================

/**
 * Format cohort results for UI consumption
 */
export function formatCohortResults(
  processedData: CohortData[],
  metric: CohortMetric,
  _breakpoints: number[],
): CohortData[] {
  return processedData.map((cohort) => ({
    ...cohort,
    cohortDate: formatCohortDate(cohort.cohortDate),
    ftdCount: Math.round(cohort.ftdCount),
    breakpointValues: formatBreakpointValues(cohort.breakpointValues, metric),
    weightedAverage: cohort.weightedAverage ? formatMetricValue(cohort.weightedAverage, metric) : undefined,
  }));
}

/**
 * Format cohort date for display
 */
export function formatCohortDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  } catch {
    return dateString;
  }
}

/**
 * Format breakpoint values with proper metric formatting
 */
export function formatBreakpointValues(
  values: Record<number, number | null>,
  metric: CohortMetric,
): Record<number, number | null> {
  const formatted: Record<number, number | null> = {};

  for (const [breakpoint, value] of Object.entries(values)) {
    const bp = Number(breakpoint);
    // eslint-disable-next-line security/detect-object-injection
    formatted[bp] = value === null ? null : formatMetricValue(value, metric);
  }

  return formatted;
}

/**
 * Format metric value based on type
 */
export function formatMetricValue(value: number, metric: CohortMetric): number {
  switch (metric) {
    case "dep2cost":
    case "roas":
    case "retention_rate": {
      return Math.round(value * 10) / 10;
    } // 1 decimal place
    case "avg_deposit_sum": {
      return Math.round(value * 100) / 100;
    } // 2 decimal places
    default: {
      return Math.round(value * 10) / 10;
    }
  }
}

/**
 * Create cohort cell data for heatmap visualization
 */
export function createCohortCell(value: number | null, metric: CohortMetric, isEmpty = false): CohortCell {
  if (isEmpty || value === null) {
    return {
      value: null,
      displayValue: "—",
      heatmapClass: "empty-cell",
      isEmpty: true,
    };
  }

  const formattedValue = formatMetricValue(value, metric);
  const unit = getMetricUnit(metric);
  const displayValue = `${formattedValue}${unit}`;
  const heatmapClass = getHeatmapClass(value, metric);

  return {
    value: formattedValue,
    displayValue,
    heatmapClass,
    isEmpty: false,
  };
}

/**
 * Get heatmap CSS class based on value and metric
 */
export function getHeatmapClass(value: number, metric: CohortMetric): string {
  // For percentage metrics, use the value as-is
  // For dollar metrics, use a different scale
  let normalizedValue = value;

  if (metric === "avg_deposit_sum") {
    // For deposit sums, create a percentage-like scale
    // Adjust these thresholds based on your business needs
    if (value >= 500) normalizedValue = 200;
    else if (value >= 300) normalizedValue = 150;
    else if (value >= 200) normalizedValue = 120;
    else if (value >= 150) normalizedValue = 110;
    else if (value >= 100) normalizedValue = 105;
    else if (value >= 75) normalizedValue = 100;
    else if (value >= 50) normalizedValue = 95;
    else if (value >= 25) normalizedValue = 90;
    else normalizedValue = 80;
  }

  for (const range of HEATMAP_RANGES) {
    if (normalizedValue >= range.min && normalizedValue <= range.max) {
      return range.className;
    }
  }

  return "growth-below-50"; // Default fallback
}

/**
 * Calculate weighted average for cohort row
 */
export function calculateWeightedAverage(
  breakpointValues: Record<number, number | null>,
  cohortSizes?: Record<number, number>,
): number | null {
  const validEntries = Object.entries(breakpointValues)
    .filter(([, value]) => value !== null)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .map(([bp, value]) => ({ breakpoint: Number(bp), value: value! }));

  if (validEntries.length === 0) return null;

  if (cohortSizes) {
    // Weighted by cohort sizes
    const totalWeight = validEntries.reduce((sum, entry) => {
      return sum + (cohortSizes[entry.breakpoint] ?? 1);
    }, 0);

    if (totalWeight === 0) return null;

    const weightedSum = validEntries.reduce((sum, entry) => {
      const weight = cohortSizes[entry.breakpoint] ?? 1;
      return sum + entry.value * weight;
    }, 0);

    return weightedSum / totalWeight;
  } else {
    // Simple average
    const sum = validEntries.reduce((acc, entry) => acc + entry.value, 0);
    return sum / validEntries.length;
  }
}

// =============================================================================
// TABLE STRUCTURE UTILITIES
// =============================================================================

/**
 * Create triangular table structure
 * Newer cohorts have fewer columns (empty cells show '—')
 */
export function createTriangularStructure(
  cohorts: CohortData[],
  breakpoints: number[],
  metric: CohortMetric,
): {
  cohortDate: string;
  ftdCount: number;
  cells: CohortCell[];
}[] {
  // Sort cohorts by date (newest first for triangular structure)
  const sortedCohorts = [...cohorts].sort(
    (a, b) => new Date(b.cohortDate).getTime() - new Date(a.cohortDate).getTime(),
  );

  return sortedCohorts.map((cohort, cohortIndex) => {
    const cells: CohortCell[] = [];

    for (let bpIndex = 0; bpIndex < breakpoints.length; bpIndex++) {
      // eslint-disable-next-line security/detect-object-injection
      const breakpoint = breakpoints[bpIndex];

      // Triangular logic: newer cohorts (higher index) have fewer filled cells
      const isEmpty = cohortIndex > 0 && bpIndex >= breakpoints.length - cohortIndex;
      // eslint-disable-next-line security/detect-object-injection
      const value = isEmpty ? null : (cohort.breakpointValues[breakpoint] ?? null);

      cells.push(createCohortCell(value, metric, isEmpty));
    }

    return {
      cohortDate: cohort.cohortDate,
      ftdCount: cohort.ftdCount,
      cells,
    };
  });
}

/**
 * Create weighted average row for the table
 */
export function createWeightedAverageRow(
  cohorts: CohortData[],
  breakpoints: number[],
  metric: CohortMetric,
): { cells: CohortCell[]; label: string } {
  const cells: CohortCell[] = [];

  for (const breakpoint of breakpoints) {
    // eslint-disable-next-line security/detect-object-injection
    const values = cohorts.map((c) => c.breakpointValues[breakpoint]).filter((v): v is number => v !== null);

    if (values.length === 0) {
      cells.push(createCohortCell(null, metric, true));
    } else {
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      cells.push(createCohortCell(average, metric, false));
    }
  }

  return {
    cells,
    label: `WEIGHTED AVG. ${metric.toUpperCase().replace("_", " ")}`,
  };
}

// =============================================================================
// EXPORT FORMATTING
// =============================================================================

/**
 * Format cohort data for CSV export
 */
export function formatForCSVExport(cohorts: CohortData[], breakpoints: number[], _metric: CohortMetric): string {
  const headers = ["Cohort Date", "FTD Count", ...breakpoints.map((bp) => `Day ${bp}`)];
  const rows = cohorts.map((cohort) => [
    cohort.cohortDate,
    cohort.ftdCount.toString(),
    ...breakpoints.map((bp) => {
      // eslint-disable-next-line security/detect-object-injection
      const value = cohort.breakpointValues[bp];
      return value === null ? "" : value.toString();
    }),
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

/**
 * Format cohort data for Excel export
 */
export function formatForExcelExport(
  cohorts: CohortData[],
  breakpoints: number[],
  _metric: CohortMetric,
): Record<string, unknown>[] {
  return cohorts.map((cohort) => {
    const row: Record<string, unknown> = {
      "Cohort Date": cohort.cohortDate,
      "FTD Count": cohort.ftdCount,
    };

    for (const bp of breakpoints) {
      // eslint-disable-next-line security/detect-object-injection
      row[`Day ${bp}`] = cohort.breakpointValues[bp];
    }

    return row;
  });
}
