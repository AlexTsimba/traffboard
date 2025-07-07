/**
 * Report Context Provider Tests
 *
 * Tests the React context providers for global report state management,
 * ensuring proper state updates and hook functionality.
 */

import { renderHook, act } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import {
  ReportProvider,
  useReportContext,
  useReports,
  useFilters,
  usePlugins,
  useReportTheme,
  useCache,
} from "@/components/reports/universal/report-context";
import type { BaseReportConfig, FilterValue, ReportPlugin, ReportTheme } from "@/types/reports";

// =============================================================================
// WRAPPER COMPONENT
// =============================================================================

const createWrapper = (initialReports: BaseReportConfig[] = []) => {
  return ({ children }: { children: React.ReactNode }) => (
    <ReportProvider initialReports={initialReports}>{children}</ReportProvider>
  );
};

// =============================================================================
// MOCK DATA
// =============================================================================

const createMockReport = (id: string): BaseReportConfig => ({
  id,
  type: "cohort",
  title: `Report ${id}`,
  description: `Test report ${id}`,
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "test-user",
});

const createMockPlugin = (id: string): ReportPlugin => ({
  id,
  name: `Plugin ${id}`,
  version: "1.0.0",
  type: "cohort",
  component: () => <div>Mock Plugin</div>,
  configSchema: [],
  dataProcessor: async () => ({
    rows: [],
    totalCount: 0,
    metadata: {
      executionTime: 0,
      dataVersion: "1.0.0",
      cacheStatus: "miss" as const,
      lastRefresh: new Date(),
      queryHash: "test-hash",
      filters: [],
    },
  }),
  exportFormats: [],
});

// =============================================================================
// CONTEXT PROVIDER TESTS
// =============================================================================

describe("ReportProvider", () => {
  it("provides initial reports", () => {
    const initialReports = [createMockReport("test-1")];
    const wrapper = createWrapper(initialReports);

    const { result } = renderHook(() => useReportContext(), { wrapper });

    expect(result.current.state.activeReports).toEqual(initialReports);
  });

  it("throws error when used outside provider", () => {
    expect(() => {
      renderHook(() => useReportContext());
    }).toThrow("useReportContext must be used within a ReportProvider");
  });
});

// =============================================================================
// USE REPORTS HOOK TESTS
// =============================================================================

describe("useReports", () => {
  it("adds a report", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useReports(), { wrapper });
    const report = createMockReport("test-1");

    act(() => {
      result.current.addReport(report);
    });

    expect(result.current.activeReports).toContain(report);
    expect(result.current.currentReportId).toBe("test-1");
  });

  it("sets active report", () => {
    const initialReports = [createMockReport("test-1"), createMockReport("test-2")];
    const wrapper = createWrapper(initialReports);
    const { result } = renderHook(() => useReports(), { wrapper });

    act(() => {
      result.current.setActiveReport("test-1");
    });

    expect(result.current.currentReportId).toBe("test-1");
    expect(result.current.currentReport?.id).toBe("test-1");
  });

  it("updates a report", () => {
    const initialReports = [createMockReport("test-1")];
    const wrapper = createWrapper(initialReports);
    const { result } = renderHook(() => useReports(), { wrapper });

    act(() => {
      result.current.updateReport("test-1", { title: "Updated Title" });
    });

    expect(result.current.activeReports[0].title).toBe("Updated Title");
  });

  it("removes a report", () => {
    const initialReports = [createMockReport("test-1"), createMockReport("test-2")];
    const wrapper = createWrapper(initialReports);
    const { result } = renderHook(() => useReports(), { wrapper });

    act(() => {
      result.current.removeReport("test-1");
    });

    expect(result.current.activeReports).toHaveLength(1);
    expect(result.current.activeReports[0].id).toBe("test-2");
  });

  it("sets loading state", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useReports(), { wrapper });

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("sets error state", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useReports(), { wrapper });

    act(() => {
      result.current.setError("Test error");
    });

    expect(result.current.error).toBe("Test error");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});

// =============================================================================
// USE FILTERS HOOK TESTS
// =============================================================================

describe("useFilters", () => {
  it("opens and closes filter dialog", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFilters(), { wrapper });

    expect(result.current.filterState.isOpen).toBe(false);

    act(() => {
      result.current.openFilterDialog();
    });

    expect(result.current.filterState.isOpen).toBe(true);

    act(() => {
      result.current.closeFilterDialog();
    });

    expect(result.current.filterState.isOpen).toBe(false);
  });

  it("applies filters", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFilters(), { wrapper });
    const filters: Record<string, FilterValue> = {
      search: "test",
      status: "active",
    };

    act(() => {
      result.current.applyFilters(filters);
    });

    expect(result.current.filterState.filters).toEqual(filters);
    expect(result.current.appliedFilters).toHaveLength(2);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("clears filters", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.applyFilters({ search: "test" });
      result.current.clearFilters();
    });

    expect(result.current.filterState.filters).toEqual({});
    expect(result.current.appliedFilters).toHaveLength(0);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("removes individual filter", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.applyFilters({ search: "test", status: "active" });
      result.current.removeFilter("search");
    });

    expect(result.current.filterState.filters.search).toBeUndefined();
    expect(result.current.appliedFilters).toHaveLength(1);
    expect(result.current.appliedFilters[0].id).toBe("status");
  });
});

