/**
 * Plugin System Tests
 *
 * Tests the plugin registry, plugin creation, validation, and lifecycle management
 * to ensure safe plugin registration/unregistration and proper dependency handling.
 */

import { describe, it, expect, beforeEach } from "vitest";

import {
  pluginRegistry,
  defaultDataProcessor,
  DEFAULT_EXPORT_FORMATS,
  validatePlugin,
} from "@/lib/reports/plugin-system";
import type { ReportPlugin, ReportType, AppliedFilter } from "@/types/reports";

// =============================================================================
// MOCK PLUGINS
// =============================================================================

const MockComponent = ({ config }: { config: { title: string } }) => `Mock Plugin: ${config.title}`;

const createMockPlugin = (id: string, type: ReportType = "cohort", dependencies?: string[]): ReportPlugin => ({
  id,
  name: `Mock ${id}`,
  version: "1.0.0",
  type,
  component: MockComponent,
  configSchema: [],
  dataProcessor: defaultDataProcessor,
  exportFormats: [DEFAULT_EXPORT_FORMATS.CSV],
  dependencies,
});

// =============================================================================
// PLUGIN REGISTRY TESTS
// =============================================================================

describe("PluginRegistry", () => {
  beforeEach(() => {
    // Clear registry before each test
    const allPlugins = pluginRegistry.getAllPlugins();
    for (const plugin of allPlugins) {
      try {
        pluginRegistry.unregister(plugin.id);
      } catch {
        // Ignore dependency errors during cleanup
      }
    }
  });

  describe("register", () => {
    it("registers a plugin successfully", () => {
      const plugin = createMockPlugin("test-plugin");

      pluginRegistry.register(plugin);

      expect(pluginRegistry.hasPlugin("test-plugin")).toBe(true);
      expect(pluginRegistry.getPlugin("test-plugin")).toEqual(plugin);
    });

    it("registers data processor for plugin type", () => {
      const plugin = createMockPlugin("test-plugin", "cohort");

      pluginRegistry.register(plugin);

      expect(pluginRegistry.getDataProcessor("cohort")).toBe(plugin.dataProcessor);
    });

    it("throws error for missing dependencies", () => {
      const plugin = createMockPlugin("dependent-plugin", "cohort", ["missing-dependency"]);

      expect(() => {
        pluginRegistry.register(plugin);
      }).toThrow('Plugin "dependent-plugin" depends on "missing-dependency" which is not registered');
    });
  });

  describe("unregister", () => {
    it("unregisters a plugin successfully", () => {
      const plugin = createMockPlugin("test-plugin");

      pluginRegistry.register(plugin);
      pluginRegistry.unregister("test-plugin");

      expect(pluginRegistry.hasPlugin("test-plugin")).toBe(false);
    });

    it("throws error when unregistering plugin with dependents", () => {
      const basePlugin = createMockPlugin("base-plugin");
      const dependentPlugin = createMockPlugin("dependent-plugin", "cohort", ["base-plugin"]);

      pluginRegistry.register(basePlugin);
      pluginRegistry.register(dependentPlugin);

      expect(() => {
        pluginRegistry.unregister("base-plugin");
      }).toThrow('Cannot unregister plugin "base-plugin" because it has dependents: dependent-plugin');
    });
  });

  describe("getters", () => {
    beforeEach(() => {
      // Ensure clean state before registering test plugins
      const allPlugins = pluginRegistry.getAllPlugins();
      for (const plugin of allPlugins) {
        try {
          pluginRegistry.unregister(plugin.id);
        } catch {
          // Ignore dependency errors during cleanup
        }
      }

      pluginRegistry.register(createMockPlugin("plugin1", "cohort"));
      pluginRegistry.register(createMockPlugin("plugin2", "conversion"));
      pluginRegistry.register(createMockPlugin("plugin3", "cohort"));
    });

    it("getPluginsByType returns correct plugins", () => {
      const cohortPlugins = pluginRegistry.getPluginsByType("cohort");

      expect(cohortPlugins).toHaveLength(2);
      expect(cohortPlugins.map((p) => p.id)).toEqual(expect.arrayContaining(["plugin1", "plugin3"]));
    });

    it("getAllPlugins returns all registered plugins", () => {
      const allPlugins = pluginRegistry.getAllPlugins();

      expect(allPlugins).toHaveLength(3);
    });
  });
});

