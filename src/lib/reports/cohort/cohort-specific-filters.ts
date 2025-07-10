import type { ReportSpecificFilterConfig, FilterDefinition } from "@/types/reports";

/**
 * Cohort-specific filter definitions
 */
export function createCohortSpecificFilters(): ReportSpecificFilterConfig {
  const cohortFilters: FilterDefinition[] = [
    {
      id: "cohortStep",
      label: "Cohort Step",
      type: "radio",
      group: "cohort-settings",
      options: [
        { value: "day", label: "Daily Cohorts" },
        { value: "week", label: "Weekly Cohorts" },
      ],
      defaultValue: "day",
      validation: {
        required: true,
      },
    },
    {
      id: "metric",
      label: "Primary Metric",
      type: "select",
      group: "cohort-settings",
      options: [
        { value: "retention", label: "Retention Rate" },
        { value: "dep2cost", label: "Deposit to Cost" },
        { value: "roas", label: "Return on Ad Spend" },
        { value: "adpu", label: "Average Deposit Per User" },
      ],
      defaultValue: "retention",
      validation: {
        required: true,
      },
    },
    {
      id: "breakpoints",
      label: "Custom Breakpoints",
      type: "multiselect",
      group: "advanced-settings",
      options: [
        { value: "1", label: "Day 1" },
        { value: "3", label: "Day 3" },
        { value: "5", label: "Day 5" },
        { value: "7", label: "Day 7" },
        { value: "14", label: "Day 14" },
        { value: "17", label: "Day 17" },
        { value: "21", label: "Day 21" },
        { value: "24", label: "Day 24" },
        { value: "27", label: "Day 27" },
        { value: "30", label: "Day 30" },
      ],
      defaultValue: ["1", "7", "14", "30"],
      placeholder: "Select breakpoints to analyze...",
    },
    {
      id: "showMetadata",
      label: "Show Performance Metadata",
      type: "checkbox",
      group: "display-options",
      defaultValue: true,
    },
    {
      id: "exportFormat",
      label: "Default Export Format",
      type: "select",
      group: "display-options",
      options: [
        { value: "csv", label: "CSV" },
        { value: "excel", label: "Excel" },
        { value: "json", label: "JSON" },
      ],
      defaultValue: "csv",
    },
  ];

  return {
    reportType: "Cohort",
    filters: cohortFilters.map((filter) => ({
      ...filter,
      tab: "report-specific" as const,
    })),
  };
}

/**
 * Helper function to get default cohort-specific values
 */
export function getDefaultCohortSpecificValues() {
  return {
    cohortStep: "day",
    metric: "retention",
    breakpoints: ["1", "7", "14", "30"],
    showMetadata: true,
    exportFormat: "csv",
  };
}

/**
 * Validate cohort-specific filter values
 */
export function validateCohortSpecificFilters(values: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (!values.cohortStep) {
    errors.push("Cohort step is required");
  }

  if (!values.metric) {
    errors.push("Primary metric is required");
  }

  if (Array.isArray(values.breakpoints) && values.breakpoints.length === 0) {
    errors.push("At least one breakpoint must be selected");
  }

  return errors;
}
