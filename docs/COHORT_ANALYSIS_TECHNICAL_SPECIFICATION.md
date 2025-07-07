# TraffBoard Cohort Analysis - Technical Specification

## 1. OVERVIEW

### 1.1 Purpose
Implementation of cohort analysis dashboard for affiliate/gambling analytics with enterprise-grade performance and scalability. Built for MVP delivery within existing TraffBoard architecture with systematic approach for future reporting features.

### 1.2 Scope
- Cohort analysis with signup/FTD attribution modes
- Day/week aggregation modes with configurable breakpoints
- Four core metrics: Dep2Cost, ROAS, Avg Deposit Sum, Avg Deposit Count
- Cohort saving/comparison functionality
- Performance-optimized for gambling industry data volumes

### 1.3 Technical Context
- **Stack**: Next.js 15 + Prisma + PostgreSQL + Arquero + TypeScript
- **Architecture**: Server Components + Server Actions + unstable_cache
- **Data Source**: Existing PlayerData model (35 fields, daily aggregates)
- **Performance Target**: <5 seconds for cohort calculations, <1 second for cached results

## 2. DATA ARCHITECTURE

### 2.1 Source Data Model
```sql
-- PlayerData (existing schema)
model PlayerData {
  playerId            String
  signUpDate          DateTime?
  firstDepositDate    DateTime?
  date                DateTime
  depositsSum         Decimal   @db.Decimal(10,2)
  depositsCount       Int
  fixedPerPlayer      Decimal   @db.Decimal(10,2)
  casinoRealNgr       Decimal   @db.Decimal(10,2)
  partnerId           String
  campaignId          String
  tagOs               String?
  tagSource           String?
  tagClickid          String?
  tagSub2             String?
  tagWebId            String?
  
  @@unique([playerId, date])
  @@index([signUpDate, partnerId, campaignId, date])
}
```

### 2.2 Cohort Data Mapping
```typescript
interface CohortDataSource {
  cohort_start_date: Date;    // signUpDate | firstDepositDate
  event_date: Date;           // date
  age_days: number;           // date - cohort_start_date
  deposit_sum: number;        // depositsSum
  deposit_count: number;      // depositsCount
  fixed_costs: number;        // fixedPerPlayer
  ngr: number;               // casinoRealNgr
  partner_id: string;        // partnerId
  campaign_id: string;       // campaignId
  player_id: string;         // playerId
}
```

### 2.3 Performance Optimization Layer
```sql
-- Materialized view for cohort base data
CREATE MATERIALIZED VIEW cohort_base AS
SELECT 
  playerId as player_id,
  signUpDate as signup_cohort_date,
  firstDepositDate as ftd_cohort_date,
  date as event_date,
  EXTRACT(DAY FROM date - signUpDate) as signup_age_days,
  EXTRACT(DAY FROM date - firstDepositDate) as ftd_age_days,
  depositsSum as deposit_sum,
  depositsCount as deposit_count,
  fixedPerPlayer as fixed_costs,
  casinoRealNgr as ngr,
  partnerId as partner_id,
  campaignId as campaign_id,
  tagOs, tagSource, tagClickid
FROM PlayerData
WHERE date >= COALESCE(signUpDate, firstDepositDate);

-- Optimized indexes
CREATE INDEX idx_cohort_signup ON cohort_base (signup_cohort_date, partner_id, campaign_id);
CREATE INDEX idx_cohort_ftd ON cohort_base (ftd_cohort_date, partner_id, campaign_id);
CREATE INDEX idx_cohort_age ON cohort_base (signup_age_days, ftd_age_days);
```

## 3. BUSINESS LOGIC SPECIFICATION

