/**
 * Report Factory Plugin System
 *
 * Provides a flexible plugin architecture for extending the TraffBoard Report Factory
 * with new report types, data sources, and export formats. This system allows for
 * modular development and easy integration of custom reporting solutions.
 */

import type {
  ReportPlugin,
  ReportType,
  DataProcessor,
  ExportFormat,
  BaseReportConfig,
  AppliedFilter,
  FilterDefinition,
  FilterType,
} from "@/types/reports";

// =============================================================================
// PLUGIN REGISTRY
// =============================================================================

class PluginRegistry {
  private plugins = new Map<string, ReportPlugin>();
  private dataProcessors = new Map<ReportType, DataProcessor>();
  private exportFormats = new Map<string, ExportFormat>();

  /**
   * Register a new report plugin
   */
  register(plugin: ReportPlugin): void {
    // Validate plugin dependencies
    if (plugin.dependencies) {
      for (const dependency of plugin.dependencies) {
        if (!this.plugins.has(dependency)) {
          throw new Error(`Plugin "${plugin.id}" depends on "${dependency}" which is not registered`);
        }
      }
    }

    this.plugins.set(plugin.id, plugin);
    this.dataProcessors.set(plugin.type, plugin.dataProcessor);

    // Register export formats
    for (const format of plugin.exportFormats) {
      this.exportFormats.set(format.id, format);
    }
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return;
    }

    // Check for dependent plugins
    const dependents = [...this.plugins.values()].filter((p) => p.dependencies?.includes(pluginId));

    if (dependents.length > 0) {
      throw new Error(
        `Cannot unregister plugin "${pluginId}" because it has dependents: ${dependents.map((p) => p.id).join(", ")}`,
      );
    }

    this.plugins.delete(pluginId);
    this.dataProcessors.delete(plugin.type);

    // Cleanup export formats
    for (const format of plugin.exportFormats) {
      this.exportFormats.delete(format.id);
    }
  }

  /**
   * Get a registered plugin
   */
  getPlugin(pluginId: string): ReportPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins of a specific type
   */
  getPluginsByType(type: ReportType): ReportPlugin[] {
    return [...this.plugins.values()].filter((p) => p.type === type);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): ReportPlugin[] {
    return [...this.plugins.values()];
  }

  /**
   * Get data processor for a report type
   */
  getDataProcessor(type: ReportType): DataProcessor | undefined {
    return this.dataProcessors.get(type);
  }

  /**
   * Get export format by ID
   */
  getExportFormat(formatId: string): ExportFormat | undefined {
    return this.exportFormats.get(formatId);
  }

  /**
   * Get all available export formats
   */
  getAllExportFormats(): ExportFormat[] {
    return [...this.exportFormats.values()];
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get plugin registry stats
   */
  getStats() {
    return {
      totalPlugins: this.plugins.size,
      dataProcessors: this.dataProcessors.size,
      exportFormats: this.exportFormats.size,
      pluginsByType: Object.fromEntries(
        [...this.plugins.values()].reduce((acc, plugin) => {
          const existingCount = acc.get(plugin.type);
          const currentCount = typeof existingCount === "number" ? existingCount : 0;
          acc.set(plugin.type, currentCount + 1);
          return acc;
        }, new Map()),
      ),
    };
  }
}

// =============================================================================
// GLOBAL PLUGIN REGISTRY INSTANCE
// =============================================================================

export const pluginRegistry = new PluginRegistry();

// =============================================================================
// PLUGIN FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a basic report plugin
 */
export function createReportPlugin(
  config: Omit<ReportPlugin, "dataProcessor" | "exportFormats"> & {
    dataProcessor?: DataProcessor;
    exportFormats?: ExportFormat[];
  },
): ReportPlugin {
  return {
    ...config,
    dataProcessor: config.dataProcessor ?? defaultDataProcessor,
    exportFormats: config.exportFormats ?? [DEFAULT_EXPORT_FORMATS.CSV, DEFAULT_EXPORT_FORMATS.JSON],
  };
}

/**
 * Default data processor that passes through data without transformation
 */
export const defaultDataProcessor: DataProcessor = (rawData, config, filters) => {
  return Promise.resolve({
    rows: rawData,
    totalCount: rawData.length,
    metadata: {
      executionTime: 0,
      dataVersion: "1.0.0",
      cacheStatus: "miss",
      lastRefresh: new Date(),
      queryHash: generateQueryHash(config, filters),
      filters: filters.map((f) => f.value),
    },
  });
};

/**
 * Generate a unique hash for query caching
 */
