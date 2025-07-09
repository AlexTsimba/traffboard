"use client";

import { useMemo } from "react";

import { FilterButton, FilterModal, FilterChips } from "@/components/reports/filters/filter-system";
import { ReportProvider, useFilters } from "@/components/reports/universal/report-context";
import type { FilterDefinition, FilterValue } from "@/types/reports";

// Simple filter definitions for cohort analysis
const createCohortFilterDefinitions = (): FilterDefinition[] => {
  return [
    {
      id: "dateRange",
      label: "Date Range",
      type: "daterange",
      group: "timeframe",
      order: 0,
    },
    {
      id: "partners",
      label: "Partners",
      type: "multiselect",
      group: "segments",
      order: 10,
      options: [
        { label: "Partner A", value: "partner_a" },
        { label: "Partner B", value: "partner_b" },
        { label: "Partner C", value: "partner_c" },
      ],
    },
    {
      id: "campaigns",
      label: "Campaigns",
      type: "multiselect",
      group: "segments",
      order: 11,
      options: [
        { label: "Campaign Alpha", value: "campaign_alpha" },
        { label: "Campaign Beta", value: "campaign_beta" },
        { label: "Campaign Gamma", value: "campaign_gamma" },
      ],
    },
    {
      id: "countries",
      label: "Countries",
      type: "multiselect",
      group: "segments",
      order: 12,
      options: [
        { label: "United States", value: "us" },
        { label: "United Kingdom", value: "uk" },
        { label: "Germany", value: "de" },
        { label: "France", value: "fr" },
      ],
    },
  ];
};

// Component that uses filters
function CohortAnalysisContent() {
  // Universal Filter System integration
  const {
    filterState,
    appliedFilters,
    hasActiveFilters,
    openFilterDialog,
    closeFilterDialog,
    applyFilters,
    clearFilters,
    removeFilter,
  } = useFilters();

  const filterDefinitions = useMemo(() => createCohortFilterDefinitions(), []);

  // Extract applied filter values for processing
  const currentFilters = useMemo(() => {
    const result: Record<string, FilterValue> = {};
    for (const filter of appliedFilters) {
      result[filter.id] = filter.value;
    }
    return result;
  }, [appliedFilters]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header with Filter Button */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Cohorts</h1>
          <p className="text-muted-foreground">Cohort analysis and user retention tracking</p>
        </div>

        {/* Filter Button from Report Factory */}
        <div className="flex items-center gap-3">
          <FilterButton onClick={openFilterDialog} hasActiveFilters={hasActiveFilters} />
        </div>
      </div>

      {/* Applied Filters Display */}
      {hasActiveFilters && (
        <FilterChips
          appliedFilters={appliedFilters}
          onRemoveFilter={removeFilter}
          onClearAll={clearFilters}
          className="pb-2"
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={filterState.isOpen}
        onClose={closeFilterDialog}
        onSubmit={applyFilters}
        onClear={clearFilters}
        filterDefinitions={filterDefinitions}
        currentFilters={currentFilters}
        title="Filter Cohort Analysis"
      />

      {/* Main Content Area */}
      <div className="rounded-lg border">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Cohort Analysis</h3>
          <div className="text-muted-foreground py-12 text-center">
            <p className="text-lg">Cohort analysis functionality coming soon</p>
            <p className="text-sm">Advanced cohort tracking and visualization will be available here</p>
          </div>
        </div>
      </div>

      {/* Debug section to show active filters */}
      {hasActiveFilters && (
        <div className="rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-medium">Active Filters (Debug)</h4>
          <pre className="text-muted-foreground text-xs">{JSON.stringify(currentFilters, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default function CohortsPage() {
  return (
    <ReportProvider>
      <CohortAnalysisContent />
    </ReportProvider>
  );
}
