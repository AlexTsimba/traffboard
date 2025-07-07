# Report Factory Foundation - TraffBoard

## OVERVIEW

Foundation architecture for scalable reporting system that supports cohorts + 4 future reports with minimal duplication. Built for reusability from day 1.

## UNIVERSAL FILTER SYSTEM

### Filter Configuration Schema
```typescript
// src/lib/reports/types/filters.ts
interface FilterDefinition {
  key: string;
  type: 'select' | 'multiselect' | 'date_range' | 'toggle';
  label: string;
  required: boolean;
  options?: FilterOption[];
  defaultValue?: any;
  dependencies?: string[]; // Other filters this depends on
}

interface FilterOption {
  value: string;
  label: string;
  metadata?: Record<string, any>;
}

// Universal filter state
interface FilterState {
  [key: string]: any;
}
```

### Filter Components Library
```typescript
// src/components/reports/filters/
- UniversalFilterProvider.tsx    // State management
- FilterSelect.tsx              // Single/multi select
- FilterDateRange.tsx           // Date range picker
- FilterToggle.tsx              // Boolean toggles
- FilterPresets.tsx             // Saved filter combinations
- FilterValidation.tsx          // Cross-filter validation
```

### Filter Implementation Pattern
```typescript
// Universal usage across all reports
const cohortFilters: FilterDefinition[] = [
  {
    key: 'partner_ids',
    type: 'multiselect',
    label: 'Partners',
    required: true,
    options: [], // Populated dynamically
  },
  {
    key: 'cohort_type',
    type: 'toggle',
    label: 'Attribution',
    required: true,
    defaultValue: 'signup',
    options: [
      { value: 'signup', label: 'Sign Up Date' },
      { value: 'ftd', label: 'First Deposit Date' }
    ]
  }
];
```

## REPORT CONFIGURATION SYSTEM

### Report Definition Schema
```typescript
// src/lib/reports/types/report-config.ts
interface ReportConfig {
  id: string;
  name: string;
  type: 'cohort' | 'funnel' | 'retention' | 'attribution';
  dataSources: string[];
  filters: FilterDefinition[];
  metrics: MetricDefinition[];
  defaultBreakpoints?: number[];
  cacheStrategy: CacheConfig;
  permissions: string[];
}

interface MetricDefinition {
  key: string;
  name: string;
  formula: string;
  format: 'percentage' | 'currency' | 'number' | 'decimal';
  precision?: number;
  dependencies: string[]; // Required data fields
}

interface CacheConfig {
  ttl: number;
  tags: string[];
  invalidationRules: string[];
}
```

### Report Registry
```typescript
// src/lib/reports/registry.ts
class ReportRegistry {
  private static reports = new Map<string, ReportConfig>();
  
  static register(config: ReportConfig): void {
    this.reports.set(config.id, config);
  }
  
  static get(id: string): ReportConfig | undefined {
    return this.reports.get(id);
  }
  
  static getByType(type: string): ReportConfig[] {
    return Array.from(this.reports.values())
      .filter(r => r.type === type);
  }
}

// Register cohort report
ReportRegistry.register({
  id: 'cohort-analysis',
  name: 'Cohort Analysis',
  type: 'cohort',
  dataSources: ['player_data'],
  filters: cohortFilters,
  metrics: cohortMetrics,
  defaultBreakpoints: [1, 3, 7, 14, 30],
  cacheStrategy: { ttl: 300, tags: ['cohorts'], invalidationRules: ['new_data'] },
  permissions: ['view_analytics']
});
```

## METRIC CALCULATION ENGINE

### Metric Processor
```typescript
// src/lib/reports/metrics/processor.ts
class MetricProcessor {
  static calculate(
    data: any[], 
    metrics: MetricDefinition[]
  ): Record<string, any> {
    return metrics.reduce((acc, metric) => {
      acc[metric.key] = this.evaluateMetric(data, metric);
      return acc;
    }, {});
  }
  
  private static evaluateMetric(data: any[], metric: MetricDefinition): any {
    // Safe formula evaluation with error handling
    try {
      return this.parseFormula(metric.formula, data);
    } catch (error) {
      console.error(`Metric calculation failed: ${metric.key}`, error);
      return 0;
    }
  }
  
  private static parseFormula(formula: string, data: any[]): number {
    // Formula parsing logic with sandboxed evaluation
    // Supports: sum(field), avg(field), count(), percentage calculations
    // Security: whitelist of allowed functions only
  }
}
```

