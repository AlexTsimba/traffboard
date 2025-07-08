"use client";

import React, { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { CohortData, CohortCell, CohortMetric, ChartConfig } from "@/types/reports";

export interface CohortHeatmapChartProps {
  /** Cohort data array containing cohort dates and breakpoint values */
  data: CohortData[];
  /** Current metric being displayed */
  metric: CohortMetric;
  /** Breakpoints to display (e.g., [1, 3, 7, 14, 30]) */
  breakpoints: number[];
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Custom className for styling */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
  /** Callback when cell is clicked */
  onCellClick?: (cohortDate: string, breakpoint: number, value: number | null) => void;
}

/**
 * Generates heatmap intensity class based on value and metric type
 */
function getHeatmapIntensity(value: number | null, maxValue: number, metric: CohortMetric): string {
  if (value === null || value === 0) return "bg-gray-50 dark:bg-gray-800";

  const intensity = Math.min(value / maxValue, 1);

  // Different color schemes for different metrics
  const colorSchemes = {
    retention_rate: "bg-green", // Green for retention
    roas: "bg-blue", // Blue for ROAS
    dep2cost: "bg-purple", // Purple for deposit cost
    avg_deposit_sum: "bg-orange", // Orange for deposit sum
  };

  const baseColor = colorSchemes[metric];

  if (intensity >= 0.8) return `${baseColor}-500 text-white`;
  if (intensity >= 0.6) return `${baseColor}-400 text-white`;
  if (intensity >= 0.4) return `${baseColor}-300 text-gray-900`;
  if (intensity >= 0.2) return `${baseColor}-200 text-gray-900`;
  return `${baseColor}-100 text-gray-900`;
}

/**
 * Formats value for display based on metric type
 */
function formatValue(value: number | null, metric: CohortMetric): string {
  if (value === null) return "-";

  switch (metric) {
    case "retention_rate": {
      return `${(value * 100).toFixed(1)}%`;
    }
    case "roas": {
      return `${value.toFixed(2)}x`;
    }
    case "dep2cost": {
      return `$${value.toFixed(2)}`;
    }
    case "avg_deposit_sum": {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
    default: {
      return value.toString();
    }
  }
}

/**
 * Cohort Heatmap Chart Component
 *
 * Displays cohort analysis data in a triangular heatmap layout.
 * Each cell represents a cohort-breakpoint intersection with color-coded intensity.
 */
export function CohortHeatmapChart({
  data,
  metric,
  breakpoints,
  title = "Cohort Analysis Heatmap",
  description,
  className,
  isLoading = false,
  error,
  onCellClick,
}: CohortHeatmapChartProps) {
  // Calculate chart configuration for tooltip
  const chartConfig = useMemo(
    (): ChartConfig => ({
      value: {
        label: metric.toUpperCase(),
        color: "hsl(var(--chart-1))",
      },
    }),
    [metric],
  );

  // Process data for heatmap display
  const processedData = useMemo(() => {
    if (!data.length) return [];

    // Find max value for intensity calculation
    const allValues = data.flatMap((cohort) =>
      Object.values(cohort.breakpointValues).filter((val): val is number => val !== null),
    );
    const maxValue = Math.max(...allValues, 1);

    return data.map((cohort) => ({
      ...cohort,
      cells: breakpoints.map((breakpoint) => {
        const value = cohort.breakpointValues[breakpoint] ?? null;
        return {
          value,
          displayValue: formatValue(value, metric),
          heatmapClass: getHeatmapIntensity(value, maxValue, metric),
          isEmpty: value === null,
          breakpoint,
        } as CohortCell & { breakpoint: number };
      }),
    }));
  }, [data, breakpoints, metric]);

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-destructive text-sm">Error loading chart: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex h-32 items-center justify-center">
          <div className="flex items-center space-x-2" role="status" aria-label="Loading chart">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-r-transparent" />
            <p className="text-muted-foreground text-sm">Loading chart...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-auto min-h-[400px]">
          <div className="w-full overflow-x-auto">
            {/* Table Header */}
            <div className="text-muted-foreground mb-4 grid grid-cols-[200px_100px_1fr] gap-2 text-xs font-medium">
              <div>Cohort Date</div>
              <div className="text-center">FTD Count</div>
              <div className="grid auto-cols-fr grid-flow-col gap-1 text-center">
                {breakpoints.map((breakpoint) => (
                  <div key={breakpoint}>Day {breakpoint}</div>
                ))}
              </div>
            </div>

            {/* Heatmap Table */}
            <div className="space-y-1">
              {processedData.map((cohort, cohortIndex) => (
                <div key={cohort.cohortDate} className="grid grid-cols-[200px_100px_1fr] gap-2">
                  {/* Cohort Date */}
                  <div className="flex items-center text-sm font-medium">
                    {new Date(cohort.cohortDate).toLocaleDateString()}
                  </div>

                  {/* FTD Count */}
                  <div className="flex items-center justify-center text-sm">{cohort.ftdCount.toLocaleString()}</div>

                  {/* Heatmap Cells */}
                  <div className="grid auto-cols-fr grid-flow-col gap-1">
                    {cohort.cells.map((cell, cellIndex) => {
                      // Only show cells up to the current cohort's age (triangular layout)
                      const maxCellsForCohort = Math.min(breakpoints.length, breakpoints.length - cohortIndex);

                      if (cellIndex >= maxCellsForCohort) {
                        return <div key={cell.breakpoint} className="h-8 bg-gray-50 dark:bg-gray-800" />;
                      }

                      return (
                        <ChartTooltip key={cell.breakpoint}>
                          <div
                            className={cn(
                              "hover:ring-primary/50 flex h-8 cursor-pointer items-center justify-center rounded-sm text-xs font-medium transition-all hover:scale-105 hover:ring-2",
                              cell.heatmapClass,
                            )}
                            onClick={() => onCellClick?.(cohort.cohortDate, cell.breakpoint, cell.value)}
                          >
                            {cell.displayValue}
                          </div>
                          <ChartTooltipContent
                            formatter={(value) => [
                              formatValue(Number(value), metric),
                              metric.replace("_", " ").toUpperCase(),
                            ]}
                            label={`Cohort: ${new Date(cohort.cohortDate).toLocaleDateString()}, Day ${cell.breakpoint}`}
                          />
                        </ChartTooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="text-muted-foreground mt-6 flex items-center justify-center space-x-4 text-xs">
              <div>Intensity:</div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded bg-gray-200 dark:bg-gray-700" />
                <span>Low</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded bg-blue-300" />
                <span>Medium</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded bg-blue-500" />
                <span>High</span>
              </div>
            </div>
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
