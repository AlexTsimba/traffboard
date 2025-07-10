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

/**
 * Format date to user-friendly format like "June 2025" or "Jun 15, 2025"
 */
function formatUserFriendlyDate(date: Date): string {
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  
  // If same year, show "Month Day" format, otherwise "Month Year"
  if (sameYear) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }
}

/**
 * Format date to simple DD-MM-YYYY format (kept for backward compatibility)
 */
function formatSimpleDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatDateValue(value: FilterValue): string {
  if (value instanceof Date) {
    return formatUserFriendlyDate(value);
  }
  return formatGenericValue(value);
}

function formatDateRangeValue(value: FilterValue): string {
  if (typeof value === "object" && value !== null && "start" in value && "end" in value) {
    const dateRange = value as { start: Date | string; end: Date | string };
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // Smart date range formatting
    const startFormatted = formatUserFriendlyDate(startDate);
    const endFormatted = formatUserFriendlyDate(endDate);
    
    // If same month and year, show "June 1-30, 2025"
    if (startDate.getFullYear() === endDate.getFullYear() && 
        startDate.getMonth() === endDate.getMonth()) {
      const monthYear = startDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      return `${monthYear} (${startDate.getDate()}-${endDate.getDate()})`;
    }
    
    // If same year, show "Jan 15 - Mar 20, 2025"
    if (startDate.getFullYear() === endDate.getFullYear()) {
      const year = startDate.getFullYear();
      const startMonth = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endMonth = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startMonth} - ${endMonth}, ${year}`;
    }
    
    // Different years, show full format
    return `${startFormatted} - ${endFormatted}`;
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
    case "number":
    case "radio":
    case "checkbox": {
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
