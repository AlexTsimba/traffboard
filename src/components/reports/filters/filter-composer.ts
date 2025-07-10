/**
 * Filter Composer Class
 *
 * Builder pattern for constructing filter definitions.
 * Extracted from filter-system.tsx for better maintainability.
 */

import type { FilterDefinition } from "@/types/reports";

// Helper function to get "This month" date range
function getThisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}

// =============================================================================
// COMMON FILTER DEFINITIONS
// =============================================================================

export const COMMON_FILTERS = {
  DATE_RANGE: {
    id: "dateRange",
    label: "Date Range",
    type: "daterange" as const,
    group: "a-timeframe",
    order: 0,
    defaultValue: getThisMonthRange(),
  },
  PARTNERS: {
    id: "partners",
    label: "Partners",
    type: "autocomplete" as const,
    group: "b-partners",
    order: 10,
    placeholder: "Search partners...",
  },
  CAMPAIGNS: {
    id: "campaigns",
    label: "Campaigns",
    type: "autocomplete" as const,
    group: "c-campaigns",
    order: 20,
    placeholder: "Search campaigns...",
  },
  COUNTRIES: {
    id: "countries",
    label: "Countries",
    type: "autocomplete" as const,
    group: "d-location",
    order: 30,
    placeholder: "Search countries...",
  },
  OS: {
    id: "os",
    label: "Operating System",
    type: "autocomplete" as const,
    group: "d-location",
    order: 31,
    placeholder: "Search OS...",
  },
  PARTNER_ID: {
    id: "partnerId",
    label: "Partner",
    type: "select" as const,
    group: "general",
    order: 20,
    options: [
      { label: "Partner A", value: "partner_a" },
      { label: "Partner B", value: "partner_b" },
    ],
  },
  SEARCH: {
    id: "search",
    label: "Search",
    type: "text" as const,
    group: "general",
    order: 30,
    placeholder: "Search...",
  },
  TRAFFIC_SOURCE: {
    id: "trafficSource",
    label: "Traffic Source",
    type: "select" as const,
    group: "analytics",
    order: 40,
    options: [
      { label: "Organic", value: "organic" },
      { label: "Direct", value: "direct" },
      { label: "Referral", value: "referral" },
      { label: "Social", value: "social" },
    ],
  },
} as const;

// =============================================================================
// FILTER COMPOSER CLASS
// =============================================================================

/**
 * Builder class for creating filter definitions with a fluent API
 */
export class FilterComposer {
  private filters: FilterDefinition[] = [];

  /**
   * Add a single filter definition
   */
  add(filter: FilterDefinition): this {
    const existingIndex = this.filters.findIndex((f) => f.id === filter.id);
    if (existingIndex === -1) {
      this.filters.push(filter);
    } else {
      // Replace the existing filter
      this.filters.splice(existingIndex, 1, filter);
    }
    return this;
  }

  /**
   * Add multiple filter definitions
   */
  addAll(filters: FilterDefinition[]): this {
    for (const filter of filters) {
      this.add(filter);
    }
    return this;
  }

  /**
   * Add a common filter by ID
   */
  addCommon(filterId: keyof typeof COMMON_FILTERS): this {
    // Safe to use direct access since filterId is constrained to valid keys
    // eslint-disable-next-line security/detect-object-injection
    const commonFilter = COMMON_FILTERS[filterId];
    if (commonFilter) {
      this.add(commonFilter);
    }
    return this;
  }

  /**
   * Build and return the final filter definitions array
   */
  build(): FilterDefinition[] {
    // Sort by group first, then by order within group
    return [...this.filters].sort((a, b) => {
      const groupA = a.group ?? "zzz"; // Default group sorts last
      const groupB = b.group ?? "zzz";

      if (groupA !== groupB) {
        return groupA.localeCompare(groupB);
      }

      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }

  /**
   * Reset the composer (clear all filters)
   */
  reset(): this {
    this.filters = [];
    return this;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new FilterComposer instance
 */
export function createFilterComposer(): FilterComposer {
  return new FilterComposer();
}
