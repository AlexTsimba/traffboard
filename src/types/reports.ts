/**
 * Report Factory Foundation - Core TypeScript Interfaces
 *
 * This file defines the foundational types for the TraffBoard Report Factory system.
 * It provides type safety and extensibility for cohort analysis and all future report types.
 *
 * ARCHITECTURE PATTERN: Plugin-based extensible reporting framework
 * - Universal filter system with modal dialog and chips display
 * - Flexible data pipeline supporting multiple data sources
 * - Export capabilities with multiple format support
 * - State management integration with Zustand stores
 */

import type { ReactNode } from "react";

// =============================================================================
// CORE REPORT TYPES
// =============================================================================

/**
 * Base report configuration that all report types must implement
 */
export interface BaseReportConfig {
  id: string;
  type: ReportType;
  title: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags?: string[];
}

/**
 * Supported report types in the system
 */
export type ReportType = "cohort" | "conversion" | "player" | "revenue" | "custom";

/**
 * Generic report data structure
 */
export interface ReportData<T = unknown> {
  rows: T[];
  totalCount: number;
  metadata: ReportMetadata;
}

/**
 * Report metadata containing execution info and performance metrics
 */
export interface ReportMetadata {
  executionTime: number;
  dataVersion: string;
  cacheStatus: "hit" | "miss" | "partial";
  lastRefresh: Date;
  queryHash: string;
  filters: FilterValue[];
}

// =============================================================================
// FILTER SYSTEM INTERFACES
// =============================================================================

/**
 * Filter definition for a specific field
 */
export interface FilterDefinition {
  id: string;
  label: string;
  type: FilterType;
  required?: boolean;
  placeholder?: string;
  options?: readonly FilterOption[];
  defaultValue?: FilterValue;
  validation?: FilterValidation;
  group?: string;
  order?: number;
}

/**
 * Supported filter types
 */
export type FilterType =
  | "text"
  | "select"
  | "multiselect"
  | "date"
  | "daterange"
  | "number"
  | "numberrange"
  | "boolean";

/**
 * Filter option for select/multiselect types
 */
export interface FilterOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  group?: string;
}

/**
 * Filter validation rules
 */
export interface FilterValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: FilterValue) => string | null;
}

/**
 * Filter value - can be various types depending on filter type
 */
export type FilterValue = string | number | boolean | Date | string[] | number[] | DateRange | NumberRange | null;

/**
 * Date range value for daterange filters
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Number range value for numberrange filters
 */
export interface NumberRange {
  min: number;
  max: number;
}

/**
 * Applied filter with current value
 */
export interface AppliedFilter {
  id: string;
  definition: FilterDefinition;
  value: FilterValue;
  displayText: string;
}

/**
 * Filter dialog state and actions
 */
export interface FilterDialogState {
  isOpen: boolean;
  filters: Record<string, FilterValue>;
  appliedFilters: AppliedFilter[];
  hasChanges: boolean;
}

/**
 * Filter modal component props based on demo requirements
 */
export interface FilterModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (filters: Record<string, FilterValue>) => void;
  readonly onClear: () => void;
  readonly filterDefinitions: FilterDefinition[];
  readonly currentFilters: Record<string, FilterValue>;
  readonly title?: string;
}

/**
 * Active filter chips display props
 */
export interface FilterChipsProps {
  readonly appliedFilters: AppliedFilter[];
  readonly onRemoveFilter: (filterId: string) => void;
  readonly onClearAll: () => void;
  readonly className?: string;
}

// =============================================================================
// DATA PIPELINE INTERFACES
// =============================================================================

/**
 * Data source configuration for the pipeline
 */
export interface DataSourceConfig {
  id: string;
  type: DataSourceType;
  connectionString?: string;
  cacheTTL?: number;
  retryAttempts?: number;
  timeout?: number;
  credentials?: Record<string, string>;
}

/**
 * Supported data source types
 */
export type DataSourceType = "postgresql" | "prisma" | "api" | "csv" | "json";

/**
 * Data transformation step in the pipeline
 */
export interface DataTransformStep {
  id: string;
  type: TransformType;
  config: Record<string, unknown>;
  order: number;
}

/**
 * Supported transformation types
 */
export type TransformType = "filter" | "aggregate" | "join" | "pivot" | "cohort" | "custom";

/**
 * Data pipeline configuration
 */
export interface DataPipeline {
  id: string;
  source: DataSourceConfig;
  transforms: DataTransformStep[];
  cache: CacheConfig;
  output: OutputConfig;
}

/**
 * Cache configuration for data pipeline
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  invalidationRules: string[];
  strategy: "memory" | "redis" | "database";
}

/**
 * Output configuration for data pipeline
 */
export interface OutputConfig {
  format: "json" | "csv" | "excel" | "pdf";
  compression?: boolean;
  encryption?: boolean;
}

// =============================================================================
// COHORT-SPECIFIC INTERFACES
// =============================================================================

/**
 * Cohort analysis configuration
 */
export interface CohortConfig {
  mode: CohortMode;
  metric: CohortMetric;
  breakpoints: number[];
  dateRange: DateRange;
  filters: Record<string, FilterValue>;
  groupBy?: string[];
}

/**
 * Cohort analysis modes
 */
export type CohortMode = "day" | "week" | "month";

/**
 * Cohort metrics as defined in the specification
 */
