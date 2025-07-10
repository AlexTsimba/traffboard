/**
 * Enhanced Filter Modal with General and Report-Specific tabs
 */

"use client";

import { Filter } from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EnhancedFilterModalProps, FilterDefinition, FilterValue } from "@/types/reports";

// Import existing filter components
import { FilterInput } from "./filter-inputs";

export function EnhancedFilterModal({
  isOpen,
  onClose,
  onSubmit,
  onClear,
  generalFilters,
  specificFilters,
  currentGeneralFilters,
  currentSpecificFilters = {},
  title = "Filter Report",
}: Readonly<EnhancedFilterModalProps>) {
  const [localGeneralFilters, setLocalGeneralFilters] = useState<Record<string, FilterValue>>(currentGeneralFilters);
  const [localSpecificFilters, setLocalSpecificFilters] = useState<Record<string, FilterValue>>(currentSpecificFilters);
  const [activeTab, setActiveTab] = useState<"general" | "specific">("general");

  const handleGeneralFilterChange = useCallback((filterId: string, value: FilterValue) => {
    setLocalGeneralFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }));
  }, []);

  const handleSpecificFilterChange = useCallback((filterId: string, value: FilterValue) => {
    setLocalSpecificFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(localGeneralFilters, localSpecificFilters);
  }, [localGeneralFilters, localSpecificFilters, onSubmit]);

  const handleClear = useCallback(() => {
    setLocalGeneralFilters({});
    setLocalSpecificFilters({});
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

  // Reset local filters when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalGeneralFilters(currentGeneralFilters);
      setLocalSpecificFilters(currentSpecificFilters);
    }
  }, [isOpen, currentGeneralFilters, currentSpecificFilters]);

  // Group general filters by their group property
  const groupedGeneralFilters = useMemo(() => {
    const groups = new Map<string, FilterDefinition[]>();

    for (const filter of generalFilters) {
      const group = filter.group ?? "general";
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      const groupFilters = groups.get(group);
      if (groupFilters) {
        groupFilters.push(filter);
      }
    }

    return groups;
  }, [generalFilters]);

  // Check if we have specific filters
  const hasSpecificFilters = specificFilters && specificFilters.filters.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as "general" | "specific");
        }}
      >
        <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {title}
            </DialogTitle>
          </DialogHeader>

          {/* Content Area without Tabs UI */}
          <div className="mt-4 flex-1 overflow-y-auto">
            {activeTab === "general" ? (
              <div className="space-y-6">
                {[...groupedGeneralFilters.entries()].map(([groupName, groupFilters]) => (
                  <div key={groupName} className="space-y-3">
                    <h4 className="text-muted-foreground text-sm font-medium capitalize">
                      {groupName.replaceAll(/[_-]/g, " ")}
                    </h4>
                    <div
                      className={`gap-3 ${groupName === "d-location" ? "grid grid-cols-1 md:grid-cols-2" : "space-y-3"}`}
                    >
                      {groupFilters.map((filter) => (
                        <FilterInput
                          key={filter.id}
                          filter={filter}
                          value={localGeneralFilters[filter.id] ?? filter.defaultValue ?? null}
                          onChange={(value) => {
                            handleGeneralFilterChange(filter.id, value);
                          }}
                        />
                      ))}
                    </div>
                    {groupName !== [...groupedGeneralFilters.keys()].pop() && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            ) : hasSpecificFilters ? (
              <div className="space-y-6">
                <div className="text-muted-foreground text-sm">
                  Configure {specificFilters.reportType.toLowerCase()}-specific parameters
                </div>

                <div className="space-y-3">
                  {specificFilters.filters.map((filter) => (
                    <FilterInput
                      key={filter.id}
                      filter={filter}
                      value={localSpecificFilters[filter.id]}
                      onChange={(value) => {
                        handleSpecificFilterChange(filter.id, value);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Dialog Footer with Tabs and Buttons */}
          <DialogFooter className="flex-col gap-2 space-y-4 sm:gap-0">
            {/* Tabs Row */}
            <div className="flex w-full items-center justify-between">
              <TabsList className="grid w-auto grid-cols-2">
                <TabsTrigger value="general">General Filters</TabsTrigger>
                <TabsTrigger value="specific" disabled={!hasSpecificFilters}>
                  {specificFilters?.reportType || "Report"} Specific
                </TabsTrigger>
              </TabsList>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClear}>
                  Clear All
                </Button>
                <Button onClick={handleSubmit}>Apply Filters</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Tabs>
    </Dialog>
  );
}
