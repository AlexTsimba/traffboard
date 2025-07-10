import { CohortProcessor } from "@/lib/reports/cohort/cohort-processor";
import type { CohortConfig, CohortMode, CohortMetric, AppliedFilter, FilterValue } from "@/types/reports";

// Service для интеграции с существующим PostgreSQL-Arquero pipeline
export class CohortDataService {
  
  async getCohortData({
    metric,
    filters,
    mode,
    breakpoints
  }: {
    metric: string;
    filters: {
      dateStart: string;
      dateEnd: string;
      partners?: string[];
      campaigns?: string[];
      countries?: string[];
      os?: string[];
    };
    mode: 'day' | 'week';
    breakpoints: number[];
  }) {
    const startTime = Date.now();
    
    try {
      console.log('🔄 CohortDataService.getCohortData called with:', { metric, mode, breakpoints });

      // ВРЕМЕННО: Используем мок-данные для быстрого тестирования UI
      // TODO: Заменить на реальный CohortProcessor когда настроена БД
      const mockData = this.generateMockCohortData(metric, mode, breakpoints);
      
      const processingTime = Date.now() - startTime;
      console.log('✅ Mock data generated in', processingTime, 'ms');

      return {
        success: true,
        data: mockData,
        metadata: {
          totalCohorts: mockData.length,
          processingTime,
          breakpointsUsed: breakpoints,
          queryHash: this.generateQueryHash(filters, metric, mode),
          mode,
          metric
        }
      };

      // РЕАЛЬНАЯ РЕАЛИЗАЦИЯ (закомментирована для тестирования UI):
      /*
      // Создаем конфигурацию когорты для CohortProcessor
      const cohortConfig: CohortConfig = {
        mode: mode as CohortMode,
        metric: this.mapMetricName(metric),
        breakpoints,
        dateRange: {
          start: new Date(filters.dateStart),
          end: new Date(filters.dateEnd)
        },
        filters: this.convertToFilterValues(filters)
      };

      // Конвертируем фильтры в формат AppliedFilter
      const appliedFilters = this.convertToAppliedFilters(filters);

      // Создаем CohortProcessor с правильными опциями
      const processor = new CohortProcessor(cohortConfig, {
        usePipelineMode: true,
        batchSize: 100,
        maxConcurrency: 4,
        parallelProcessing: true
      });

      // Используем существующий Cohort Processor из Task 2
      const result = await processor.processCohorts(appliedFilters);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: result.cohorts,
        metadata: {
          totalCohorts: result.cohorts?.length || 0,
          processingTime,
          breakpointsUsed: breakpoints,
          queryHash: this.generateQueryHash(filters, metric, mode),
          mode,
          metric
        }
      };
      */
    } catch (error) {
      console.error('❌ CohortDataService Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        metadata: null
      };
    }
  }

  // Генерируем мок-данные для тестирования UI
  private generateMockCohortData(metric: string, mode: 'day' | 'week', breakpoints: number[]) {
    const mockData = [];
    const today = new Date();
    
    // Создаем 10 строк мок-данных
    for (let i = 0; i < 10; i++) {
      const cohortDate = new Date(today);
      cohortDate.setDate(today.getDate() - i * 7); // Каждая неделя назад
      
      const row: any = {
        cohort_date: cohortDate.toISOString(),
        initial_players: Math.floor(Math.random() * 1000) + 100,
        total_players: Math.floor(Math.random() * 1000) + 100,
        avg_deposit_sum: (Math.random() * 100 + 20).toFixed(2)
      };

      // Добавляем данные для каждого breakpoint
      breakpoints.forEach(bp => {
        const fieldPrefix = mode === 'day' ? 'day' : 'week';
        const fieldSuffix = mode === 'day' ? bp : bp / 7;
        
        switch (metric) {
          case 'retention':
            row[`${fieldPrefix}${fieldSuffix}_retention`] = Math.random() * 0.5 + 0.1; // 10-60%
            break;
          case 'dep2cost':
            row[`${fieldPrefix}${fieldSuffix}_dep2cost`] = Math.random() * 50 + 10; // 10-60%
            break;
          case 'roas':
            row[`${fieldPrefix}${fieldSuffix}_roas`] = Math.random() * 3 + 0.5; // 0.5-3.5x
            break;
          case 'adpu':
            row[`${fieldPrefix}${fieldSuffix}_adpu`] = Math.random() * 200 + 50; // $50-250
            break;
        }
      });

      mockData.push(row);
    }

    return mockData;
  }

