/**
 * Report Factory Foundation - Index Exports
 *
 * Provides convenient imports for all Report Factory components,
 * types, utilities, and stores.
 */

// Core types
export type * from "@/types/reports";

// Context providers
export {
  ReportProvider,
  FilterRegistryProvider,
  useReportContext,
  useReports,
  useFilters,
  usePlugins,
  useReportTheme,
  useCache,
  useFilterRegistry,
} from "@/components/reports/universal/report-context";

// Filter system
export {
  FilterButton,
  FilterModal,
  FilterChips,
  formatFilterValue,
  createAppliedFilter,
  validateFilterValue,
  validateFilters,
  COMMON_FILTERS,
  FilterComposer,
  createFilterComposer,
} from "@/components/reports/filters/filter-system";

// Universal components
export { ReportHeader } from "@/components/reports/universal/report-header";

// Plugin system
export {
  pluginRegistry,
  createReportPlugin,
  defaultDataProcessor,
  DEFAULT_EXPORT_FORMATS,
  validatePlugin,
  createPluginManifest,
  pluginHooks,
  BasePlugin,
} from "@/lib/reports/plugin-system";

// Data pipeline
export {
  pipelineManager,
  createConversionPipeline,
  createCohortPipeline,
  registerDefaultPipelines,
  executePipelineWithRetry,
  validatePipeline,
  createTransformBuilder,
} from "@/lib/reports/data-pipeline";

// Pipeline components
export { extractData } from "@/lib/reports/pipeline/data-extractors";
export { applyTransform } from "@/lib/reports/pipeline/data-transformers";
export { cacheManager, CacheManager } from "@/lib/reports/pipeline/cache-manager";
export { TransformBuilder } from "@/lib/reports/pipeline/transform-builder";
export {
  buildPrismaWhereClause,
  formatFilterValue as formatPipelineFilterValue,
} from "@/lib/reports/pipeline/filter-utils";

// Export system
export {
  exportManager,
  createExportRequest,
  exportReportData,
  getExportFormat,
  validateExportRequest,
  generateExportFilename,
} from "@/lib/reports/export/export-system";

// State management
export {
  useReportStore,
  useCurrentReport,
  useReportById,
  useReportLoading,
  useReportError,
  useReportData,
  useFilters as useFilterStore,
  useCache as useCacheStore,
} from "@/stores/report-store";
