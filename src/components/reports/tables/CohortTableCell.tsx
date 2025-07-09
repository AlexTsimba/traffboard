/**
 * CohortTableCell Component
 *
 * Renders individual cells in the cohort table with heatmap visualization.
 * Supports accessibility, tooltips, and interactive features.
 */

import type { JSX } from "react";

import { cn } from "@/lib/utils";
import type { CohortCell, CohortMetric } from "@/types/reports";

export interface CohortTableCellProps {
  readonly cell: CohortCell;
  readonly metric: CohortMetric;
  readonly cohortDate: string;
  readonly breakpoint: number;
  readonly onCellClick?: (cohortDate: string, breakpoint: number, value: number | null) => void;
  readonly className?: string;
  readonly isSelected?: boolean;
  readonly isHighlighted?: boolean;
}

// Get human-readable metric label
function getMetricLabel(metric: CohortMetric): string {
  switch (metric) {
    case "dep2cost": {
      return "Deposit to Cost";
    }
    case "roas": {
      return "Return on Ad Spend";
    }
    case "avg_deposit_sum": {
      return "Average Deposit Sum";
    }
    case "retention_rate": {
      return "Retention Rate";
    }
    default: {
      const _exhaustive: never = metric;
      throw new Error(`Unhandled metric: ${String(_exhaustive)}`);
    }
  }
}

export function CohortTableCell({
  cell,
  metric,
  cohortDate,
  breakpoint,
  onCellClick,
  className,
  isSelected = false,
  isHighlighted = false,
}: CohortTableCellProps): JSX.Element {
  const handleClick = () => {
    if (onCellClick && !cell.isEmpty) {
      onCellClick(cohortDate, breakpoint, cell.value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === "Enter" || event.key === " ") && onCellClick && !cell.isEmpty) {
      event.preventDefault();
      onCellClick(cohortDate, breakpoint, cell.value);
    }
  };

  const getTooltipText = (): string => {
    const formattedDate = new Date(cohortDate).toLocaleDateString();
    const metricLabel = getMetricLabel(metric);

    if (cell.isEmpty) {
      return `Cohort: ${formattedDate}, Day ${breakpoint} - No data available`;
    }

    return `Cohort: ${formattedDate}, Day ${breakpoint} - ${metricLabel}: ${cell.displayValue}`;
  };

  const isInteractive = onCellClick && !cell.isEmpty;

  if (isInteractive) {
    return (
      <button
        type="button"
        tabIndex={0}
        className={cn(
          // Base styles
          "flex h-8 items-center justify-center border-0 bg-transparent text-xs font-medium transition-all",
          // Empty cell styles
          cell.isEmpty && "text-muted-foreground",
          // Interactive styles
          "hover:ring-primary/50 cursor-pointer hover:scale-105 hover:ring-2",
          "focus:ring-primary/50 focus:ring-2 focus:outline-none",
          // Selection styles
          isSelected && "ring-primary ring-2",
          // Highlight styles
          isHighlighted && "ring-accent/50 ring-2",
          // Heatmap styles
          !cell.isEmpty && cell.heatmapClass,
          // Custom className
          className,
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {cell.displayValue}
      </button>
    );
  }

  return (
    <div
      className={cn(
        // Base styles
        "flex h-8 items-center justify-center text-xs font-medium transition-all",
        // Empty cell styles
        cell.isEmpty && "text-muted-foreground",
        // Selection styles
        isSelected && "ring-primary ring-2",
        // Highlight styles
        isHighlighted && "ring-accent/50 ring-2",
        // Heatmap styles
        !cell.isEmpty && cell.heatmapClass,
        // Custom className
        className,
      )}
      title={getTooltipText()}
      aria-label={getTooltipText()}
    >
      {cell.displayValue}
    </div>
  );
}
