/**
 * Report Factory Context Providers
 *
 * Provides React context for global report state management, filter state,
 * and plugin configuration. This serves as the foundation for all report
 * components in the TraffBoard system.
 */

"use client";

import React, { createContext, useContext, useReducer, type ReactNode } from "react";

import type {
  BaseReportConfig,
  FilterDialogState,
  AppliedFilter,
  FilterValue,
  ReportPlugin,
  ReportTheme,
  CacheStats,
  FilterDefinition,
} from "@/types/reports";

// =============================================================================
// REPORT CONTEXT
// =============================================================================

interface ReportContextState {
  // Active reports
  activeReports: BaseReportConfig[];
  currentReportId: string | null;

  // Filter state
  filterState: FilterDialogState;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Plugin registry
  plugins: Map<string, ReportPlugin>;

  // Theme configuration
  theme: ReportTheme;

  // Cache statistics
  cacheStats: CacheStats;
}

type ReportAction =
  | { type: "SET_ACTIVE_REPORT"; payload: string }
  | { type: "ADD_REPORT"; payload: BaseReportConfig }
  | { type: "UPDATE_REPORT"; payload: { id: string; config: Partial<BaseReportConfig> } }
  | { type: "REMOVE_REPORT"; payload: string }
  | { type: "OPEN_FILTER_DIALOG" }
  | { type: "CLOSE_FILTER_DIALOG" }
  | { type: "APPLY_FILTERS"; payload: Record<string, FilterValue> }
  | { type: "CLEAR_FILTERS" }
  | { type: "REMOVE_FILTER"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "REGISTER_PLUGIN"; payload: ReportPlugin }
  | { type: "UNREGISTER_PLUGIN"; payload: string }
  | { type: "UPDATE_CACHE_STATS"; payload: Partial<CacheStats> };

const initialState: ReportContextState = {
  activeReports: [],
  currentReportId: null,
  filterState: {
    isOpen: false,
    filters: {},
    appliedFilters: [],
    hasChanges: false,
  },
  isLoading: false,
  error: null,
  plugins: new Map(),
  theme: {
    colors: {
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#10b981",
      background: "#f8fafc",
      surface: "#ffffff",
      text: "#1e293b",
      textSecondary: "#64748b",
      border: "#e2e8f0",
      error: "#dc2626",
      warning: "#f59e0b",
      success: "#10b981",
    },
    heatmap: {
      gradient: [
        "#065f46",
        "#10b981",
        "#34d399",
        "#6ee7b7",
        "#a7f3d0",
        "#d1fae5",
        "#fef3c7",
        "#fbbf24",
        "#f59e0b",
        "#ea580c",
        "#dc2626",
        "#b91c1c",
      ],
      steps: 12,
    },
    typography: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "18px",
        xl: "20px",
      },
    },
  },
  cacheStats: {
    hitRate: 0,
    totalRequests: 0,
    cacheSize: 0,
    lastCleared: null,
  },
};

function reportReducer(state: ReportContextState, action: ReportAction): ReportContextState {
  switch (action.type) {
    case "SET_ACTIVE_REPORT": {
      return {
        ...state,
        currentReportId: action.payload,
      };
    }

    case "ADD_REPORT": {
      return {
        ...state,
        activeReports: [...state.activeReports, action.payload],
        currentReportId: action.payload.id,
      };
    }

    case "UPDATE_REPORT": {
      return {
        ...state,
        activeReports: state.activeReports.map((report) =>
          report.id === action.payload.id ? { ...report, ...action.payload.config } : report,
        ),
      };
    }

    case "REMOVE_REPORT": {
      const filteredReports = state.activeReports.filter((report) => report.id !== action.payload);
      return {
        ...state,
        activeReports: filteredReports,
        currentReportId:
          state.currentReportId === action.payload ? (filteredReports[0]?.id ?? null) : state.currentReportId,
      };
    }

    case "OPEN_FILTER_DIALOG": {
      return {
        ...state,
        filterState: {
          ...state.filterState,
          isOpen: true,
        },
      };
    }

    case "CLOSE_FILTER_DIALOG": {
      return {
        ...state,
        filterState: {
          ...state.filterState,
          isOpen: false,
          hasChanges: false,
        },
      };
    }

    case "APPLY_FILTERS": {
      // Convert filters to applied filters (simplified for now)
      const appliedFilters: AppliedFilter[] = Object.entries(action.payload)
        .filter(([, value]) => value != null && value !== "")
        .map(([id, value]) => ({
          id,
          definition: {
            id,
            label: id,
            type: "text",
          },
          value,
          displayText: typeof value === "object" ? JSON.stringify(value) : String(value),
        }));

      return {
        ...state,
        filterState: {
          ...state.filterState,
          filters: action.payload,
          appliedFilters,
          isOpen: false,
          hasChanges: false,
        },
      };
    }

    case "CLEAR_FILTERS": {
      return {
        ...state,
        filterState: {
          ...state.filterState,
          filters: {},
          appliedFilters: [],
          hasChanges: false,
        },
      };
    }

    case "REMOVE_FILTER": {
      const updatedFilters = { ...state.filterState.filters };
      if (action.payload in updatedFilters) {
        const { [action.payload]: _removed, ...remaining } = updatedFilters;
        // Acknowledge the removed value without triggering lint warning
        if (_removed != null) {
          // Destructured value acknowledged
        }
        return {
          ...state,
          filterState: {
            ...state.filterState,
            filters: remaining,
            appliedFilters: state.filterState.appliedFilters.filter((filter) => filter.id !== action.payload),
          },
        };
      }
      return state;
    }

    case "SET_LOADING": {
      return {
        ...state,
        isLoading: action.payload,
      };
    }

    case "SET_ERROR": {
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    }

    case "REGISTER_PLUGIN": {
      const newPlugins = new Map(state.plugins);
      newPlugins.set(action.payload.id, action.payload);
      return {
        ...state,
        plugins: newPlugins,
      };
    }

    case "UNREGISTER_PLUGIN": {
      const updatedPlugins = new Map(state.plugins);
      updatedPlugins.delete(action.payload);
      return {
        ...state,
        plugins: updatedPlugins,
      };
    }

    case "UPDATE_CACHE_STATS": {
      return {
        ...state,
        cacheStats: {
          ...state.cacheStats,
          ...action.payload,
        },
      };
    }

    default: {
      return state;
    }
  }
}

