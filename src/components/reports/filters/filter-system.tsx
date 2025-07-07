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
}: FilterModalProps) {
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

export function FilterChips({ appliedFilters, onRemoveFilter, onClearAll, className }: FilterChipsProps) {
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