function generateQueryHash(config: BaseReportConfig, filters: AppliedFilter[]): string {
  const hashInput = JSON.stringify({
    configId: config.id,
    type: config.type,
    filters: filters.map((f) => ({ id: f.id, value: f.value })),
  });

  // Simple hash function (in production, use a proper hashing library)
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.codePointAt(i);
    if (typeof char === "number") {
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
  }

  return Math.abs(hash).toString(16);
}

// =============================================================================
// DEFAULT EXPORT FORMATS
// =============================================================================

export const DEFAULT_EXPORT_FORMATS = {
  CSV: {
    id: "csv",
    name: "CSV",
    extension: "csv",
    mimeType: "text/csv",
    supports: [],
  } as ExportFormat,

  EXCEL: {
    id: "excel",
    name: "Excel",
    extension: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    supports: ["formatting"],
  } as ExportFormat,

  JSON: {
    id: "json",
    name: "JSON",
    extension: "json",
    mimeType: "application/json",
    supports: ["metadata"],
  } as ExportFormat,

  PDF: {
    id: "pdf",
    name: "PDF",
    extension: "pdf",
    mimeType: "application/pdf",
    supports: ["images", "charts", "formatting"],
  } as ExportFormat,

  PNG: {
    id: "png",
    name: "PNG Image",
    extension: "png",
    mimeType: "image/png",
    supports: ["images", "charts"],
  } as ExportFormat,
} as const;

// =============================================================================
// PLUGIN UTILITIES
// =============================================================================

/**
 * Validate plugin configuration
 */
export function validatePlugin(plugin: ReportPlugin): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!plugin.id) {
    errors.push("Plugin ID is required");
  }

  if (!plugin.name) {
    errors.push("Plugin name is required");
  }

  if (!plugin.version) {
    errors.push("Plugin version is required");
  }

  if (!plugin.type) {
    errors.push("Plugin type is required");
  }

  if (!plugin.component) {
    errors.push("Plugin component is required");
  }

  if (!plugin.dataProcessor) {
    errors.push("Plugin data processor is required");
  }

  if (!Array.isArray(plugin.exportFormats)) {
    errors.push("Plugin export formats must be an array");
  }

  if (!Array.isArray(plugin.configSchema)) {
    errors.push("Plugin config schema must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a plugin manifest for registration
 */
export function createPluginManifest(id: string, name: string, version: string, description?: string) {
  return {
    id,
    name,
    version,
    description,
    registeredAt: new Date(),
    author: "TraffBoard",
    homepage: "https://traffboard.com",
    repository: "https://github.com/traffboard/plugins",
  };
}

// =============================================================================
// PLUGIN HOOKS
// =============================================================================

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  onRegister?: (plugin: ReportPlugin) => void;
  onUnregister?: (plugin: ReportPlugin) => void;
  onError?: (error: Error, plugin: ReportPlugin) => void;
}

class PluginHookManager {
  private hooks: PluginHooks = {};

  setHooks(hooks: PluginHooks) {
    this.hooks = hooks;
  }

  triggerRegister(plugin: ReportPlugin) {
    this.hooks.onRegister?.(plugin);
  }

  triggerUnregister(plugin: ReportPlugin) {
    this.hooks.onUnregister?.(plugin);
  }

  triggerError(error: Error, plugin: ReportPlugin) {
    this.hooks.onError?.(error, plugin);
  }
}

export const pluginHooks = new PluginHookManager();

// =============================================================================
// PLUGIN DEVELOPMENT UTILITIES
// =============================================================================

/**
 * Base class for creating plugins with common functionality
 */
export abstract class BasePlugin implements Omit<ReportPlugin, "component"> {
  abstract id: string;
  abstract name: string;
  abstract version: string;
  abstract type: ReportType;
  abstract configSchema: FilterDefinition[];

  dependencies?: string[];
  exportFormats: ExportFormat[] = [DEFAULT_EXPORT_FORMATS.CSV, DEFAULT_EXPORT_FORMATS.JSON];

  abstract dataProcessor: DataProcessor;

  /**
   * Create a filter definition helper
   */
  protected createFilter(
    id: string,
    label: string,
    type: FilterType,
    options?: Partial<FilterDefinition>,
  ): FilterDefinition {
    return {
      id,
      label,
      type,
      required: false,
      ...options,
    };
  }

  /**
   * Helper method to validate configuration
   */
  protected validateConfig(config: BaseReportConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.id) {
      errors.push("Report ID is required");
    }

    if (!config.title) {
      errors.push("Report title is required");
    }

    if (config.type !== this.type) {
      errors.push(`Report type must be "${this.type}"`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