  private mapMetricName(metric: string): CohortMetric {
    // Маппинг названий метрик в соответствии с типами
    switch (metric) {
      case 'retention':
        return 'retention_rate';
      case 'adpu':
        return 'avg_deposit_sum';
      case 'dep2cost':
        return 'dep2cost';
      case 'roas':
        return 'roas';
      default:
        return 'retention_rate';
    }
  }

  private convertToFilterValues(filters: any): Record<string, FilterValue> {
    return {
      partners: filters.partners || [],
      campaigns: filters.campaigns || [],
      countries: filters.countries || [],
      os: filters.os || []
    };
  }

  private convertToAppliedFilters(filters: any): AppliedFilter[] {
    const appliedFilters: AppliedFilter[] = [];

    // Date Range Filter
    appliedFilters.push({
      id: 'dateRange',
      definition: {
        id: 'dateRange',
        label: 'Date Range',
        type: 'daterange'
      },
      value: {
        start: filters.dateStart,
        end: filters.dateEnd
      },
      displayText: `${new Date(filters.dateStart).toLocaleDateString()} - ${new Date(filters.dateEnd).toLocaleDateString()}`,
      label: 'Date Range',
      displayValue: `${new Date(filters.dateStart).toLocaleDateString()} - ${new Date(filters.dateEnd).toLocaleDateString()}`
    });

    // Partners Filter
    if (filters.partners?.length > 0) {
      appliedFilters.push({
        id: 'partners',
        definition: {
          id: 'partners',
          label: 'Partners',
          type: 'multiselect'
        },
        value: filters.partners,
        displayText: filters.partners.join(', '),
        label: 'Partners',
        displayValue: filters.partners.join(', ')
      });
    }

    // Campaigns Filter
    if (filters.campaigns?.length > 0) {
      appliedFilters.push({
        id: 'campaigns', 
        definition: {
          id: 'campaigns',
          label: 'Campaigns',
          type: 'multiselect'
        },
        value: filters.campaigns,
        displayText: filters.campaigns.join(', '),
        label: 'Campaigns',
        displayValue: filters.campaigns.join(', ')
      });
    }

    // Countries Filter
    if (filters.countries?.length > 0) {
      appliedFilters.push({
        id: 'countries',
        definition: {
          id: 'countries',
          label: 'Countries',
          type: 'multiselect'
        },
        value: filters.countries,
        displayText: filters.countries.join(', '),
        label: 'Countries',
        displayValue: filters.countries.join(', ')
      });
    }

    // OS Filter
    if (filters.os?.length > 0) {
      appliedFilters.push({
        id: 'os',
        definition: {
          id: 'os',
          label: 'OS',
          type: 'multiselect'
        },
        value: filters.os,
        displayText: filters.os.join(', '),
        label: 'OS',
        displayValue: filters.os.join(', ')
      });
    }

    return appliedFilters;
  }

  private generateQueryHash(filters: any, metric: string, mode: string): string {
    const hash = JSON.stringify({ filters, metric, mode });
    return Buffer.from(hash).toString('base64').slice(0, 8);
  }

  // Метод для получения доступных метрик
  getAvailableMetrics() {
    return [
      {
        key: 'retention',
        label: 'Retention',
        description: 'User retention analysis',
        unit: '%',
        format: (value: number) => `${(value * 100).toFixed(1)}%`
      },
      {
        key: 'dep2cost',
        label: 'Dep2Cost',
        description: 'Deposit to Cost ratio analysis',
        unit: '%',
        format: (value: number) => `${value.toFixed(1)}%`
      },
      {
        key: 'roas',
        label: 'ROAS',
        description: 'Return on Ad Spend analysis',
        unit: 'x',
        format: (value: number) => `${value.toFixed(2)}x`
      },
      {
        key: 'adpu',
        label: 'ADPU',
        description: 'Average Deposit Per User analysis',
        unit: '$',
        format: (value: number) => `$${value.toFixed(2)}`
      }
    ];
  }

  // Метод для получения конфигурации breakpoints
  getBreakpointsConfig(mode: 'day' | 'week') {
    return {
      day: [1, 3, 5, 7, 14, 17, 21, 24, 27, 30],
      week: [7, 14, 21, 28, 35, 42]
    }[mode];
  }
}
