/**
 * Report Store - Zustand State Management
 *
 * Provides centralized state management for the TraffBoard Report Factory
 * using Zustand. Manages report configurations, filter state, cache status,
 * and UI interactions.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { persist } from "zustand/middleware";

import type {
  BaseReportConfig,
  FilterDialogState,
  AppliedFilter,
  FilterValue,
  CacheStats,
  ReportData,
} from "@/types/reports";

// =============================================================================
// REPORT STORE TYPES
// =============================================================================

interface ReportStore {
  // Active reports state
  activeReports: BaseReportConfig[];
  currentReportId: string | null;
  reportData: Map<string, ReportData>;

  // Filter state
  filterState: FilterDialogState;

  // Loading and error states
  isLoading: boolean;
  loadingStates: Map<string, boolean>;
  error: string | null;
  errors: Map<string, string>;

  // Cache state
  cacheStats: CacheStats;

  // UI state
  sidebarCollapsed: boolean;
  selectedTabId: string | null;

  // Actions
  setActiveReport: (reportId: string) => void;
  addReport: (config: BaseReportConfig) => void;
  updateReport: (reportId: string, config: Partial<BaseReportConfig>) => void;
  removeReport: (reportId: string) => void;
  duplicateReport: (reportId: string) => void;
  setReportData: (reportId: string, data: ReportData) => void;
  clearReportData: (reportId: string) => void;
  openFilterDialog: () => void;
  closeFilterDialog: () => void;
  applyFilters: (filters: Record<string, FilterValue>) => void;
  clearFilters: () => void;
  removeFilter: (filterId: string) => void;
  updateFilterState: (updates: Partial<FilterDialogState>) => void;
  setLoading: (loading: boolean) => void;
  setReportLoading: (reportId: string, loading: boolean) => void;
  setError: (error: string | null) => void;
  setReportError: (reportId: string, error: string | null) => void;
  clearError: () => void;
  clearReportError: (reportId: string) => void;
  updateCacheStats: (stats: Partial<CacheStats>) => void;
  clearCache: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedTab: (tabId: string | null) => void;
  reset: () => void;
  getCurrentReport: () => BaseReportConfig | null;
  getReportById: (reportId: string) => BaseReportConfig | null;
  hasActiveFilters: () => boolean;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  activeReports: [],
  currentReportId: null,
  reportData: new Map<string, ReportData>(),
  filterState: {
    isOpen: false,
    filters: {},
    appliedFilters: [],
    hasChanges: false,
  },
  isLoading: false,
  loadingStates: new Map<string, boolean>(),
  error: null,
  errors: new Map<string, string>(),
  cacheStats: {
    hitRate: 0,
    totalRequests: 0,
    cacheSize: 0,
    lastCleared: null,
  },
  sidebarCollapsed: false,
  selectedTabId: null,
};

// =============================================================================
// REPORT STORE
// =============================================================================

export const useReportStore = create<ReportStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        setActiveReport: (reportId: string) => {
          set(() => ({
            currentReportId: reportId,
            selectedTabId: reportId,
          }));
        },

        addReport: (config: BaseReportConfig) => {
          set((state) => ({
            activeReports: [...state.activeReports, config],
            currentReportId: config.id,
            selectedTabId: config.id,
          }));
        },

        updateReport: (reportId: string, config: Partial<BaseReportConfig>) => {
          set((state) => ({
            activeReports: state.activeReports.map((report) =>
              report.id === reportId ? { ...report, ...config, updatedAt: new Date() } : report,
            ),
          }));
        },

        removeReport: (reportId: string) => {
          set((state) => {
            const filteredReports = state.activeReports.filter((report) => report.id !== reportId);
            const newCurrentId =
              state.currentReportId === reportId ? (filteredReports[0]?.id ?? null) : state.currentReportId;

            const newReportData = new Map(state.reportData);
            newReportData.delete(reportId);

            const newLoadingStates = new Map(state.loadingStates);
            newLoadingStates.delete(reportId);

            const newErrors = new Map(state.errors);
            newErrors.delete(reportId);

            return {
              activeReports: filteredReports,
              currentReportId: newCurrentId,
              selectedTabId: newCurrentId,
              reportData: newReportData,
              loadingStates: newLoadingStates,
              errors: newErrors,
            };
          });
        },

        duplicateReport: (reportId: string) => {
          const report = get().getReportById(reportId);
          if (report) {
            const duplicatedReport: BaseReportConfig = {
              ...report,
              id: `${report.id}-copy-${Date.now()}`,
              title: `${report.title} (Copy)`,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            get().addReport(duplicatedReport);
          }
        },

        setReportData: (reportId: string, data: ReportData) => {
          set((state) => {
            const newReportData = new Map(state.reportData);
            newReportData.set(reportId, data);
            return { reportData: newReportData };
          });
        },

        clearReportData: (reportId: string) => {
          set((state) => {
            const newReportData = new Map(state.reportData);
            newReportData.delete(reportId);
            return { reportData: newReportData };
          });
        },

        openFilterDialog: () => {
          set((state) => ({
            filterState: {
              ...state.filterState,
              isOpen: true,
            },
          }));
        },

        closeFilterDialog: () => {
          set((state) => ({
            filterState: {
              ...state.filterState,
              isOpen: false,
              hasChanges: false,
            },
          }));
        },

        applyFilters: (filters: Record<string, FilterValue>) => {
          const appliedFilters: AppliedFilter[] = Object.entries(filters)
            .filter(([, value]) => value != null && value !== "")
            .map(([id, value]) => ({
              id,
              definition: {
                id,
                label: id,
                type: "text" as const,
              },
              value,
              displayText: typeof value === "object" ? JSON.stringify(value) : String(value),
            }));

          set((state) => ({
            filterState: {
              ...state.filterState,
              filters,
              appliedFilters,
              isOpen: false,
              hasChanges: false,
            },
          }));
        },

        clearFilters: () => {
          set((state) => ({
            filterState: {
              ...state.filterState,
              filters: {},
              appliedFilters: [],
              hasChanges: false,
            },
          }));
        },

        removeFilter: (filterId: string) => {
          set((state) => {
            const updatedFilters = { ...state.filterState.filters };
            if (filterId in updatedFilters) {
              const { [filterId]: _removed, ...remaining } = updatedFilters;
              // Acknowledge the removed value without triggering lint warning
              if (_removed != null) {
                // Destructured value acknowledged
              }
              return {
                filterState: {
                  ...state.filterState,
                  filters: remaining,
                  appliedFilters: state.filterState.appliedFilters.filter((filter) => filter.id !== filterId),
                },
              };
            }
            return state;
          });
        },

        updateFilterState: (updates: Partial<FilterDialogState>) => {
          set((state) => ({
            filterState: {
              ...state.filterState,
              ...updates,
            },
          }));
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setReportLoading: (reportId: string, loading: boolean) => {
          set((state) => {
            const newLoadingStates = new Map(state.loadingStates);
            if (loading) {
              newLoadingStates.set(reportId, true);
            } else {
              newLoadingStates.delete(reportId);
            }
            return { loadingStates: newLoadingStates };
          });
        },

        setError: (error: string | null) => {
          set({ error });
        },

        setReportError: (reportId: string, error: string | null) => {
          set((state) => {
            const newErrors = new Map(state.errors);
            if (error) {
              newErrors.set(reportId, error);
            } else {
              newErrors.delete(reportId);
            }
            return { errors: newErrors };
          });
        },

        clearError: () => {
          set({ error: null });
        },

        clearReportError: (reportId: string) => {
          set((state) => {
            const newErrors = new Map(state.errors);
            newErrors.delete(reportId);
            return { errors: newErrors };
          });
        },

        updateCacheStats: (stats: Partial<CacheStats>) => {
          set((state) => ({
            cacheStats: {
              ...state.cacheStats,
              ...stats,
            },
          }));
        },

        clearCache: () => {
          set((state) => ({
            cacheStats: {
              ...state.cacheStats,
              lastCleared: new Date(),
            },
            reportData: new Map(),
          }));
        },

        toggleSidebar: () => {
          set((state) => ({
            sidebarCollapsed: !state.sidebarCollapsed,
          }));
        },

        setSidebarCollapsed: (collapsed: boolean) => {
          set({ sidebarCollapsed: collapsed });
        },

        setSelectedTab: (tabId: string | null) => {
          set({ selectedTabId: tabId });
        },

        reset: () => {
          set(initialState);
        },

        getCurrentReport: () => {
          const state = get();
          return state.activeReports.find((r) => r.id === state.currentReportId) ?? null;
        },

        getReportById: (reportId: string) => {
          const state = get();
          return state.activeReports.find((r) => r.id === reportId) ?? null;
        },

        hasActiveFilters: () => {
          const state = get();
          return state.filterState.appliedFilters.length > 0;
        },
      }),
      {
        name: "traffboard-report-store",
        partialize: (state) => ({
          activeReports: state.activeReports,
          currentReportId: state.currentReportId,
          filterState: {
            filters: state.filterState.filters,
            appliedFilters: state.filterState.appliedFilters,
            isOpen: false,
            hasChanges: false,
          },
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      },
    ),
  ),
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

export const useCurrentReport = () => useReportStore((state) => state.getCurrentReport());

export const useReportById = (reportId: string) => useReportStore((state) => state.getReportById(reportId));

export const useReportLoading = (reportId: string) =>
  useReportStore((state) => state.loadingStates.get(reportId) ?? false);

export const useReportError = (reportId: string) => useReportStore((state) => state.errors.get(reportId) ?? null);

export const useReportData = (reportId: string) => useReportStore((state) => state.reportData.get(reportId) ?? null);

export const useFilters = () => {
  const store = useReportStore();
  return {
    filterState: store.filterState,
    hasActiveFilters: store.filterState.appliedFilters.length > 0,
    openFilterDialog: store.openFilterDialog,
    closeFilterDialog: store.closeFilterDialog,
    applyFilters: store.applyFilters,
    clearFilters: store.clearFilters,
    removeFilter: store.removeFilter,
  };
};

export const useCache = () =>
  useReportStore((state) => ({
    stats: state.cacheStats,
    updateStats: state.updateCacheStats,
    clearCache: state.clearCache,
  }));
