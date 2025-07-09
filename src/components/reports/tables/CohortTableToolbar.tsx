/**
 * CohortTableToolbar Component
 *
 * Toolbar with bulk operations, advanced controls, and action buttons for cohort table.
 * Provides export, filtering, and selection management functionality.
 */

import { Download, Filter, RefreshCw, Settings } from "lucide-react";
import type { JSX } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CohortMetric } from "@/types/reports";

export interface CohortTableToolbarProps {
  readonly selectedCount: number;
  readonly totalCount: number;
  readonly metric: CohortMetric;
  readonly onExport?: (format: "csv" | "excel" | "pdf") => void;
  readonly onRefresh?: () => void;
  readonly onClearSelection?: () => void;
  readonly onSelectAll?: () => void;
  readonly onOpenFilters?: () => void;
  readonly onOpenSettings?: () => void;
  readonly isLoading?: boolean;
  readonly className?: string;
}

function getMetricDisplayName(currentMetric: CohortMetric): string {
  switch (currentMetric) {
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
      const _exhaustive: never = currentMetric;
      throw new Error(`Unhandled metric: ${String(_exhaustive)}`);
    }
  }
}

export function CohortTableToolbar({
  selectedCount,
  totalCount,
  metric,
  onExport,
  onRefresh,
  onClearSelection,
  onSelectAll,
  onOpenFilters,
  onOpenSettings,
  isLoading = false,
  className,
}: CohortTableToolbarProps): JSX.Element {
  const hasSelection = selectedCount > 0;
  const hasSelectAll = onSelectAll && selectedCount < totalCount;

  return (
    <div className={`flex items-center justify-between gap-4 p-4 ${className ?? ""}`}>
      {/* Left side - Selection info and bulk actions */}
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground text-sm">
          {hasSelection ? (
            <span>
              {selectedCount} of {totalCount} cohorts selected
            </span>
          ) : (
            <span>
              {totalCount} cohorts • {getMetricDisplayName(metric)}
            </span>
          )}
        </div>

        {hasSelection && (
          <div className="flex items-center gap-2">
            {hasSelectAll && (
              <Button variant="outline" size="sm" onClick={onSelectAll}>
                Select All ({totalCount})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2">
        {/* Export dropdown */}
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading || totalCount === 0} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  onExport("csv");
                }}
              >
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onExport("excel");
                }}
              >
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onExport("pdf");
                }}
              >
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Filter button */}
        {onOpenFilters && (
          <Button variant="outline" size="sm" onClick={onOpenFilters} className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        )}

        {/* Settings button */}
        {onOpenSettings && (
          <Button variant="outline" size="sm" onClick={onOpenSettings} className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
}