### 3.1 Cohort Configuration
```typescript
interface CohortConfig {
  cohort_type: 'signup' | 'ftd';
  mode: 'day' | 'week';
  start_date: Date;
  end_date: Date;
  breakpoints: number[];
  filters: {
    partner_ids?: string[];
    campaign_ids?: string[];
    os_tags?: string[];
    source_tags?: string[];
  };
}

// Default breakpoints
const DAY_BREAKPOINTS = [1, 3, 5, 7, 14, 17, 21, 24, 27, 30];
const WEEK_BREAKPOINTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
```

### 3.2 Age Calculation Logic
```sql
-- Day mode
age_days = EXTRACT(DAY FROM event_date - cohort_start_date)

-- Week mode (Monday as week start)
age_weeks = EXTRACT(WEEK FROM event_date - 
  DATE_TRUNC('week', cohort_start_date + INTERVAL '1 day') - INTERVAL '1 day')
```

### 3.3 Breakpoint Mapping
```typescript
function mapToBreakpoints(age: number, breakpoints: number[]): number {
  for (const bp of breakpoints.sort((a, b) => a - b)) {
    if (age <= bp) return bp;
  }
  return breakpoints[breakpoints.length - 1];
}
```

### 3.4 Cumulative Metrics Calculation
```sql
WITH cohort_data AS (
  SELECT 
    cohort_start_date,
    age_breakpoint,
    player_id,
    SUM(deposit_sum) OVER (
      PARTITION BY player_id, cohort_start_date 
      ORDER BY age_days 
      ROWS UNBOUNDED PRECEDING
    ) as cum_deposit_sum,
    SUM(deposit_count) OVER (
      PARTITION BY player_id, cohort_start_date 
      ORDER BY age_days 
      ROWS UNBOUNDED PRECEDING
    ) as cum_deposit_count,
    SUM(fixed_costs) OVER (
      PARTITION BY player_id, cohort_start_date 
      ORDER BY age_days 
      ROWS UNBOUNDED PRECEDING
    ) as cum_fixed_costs,
    SUM(ngr) OVER (
      PARTITION BY player_id, cohort_start_date 
      ORDER BY age_days 
      ROWS UNBOUNDED PRECEDING
    ) as cum_ngr
  FROM cohort_base_filtered
),
cohort_aggregates AS (
  SELECT 
    cohort_start_date,
    age_breakpoint,
    SUM(cum_deposit_sum) as total_deposit_sum,
    SUM(cum_deposit_count) as total_deposit_count,
    SUM(cum_fixed_costs) as total_fixed_costs,
    SUM(cum_ngr) as total_ngr,
    COUNT(DISTINCT player_id) as cohort_size
  FROM cohort_data
  GROUP BY cohort_start_date, age_breakpoint
)
SELECT 
  cohort_start_date,
  age_breakpoint,
  -- Core metrics
  CASE 
    WHEN total_fixed_costs > 0 
    THEN (total_deposit_sum / total_fixed_costs * 100)::DECIMAL(10,2)
    ELSE 0 
  END as dep2cost,
  CASE 
    WHEN total_fixed_costs > 0 
    THEN (total_ngr / total_fixed_costs * 100)::DECIMAL(10,2)
    ELSE 0 
  END as roas,
  CASE 
    WHEN cohort_size > 0 
    THEN (total_deposit_sum / cohort_size)::DECIMAL(10,2)
    ELSE 0 
  END as avg_deposit_sum,
  CASE 
    WHEN cohort_size > 0 
    THEN (total_deposit_count::DECIMAL / cohort_size)::DECIMAL(5,1)
    ELSE 0 
  END as avg_deposit_count,
  cohort_size
FROM cohort_aggregates
ORDER BY cohort_start_date, age_breakpoint;
```

## 4. TECHNICAL ARCHITECTURE

### 4.1 System Architecture
```
PostgreSQL → Materialized Views → Arquero (Server) → unstable_cache → Server Components → Streaming UI
```

### 4.2 Performance Strategy
**Level 1: Database Optimization**
- Materialized view for pre-aggregated cohort base data
- Optimized indexes on cohort date + filter combinations
- Query optimization with proper JOIN strategies

