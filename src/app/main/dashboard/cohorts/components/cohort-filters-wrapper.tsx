'use client';

import { ReportHeader } from "@/components/reports/universal/report-header";
import { CohortFilters } from "./cohort-filters";

interface CohortFiltersWrapperProps {
  currentFilters: {
    dateStart: string;
    dateEnd: string;
    partners: string[];
    campaigns: string[];
    countries: string[];
    os: string[];
  };
}

/**
 * Client Component wrapper для CohortFilters
 * Необходим для использования в Server Component
 */
export function CohortFiltersWrapper({ currentFilters }: CohortFiltersWrapperProps) {
  // Используем компонент CohortFilters напрямую
  return (
    <CohortFilters currentFilters={currentFilters} />
  );
}
