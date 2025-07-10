"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useTransition } from "react";

import { EnhancedFilterModal } from "@/components/reports/filters/enhanced-filter-modal";
import { formatFilterValue } from "@/components/reports/filters/filter-formatting";
import { FilterButton, FilterChips, createFilterComposer } from "@/components/reports/filters/filter-system";
import { ReportHeader } from "@/components/reports/universal/report-header";
import {
  createCohortSpecificFilters,
  getDefaultCohortSpecificValues,
} from "@/lib/reports/cohort/cohort-specific-filters";
import type { FilterDefinition, FilterValue, AppliedFilter } from "@/types/reports";

// Helper functions for building applied filters
const buildDateRangeFilter = (
  searchParams: URLSearchParams,
  generalFilterDefinitions: FilterDefinition[],
): AppliedFilter | null => {
  const dateStart = searchParams.get("dateStart");
  const dateEnd = searchParams.get("dateEnd");
  if (!dateStart || !dateEnd) return null;

  const dateRangeDefinition = generalFilterDefinitions.find((def) => def.id === "dateRange");
  if (!dateRangeDefinition) return null;

  return {
    id: "dateRange",
    definition: dateRangeDefinition,
    value: { start: new Date(dateStart), end: new Date(dateEnd) },
    displayText: `${formatFilterValue(new Date(dateStart), "date")} - ${formatFilterValue(new Date(dateEnd), "date")}`,
  };
};

const buildMultiselectFilter = (
  searchParams: URLSearchParams,
  generalFilterDefinitions: FilterDefinition[],
  filterId: string,
): AppliedFilter | null => {
  const value = searchParams.get(filterId);
  if (!value) return null;

  const definition = generalFilterDefinitions.find((def) => def.id === filterId);
  if (!definition) return null;

  return {
    id: filterId,
    definition,
    value: value.split(","),
    displayText: value.split(",").join(", "),
  };
};

// Helper functions for URL parameters
const clearFilterParams = (params: URLSearchParams) => {
  const filterKeys = [
    "dateStart",
    "dateEnd",
    "partners",
    "campaigns",
    "countries",
    "os",
    "cohortStep",
    "metric",
    "breakpoints",
    "showMetadata",
    "exportFormat",
  ];
  for (const key of filterKeys) {
    params.delete(key);
  }
};

const setGeneralFilterParams = (params: URLSearchParams, generalFilters: Record<string, FilterValue>) => {
  for (const [key, value] of Object.entries(generalFilters)) {
    if (key === "dateRange" && value && typeof value === "object") {
      const dateRange = value as { start: string | Date; end: string | Date };
      const startISO = typeof dateRange.start === "string" ? dateRange.start : dateRange.start.toISOString();
      const endISO = typeof dateRange.end === "string" ? dateRange.end : dateRange.end.toISOString();
      params.set("dateStart", startISO);
      params.set("dateEnd", endISO);
    } else if (Array.isArray(value) && value.length > 0) {
      params.set(key, value.join(","));
    } else if (typeof value === "string" && value.trim()) {
      params.set(key, value);
    }
  }
};

const setSpecificFilterParams = (params: URLSearchParams, specificFilters: Record<string, FilterValue>) => {
  for (const [key, value] of Object.entries(specificFilters)) {
    if (Array.isArray(value) && value.length > 0) {
      params.set(key, value.join(","));
    } else if (typeof value === "boolean") {
      params.set(key, value.toString());
    } else if (typeof value === "string" && value.trim()) {
      params.set(key, value);
    }
  }
};

interface CohortFiltersProps {
  currentFilters: {
    dateStart: string;
    dateEnd: string;
    partners: string[];
    campaigns: string[];
    countries: string[];
    os: string[];
  };
}