**Level 2: Application Caching**
- Next.js unstable_cache for cohort results (5-10 minutes TTL)
- Tag-based cache invalidation by partner/campaign
- Graduated cache TTL based on data age

**Level 3: Computation Optimization**
- Arquero for flexible metric calculations on server
- Streaming responses for large cohort calculations
- Background job queue for heavy operations

### 4.3 Server Actions Implementation
```typescript
// app/actions/cohort-actions.ts
'use server';

import { unstable_cache } from 'next/cache';
import { table } from 'arquero';

export const calculateCohort = unstable_cache(
  async (config: CohortConfig): Promise<CohortResult> => {
    // 1. PostgreSQL query for base data
    const baseData = await prisma.$queryRaw<CohortDataSource[]>`
      SELECT * FROM cohort_base 
      WHERE ${config.cohort_type}_cohort_date BETWEEN ${config.start_date} AND ${config.end_date}
      AND partner_id = ANY(${config.filters.partner_ids})
      AND ${config.cohort_type}_age_days >= 0
    `;
    
    // 2. Arquero processing for breakpoints and metrics
    const dt = table(baseData);
    const processed = dt
      .derive({
        age_breakpoint: d => mapToBreakpoints(
          config.mode === 'day' ? d.signup_age_days : Math.floor(d.signup_age_days / 7),
          config.breakpoints
        )
      })
      .filter(d => config.breakpoints.includes(d.age_breakpoint))
      .groupby('cohort_start_date', 'age_breakpoint')
      .rollup({
        total_deposit_sum: d => op.sum(d.deposit_sum),
        total_deposit_count: d => op.sum(d.deposit_count),
        total_fixed_costs: d => op.sum(d.fixed_costs),
        total_ngr: d => op.sum(d.ngr),
        cohort_size: d => op.count()
      })
      .derive({
        dep2cost: d => d.total_fixed_costs > 0 ? (d.total_deposit_sum / d.total_fixed_costs * 100) : 0,
        roas: d => d.total_fixed_costs > 0 ? (d.total_ngr / d.total_fixed_costs * 100) : 0,
        avg_deposit_sum: d => d.cohort_size > 0 ? (d.total_deposit_sum / d.cohort_size) : 0,
        avg_deposit_count: d => d.cohort_size > 0 ? (d.total_deposit_count / d.cohort_size) : 0
      });
    
    return {
      data: processed.objects(),
      config,
      generated_at: new Date(),
      cache_ttl: 300000 // 5 minutes
    };
  },
  ['cohort-analysis'],
  { 
    revalidate: 300,
    tags: (config) => [
      'cohorts',
      `cohort-${config.cohort_type}`,
      ...config.filters.partner_ids?.map(id => `partner-${id}`) || []
    ]
  }
);
```

### 4.4 URL-Based Routing Strategy
```typescript
// app/cohorts/[partner]/[campaign]/[cohort_type]/[mode]/[date_range]/page.tsx
interface CohortPageParams {
  partner: string;
  campaign: string;
  cohort_type: 'signup' | 'ftd';
  mode: 'day' | 'week';
  date_range: string; // '2024-01-01-to-2024-12-31'
}

export default async function CohortPage({ params }: { params: CohortPageParams }) {
  const config = parseCohortParams(params);
  const cohortData = await calculateCohort(config);
  
  return (
    <div>
      <CohortFilters initialConfig={config} />
      <Suspense fallback={<CohortTableSkeleton />}>
        <CohortTable data={cohortData} />
      </Suspense>
    </div>
  );
}
```

## 5. REPORTING FACTORY ARCHITECTURE

