/**
 * Filter Formatting Functions
 *
 * Utilities for formatting filter values for display.
 * Extracted from filter-system.tsx for better maintainability.
 */

import type { FilterDefinition, FilterValue, FilterType, AppliedFilter } from "@/types/reports";

// =============================================================================
// FORMATTING HELPER FUNCTIONS
// =============================================================================

function formatDateValue(value: FilterValue): string {
  if (value instanceof Date) {
    return value.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return formatGenericValue(value);
}

function formatDateRangeValue(value: FilterValue): string {
  if (typeof value === "object" && value !== null && "start" in value && "end" in value) {
    const dateRange = value as { start: Date | string; end: Date | string };
    const formatOptions = { day: "numeric", month: "long" } as const;
    const startDate = new Date(dateRange.start).toLocaleDateString("en-US", formatOptions);
    const endDate = new Date(dateRange.end).toLocaleDateString("en-US", formatOptions);
    return `${startDate} - ${endDate}`;
  }
  return formatGenericValue(value);
}

function formatNumberRangeValue(value: FilterValue): string {
  if (typeof value === "object" && value !== null && "min" in value && "max" in value) {
    const numberRange = value as { min: number; max: number };
    return `${numberRange.min} - ${numberRange.max}`;
  }
  return formatGenericValue(value);
}

function formatMultiselectValue(value: FilterValue): string {
  if (Array.isArray(value)) {
    return value.length > 3 ? `${value.slice(0, 3).join(", ")} +${value.length - 3}` : value.join(", ");
  }
  return formatGenericValue(value);
}

function formatBooleanValue(value: FilterValue): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return formatGenericValue(value);
}

function formatGenericValue(value: FilterValue): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value.toString();
  }

  if (typeof value === "object") {
    // Safe object stringification for complex objects
    try {
      return JSON.stringify(value);
    } catch {
      return "[object Object]";
    }
  }

  return "[unknown]";
}

// =============================================================================
// MAIN FORMATTING FUNCTION
// =============================================================================

/**
 * Format filter value for display in chips
 */
export function formatFilterValue(value: FilterValue, type: FilterType): string {
  if (value == null) {
    return "";
  }

  switch (type) {
    case "date": {
      return formatDateValue(value);
    }
    case "daterange": {
      return formatDateRangeValue(value);
    }
    case "numberrange": {
      return formatNumberRangeValue(value);
    }
    case "multiselect":
    case "autocomplete": {
      return formatMultiselectValue(value);
    }
    case "boolean": {
      return formatBooleanValue(value);
    }
    case "text":
    case "select":
    case "number": {
      return formatGenericValue(value);
    }
    default: {
      return formatGenericValue(value);
    }
  }
}

/**
 * Create an applied filter from definition and value
 */
export function createAppliedFilter(definition: FilterDefinition, value: FilterValue): AppliedFilter {
  return {
    id: definition.id,
    definition,
    value,
    displayText: formatFilterValue(value, definition.type),
  };
}