// =============================================================================
// USE PLUGINS HOOK TESTS
// =============================================================================

describe("usePlugins", () => {
  it("registers a plugin", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => usePlugins(), { wrapper });
    const plugin = createMockPlugin("test-plugin");

    act(() => {
      result.current.registerPlugin(plugin);
    });

    expect(result.current.plugins).toContain(plugin);
    expect(result.current.getPlugin("test-plugin")).toEqual(plugin);
  });

  it("unregisters a plugin", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => usePlugins(), { wrapper });
    const plugin = createMockPlugin("test-plugin");

    act(() => {
      result.current.registerPlugin(plugin);
      result.current.unregisterPlugin("test-plugin");
    });

    expect(result.current.plugins).not.toContain(plugin);
    expect(result.current.getPlugin("test-plugin")).toBeUndefined();
  });

  it("gets plugins by type", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => usePlugins(), { wrapper });
    const cohortPlugin = createMockPlugin("cohort-plugin");
    const conversionPlugin = { ...createMockPlugin("conversion-plugin"), type: "conversion" as const };

    act(() => {
      result.current.registerPlugin(cohortPlugin);
      result.current.registerPlugin(conversionPlugin);
    });

    const cohortPlugins = result.current.getPluginsByType("cohort");
    expect(cohortPlugins).toHaveLength(1);
    expect(cohortPlugins[0].id).toBe("cohort-plugin");
  });
});

// =============================================================================
// USE THEME HOOK TESTS
// =============================================================================

describe("useReportTheme", () => {
  it("returns default theme", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useReportTheme(), { wrapper });

    expect(result.current.colors).toBeDefined();
    expect(result.current.heatmap).toBeDefined();
    expect(result.current.typography).toBeDefined();
  });

  it("uses custom theme", () => {
    const customTheme: Partial<ReportTheme> = {
      colors: {
        primary: "#custom-primary",
        secondary: "#custom-secondary",
        accent: "#custom-accent",
        background: "#ffffff",
        surface: "#f5f5f5",
        text: "#000000",
        textSecondary: "#666666",
        border: "#cccccc",
        error: "#ff0000",
        warning: "#ffaa00",
        success: "#00aa00",
      },
    };

    const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
      <ReportProvider theme={customTheme}>{children}</ReportProvider>
    );

    const { result } = renderHook(() => useReportTheme(), { wrapper: CustomWrapper });

    expect(result.current.colors.primary).toBe("#custom-primary");
  });
});

// =============================================================================
// USE CACHE HOOK TESTS
// =============================================================================

describe("useCache", () => {
  it("updates cache stats", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCache(), { wrapper });

    act(() => {
      result.current.updateStats({
        hitRate: 0.85,
        totalRequests: 100,
      });
    });

    expect(result.current.stats.hitRate).toBe(0.85);
    expect(result.current.stats.totalRequests).toBe(100);
  });

  it("has initial cache stats", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCache(), { wrapper });

    expect(result.current.stats.hitRate).toBe(0);
    expect(result.current.stats.totalRequests).toBe(0);
    expect(result.current.stats.cacheSize).toBe(0);
    expect(result.current.stats.lastCleared).toBeNull();
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe("Context Integration", () => {
  it("handles complex workflow across multiple hooks", () => {
    const wrapper = createWrapper();
    const reportsHook = renderHook(() => useReports(), { wrapper });
    const filtersHook = renderHook(() => useFilters(), { wrapper });
    const pluginsHook = renderHook(() => usePlugins(), { wrapper });

    const report = createMockReport("test-1");
    const plugin = createMockPlugin("test-plugin");

    // Add report and plugin
    act(() => {
      reportsHook.result.current.addReport(report);
      pluginsHook.result.current.registerPlugin(plugin);
      filtersHook.result.current.applyFilters({ search: "test" });
    });

    // Verify state is consistent across hooks
    expect(reportsHook.result.current.activeReports[0]).toEqual(report);
    expect(pluginsHook.result.current.plugins[0]).toEqual(plugin);
    expect(filtersHook.result.current.hasActiveFilters).toBe(true);

    // Update and verify
    act(() => {
      reportsHook.result.current.updateReport("test-1", { title: "Updated" });
      filtersHook.result.current.clearFilters();
    });

    expect(reportsHook.result.current.activeReports[0].title).toBe("Updated");
    expect(filtersHook.result.current.hasActiveFilters).toBe(false);
  });
});
