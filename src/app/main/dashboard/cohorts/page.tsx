import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportHeader } from "@/components/reports/universal/report-header";
import { CohortDataService } from "@/lib/reports/cohort/cohort-data-service";
import { CohortTable } from "./components/cohort-table";
import { CohortFiltersWrapper } from "./components/cohort-filters-wrapper";
import { CohortMetadata } from "./components/cohort-metadata";

// Types for cohort metrics
type CohortMetric = 'dep2cost' | 'roas' | 'adpu' | 'retention';

interface PageProps {
  searchParams: Promise<{
    metric?: CohortMetric;
    dateStart?: string;
    dateEnd?: string;
    partners?: string;
    campaigns?: string;
    countries?: string;
    os?: string;
    mode?: 'day' | 'week';
  }>;
}

// Server Component для страницы когорт
export default async function CohortsPage({ searchParams }: PageProps) {
  // В Next.js 15 searchParams теперь Promise
  const params = await searchParams;
  
  // Извлекаем параметры с дефолтными значениями
  const metric = params.metric || 'retention';
  const mode = params.mode || 'day';
  
  const filters = {
    dateStart: params.dateStart || new Date('2024-01-01').toISOString(),
    dateEnd: params.dateEnd || new Date('2024-12-31').toISOString(),
    partners: params.partners?.split(',') || [],
    campaigns: params.campaigns?.split(',') || [],
    countries: params.countries?.split(',') || [],
    os: params.os?.split(',') || [],
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Universal Report Header с Client Component wrapper */}
      <CohortFiltersWrapper currentFilters={filters} />

      {/* Tabs Layout следуя Report-Factory-Architecture-Guide */}
      <Tabs value={metric} className="w-full">
        <div className="flex items-center justify-between">
          <div />
          <TabsList className="ml-auto">
            <TabsTrigger value="retention">Retention</TabsTrigger>
            <TabsTrigger value="dep2cost">Dep2Cost</TabsTrigger>
            <TabsTrigger value="roas">ROAS</TabsTrigger>
            <TabsTrigger value="adpu">ADPU</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content с pt-2 padding как в паттерне */}
        <div className="pt-2">
          <Suspense fallback={<CohortLoadingSkeleton />}>
            <TabsContent value="retention" className="mt-0">
              <CohortMetricSection 
                metric="retention" 
                filters={filters} 
                mode={mode} 
              />
            </TabsContent>
            <TabsContent value="dep2cost" className="mt-0">
              <CohortMetricSection 
                metric="dep2cost" 
                filters={filters} 
                mode={mode} 
              />
            </TabsContent>
            <TabsContent value="roas" className="mt-0">
              <CohortMetricSection 
                metric="roas" 
                filters={filters} 
                mode={mode} 
              />
            </TabsContent>
            <TabsContent value="adpu" className="mt-0">
              <CohortMetricSection 
                metric="adpu" 
                filters={filters} 
                mode={mode} 
              />
            </TabsContent>
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
}

// Server Component для отдельной метрики
async function CohortMetricSection({
  metric,
  filters,
  mode
}: {
  metric: CohortMetric;
  filters: any;
  mode: 'day' | 'week';
}) {
  try {
    // Используем существующий Cohort Data Engine из Task 2
    const cohortService = new CohortDataService();
    const breakpoints = mode === 'day' 
      ? [1, 3, 5, 7, 14, 17, 21, 24, 27, 30]
      : [7, 14, 21, 28, 35, 42];
      
    const result = await cohortService.getCohortData({
      metric,
      filters,
      mode,
      breakpoints
    });

    if (!result.success) {
      return (
        <div className="rounded-lg border p-6 text-center">
          <div className="text-red-500 mb-2">
            <h3 className="font-medium">Error loading {metric} data</h3>
            <p className="text-sm">{result.error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Metadata */}
        {result.metadata && (
          <CohortMetadata metadata={result.metadata} mode={mode} />
        )}

        {/* Cohort Table */}
        <div className="rounded-lg border">
          <CohortTable 
            data={result.data || []} 
            metric={metric}
            mode={mode}
          />
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <div className="text-red-500">
          <h3 className="font-medium">Server Error</h3>
          <p className="text-sm">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }
}

// Loading skeleton
function CohortLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-muted rounded animate-pulse" />
      <div className="rounded-lg border">
        <div className="p-6">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
