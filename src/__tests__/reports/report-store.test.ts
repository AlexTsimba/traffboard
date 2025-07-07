/**
 * Report Store Tests
 *
 * Tests the Zustand store for report state management, including report operations,
 * filter state, loading states, and persistence functionality.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { useReportStore, useCurrentReport, useFilters } from "@/stores/report-store";
import type { BaseReportConfig, ReportData, FilterValue } from "@/types/reports";

// =============================================================================
// MOCK DATA
// =============================================================================

const createMockReport = (id: string, title?: string): BaseReportConfig => ({
  id,
  type: "cohort",
  title: title ?? `Report ${id}`,
  description: `Test report ${id}`,
  isPublic: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  createdBy: "test-user",
});

const createMockReportData = (): ReportData => ({
  rows: [{ id: 1, name: "test" }],
  totalCount: 1,
  metadata: {
    executionTime: 100,
    dataVersion: "1.0.0",
    cacheStatus: "miss",
    lastRefresh: new Date(),
    queryHash: "test-hash",
    filters: [],
  },
});

// =============================================================================
// STORE TESTS
// =============================================================================

describe("useReportStore", () => {
  beforeEach(() => {
    useReportStore.getState().reset();
  });

  afterEach(() => {
    useReportStore.getState().reset();
  });

  describe("report management", () => {
    it("adds a report", () => {
      const { result } = renderHook(() => useReportStore());
      const report = createMockReport("test-1");

      act(() => {
        result.current.addReport(report);
      });

      expect(result.current.activeReports).toHaveLength(1);
      expect(result.current.activeReports[0]).toEqual(report);
      expect(result.current.currentReportId).toBe("test-1");
      expect(result.current.selectedTabId).toBe("test-1");
    });

    it("sets active report", () => {
      const { result } = renderHook(() => useReportStore());
      const report1 = createMockReport("test-1");
      const report2 = createMockReport("test-2");

      act(() => {
        result.current.addReport(report1);
        result.current.addReport(report2);
        result.current.setActiveReport("test-1");
      });

      expect(result.current.currentReportId).toBe("test-1");
      expect(result.current.selectedTabId).toBe("test-1");
    });

    it("updates a report", () => {
      const { result } = renderHook(() => useReportStore());
      const report = createMockReport("test-1");

      act(() => {
        result.current.addReport(report);
        result.current.updateReport("test-1", { title: "Updated Title" });
      });

      const updatedReport = result.current.activeReports[0];
      expect(updatedReport.title).toBe("Updated Title");
      expect(updatedReport.updatedAt).not.toEqual(report.updatedAt);
    });

    it("removes a report", () => {
      const { result } = renderHook(() => useReportStore());
      const report1 = createMockReport("test-1");
      const report2 = createMockReport("test-2");

      act(() => {
        result.current.addReport(report1);
        result.current.addReport(report2);
        result.current.removeReport("test-1");
      });

      expect(result.current.activeReports).toHaveLength(1);
      expect(result.current.activeReports[0].id).toBe("test-2");
      expect(result.current.currentReportId).toBe("test-2");
    });

    it("duplicates a report", () => {
      const { result } = renderHook(() => useReportStore());
      const report = createMockReport("test-1");

      act(() => {
        result.current.addReport(report);
        result.current.duplicateReport("test-1");
      });

      expect(result.current.activeReports).toHaveLength(2);
      const duplicatedReport = result.current.activeReports[1];
      expect(duplicatedReport.title).toBe("Report test-1 (Copy)");
      expect(duplicatedReport.id).toContain("test-1-copy-");
    });
  });

  describe("filter state management", () => {
    it("opens filter dialog", () => {
      const { result } = renderHook(() => useReportStore());

      act(() => {
        result.current.openFilterDialog();
      });

      expect(result.current.filterState.isOpen).toBe(true);
    });

    it("applies filters", () => {
      const { result } = renderHook(() => useReportStore());
      const filters: Record<string, FilterValue> = {
        search: "test",
        status: "active",
      };

      act(() => {
        result.current.applyFilters(filters);
      });

      expect(result.current.filterState.filters).toEqual(filters);
      expect(result.current.filterState.appliedFilters).toHaveLength(2);
      expect(result.current.filterState.isOpen).toBe(false);
    });

    it("clears filters", () => {
      const { result } = renderHook(() => useReportStore());
      const filters: Record<string, FilterValue> = {
        search: "test",
      };

      act(() => {
        result.current.applyFilters(filters);
        result.current.clearFilters();
      });

      expect(result.current.filterState.filters).toEqual({});
      expect(result.current.filterState.appliedFilters).toHaveLength(0);
    });
  });

  describe("loading state management", () => {
    it("sets global loading state", () => {
      const { result } = renderHook(() => useReportStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("sets report-specific loading state", () => {
      const { result } = renderHook(() => useReportStore());

      act(() => {
        result.current.setReportLoading("test-1", true);
      });

      expect(result.current.loadingStates.get("test-1")).toBe(true);
    });
  });

  describe("cache management", () => {
    it("updates cache stats", () => {
      const { result } = renderHook(() => useReportStore());

      act(() => {
        result.current.updateCacheStats({
          hitRate: 0.85,
          totalRequests: 100,
        });
      });

      expect(result.current.cacheStats.hitRate).toBe(0.85);
      expect(result.current.cacheStats.totalRequests).toBe(100);
    });

    it("clears cache", () => {
      const { result } = renderHook(() => useReportStore());
      const reportData = createMockReportData();

      act(() => {
        result.current.setReportData("test-1", reportData);
        result.current.clearCache();
      });

      expect(result.current.reportData.get("test-1")).toBeUndefined();
      expect(result.current.cacheStats.lastCleared).toBeInstanceOf(Date);
    });
  });

  describe("getter methods", () => {
    it("getCurrentReport returns current report", () => {
      const { result } = renderHook(() => useReportStore());
      const report = createMockReport("test-1");

      act(() => {
        result.current.addReport(report);
      });

      expect(result.current.getCurrentReport()).toEqual(report);
    });

    it("getReportById returns correct report", () => {
      const { result } = renderHook(() => useReportStore());
      const report1 = createMockReport("test-1");
      const report2 = createMockReport("test-2");

      act(() => {
        result.current.addReport(report1);
        result.current.addReport(report2);
      });

      expect(result.current.getReportById("test-1")).toEqual(report1);
      expect(result.current.getReportById("test-2")).toEqual(report2);
    });
  });
});

// =============================================================================
// SELECTOR HOOK TESTS
// =============================================================================

describe("useCurrentReport", () => {
  beforeEach(() => {
    useReportStore.getState().reset();
  });

  it("returns current report", () => {
    const report = createMockReport("test-1");

    act(() => {
      useReportStore.getState().addReport(report);
    });

    const { result } = renderHook(() => useCurrentReport());
    expect(result.current).toEqual(report);
  });

  it("returns null when no current report", () => {
    const { result } = renderHook(() => useCurrentReport());
    expect(result.current).toBeNull();
  });
});

describe("useFilters", () => {
  beforeEach(() => {
    useReportStore.getState().reset();
  });

  it("returns filter state and actions", () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.filterState).toBeDefined();
    expect(result.current.hasActiveFilters).toBe(false);
    expect(typeof result.current.openFilterDialog).toBe("function");
  });

  it("returns correct hasActiveFilters value", () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.applyFilters({ search: "test" });
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe("Store Integration", () => {
  beforeEach(() => {
    useReportStore.getState().reset();
  });

  it("handles complex workflow", () => {
    const { result } = renderHook(() => useReportStore());
    const report1 = createMockReport("report-1", "First Report");
    const report2 = createMockReport("report-2", "Second Report");
    const reportData = createMockReportData();

    // Add reports
    act(() => {
      result.current.addReport(report1);
      result.current.addReport(report2);
    });

    expect(result.current.activeReports).toHaveLength(2);
    expect(result.current.currentReportId).toBe("report-2");

    // Set data for first report
    act(() => {
      result.current.setReportData("report-1", reportData);
    });

    // Switch to first report
    act(() => {
      result.current.setActiveReport("report-1");
    });

    expect(result.current.currentReportId).toBe("report-1");
    expect(result.current.reportData.get("report-1")).toEqual(reportData);

    // Apply filters
    act(() => {
      result.current.applyFilters({ search: "test", status: "active" });
    });

    expect(result.current.filterState.appliedFilters).toHaveLength(2);
  });
});