### Predefined Metrics Library
```typescript
// src/lib/reports/metrics/library.ts
export const STANDARD_METRICS: Record<string, MetricDefinition> = {
  dep2cost: {
    key: 'dep2cost',
    name: 'Dep2Cost',
    formula: 'sum(deposit_sum) / sum(fixed_costs) * 100',
    format: 'percentage',
    precision: 2,
    dependencies: ['deposit_sum', 'fixed_costs']
  },
  roas: {
    key: 'roas',
    name: 'ROAS',
    formula: 'sum(ngr) / sum(fixed_costs) * 100',
    format: 'percentage',
    precision: 2,
    dependencies: ['ngr', 'fixed_costs']
  },
  conversion_rate: {
    key: 'conversion_rate',
    name: 'Conversion Rate',
    formula: 'count_distinct(converted_players) / count_distinct(all_players) * 100',
    format: 'percentage',
    precision: 1,
    dependencies: ['player_id', 'converted']
  }
};
```

## COMPONENT LIBRARY STRUCTURE

### Base Report Components
```typescript
// src/components/reports/base/
- ReportProvider.tsx           // Context with config + data
- ReportFilters.tsx           // Universal filter interface
- ReportTable.tsx             // Data table with metrics
- ReportChart.tsx             // Recharts integration
- ReportExport.tsx            // PDF/CSV export
- ReportSaver.tsx             // Save/load configurations
- ReportComparison.tsx        // Compare multiple reports
```

### Report-Specific Components
```typescript
// src/components/reports/cohort/
- CohortHeatmap.tsx           // Cohort-specific visualization
- CohortBreakpoints.tsx       // Breakpoint selector
- CohortComparison.tsx        // Two-cohort comparison

// Future: src/components/reports/funnel/
// Future: src/components/reports/retention/
```

### Usage Pattern
```typescript
// Any report page implementation
export default function ReportPage({ params }: { params: ReportParams }) {
  const config = ReportRegistry.get(params.reportId);
  
  return (
    <ReportProvider config={config} initialFilters={params.filters}>
      <ReportFilters />
      <Suspense fallback={<ReportSkeleton />}>
        <ReportTable />
        <ReportChart />
      </Suspense>
      <ReportExport />
    </ReportProvider>
  );
}
```

## DATA SOURCE ABSTRACTION

### Data Source Interface
```typescript
// src/lib/reports/data-sources/base.ts
interface DataSource {
  id: string;
  name: string;
  query(filters: FilterState, config: ReportConfig): Promise<any[]>;
  getAvailableFilters(): FilterDefinition[];
  validateFilters(filters: FilterState): ValidationResult;
}

class PlayerDataSource implements DataSource {
  id = 'player_data';
  name = 'Player Data';
  
  async query(filters: FilterState, config: ReportConfig): Promise<any[]> {
    // PostgreSQL query with proper filtering
    return await prisma.$queryRaw`...`;
  }
  
  getAvailableFilters(): FilterDefinition[] {
    return [
      { key: 'partner_ids', type: 'multiselect', label: 'Partners', required: true },
      { key: 'date_range', type: 'date_range', label: 'Date Range', required: true }
    ];
  }
}
```

## CACHING STRATEGY

### Universal Cache Management
```typescript
// src/lib/reports/cache/manager.ts
class ReportCacheManager {
  static generateKey(config: ReportConfig, filters: FilterState): string {
    const filterHash = this.hashFilters(filters);
    return `report:${config.id}:${filterHash}`;
  }
  
  static getTags(config: ReportConfig, filters: FilterState): string[] {
    return [
      `report:${config.id}`,
      ...config.cacheStrategy.tags,
      ...this.generateFilterTags(filters)
    ];
  }
  
  static async invalidate(tags: string[]): Promise<void> {
    // Use Next.js revalidateTag for each tag
    for (const tag of tags) {
      revalidateTag(tag);
    }
  }
}
```

## DEVELOPMENT WORKFLOW

### Report Creation Steps
1. Define FilterDefinition[] for report-specific filters
2. Define MetricDefinition[] for report-specific metrics  
3. Create DataSource implementation if needed
4. Register ReportConfig in registry
5. Create report-specific components (extend base components)
6. Add route with ReportProvider pattern

### Code Generation Potential
```bash
# Future CLI tool
npx traffboard generate-report \
  --name "Funnel Analysis" \
  --type funnel \
  --data-source player_data \
  --metrics conversion_rate,drop_off_rate \
  --filters partner,campaign,date_range
```

This foundation enables:
- Zero duplication across reports
- Consistent UX patterns
- Type safety throughout
- Performance optimization at the system level
- Easy addition of new report types