const ReportContext = createContext<{
  state: ReportContextState;
  dispatch: React.Dispatch<ReportAction>;
} | null>(null);

// =============================================================================
// REPORT PROVIDER
// =============================================================================

interface ReportProviderProps {
  readonly children: ReactNode;
  readonly initialReports?: BaseReportConfig[];
  readonly theme?: Partial<ReportTheme>;
}

export function ReportProvider({ children, initialReports = [], theme }: ReportProviderProps) {
  const [state, dispatch] = useReducer(reportReducer, {
    ...initialState,
    activeReports: initialReports,
    theme: theme ? { ...initialState.theme, ...theme } : initialState.theme,
  });

  return <ReportContext.Provider value={{ state, dispatch }}>{children}</ReportContext.Provider>;
}

// =============================================================================
// HOOKS
// =============================================================================

export function useReportContext() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error("useReportContext must be used within a ReportProvider");
  }
  return context;
}

export function useReports() {
  const { state, dispatch } = useReportContext();

  return {
    // State
    activeReports: state.activeReports,
    currentReportId: state.currentReportId,
    currentReport: state.activeReports.find((r) => r.id === state.currentReportId) ?? null,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    setActiveReport: (reportId: string) => {
      dispatch({ type: "SET_ACTIVE_REPORT", payload: reportId });
    },

    addReport: (config: BaseReportConfig) => {
      dispatch({ type: "ADD_REPORT", payload: config });
    },

    updateReport: (id: string, config: Partial<BaseReportConfig>) => {
      dispatch({ type: "UPDATE_REPORT", payload: { id, config } });
    },

    removeReport: (reportId: string) => {
      dispatch({ type: "REMOVE_REPORT", payload: reportId });
    },

    setLoading: (loading: boolean) => {
      dispatch({ type: "SET_LOADING", payload: loading });
    },

    setError: (error: string | null) => {
      dispatch({ type: "SET_ERROR", payload: error });
    },

    clearError: () => {
      dispatch({ type: "SET_ERROR", payload: null });
    },
  };
}

export function useFilters() {
  const { state, dispatch } = useReportContext();

  return {
    // State
    filterState: state.filterState,
    appliedFilters: state.filterState.appliedFilters,
    hasActiveFilters: state.filterState.appliedFilters.length > 0,

    // Actions
    openFilterDialog: () => {
      dispatch({ type: "OPEN_FILTER_DIALOG" });
    },

    closeFilterDialog: () => {
      dispatch({ type: "CLOSE_FILTER_DIALOG" });
    },

    applyFilters: (filters: Record<string, FilterValue>) => {
      dispatch({ type: "APPLY_FILTERS", payload: filters });
    },

    clearFilters: () => {
      dispatch({ type: "CLEAR_FILTERS" });
    },

    removeFilter: (filterId: string) => {
      dispatch({ type: "REMOVE_FILTER", payload: filterId });
    },
  };
}

export function usePlugins() {
  const { state, dispatch } = useReportContext();

  return {
    // State
    plugins: [...state.plugins.values()],
    pluginMap: state.plugins,

    // Actions
    registerPlugin: (plugin: ReportPlugin) => {
      dispatch({ type: "REGISTER_PLUGIN", payload: plugin });
    },

    unregisterPlugin: (pluginId: string) => {
      dispatch({ type: "UNREGISTER_PLUGIN", payload: pluginId });
    },

    getPlugin: (pluginId: string) => state.plugins.get(pluginId),

    getPluginsByType: (type: string) => [...state.plugins.values()].filter((p) => p.type === type),
  };
}

export function useReportTheme() {
  const { state } = useReportContext();
  return state.theme;
}

export function useCache() {
  const { state, dispatch } = useReportContext();

  return {
    // State
    stats: state.cacheStats,

    // Actions
    updateStats: (stats: Partial<CacheStats>) => {
      dispatch({ type: "UPDATE_CACHE_STATS", payload: stats });
    },
  };
}

// =============================================================================
// FILTER CONTEXT (Specialized for Filter Management)
// =============================================================================

interface FilterContextState {
  readonly availableFilters: Map<string, FilterDefinition>;
  readonly filterGroups: Map<string, string[]>;
}

const FilterContext = createContext<FilterContextState | null>(null);

interface FilterRegistryProviderProps {
  readonly children: ReactNode;
}

export function FilterRegistryProvider({ children }: FilterRegistryProviderProps) {
  const [state] = React.useState<FilterContextState>({
    availableFilters: new Map(),
    filterGroups: new Map(),
  });

  return <FilterContext.Provider value={state}>{children}</FilterContext.Provider>;
}

export function useFilterRegistry() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterRegistry must be used within a FilterRegistryProvider");
  }
  return context;
}