// Функция для консистентного форматирования дат в европейском формате
function formatDateConsistently(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Функция для конвертации Date в ISO строку (только дата)
function dateToISOString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function CohortFilters({ currentFilters: _currentFilters }: CohortFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Создаем общие фильтры
  const generalFilterDefinitions = useMemo((): FilterDefinition[] => {
    return createFilterComposer()
      .addCommon("DATE_RANGE") // 1. Date Range (самый важный)
      .addCommon("PARTNERS") // 2. Partners
      .addCommon("CAMPAIGNS") // 3. Campaigns
      .addCommon("COUNTRIES") // 4. Countries
      .addCommon("OS") // 5. OS
      .build();
  }, []);

  // Создаем специфичные фильтры для когорт
  const cohortSpecificFilters = useMemo(() => {
    return createCohortSpecificFilters();
  }, []);

  // Конвертируем URL параметры в applied filters в правильном порядке
  const appliedFilters = useMemo((): AppliedFilter[] => {
    const filters: AppliedFilter[] = [];

    // 1. Date Range (первый и самый важный)
    const dateRangeFilter = buildDateRangeFilter(searchParams, generalFilterDefinitions);
    if (dateRangeFilter) filters.push(dateRangeFilter);

    // 2-5. Multiselect filters
    const multiselectFilters = ["partners", "campaigns", "countries", "os"];
    for (const filterId of multiselectFilters) {
      const filter = buildMultiselectFilter(searchParams, generalFilterDefinitions, filterId);
      if (filter) filters.push(filter);
    }

    return filters;
  }, [searchParams, generalFilterDefinitions]);

  // Конвертируем applied filters в current filters для модального окна
  const currentGeneralFilters = useMemo((): Record<string, FilterValue> => {
    const result: Record<string, FilterValue> = {};

    // Сначала установим defaultValue для всех фильтров
    for (const filterDef of generalFilterDefinitions) {
      if (filterDef.defaultValue !== undefined) {
        result[filterDef.id] = filterDef.defaultValue;
      }
    }

    // Затем перезапишем значениями из appliedFilters
    for (const filter of appliedFilters) {
      if (["dateRange", "partners", "campaigns", "countries", "os"].includes(filter.id)) {
        result[filter.id] = filter.value;
      }
    }
    return result;
  }, [appliedFilters, generalFilterDefinitions]);

  // Текущие специфичные фильтры
  const currentSpecificFilters = useMemo((): Record<string, FilterValue> => {
    const defaults = getDefaultCohortSpecificValues();
    return {
      cohortStep: searchParams.get("cohortStep") || defaults.cohortStep,
      metric: searchParams.get("metric") || defaults.metric,
      breakpoints: searchParams.get("breakpoints")?.split(",") || defaults.breakpoints,
      showMetadata: searchParams.get("showMetadata") === "true" || defaults.showMetadata,
      exportFormat: searchParams.get("exportFormat") || defaults.exportFormat,
    };
  }, [searchParams]);

  const hasActiveFilters = appliedFilters.length > 0;

  // Открытие/закрытие модального окна
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Enhanced filter handling - обрабатывает общие И специфичные фильтры
  const handleApplyFilters = (
    generalFilters: Record<string, FilterValue>,
    specificFilters: Record<string, FilterValue>,
  ) => {
    const params = new URLSearchParams(searchParams);

    // Очищаем старые параметры
    clearFilterParams(params);

    // Устанавливаем общие и специфичные фильтры
    setGeneralFilterParams(params, generalFilters);
    setSpecificFilterParams(params, specificFilters);

    startTransition(() => {
      router.push(`?${params.toString()}`);
      setIsModalOpen(false);
    });
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams);

    // Удаляем ВСЕ параметры фильтров
    params.delete("dateStart");
    params.delete("dateEnd");
    params.delete("partners");
    params.delete("campaigns");
    params.delete("countries");
    params.delete("os");
    params.delete("cohortStep");
    params.delete("metric");
    params.delete("breakpoints");
    params.delete("showMetadata");
    params.delete("exportFormat");

    startTransition(() => {
      router.push(`?${params.toString()}`);
      setIsModalOpen(false);
    });
  };

  const handleRemoveFilter = (filterId: string) => {
    const params = new URLSearchParams(searchParams);

    if (filterId === "dateRange") {
      params.delete("dateStart");
      params.delete("dateEnd");
    } else {
      params.delete(filterId);
    }

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  // Возвращаем JSX вместо объекта
  return (
    <>
      {/* Universal Report Header */}
      <ReportHeader
        title="Cohorts"
        description="Cohort analysis and user retention tracking"
        filterButton={<FilterButton onClick={handleOpenModal} hasActiveFilters={hasActiveFilters} />}
        filterChips={
          hasActiveFilters ? (
            <div className="flex items-center gap-2">
              {/* Loading indicator */}
              {isPending && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  <span>Applying filters...</span>
                </div>
              )}

              {/* Filter Chips */}
              <FilterChips
                appliedFilters={appliedFilters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearFilters}
                className="w-full"
              />
            </div>
          ) : null
        }
      />

      {/* Filter Modal */}
      <EnhancedFilterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleApplyFilters}
        onClear={handleClearFilters}
        generalFilters={generalFilterDefinitions}
        specificFilters={cohortSpecificFilters}
        currentGeneralFilters={currentGeneralFilters}
        currentSpecificFilters={currentSpecificFilters}
        title="Filter Cohort Analysis"
      />
    </>
  );
}
