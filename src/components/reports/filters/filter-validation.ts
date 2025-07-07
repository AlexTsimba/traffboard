/**
 * Filter Validation Functions
 *
 * Validation utilities for filter values and definitions.
 * Extracted from filter-system.tsx for better maintainability.
 */

import type { FilterDefinition, FilterValue } from "@/types/reports";

// =============================================================================
// VALIDATION HELPER FUNCTIONS
// =============================================================================

function validateCustomRule(
  value: FilterValue,
  validation: NonNullable<FilterDefinition["validation"]>,
): string | null {
  if (validation.custom) {
    const customError = validation.custom(value);
    if (customError) {
      return customError;
    }
  }
  return null;
}

function validateTextPattern(
  value: FilterValue,
  validation: NonNullable<FilterDefinition["validation"]>,
  label: string,
): string | null {
  if (validation.pattern && typeof value === "string") {
    try {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return `${label} format is invalid`;
      }
    } catch {
      // Invalid regex pattern, treat as validation failure
      return `${label} format validation error`;
    }
  }
  return null;
}

function validateNumberRange(
  value: FilterValue,
  validation: NonNullable<FilterDefinition["validation"]>,
  label: string,
): string | null {
  if (typeof value === "number") {
    if (validation.min !== undefined && value < validation.min) {
      return `${label} must be at least ${validation.min}`;
    }
    if (validation.max !== undefined && value > validation.max) {
      return `${label} must be at most ${validation.max}`;
    }
  }
  return null;
}

// =============================================================================
// MAIN VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate filter value against definition
 */
export function validateFilterValue(
  value: FilterValue,
  definition: FilterDefinition,
): { valid: boolean; error?: string } {
  if (definition.required && (value == null || (typeof value === "string" && value === ""))) {
    return { valid: false, error: `${definition.label} is required` };
  }

  // Empty values are valid for non-required fields
  if (value == null) {
    return { valid: true };
  }

  if (definition.validation) {
    const { validation } = definition;

    // Check custom validation
    const customError = validateCustomRule(value, validation);
    if (customError) {
      return { valid: false, error: customError };
    }

    // Check pattern validation for text
    const patternError = validateTextPattern(value, validation, definition.label);
    if (patternError) {
      return { valid: false, error: patternError };
    }

    // Check number range validation
    const numberRangeError = validateNumberRange(value, validation, definition.label);
    if (numberRangeError) {
      return { valid: false, error: numberRangeError };
    }
  }

  return { valid: true };
}

/**
 * Validate multiple filters against their definitions
 */
export function validateFilters(
  filters: Record<string, FilterValue>,
  definitions: FilterDefinition[],
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  let hasErrors = false;

  for (const definition of definitions) {
    const value = filters[definition.id];
    const result = validateFilterValue(value, definition);

    if (!result.valid && result.error) {
      errors[definition.id] = result.error;
      hasErrors = true;
    }
  }

  return {
    valid: !hasErrors,
    errors,
  };
}
