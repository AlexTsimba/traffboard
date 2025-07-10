"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useTransition } from "react";

import { EnhancedFilterModal } from "@/components/reports/filters/enhanced-filter-modal";
import { FilterButton, FilterChips, createFilterComposer } from "@/components/reports/filters/filter-system";
import { ReportHeader } from "@/components/reports/universal/report-header";
import {
  createCohortSpecificFilters,
  getDefaultCohortSpecificValues,
} from "@/lib/reports/cohort/cohort-specific-filters";
import type { FilterDefinition, FilterValue, AppliedFilter } from "@/types/reports";

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
    const dateStart = searchParams.get("dateStart");
    const dateEnd = searchParams.get("dateEnd");
    if (dateStart && dateEnd) {
      const dateRangeDefinition = generalFilterDefinitions.find((def) => def.id === "dateRange");
      if (dateRangeDefinition) {
        filters.push({
          id: "dateRange",
          definition: dateRangeDefinition,
          value: { start: new Date(dateStart), end: new Date(dateEnd) },
          displayText: `${formatDateConsistently(dateStart)} - ${formatDateConsistently(dateEnd)}`,
        });
      }
    }

    // 2. Partners
    const partners = searchParams.get("partners");
    if (partners) {
      const partnersDefinition = generalFilterDefinitions.find((def) => def.id === "partners");
      if (partnersDefinition) {
        filters.push({
          id: "partners",
          definition: partnersDefinition,
          value: partners.split(","),
          displayText: partners.split(",").join(", "),
        });
      }
    }

    // 3. Campaigns
    const campaigns = searchParams.get("campaigns");
    if (campaigns) {
      const campaignsDefinition = generalFilterDefinitions.find((def) => def.id === "campaigns");
      if (campaignsDefinition) {
        filters.push({
          id: "campaigns",
          definition: campaignsDefinition,
          value: campaigns.split(","),
          displayText: campaigns.split(",").join(", "),
        });
      }
    }

    // 4. Countries
    const countries = searchParams.get("countries");
    if (countries) {
      const countriesDefinition = generalFilterDefinitions.find((def) => def.id === "countries");
      if (countriesDefinition) {
        filters.push({
          id: "countries",
          definition: countriesDefinition,
          value: countries.split(","),
          displayText: countries.split(",").join(", "),
        });
      }
    }

    // 5. OS (последний)
    const os = searchParams.get("os");
    if (os) {
      const osDefinition = generalFilterDefinitions.find((def) => def.id === "os");
      if (osDefinition) {
        filters.push({
          id: "os",
          definition: osDefinition,
          value: os.split(","),
          displayText: os.split(",").join(", "),
        });
      }
    }

    // 6. Добавляем специфичные фильтры когорт в чипсы
    const cohortStep = searchParams.get("cohortStep");
    if (cohortStep && cohortStep !== "day") {
      // показываем только если не дефолт
      const cohortStepDefinition = cohortSpecificFilters.filters.find((def) => def.id === "cohortStep");
      if (cohortStepDefinition) {
        filters.push({
          id: "cohortStep",
          definition: cohortStepDefinition,
          value: cohortStep,
          displayText: cohortStep === "week" ? "Weekly" : "Daily",
        });
      }
    }

    const metric = searchParams.get("metric");
    if (metric && metric !== "retention") {
      // показываем только если не дефолт
      const metricDefinition = cohortSpecificFilters.filters.find((def) => def.id === "metric");
      const metricLabels = {
        retention: "Retention",
        dep2cost: "Dep2Cost",
        roas: "ROAS",
        adpu: "ADPU",
      };
      if (metricDefinition) {
        filters.push({
          id: "metric",
          definition: metricDefinition,
          value: metric,
          displayText: metricLabels[metric as keyof typeof metricLabels] || metric,
        });
      }
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

    // Устанавливаем общие фильтры
    for (const [key, value] of Object.entries(generalFilters)) {
      if (key === "dateRange" && value && typeof value === "object") {
        const dateRange = value as { start: string | Date; end: string | Date };
        const startISO = typeof dateRange.start === "string" ? dateRange.start : dateToISOString(dateRange.start);
        const endISO = typeof dateRange.end === "string" ? dateRange.end : dateToISOString(dateRange.end);
        params.set("dateStart", startISO);
        params.set("dateEnd", endISO);
      } else if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(","));
      } else if (typeof value === "string" && value.trim()) {
        params.set(key, value);
      }
    }

    // Устанавливаем специфичные фильтры
    for (const [key, value] of Object.entries(specificFilters)) {
      if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(","));
      } else if (typeof value === "boolean") {
        params.set(key, value.toString());
      } else if (typeof value === "string" && value.trim()) {
        params.set(key, value);
      }
    }

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