// =============================================================================
// PLUGIN VALIDATION TESTS
// =============================================================================

describe("validatePlugin", () => {
  const validPlugin = createMockPlugin("valid-plugin");

  it("validates valid plugin", () => {
    const result = validatePlugin(validPlugin);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects missing required fields", () => {
    const invalidPlugin = { ...validPlugin, id: "" };

    const result = validatePlugin(invalidPlugin);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Plugin ID is required");
  });
});

// =============================================================================
// DEFAULT DATA PROCESSOR TESTS
// =============================================================================

describe("defaultDataProcessor", () => {
  it("processes data correctly", async () => {
    const rawData = [{ id: 1, name: "test" }];
    const config = {
      id: "test-report",
      type: "cohort" as const,
      title: "Test Report",
      description: "Test",
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "test-user",
    };
    const filters: AppliedFilter[] = [];

    const result = await defaultDataProcessor(rawData, config, filters);

    expect(result.rows).toEqual(rawData);
    expect(result.totalCount).toBe(1);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.cacheStatus).toBe("miss");
    expect(result.metadata.queryHash).toBeDefined();
  });

  it("generates consistent query hashes for same inputs", async () => {
    const rawData = [{ id: 1 }];
    const config = {
      id: "test",
      type: "cohort" as const,
      title: "Test",
      description: "Test",
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "test-user",
    };
    const filters: AppliedFilter[] = [];

    const result1 = await defaultDataProcessor(rawData, config, filters);
    const result2 = await defaultDataProcessor(rawData, config, filters);

    expect(result1.metadata.queryHash).toBe(result2.metadata.queryHash);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe("Plugin System Integration", () => {
  beforeEach(() => {
    // Clear registry
    const allPlugins = pluginRegistry.getAllPlugins();
    for (const plugin of allPlugins) {
      try {
        pluginRegistry.unregister(plugin.id);
      } catch {
        // Ignore dependency errors during cleanup
      }
    }
  });

  it("handles complex dependency chain", () => {
    const pluginA = createMockPlugin("plugin-a");
    const pluginB = createMockPlugin("plugin-b", "cohort", ["plugin-a"]);
    const pluginC = createMockPlugin("plugin-c", "cohort", ["plugin-b"]);

    pluginRegistry.register(pluginA);
    pluginRegistry.register(pluginB);
    pluginRegistry.register(pluginC);

    expect(pluginRegistry.getAllPlugins()).toHaveLength(3);

    // Should not be able to unregister A because B depends on it
    expect(() => {
      pluginRegistry.unregister("plugin-a");
    }).toThrow();

    // Should be able to unregister C (no dependents)
    expect(() => {
      pluginRegistry.unregister("plugin-c");
    }).not.toThrow();

    // Now should be able to unregister B
    expect(() => {
      pluginRegistry.unregister("plugin-b");
    }).not.toThrow();

    // Finally should be able to unregister A
    expect(() => {
      pluginRegistry.unregister("plugin-a");
    }).not.toThrow();
  });

  it("handles multiple plugins of same type", () => {
    const plugin1 = createMockPlugin("cohort-plugin-1", "cohort");
    const plugin2 = createMockPlugin("cohort-plugin-2", "cohort");

    pluginRegistry.register(plugin1);
    pluginRegistry.register(plugin2);

    const cohortPlugins = pluginRegistry.getPluginsByType("cohort");
    expect(cohortPlugins).toHaveLength(2);

    // Data processor should be from the last registered plugin
    expect(pluginRegistry.getDataProcessor("cohort")).toBe(plugin2.dataProcessor);
  });
});
