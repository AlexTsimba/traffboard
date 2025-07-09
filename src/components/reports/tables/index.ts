/**
 * Cohort Table Components - Clean Exports
 *
 * Centralized exports for all cohort table related components and utilities.
 * Provides a clean API for importing cohort table functionality.
 */

// Main table component
export { CohortTable } from "./CohortTable";
export type { CohortTableProps } from "./CohortTable";

// Table cell component
export { CohortTableCell } from "./CohortTableCell";
export type { CohortTableCellProps } from "./CohortTableCell";

// Table toolbar component
export { CohortTableToolbar } from "./CohortTableToolbar";
export type { CohortTableToolbarProps } from "./CohortTableToolbar";

// Utility functions
export {
  calculateHeatmapIntensity,
  calculateMetricRange,
  clearCohortCellCache,
  createCohortCell,
  createCohortCellMemoized,
  formatCohortValue,
  generateBreakpointColumns,
  generateHeatmapClass,
  generateTriangularColumns,
  getBreakpointValueSafe,
  getMetricConfigSafe,
  getVisibleBreakpoints,
  sortCohortsByDate,
  validateBreakpointKey,
  validateCohortData,
} from "./cohort-table-utils";
