/**
 * Universal Filter System Components
 *
 * Main filter system with modal dialog, filter button, and active filter chips.
 * Uses extracted modules for better maintainability.
 */

"use client";

import { Filter, X } from "lucide-react";
import React, { useState, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { FilterModalProps, FilterChipsProps, FilterDefinition, FilterValue } from "@/types/reports";

// Import extracted components and utilities
import { FilterInput } from "./filter-inputs";

// =============================================================================
// DATE PRESET UTILITIES
// =============================================================================

function getThisWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  return { start: monday, end: today }; // Заканчивается сегодня
}

function getThisMonth() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { start, end: today }; // Заканчивается сегодня
}

function getLastWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - dayOfWeek - 6 + (dayOfWeek === 0 ? -6 : 1));
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  return { start: lastMonday, end: lastSunday }; // Полная прошлая неделя
}

function getLastMonth() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 0);
  return { start, end }; // Полный прошлый месяц
}

// =============================================================================
// FILTER BUTTON COMPONENT
// =============================================================================

interface FilterButtonProps {
  readonly onClick: () => void;
  readonly hasActiveFilters?: boolean;
  readonly className?: string;
}

export function FilterButton({ onClick, hasActiveFilters, className }: FilterButtonProps) {
  return (
    <Button
      variant={hasActiveFilters ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={className}
      aria-label="Open filters"
    >
      <Filter className="h-4 w-4" />
    </Button>
  );
}

// =============================================================================
// FILTER MODAL DIALOG
// =============================================================================

export function FilterModal({
  isOpen,
  onClose,
  onSubmit,
  onClear,
  filterDefinitions,
  currentFilters,
  title = "Filter Report",
}: Readonly<FilterModalProps>) {
  const [localFilters, setLocalFilters] = useState<Record<string, FilterValue>>(currentFilters);

  const handleFilterChange = useCallback((filterId: string, value: FilterValue) => {
    setLocalFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(localFilters);
  }, [localFilters, onSubmit]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  // Reset local filters when dialog opens with new current filters
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  // Group filters by their group property
  const groupedFilters = React.useMemo(() => {
    const groups = new Map<string, FilterDefinition[]>();

    for (const filter of filterDefinitions) {
      const group = filter.group ?? "general";
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      const groupFilters = groups.get(group);
      if (groupFilters) {
        groupFilters.push(filter);
      }
    }

    // Sort filters within each group by order
    for (const [groupName, filters] of groups) {
      const sortedFilters = filters.toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0));
      groups.set(groupName, sortedFilters);
    }

    return groups;
  }, [filterDefinitions]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {[...groupedFilters.entries()].map(([groupName, filters]) => (
            <div key={groupName}>
              {groupedFilters.size > 1 && (
                <>
                  <h3 className="text-sm font-medium text-gray-900 capitalize">{groupName}</h3>
                  <Separator className="mb-4" />
                </>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filters.map((filter) => (
                  <FilterInput
                    key={filter.id}
                    filter={filter}
                    value={localFilters[filter.id] ?? filter.defaultValue ?? null}
                    onChange={(value) => {
                      handleFilterChange(filter.id, value);
                    }}
                  />
                ))}
              </div>

              {/* Date Range Presets */}
              {filters.some((filter) => filter.type === "daterange") && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-colors hover:bg-gray-100"
                      onClick={() => {
                        const thisWeek = getThisWeek();
                        const dateRangeFilter = filters.find((f) => f.type === "daterange");
                        if (dateRangeFilter) {
                          handleFilterChange(dateRangeFilter.id, thisWeek);
                        }
                      }}
                    >
                      This Week
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-colors hover:bg-gray-100"
                      onClick={() => {
                        const lastWeek = getLastWeek();
                        const dateRangeFilter = filters.find((f) => f.type === "daterange");
                        if (dateRangeFilter) {
                          handleFilterChange(dateRangeFilter.id, lastWeek);
                        }
                      }}
                    >
                      Last Week
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-colors hover:bg-gray-100"
                      onClick={() => {
                        const thisMonth = getThisMonth();
                        const dateRangeFilter = filters.find((f) => f.type === "daterange");
                        if (dateRangeFilter) {
                          handleFilterChange(dateRangeFilter.id, thisMonth);
                        }
                      }}
                    >
                      This Month
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-colors hover:bg-gray-100"
                      onClick={() => {
                        const lastMonth = getLastMonth();
                        const dateRangeFilter = filters.find((f) => f.type === "daterange");
                        if (dateRangeFilter) {
                          handleFilterChange(dateRangeFilter.id, lastMonth);
                        }
                      }}
                    >
                      Last Month
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClear}>
            CLEAR
          </Button>
          <Button onClick={handleSubmit}>SUBMIT</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// FILTER CHIPS COMPONENT
// =============================================================================

export function FilterChips({ appliedFilters, onRemoveFilter, onClearAll, className }: Readonly<FilterChipsProps>) {
  if (appliedFilters.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {appliedFilters.map((filter) => (
        <Badge key={filter.id} variant="secondary" className="flex items-center gap-2">
          <span className="text-xs">
            {filter.definition.label}: {filter.displayText}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs hover:bg-transparent"
            onClick={() => {
              onRemoveFilter(filter.id);
            }}
            aria-label={`Remove ${filter.definition.label} filter`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {appliedFilters.length > 1 && (
        <Button variant="ghost" size="sm" className="muted-foreground text-xs" onClick={onClearAll}>
          Clear all
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// RE-EXPORT EXTRACTED UTILITIES
// =============================================================================

export { FilterComposer, createFilterComposer, COMMON_FILTERS } from "./filter-composer";
export { formatFilterValue, createAppliedFilter } from "./filter-formatting";
export { validateFilterValue, validateFilters } from "./filter-validation";
