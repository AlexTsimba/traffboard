/**
 * Enhanced Filter-to-SQL Conversion for UI Filter System
 *
 * Converts AppliedFilter[] from the UI to SQL WHERE conditions
 * that work with the cohort analysis backend.
 */

import type { AppliedFilter, FilterValue, DateRange } from "@/types/reports";

// =============================================================================
// FILTER CONVERSION UTILITIES
// =============================================================================

/**
 * Convert a single UI filter to SQL condition
 */
export function buildUIFilterCondition(filter: AppliedFilter): string | null {
  const { id, value } = filter;

  // Handle empty or invalid values
  if (!value || value === "" || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  switch (id) {
    // Date range filter (special handling)
    case "dateRange": {
      // Date range is handled in the main query parameters, not WHERE clause
      return null;
    }

    // Partners filter (autocomplete, single or multiple values)
    case "partners": {
      return buildArrayFilterCondition(value, 'pd."partnerId"');
    }

    // Campaigns filter (autocomplete, single or multiple values)
    case "campaigns": {
      return buildArrayFilterCondition(value, 'pd."campaignId"');
    }

    // Countries filter (autocomplete, single or multiple values)
    case "countries": {
      return buildArrayFilterCondition(value, 'pd."playerCountry"');
    }

    // OS filter (autocomplete, single or multiple values)
    case "os": {
      return buildArrayFilterCondition(value, 'pd."tagOs"');
    }

    // Legacy filter support (for backward compatibility)
    case "partner": {
      return buildSimpleStringFilter(value, 'pd."partnerId"');
    }

    case "source": {
      return buildSimpleStringFilter(value, 'pd."tagSource"');
    }

    case "country": {
      return buildSimpleStringFilter(value, 'pd."playerCountry"');
    }

    case "minDeposit": {
      return buildMinDepositFilter(value);
    }

    default: {
      console.warn(`Unknown filter ID: ${id}`);
      return null;
    }
  }
}

/**
 * Build SQL condition for array-based filters (partners, campaigns, etc.)
 */
function buildArrayFilterCondition(value: FilterValue, columnName: string): string | null {
  // Handle single string value
  if (typeof value === "string") {
    return `${columnName} = '${sanitizeSQL(value)}'`;
  }

  // Handle array of values
  if (Array.isArray(value) && value.length > 0) {
    const sanitizedValues = value
      .filter((v) => v && typeof v === "string")
      .map((v) => `'${sanitizeSQL(String(v))}'`)
      .join(", ");

    if (sanitizedValues) {
      return `${columnName} IN (${sanitizedValues})`;
    }
  }

  // Handle object with selected values (from autocomplete)
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const objValue = value as unknown as Record<string, unknown>;
    if (objValue.value && typeof objValue.value === "string") {
      return `${columnName} = '${sanitizeSQL(objValue.value)}'`;
    }
  }

  return null;
}

/**
 * Build SQL condition for simple string filters
 */
function buildSimpleStringFilter(value: FilterValue, columnName: string): string | null {
  if (typeof value === "string" && value.trim()) {
    return `${columnName} = '${sanitizeSQL(value)}'`;
  }
  return null;
}

/**
 * Build SQL condition for minimum deposit filter
 */
function buildMinDepositFilter(value: FilterValue): string | null {
  if (typeof value === "number" && value > 0) {
    return `pd."playerId" IN (
      SELECT DISTINCT "playerId" 
      FROM "PlayerData" 
      WHERE "depositsSum" >= ${value}
    )`;
  }
  return null;
}

/**
 * Basic SQL injection protection
 */
function sanitizeSQL(input: string): string {
  return input.replaceAll("'", "''").replaceAll(";", "");
}

// =============================================================================
// MAIN CONVERSION FUNCTION
// =============================================================================

/**
 * Convert UI filters to SQL WHERE conditions
 */
export function convertUIFiltersToSQL(filters: AppliedFilter[]): {
  conditions: string[];
  dateRange?: { start: Date; end: Date };
} {
  const conditions: string[] = [];
  let dateRange: { start: Date; end: Date } | undefined;

  for (const filter of filters) {
    // Handle date range separately
    if (filter.id === "dateRange" && filter.value) {
      const rangeValue = filter.value as DateRange;
      if (rangeValue.start && rangeValue.end) {
        dateRange = {
          start: new Date(rangeValue.start),
          end: new Date(rangeValue.end),
        };
      }
      continue;
    }

    // Convert other filters to SQL conditions
    const condition = buildUIFilterCondition(filter);
    if (condition) {
      conditions.push(condition);
    }
  }

  return { conditions, dateRange };
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate that filters are properly formatted
 */
export function validateUIFilters(filters: AppliedFilter[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const filter of filters) {
    if (!filter.id) {
      errors.push("Filter missing ID");
      continue;
    }

    if (filter.value === null || filter.value === undefined) {
      errors.push(`Filter ${filter.id} has null/undefined value`);
      continue;
    }

    // Validate specific filter types
    if (
      ["partners", "campaigns", "countries", "os"].includes(filter.id) &&
      (!filter.value || (Array.isArray(filter.value) && filter.value.length === 0))
    ) {
      errors.push(`Filter ${filter.id} has empty value`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
