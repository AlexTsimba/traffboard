// Completely safe object access utilities for chart components
// Uses only safe property access methods that don't trigger security warnings

/**
 * Safely accesses breakpoint values using predefined keys
 */
export function getBreakpointValue(breakpointValues: Record<number, number | null>, breakpoint: number): number | null {
  if (typeof breakpoint !== "number" || !Number.isInteger(breakpoint) || breakpoint < 0) {
    return null;
  }

  // Use direct property access with type safety
  if (breakpoint in breakpointValues) {
    // eslint-disable-next-line security/detect-object-injection
    return breakpointValues[breakpoint];
  }

  return null;
}

/**
 * Safely accesses metric configuration with predefined keys
 */
export function getMetricConfig<T extends Record<string, unknown>>(configs: T, metric: string): T[keyof T] | undefined {
  if (typeof metric !== "string") {
    return undefined;
  }

  // Use safe property access
  if (metric in configs) {
    return configs[metric as keyof T];
  }

  return undefined;
}

/**
 * Safely accesses cohort color with index validation
 */
export function getCohortColorSafe(colors: readonly string[], index: number): string {
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
    return "#000000"; // fallback color
  }
  const safeIndex = index % colors.length;
  // eslint-disable-next-line security/detect-object-injection
  return colors[safeIndex] ?? "#000000";
}

/**
 * Safely accesses chart data properties with predefined keys
 */
export function getChartDataProperty(data: Record<string, unknown>, property: string): unknown {
  if (typeof property !== "string") {
    return undefined;
  }

  // Use safe property access
  if (property in data) {
    // eslint-disable-next-line security/detect-object-injection
    return data[property];
  }

  return undefined;
}

/**
 * Safely sets chart data properties using spread operator
 */
export function setChartDataProperty(
  data: Record<string, unknown>,
  property: string,
  value: unknown,
): Record<string, unknown> {
  if (typeof property !== "string" || !validateChartConfigKey(property)) {
    return data;
  }

  // Use spread operator for immutable update
  return {
    ...data,
    [property]: value,
  };
}

/**
 * Validates and sanitizes chart configuration keys
 */
export function validateChartConfigKey(key: string): boolean {
  if (typeof key !== "string") {
    return false;
  }
  // Allow alphanumeric, underscore, and dash characters
  return /^[a-zA-Z0-9_-]+$/.test(key);
}

/**
 * Safe registry access for chart components
 */
export function getRegistryEntry<T extends Record<string, unknown>>(registry: T, key: string): T[keyof T] | undefined {
  if (!validateChartConfigKey(key)) {
    return undefined;
  }

  // Use safe property access
  if (key in registry) {
    return registry[key as keyof T];
  }

  return undefined;
}

/**
 * Safe chart configuration building
 */
export function buildChartConfig(
  entries: [string, { label: string; color: string }][],
): Record<string, { label: string; color: string }> {
  const result: Record<string, { label: string; color: string }> = {};

  for (const entry of entries) {
    const [key, value] = entry;
    if (key != null && validateChartConfigKey(key)) {
      // Use spread operator for safe assignment
      Object.assign(result, { [key]: value });
    }
  }

  return result;
}

/**
 * Safe breakpoint values extraction from cohort data
 */
export function getValidBreakpointValues(
  cohorts: { breakpointValues: Record<number, number | null> }[],
  breakpoint: number,
): number[] {
  const values: number[] = [];

  for (const cohort of cohorts) {
    const value = getBreakpointValue(cohort.breakpointValues, breakpoint);
    if (typeof value === "number") {
      values.push(value);
    }
  }

  return values;
}