export type CohortMetric = "dep2cost" | "roas" | "avg_deposit_sum" | "retention_rate";

/**
 * Predefined breakpoints for cohort analysis
 */
export const COHORT_BREAKPOINTS = {
  DAY: [1, 3, 5, 7, 14, 17, 21, 24, 27, 30],
  WEEK: [7, 14, 21, 28, 35, 42], // Monday start, Sunday view
} as const;

/**
 * Cohort data structure
 */
export interface CohortData {
  cohortDate: string;
  ftdCount: number;
  breakpointValues: Record<number, number | null>;
  weightedAverage?: number;
}

/**
 * Cohort table cell data for heatmap visualization
 */
export interface CohortCell {
  value: number | null;
  displayValue: string;
  heatmapClass: string;
  isEmpty: boolean;
}

/**
 * Cohort table header configuration
 */
export interface CohortTableHeader {
  cohortDate: string;
  ftdCount: string;
  breakpoints: string[];
}

// =============================================================================
// PLUGIN ARCHITECTURE INTERFACES
// =============================================================================

/**
 * Plugin definition for extensible report types
 */
export interface ReportPlugin {
  id: string;
  name: string;
  version: string;
  type: ReportType;
  component: React.ComponentType<ReportPluginProps>;
  configSchema: FilterDefinition[];
  dataProcessor: DataProcessor;
  exportFormats: ExportFormat[];
  dependencies?: string[];
}

/**
 * Props passed to report plugin components
 */
export interface ReportPluginProps {
  config: BaseReportConfig;
  data: ReportData;
  filters: AppliedFilter[];
  onConfigChange: (config: Partial<BaseReportConfig>) => void;
  onFilterChange: (filters: Record<string, FilterValue>) => void;
  onExport: (format: ExportFormat) => void;
  isLoading: boolean;
  error?: string;
}

/**
 * Data processor function for plugin-specific data transformations
 */
export type DataProcessor = (
  rawData: unknown[],
  config: BaseReportConfig,
  filters: AppliedFilter[],
) => Promise<ReportData>;

// =============================================================================
// EXPORT SYSTEM INTERFACES
// =============================================================================

/**
 * Export format configuration
 */
export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  supports: ExportFeature[];
}

/**
 * Supported export features
 */
export type ExportFeature = "images" | "charts" | "formatting" | "metadata" | "compression";

/**
 * Export request configuration
 */
export interface ExportRequest {
  reportId: string;
  format: ExportFormat;
  options: ExportOptions;
  filename?: string;
}

/**
 * Export options
 */
export interface ExportOptions {
  includeCharts?: boolean;
  includeMetadata?: boolean;
  compression?: boolean;
  pageSize?: "A4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// =============================================================================
// UI COMPONENT INTERFACES
// =============================================================================

/**
 * Base report component props
 */
export interface BaseReportProps {
  config: BaseReportConfig;
  data?: ReportData;
  isLoading?: boolean;
  error?: string;
  onConfigChange?: (config: Partial<BaseReportConfig>) => void;
  className?: string;
}

/**
 * Report header component props
 */
export interface ReportHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly onFilterClick: () => void;
  readonly onExportClick: () => void;
  readonly actions?: ReactNode;
  readonly className?: string;
}

/**
 * Report table component props
 */
export interface ReportTableProps<T = unknown> {
  data: T[];
  columns: TableColumn<T>[];
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  selection?: SelectionConfig;
  loading?: boolean;
  className?: string;
}

/**
 * Table column definition
 */
export interface TableColumn<T = unknown> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => unknown);
  cell?: (value: unknown, row: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  align?: "left" | "center" | "right";
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * Sorting configuration
 */
export interface SortingConfig {
  column: string;
  direction: "asc" | "desc";
  onSortChange: (column: string, direction: "asc" | "desc") => void;
}

/**
 * Selection configuration
 */
export interface SelectionConfig {
  selectedRows: string[];
  onSelectionChange: (selectedRows: string[]) => void;
  selectAll?: boolean;
  onSelectAllChange?: (selectAll: boolean) => void;
}

// =============================================================================
// STATE MANAGEMENT INTERFACES
// =============================================================================

/**
 * Report store state for Zustand
 */
export interface ReportStoreState {
  // Active reports
  activeReports: BaseReportConfig[];
  currentReportId: string | null;

  // Filter state
  filterState: FilterDialogState;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Cache state
  cacheStats: CacheStats;
}

/**
 * Report store actions for Zustand
 */
export interface ReportStoreActions {
  // Report management
  setActiveReport: (reportId: string) => void;
  addReport: (config: BaseReportConfig) => void;
  updateReport: (reportId: string, config: Partial<BaseReportConfig>) => void;
  removeReport: (reportId: string) => void;

  // Filter management
  openFilterDialog: () => void;
  closeFilterDialog: () => void;
  applyFilters: (filters: Record<string, FilterValue>) => void;
  clearFilters: () => void;
  removeFilter: (filterId: string) => void;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Cache management
  clearCache: () => void;
  refreshData: () => void;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hitRate: number;
  totalRequests: number;
  cacheSize: number;
  lastCleared: Date | null;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: Date;
    requestId: string;
    executionTime: number;
  };
}

/**
 * Loading state helper
 */
export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  stage?: string;
  error?: string;
}

/**
 * Theme configuration for reports
 */
export interface ReportTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
  heatmap: {
    gradient: string[];
    steps: number;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
  };
}
