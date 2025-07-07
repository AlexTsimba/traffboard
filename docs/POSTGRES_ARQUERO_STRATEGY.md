# PostgreSQL-Arquero Strategy - Optimal Tool Division

## RESPONSIBILITY MATRIX

### PostgreSQL Strengths: Heavy Data Lifting
**Use PostgreSQL for:**
- ✅ Large dataset filtering (millions of rows)
- ✅ Date range operations and calculations  
- ✅ Basic aggregations (SUM, COUNT, AVG by groups)
- ✅ Window functions (cumulative sums, rankings)
- ✅ JOIN operations between tables
- ✅ Data type conversions and validations

### Arquero Strengths: Flexible Processing
**Use Arquero for:**
- ✅ Dynamic breakpoint mapping
- ✅ Complex metric calculations with custom formulas
- ✅ Post-processing and data transformations
- ✅ Conditional logic and business rules
- ✅ Data reshaping and pivoting
- ✅ Client-side data manipulation (when needed)

## OPTIMAL DATA PIPELINE

### Stage 1: PostgreSQL Data Preparation
```sql
-- PostgreSQL handles volume and basic aggregation
WITH cohort_base AS (
  SELECT 
    playerId,
    signUpDate as cohort_start_date,
    date as event_date,
    EXTRACT(DAY FROM date - signUpDate) as age_days,
    -- Basic aggregations PostgreSQL does best
    SUM(depositsSum) as daily_deposits,
    SUM(depositsCount) as daily_count,
    SUM(fixedPerPlayer) as daily_costs,
    SUM(casinoRealNgr) as daily_ngr,
    partnerId,
    campaignId
  FROM PlayerData 
  WHERE signUpDate BETWEEN $1 AND $2
    AND partnerId = ANY($3)
    AND date >= signUpDate  -- Essential filter
  GROUP BY playerId, signUpDate, date, partnerId, campaignId
),
player_cumulative AS (
  SELECT *,
    -- PostgreSQL excels at window functions
    SUM(daily_deposits) OVER (
      PARTITION BY playerId, cohort_start_date 
      ORDER BY age_days 
      ROWS UNBOUNDED PRECEDING
    ) as cum_deposits,
    SUM(daily_costs) OVER (
      PARTITION BY playerId, cohort_start_date 
      ORDER BY age_days 
      ROWS UNBOUNDED PRECEDING  
    ) as cum_costs,
    SUM(daily_ngr) OVER (
      PARTITION BY playerId, cohort_start_date 
      ORDER BY age_days 
      ROWS UNBOUNDED PRECEDING
    ) as cum_ngr
  FROM cohort_base
)
SELECT * FROM player_cumulative
WHERE age_days >= 0  -- Filter invalid ages
ORDER BY cohort_start_date, playerId, age_days;
```

### Stage 2: Arquero Business Logic Processing
```typescript
import { table, op } from 'arquero';

export function processCohortMetrics(
  rawData: PostgreSQLResult[], 
  config: CohortConfig
): CohortResult {
  const dt = table(rawData);
  
  // Arquero handles dynamic breakpoint mapping
  const withBreakpoints = dt.derive({
    breakpoint: d => mapToBreakpoint(d.age_days, config.breakpoints, config.mode)
  });
  
  // Arquero excels at flexible grouping and metric calculations
  const cohortMetrics = withBreakpoints
    .filter(d => config.breakpoints.includes(d.breakpoint))
    .groupby('cohort_start_date', 'breakpoint')
    .rollup({
      // Arquero handles custom metric formulas
      total_deposits: d => op.sum(d.cum_deposits),
      total_costs: d => op.sum(d.cum_costs), 
      total_ngr: d => op.sum(d.cum_ngr),
      cohort_size: d => op.count_distinct(d.playerId)
    })
    .derive({
      // Complex business logic calculations
      dep2cost: d => safeDiv(d.total_deposits, d.total_costs) * 100,
      roas: d => safeDiv(d.total_ngr, d.total_costs) * 100,
      avg_deposit: d => safeDiv(d.total_deposits, d.cohort_size),
      avg_count: d => safeDiv(d.total_count, d.cohort_size)
    });
    
  return {
    data: cohortMetrics.objects(),
    config,
    performance: {
      postgres_rows: rawData.length,
      processed_cohorts: cohortMetrics.numRows()
    }
  };
}

// Arquero helper functions
function mapToBreakpoint(age: number, breakpoints: number[], mode: string): number {
  const adjustedAge = mode === 'week' ? Math.floor(age / 7) : age;
  return breakpoints.find(bp => adjustedAge <= bp) || breakpoints[breakpoints.length - 1];
}

function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}
```

## PERFORMANCE OPTIMIZATION PATTERNS

### Pattern 1: Volume-First Processing
```typescript
// ✅ GOOD: PostgreSQL filters first, Arquero processes smaller dataset
async function getCohortData(filters: CohortFilters) {
  // PostgreSQL reduces 10M rows to 50K
  const rawData = await prisma.$queryRaw`
    SELECT ... FROM PlayerData 
    WHERE signUpDate BETWEEN ${filters.startDate} AND ${filters.endDate}
    AND partnerId = ANY(${filters.partnerIds})
  `;
  
  // Arquero processes 50K rows efficiently
  return processCohortMetrics(rawData, filters);
}

// ❌ BAD: Arquero processing large datasets
async function getFullDataset() {
  const allData = await prisma.playerData.findMany(); // 10M rows
  return table(allData).filter(d => d.partnerId === 'partner-123'); // Slow!
}
```