### 5.1 Extensible Report Framework
```typescript
interface ReportDefinition {
  reportType: 'cohort' | 'funnel' | 'retention' | 'attribution';
  dataSources: string[];
  filters: FilterConfig[];
  metrics: MetricDefinition[];
  aggregations: AggregationConfig[];
  visualizations: VisualizationType[];
  cacheStrategy: CacheConfig;
}

interface MetricDefinition {
  name: string;
  formula: string;
  format: 'percentage' | 'currency' | 'number' | 'decimal';
  dependencies: string[];
}

// Cohort-specific implementation
const COHORT_REPORT: ReportDefinition = {
  reportType: 'cohort',
  dataSources: ['cohort_base'],
  filters: ['partner', 'campaign', 'cohort_type', 'date_range'],
  metrics: [
    { name: 'dep2cost', formula: 'deposit_sum / fixed_costs * 100', format: 'percentage' },
    { name: 'roas', formula: 'ngr / fixed_costs * 100', format: 'percentage' },
    { name: 'avg_deposit_sum', formula: 'deposit_sum / cohort_size', format: 'currency' },
    { name: 'avg_deposit_count', formula: 'deposit_count / cohort_size', format: 'decimal' }
  ],
  aggregations: ['cumulative_sum', 'breakpoint_grouping'],
  visualizations: ['heatmap_table', 'line_chart'],
  cacheStrategy: { ttl: 300, tags: ['cohorts', 'partner_based'] }
};
```

### 5.2 Reusable Components
```typescript
// Universal filter system
interface UniversalFilterProps {
  definition: FilterConfig[];
  onChange: (filters: FilterValues) => void;
  initialValues?: FilterValues;
}

// Metric calculation engine
class MetricCalculator {
  calculate(data: any[], metrics: MetricDefinition[]): CalculatedMetrics {
    return metrics.reduce((acc, metric) => {
      acc[metric.name] = this.evaluateFormula(metric.formula, data);
      return acc;
    }, {});
  }
}

// Report table component
interface ReportTableProps {
  data: any[];
  metrics: MetricDefinition[];
  groupBy: string[];
  formatters: Record<string, Formatter>;
}
```

### 5.3 Development Process Optimization
```typescript
// Report generator CLI tool
interface ReportGeneratorConfig {
  reportName: string;
  dataSource: string;
  metrics: string[];
  filters: string[];
  defaultBreakpoints?: number[];
}

// Auto-generates:
// - Server Action for data processing
// - React components for UI
// - Type definitions
// - Test suites
// - Documentation
```

## 6. TESTING STRATEGY

### 6.1 Unit Tests
```typescript
// Metric calculation tests
describe('CohortMetrics', () => {
  test('calculates dep2cost correctly', () => {
    const data = [
      { deposit_sum: 1000, fixed_costs: 500 },
      { deposit_sum: 2000, fixed_costs: 800 }
    ];
    expect(calculateDep2Cost(data)).toBe(187.5); // 3000/1300*100
  });
  
  test('handles zero division in ROAS', () => {
    const data = [{ ngr: 100, fixed_costs: 0 }];
    expect(calculateROAS(data)).toBe(0);
  });
});

// Breakpoint mapping tests
describe('BreakpointMapping', () => {
  test('maps age to correct breakpoint', () => {
    expect(mapToBreakpoints(5, [1,3,7,14])).toBe(7);
    expect(mapToBreakpoints(15, [1,3,7,14])).toBe(14);
  });
});
```

### 6.2 Integration Tests
```typescript
// Database query tests with real PostgreSQL
describe('CohortQueries', () => {
  beforeEach(async () => {
    await seedTestData();
  });
  
  test('cohort base query returns expected structure', async () => {
    const result = await prisma.$queryRaw`SELECT * FROM cohort_base LIMIT 1`;
    expect(result[0]).toMatchObject({
      player_id: expect.any(String),
      signup_cohort_date: expect.any(Date),
      signup_age_days: expect.any(Number)
    });
  });
});

// Arquero processing tests
describe('ArqueroProcessing', () => {
  test('processes cohort data correctly', () => {
    const testData = generateTestCohortData();
    const result = processCohortWithArquero(testData, testConfig);
    expect(result.data).toHaveLength(expectedLength);
    expect(result.data[0].dep2cost).toBeCloseTo(expectedValue, 2);
  });
});
```