### Pattern 2: Staged Aggregation
```typescript
// ✅ GOOD: PostgreSQL aggregates, Arquero calculates metrics
// Stage 1: PostgreSQL daily aggregates (10M rows → 100K rows)
// Stage 2: Arquero breakpoint grouping (100K rows → 1K rows)  
// Stage 3: Arquero metric calculations (1K rows → final result)

// ❌ BAD: Single-stage processing
// All aggregation in PostgreSQL OR all processing in Arquero
```

### Pattern 3: Conditional Tool Selection
```typescript
export function calculateCohorts(config: CohortConfig) {
  const estimatedRows = estimateResultSize(config);
  
  if (estimatedRows > 100000) {
    // Heavy PostgreSQL processing for large datasets
    return calculateWithPostgreSQL(config);
  } else {
    // Hybrid approach for moderate datasets
    return calculateWithHybrid(config);
  }
}
```

## SPECIFIC USE CASES

### Cohort Analysis Breakdown
```typescript
interface ToolResponsibility {
  task: string;
  tool: 'PostgreSQL' | 'Arquero';
  reason: string;
}

const cohortTasks: ToolResponsibility[] = [
  {
    task: 'Filter by date range and partners',
    tool: 'PostgreSQL',
    reason: 'Indexes and efficient WHERE clauses'
  },
  {
    task: 'Calculate age_days from dates',
    tool: 'PostgreSQL', 
    reason: 'Native date functions and performance'
  },
  {
    task: 'Cumulative sum calculations',
    tool: 'PostgreSQL',
    reason: 'Window functions optimized for this'
  },
  {
    task: 'Map age to breakpoints [1,3,7,14,30]',
    tool: 'Arquero',
    reason: 'Dynamic array logic easier in JS'
  },
  {
    task: 'Calculate Dep2Cost = deposits/costs*100',
    tool: 'Arquero',
    reason: 'Custom formula with error handling'
  },
  {
    task: 'Format numbers and percentages',
    tool: 'Arquero',
    reason: 'Frontend formatting requirements'
  }
];
```

### Future Reports Strategy
```typescript
// Funnel Analysis: PostgreSQL for conversions, Arquero for funnel logic
// Retention Analysis: PostgreSQL for user sessions, Arquero for retention periods
// Attribution Analysis: PostgreSQL for joins, Arquero for attribution models
```

## DEVELOPMENT GUIDELINES

### When to Choose PostgreSQL
```sql
-- Volume: >10K rows to process
-- Operations: Filtering, basic aggregation, window functions
-- Data: Relational operations, complex JOINs
-- Performance: Time-sensitive operations

SELECT 
  partner_id,
  DATE_TRUNC('month', signup_date) as cohort_month,
  COUNT(*) as signup_count,
  SUM(deposits_sum) as total_deposits
FROM player_data 
WHERE signup_date >= '2024-01-01'
GROUP BY partner_id, cohort_month;
```

### When to Choose Arquero
```typescript
// Volume: <100K rows to process  
// Operations: Complex business logic, dynamic calculations
// Data: Array/object transformations, custom grouping
// Performance: Flexibility over raw speed

const result = table(data)
  .derive({
    // Dynamic business logic
    tier: d => calculatePlayerTier(d.total_deposits, d.activity_days),
    risk_score: d => calculateRiskScore(d.country, d.deposit_pattern)
  })
  .filter(d => d.tier === 'high_value')
  .groupby('partner_id', 'tier')
  .rollup({
    avg_risk: d => op.mean(d.risk_score),
    revenue_share: d => op.sum(d.revenue) / op.sum(d.total_revenue) * 100
  });
```

### Hybrid Pattern Template
```typescript
// Standard cohort calculation pattern
export async function calculateCohort(config: CohortConfig): Promise<CohortResult> {
  // 1. PostgreSQL: Heavy lifting
  const postgresQuery = buildPostgreSQLQuery(config);
  const rawData = await prisma.$queryRaw(postgresQuery);
  
  // 2. Arquero: Business logic
  const processedData = processCohortMetrics(rawData, config);
  
  // 3. Cache result
  return cacheResult(processedData, config);
}

function buildPostgreSQLQuery(config: CohortConfig): string {
  // Generate optimized SQL based on config
  // Focus on filtering and basic aggregation
}

function processCohortMetrics(data: any[], config: CohortConfig): any {
  // Handle breakpoints, metrics, formatting
  // Focus on business logic and flexibility
}
```

## PERFORMANCE BENCHMARKS

### Expected Performance Targets
```typescript
interface PerformanceBenchmarks {
  // PostgreSQL stage (1M player records)
  data_filtering: '<2 seconds';
  basic_aggregation: '<3 seconds'; 
  window_functions: '<5 seconds';
  
  // Arquero stage (50K processed records)
  breakpoint_mapping: '<200ms';
  metric_calculations: '<500ms';
  data_formatting: '<100ms';
  
  // Total pipeline
  end_to_end: '<8 seconds';
  cached_response: '<100ms';
}
```

### Optimization Checkpoints
- [ ] PostgreSQL query uses proper indexes
- [ ] Result set <100K rows before Arquero processing
- [ ] Arquero operations avoid nested loops
- [ ] Memory usage stays <500MB for processing
- [ ] Total processing time <10 seconds
- [ ] Cache hit ratio >80% for common queries

This strategy ensures each tool handles what it does best, maximizing performance while maintaining code clarity and maintainability.