### 6.3 Performance Tests
```typescript
// Load testing for large datasets
describe('CohortPerformance', () => {
  test('processes 100k records within 5 seconds', async () => {
    const startTime = Date.now();
    await calculateCohort(largeDatasetConfig);
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000);
  });
  
  test('cache hit returns within 100ms', async () => {
    await calculateCohort(testConfig); // Prime cache
    const startTime = Date.now();
    await calculateCohort(testConfig); // Cache hit
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(100);
  });
});
```

### 6.4 E2E Tests with Playwright
```typescript
test('cohort analysis workflow', async ({ page }) => {
  await page.goto('/cohorts');
  
  // Set filters
  await page.selectOption('[data-testid=partner-select]', 'partner-123');
  await page.selectOption('[data-testid=campaign-select]', 'campaign-456');
  await page.click('[data-testid=cohort-type-signup]');
  
  // Wait for results
  await expect(page.locator('[data-testid=cohort-table]')).toBeVisible();
  
  // Verify metrics
  const dep2costValue = await page.locator('[data-testid=dep2cost-cell-0-1]').textContent();
  expect(parseFloat(dep2costValue)).toBeGreaterThan(0);
  
  // Test cohort saving
  await page.click('[data-testid=save-cohort-button]');
  await page.fill('[data-testid=cohort-name-input]', 'Test Cohort');
  await page.click('[data-testid=confirm-save]');
  
  await expect(page.locator('text=Cohort saved successfully')).toBeVisible();
});
```

## 7. DEPLOYMENT & MONITORING

### 7.1 Environment Configuration
```typescript
// Production optimizations
const cohortCacheConfig = {
  development: { ttl: 60, tags: ['dev-cohorts'] },
  staging: { ttl: 300, tags: ['staging-cohorts'] },
  production: { ttl: 600, tags: ['prod-cohorts'] }
};

// Database connection pooling
const prismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=20'
    }
  }
};
```

### 7.2 Performance Monitoring
```typescript
// Metrics collection
interface CohortMetrics {
  query_duration_ms: number;
  cache_hit_rate: number;
  data_size_kb: number;
  user_id: string;
  cohort_config: CohortConfig;
}

// Alerts configuration
const performanceAlerts = {
  query_duration: { threshold: 10000, severity: 'warning' },
  cache_miss_rate: { threshold: 0.5, severity: 'info' },
  error_rate: { threshold: 0.05, severity: 'critical' }
};
```

### 7.3 Database Maintenance
```sql
-- Materialized view refresh schedule
-- Every 6 hours during business hours
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('refresh-cohort-base', '0 */6 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY cohort_base;');

-- Index maintenance
-- Weekly VACUUM and ANALYZE during low-traffic hours
SELECT cron.schedule('maintenance-cohort', '0 2 * * SUN', 'VACUUM ANALYZE cohort_base;');
```

## 8. DEVELOPMENT PRIORITIES

### 8.1 MVP Implementation Order
1. **Phase 1 (Week 1-2)**: Database optimization and basic cohort calculation
2. **Phase 2 (Week 3)**: Server Components and caching implementation
3. **Phase 3 (Week 4)**: UI components and filtering system
4. **Phase 4 (Week 5)**: Cohort saving/comparison and polish

### 8.2 Future Reports Preparation
- Establish filter component library
- Build metric calculation framework
- Create report template generator
- Implement universal caching strategy

### 8.3 Technical Debt Prevention
- Comprehensive TypeScript typing
- Performance benchmarking from day 1
- Automated testing at every level
- Documentation-driven development

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-07  
**Next Review**: Implementation kickoff  
**Owner**: TraffBoard Development Team