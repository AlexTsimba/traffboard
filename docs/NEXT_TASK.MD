# TraffBoard Cohort Analysis Implementation Plan

## 🎯 STRATEGIC OVERVIEW

### Context Assessment
TraffBoard project has reached a critical milestone with substantial infrastructure already in place:
- **CSV Upload System**: 90% complete with sophisticated 441-line component
- **Authentication**: Fully functional enterprise-grade system  
- **Database**: Optimized PostgreSQL with Prisma, PlayerData schema ready
- **Architecture**: Next.js 15 + Server Components + TypeScript established

### Implementation Strategy - CORRECTED AFTER DEMO
Following **daily cohort growth analysis** pattern (NOT retention):
- **PostgreSQL**: Heavy data lifting, growth calculations, daily cohort grouping
- **Arquero**: Dynamic breakpoint mapping, triangle table pivot, metric formatting
- **MVP Approach**: Core functionality first, optimized for 10K rows
- **4 Analysis Modes**: DEP2COST, ROAS, AVG DEPOSIT, PLAYER COUNT growth tracking

### Timeline Target - ACCELERATED MVP
**1.5 weeks total** for 10K rows database:
- Week 1: Core cohort engine + basic UI (7 days)
- Week 0.5: Integration + testing (3-4 days)

### Cohort Analysis Logic - CORRECTED
- **Cohort Definition**: Daily FTD cohorts (players who made first deposit on specific date)
- **Growth Metrics**: Dep2Cost, ROAS grow UPWARD over time (115% → 178%)
- **Triangle Structure**: Newer cohorts have fewer age periods
- **4 Analysis Slices**: Toggle between different growth metrics

---

## 📋 TASK 1: Complete CSV Upload System
**Priority**: CRITICAL | **Duration**: 3-5 days | **Dependencies**: None

### Objective
Finalize the existing CSV upload infrastructure to ensure solid data foundation for cohort analysis.

### 1.1 Fix API Integration Issues
- **Goal**: Ensure seamless communication between CsvUpload component and backend
- **Work**: Debug authentication headers, error handling, response parsing
- **Testing**: Upload test files with validation of database records
- **Success Criteria**: 100% successful uploads with proper error reporting

### 1.2 Add Real-Time Progress Indicators  
- **Goal**: Enhanced user experience with detailed upload feedback
- **Work**: Integrate progress streaming, status updates, ETA calculations
- **Implementation**: WebSocket or Server-Sent Events for real-time updates
- **Success Criteria**: Users see progress from 0-100% with status messages

### 1.3 Comprehensive Error Handling
- **Goal**: Graceful failure recovery with actionable user guidance
- **Work**: Categorize errors (network, validation, processing), retry logic
- **UX**: User-friendly error messages, recovery suggestions, support links
- **Success Criteria**: Users can resolve 90% of issues independently

### 1.4 End-to-End Validation
- **Goal**: Robust testing with realistic gambling industry data
- **Work**: Test with large files, various formats, edge cases
- **Performance**: Validate upload processing within acceptable timeframes
- **Success Criteria**: Handle 10MB+ files reliably, process 10K+ records

### 1.5 Documentation & Deployment
- **Goal**: Complete Task 3 requirements and deployment readiness
- **Work**: User guides, API documentation, deployment scripts
- **Integration**: Ensure compatibility with existing authentication system
- **Success Criteria**: Task 3 marked complete, ready for production

---

## 📋 TASK 2: Database Optimization for Cohort Analysis
**Priority**: HIGH | **Duration**: 4-6 days | **Dependencies**: Task 1 completion

### Objective
Optimize PostgreSQL database for high-performance cohort calculations supporting gambling industry data volumes.

### 2.1 Add Cohort-Specific Indexes
- **Goal**: Sub-second query performance for cohort data retrieval
- **Implementation**:
  ```sql
  CREATE INDEX CONCURRENTLY idx_cohort_signup_perf 
  ON PlayerData (signUpDate, partnerId, campaignId, date) 
  WHERE signUpDate IS NOT NULL;
  
  CREATE INDEX CONCURRENTLY idx_cohort_ftd_perf
  ON PlayerData (firstDepositDate, partnerId, campaignId, date)
  WHERE firstDepositDate IS NOT NULL;
  
  CREATE INDEX CONCURRENTLY idx_player_activity
  ON PlayerData (playerId, date, depositsSum)
  WHERE depositsSum > 0;
  ```
- **Success Criteria**: 5x+ query performance improvement for cohort queries

### 2.2 Create Cohort Base Materialized View (Future Optimization)
- **Goal**: Pre-calculated cohort foundation for complex analyses
- **Scope**: Design and document for post-MVP implementation
- **Implementation**: Materialized view with age calculations, cumulative sums
- **Success Criteria**: Architecture documented, implementation plan ready

### 2.3 PostgreSQL Optimization Functions
- **Goal**: Efficient age calculation and cohort grouping
- **Functions**: Date calculations, breakpoint mapping helpers
- **Performance**: Optimize for gambling industry cohort patterns
- **Success Criteria**: Complex cohort queries execute in <5 seconds

### 2.4 Performance Validation
- **Goal**: Confirm database performance meets production requirements
- **Testing**: Realistic data volumes (100K+ player records)
- **Monitoring**: Query execution plans, index usage statistics
- **Success Criteria**: All cohort queries meet <5 second target

---

## 📋 TASK 3: Core Cohort Calculation Engine
**Priority**: CRITICAL | **Duration**: 6-8 days | **Dependencies**: Task 2 completion

### Objective
Build the heart of cohort analysis system using PostgreSQL-Arquero strategy with enterprise-grade performance.

### 3.1 Server Actions Architecture
- **Goal**: Scalable cohort calculation with intelligent caching
- **Implementation**:
  ```typescript
  export const calculateCohort = unstable_cache(
    async (config: CohortConfig): Promise<CohortResult> => {
      // PostgreSQL: Heavy data lifting
      const rawData = await getCohortBaseData(config);
      // Arquero: Business logic processing
      return processCohortMetrics(rawData, config);
    },
    ['cohort-analysis'],
    { revalidate: 300, tags: ['cohorts'] }
  );
  ```
- **Success Criteria**: Sub-second cached responses, 5-second fresh calculations

### 3.2 PostgreSQL Query Builder
- **Goal**: Dynamic, optimized query generation based on filters
- **Features**: Partner filtering, date ranges, cohort type selection
- **Optimization**: Use window functions for cumulative calculations
- **Implementation**:
  ```sql
  WITH cohort_base AS (
    SELECT playerId, signUpDate as cohort_date, 
           EXTRACT(DAY FROM date - signUpDate) as age_days,
           SUM(depositsSum) OVER (
             PARTITION BY playerId, signUpDate 
             ORDER BY date ROWS UNBOUNDED PRECEDING
           ) as cumulative_deposits
    FROM PlayerData 
    WHERE signUpDate BETWEEN $1 AND $2
  )
  SELECT * FROM cohort_base WHERE age_days >= 0;
  ```
- **Success Criteria**: Flexible query generation, optimal execution plans

### 3.3 Arquero Integration for Business Logic
- **Goal**: Flexible metric calculations and breakpoint mapping
- **Features**: Dynamic breakpoint mapping [1,3,7,14,30], day/week modes
- **Implementation**:
  ```typescript
  const cohortData = table(rawData)
    .derive({ 
      breakpoint: d => mapToBreakpoint(d.age_days, config.breakpoints, config.mode)
    })
    .filter(d => config.breakpoints.includes(d.breakpoint))
    .groupby('cohort_date', 'breakpoint')
    .rollup({ /* aggregations */ })
  ```
- **Success Criteria**: Accurate breakpoint mapping, efficient processing

### 3.4 Core Metrics Implementation
- **Goal**: Gambling industry cohort metrics matching MRR report structure
- **Primary Metrics**: 
  - **Dep2Cost Retention**: (cumulative_deposits / initial_costs) * 100 by age
  - **ROAS Retention**: (cumulative_ngr / initial_costs) * 100 by age
  - **Player Count Retention**: (active_players / initial_cohort_size) * 100 by age
  - **Deposit Amount Retention**: (avg_deposit_sum / initial_avg) * 100 by age
- **Calculation Pattern**:
  ```sql
  -- Base cohort with cumulative values
  WITH cohort_cumulative AS (
    SELECT cohort_date, age_days, player_id,
           SUM(deposits) OVER (PARTITION BY player_id, cohort_date ORDER BY age_days) as cum_deposits,
           SUM(costs) OVER (PARTITION BY player_id, cohort_date ORDER BY age_days) as cum_costs
    FROM cohort_base
  ),
  -- Retention percentages by breakpoint
  cohort_retention AS (
    SELECT cohort_date, age_breakpoint,
           (current_metric / FIRST_VALUE(current_metric) OVER (PARTITION BY cohort_date ORDER BY age_breakpoint)) * 100 as retention_pct
    FROM cohort_aggregated
  )
  ```
- **Triangle Structure**: Newer cohorts have fewer age periods (matches MRR report)
- **Success Criteria**: Accurate % retention calculations, triangle layout support

### 3.5 Intelligent Caching Strategy
- **Goal**: Optimal performance with minimal memory usage
- **Strategy**: Tag-based invalidation, graduated TTL, cache warming
- **Implementation**: Next.js unstable_cache with custom tags
- **Monitoring**: Cache hit rates, performance metrics
- **Success Criteria**: >80% cache hit rate, intelligent invalidation

---

## 📋 TASK 4: Cohort Analysis UI Components
**Priority**: HIGH | **Duration**: 7-10 days | **Dependencies**: Task 3 for data integration

### Objective
Build intuitive, responsive UI for cohort analysis following TraffBoard design patterns and gambling industry UX standards.

### 4.1 Advanced Filter System
- **Goal**: Comprehensive filtering matching gambling industry needs
- **Components**: Partner selection, campaign filtering, date ranges
- **Features**: Multi-select, search, saved filter sets
- **Implementation**: React Hook Form + Zod validation
- **UX**: Real-time validation, filter preview, clear/reset options
- **Success Criteria**: Intuitive filter experience, URL-based state management

### 4.2 Cohort Configuration UI
- **Goal**: Flexible cohort analysis configuration
- **Features**: 
  - Cohort type selection (signup vs FTD attribution)
  - Mode switching (day vs week analysis)
  - Breakpoint customization [1,3,7,14,30] with presets
  - Attribution window configuration
- **UX**: Visual breakpoint selector, mode comparison, configuration presets
- **Success Criteria**: Easy configuration changes, configuration persistence

### 4.3 Interactive Cohort Results Table
- **Goal**: Professional heatmap-style cohort table matching MRR Cohort Report structure
- **Core Structure**:
  ```typescript
  // Треугольная таблица: Когорта × Возраст
  interface CohortTableData {
    cohort_month: string;           // "OCT 2021"
    value: string;                  // "$1.01M" или "1,234 players"
    day_1: number;                  // 98.4%
    day_3: number;                  // 92.3%
    day_7: number;                  // 83.6%
    day_14: number;                 // 70%
    day_30: number;                 // 67.9%
  }
  ```
- **Visual Features**: 
  - Color gradient: Green (high retention) → Yellow → Red (low retention)
  - VALUE column with currency/count formatting
  - Weighted average row at bottom
  - Responsive triangle layout (newer cohorts have fewer columns)
- **Controls**: 
  - Toggle: DEPOSITS/PLAYERS (metric type)
  - Toggle: 30 DAYS/90 DAYS (time period)
  - Toggle: % OF TOTAL/ABSOLUTE VALUES
- **Implementation**: TanStack Table with heatmap cell renderers
- **Success Criteria**: Exact visual match to MRR report structure

### 4.4 Chart Visualization Components
- **Goal**: Visual trend analysis for cohort performance
- **Charts**: Line charts for retention curves, bar charts for comparisons
- **Implementation**: Recharts with custom themes
- **Features**: Interactive legends, zoom/pan, export capabilities
- **Success Criteria**: Clear trend visualization, interactive exploration

### 4.5 Export & Save Functionality
- **Goal**: Professional reporting capabilities
- **Export**: CSV, Excel, PDF report generation
- **Save**: Cohort configuration persistence, favorite configurations
- **Sharing**: URL-based sharing, team collaboration features
- **Success Criteria**: Professional export quality, easy sharing

---

## 📋 TASK 5: Report Factory Foundation
**Priority**: MEDIUM | **Duration**: 5-7 days | **Dependencies**: Task 4 for component patterns

### Objective
Establish reusable architecture for future analytics reports, enabling rapid development of funnel analysis, retention reports, and custom dashboards.

### 5.1 Universal Filter Framework
- **Goal**: Reusable filter system for all future reports
- **Architecture**: Generic FilterConfig, FilterRenderer, FilterState management
- **Implementation**:
  ```typescript
  interface FilterConfig {
    type: 'date_range' | 'multi_select' | 'single_select' | 'text_search';
    key: string;
    label: string;
    options?: FilterOption[];
    validation?: ZodSchema;
  }
  ```
- **Features**: Type-safe configuration, custom validators, async options
- **Success Criteria**: Easy new filter type addition, consistent UX

### 5.2 Metric Definition System
- **Goal**: Configurable metric calculations for any report type
- **Architecture**: MetricDefinition with formula parsing, dependency resolution
- **Implementation**:
  ```typescript
  interface MetricDefinition {
    name: string;
    formula: string; // "deposits_sum / fixed_costs * 100"
    format: 'percentage' | 'currency' | 'number' | 'decimal';
    dependencies: string[];
  }
  ```
- **Features**: Formula validation, dependency injection, custom formatters
- **Success Criteria**: Easy metric addition, accurate calculations

### 5.3 Report Template Engine
- **Goal**: Generic report structure for consistent UX across report types
- **Components**: ReportLayout, ReportFilters, ReportResults, ReportExport
- **Architecture**: Plugin-based report types, shared component library
- **Implementation**: Higher-order components, render props pattern
- **Success Criteria**: Rapid new report development, consistent UX

### 5.4 Performance Monitoring & Analytics
- **Goal**: Production-ready monitoring and optimization insights
- **Metrics**: Query timing, cache hit rates, user engagement, error rates
- **Implementation**: Custom hooks, performance observers, analytics events
- **Dashboard**: Real-time performance monitoring, usage analytics
- **Success Criteria**: Complete visibility into system performance

---

## 🔧 TECHNICAL IMPLEMENTATION STRATEGY

### Cohort Table Structure (MRR Report Pattern)
```typescript
// Точное соответствие структуре MRR Cohort Report
interface CohortReportData {
  cohort_month: string;      // "OCT 2021"
  value: string;             // "$1.01M" или "1,234 players" 
  periods: {
    day_1: number;           // 98.4% - retention на 1 день
    day_3: number;           // 92.3% - retention на 3 день
    day_7: number;           // 83.6% - retention на 7 день
    day_14: number;          // 70% - retention на 14 день
    day_30: number;          // 67.9% - retention на 30 день
  };
  max_age: number;           // Максимальный возраст когорты
}

// Weighted Average для итоговой строки
interface WeightedAverage {
  label: "WEIGHTED AVG. RETAINED";
  periods: Record<string, number>; // Средневзвешенные значения
}
```

### PostgreSQL Query для Retention Calculation
```sql
-- Базовый запрос для треугольной структуры
WITH cohort_base AS (
  SELECT 
    DATE_TRUNC('month', signUpDate) as cohort_month,
    playerId,
    EXTRACT(DAY FROM date - signUpDate) as age_days,
    depositsSum, fixedPerPlayer, casinoRealNgr
  FROM PlayerData 
  WHERE signUpDate >= '2021-10-01'
),
cohort_initial AS (
  -- Начальные значения когорты (VALUE колонка)
  SELECT cohort_month,
         COUNT(DISTINCT playerId) as initial_players,
         SUM(depositsSum) as initial_deposits,
         SUM(fixedPerPlayer) as initial_costs
  FROM cohort_base 
  WHERE age_days = 0
  GROUP BY cohort_month
),
cohort_retention AS (
  -- Retention по периодам
  SELECT 
    c.cohort_month,
    CASE 
      WHEN c.age_days <= 1 THEN 'day_1'
      WHEN c.age_days <= 3 THEN 'day_3'
      WHEN c.age_days <= 7 THEN 'day_7'
      WHEN c.age_days <= 14 THEN 'day_14'
      WHEN c.age_days <= 30 THEN 'day_30'
    END as period,
    SUM(c.depositsSum) / i.initial_deposits * 100 as retention_pct
  FROM cohort_base c
  JOIN cohort_initial i ON c.cohort_month = i.cohort_month
  WHERE c.age_days <= 30
  GROUP BY c.cohort_month, period, i.initial_deposits
)
SELECT * FROM cohort_retention 
ORDER BY cohort_month DESC, period;
```

### Arquero для Pivot и Formatting
```typescript
// Преобразование в triangle table format
const cohortTable = table(retentionData)
  .pivot('period', 'retention_pct', { 
    groupby: ['cohort_month'],
    fill: null // null для отсутствующих периодов (triangle effect)
  })
  .derive({
    // Форматирование как в MRR report
    cohort_display: d => formatCohortMonth(d.cohort_month),
    value_display: d => formatValue(d.initial_value, config.metric_type)
  })
  .select('cohort_display', 'value_display', 'day_1', 'day_3', 'day_7', 'day_14', 'day_30')
  .orderby(desc('cohort_month'));
```

### Caching Architecture
```typescript
// Tag-based cache invalidation
export const calculateCohort = unstable_cache(
  cohortCalculationFn,
  ['cohort'],
  { 
    revalidate: 300,
    tags: (config) => [
      'cohorts',
      `partner-${config.partnerId}`,
      `campaign-${config.campaignId}`
    ]
  }
);
```

### Component Reusability
```typescript
// Universal report framework
export function ReportTemplate<T>({
  filters,
  calculator,
  renderer
}: ReportTemplateProps<T>) {
  return (
    <ReportLayout>
      <ReportFilters config={filters} />
      <ReportResults calculator={calculator} renderer={renderer} />
    </ReportLayout>
  );
}
```

---

## 📊 SUCCESS METRICS & VALIDATION

### Performance Targets
- **Query Response Time**: <5 seconds for fresh calculations
- **Cached Response Time**: <100ms for cached results  
- **Cache Hit Rate**: >80% for common configurations
- **UI Responsiveness**: <200ms for filter interactions
- **Export Generation**: <30 seconds for large datasets

### Business Validation
- **Metric Accuracy**: 100% accuracy vs manual calculations
- **User Experience**: <3 clicks to generate basic cohort analysis
- **Data Coverage**: Support for 100K+ player records
- **Flexibility**: Support multiple cohort types, breakpoints, attribution modes

### Quality Assurance
- **Unit Test Coverage**: >90% for core calculation logic
- **Integration Test Coverage**: 100% for Server Actions
- **E2E Test Coverage**: Complete cohort workflow validation
- **Error Handling**: Graceful degradation for all failure scenarios
- **Documentation**: Comprehensive user guides and technical documentation

---

## 🚀 DEPLOYMENT & MONITORING

### Production Readiness Checklist
- [ ] Database indexes optimized and tested
- [ ] Caching strategy implemented and validated
- [ ] Error handling and logging comprehensive
- [ ] Performance monitoring configured
- [ ] Security review completed
- [ ] User documentation finalized
- [ ] Backup and recovery procedures established

### Monitoring Strategy
```typescript
// Performance monitoring
interface CohortMetrics {
  query_duration_ms: number;
  cache_hit_rate: number;
  data_size_kb: number;
  user_id: string;
  cohort_config: CohortConfig;
}

// Alert thresholds
const performanceAlerts = {
  query_duration: { threshold: 10000, severity: 'warning' },
  cache_miss_rate: { threshold: 0.5, severity: 'info' },
  error_rate: { threshold: 0.05, severity: 'critical' }
};
```

### Rollback Plan
1. Database schema changes are backward compatible
2. Feature flags for gradual rollout
3. Monitoring for performance degradation
4. Quick rollback procedures documented
5. Data integrity validation post-deployment

---

## 📈 POST-MVP OPTIMIZATION ROADMAP

### Phase 1: Performance Optimization (Month 1)
- Materialized views for complex cohorts
- Query optimization and index tuning
- Advanced caching strategies
- Background job processing for heavy calculations

### Phase 2: Advanced Features (Month 2-3)
- Cohort comparison functionality
- Custom breakpoint definitions
- Advanced filtering options
- Real-time cohort monitoring

### Phase 3: Report Factory Expansion (Month 3-6)
- Funnel analysis reports
- Retention analysis reports
- Attribution analysis reports
- Custom dashboard builder

### Phase 4: Enterprise Features (Month 6+)
- Multi-tenant support
- Advanced security features
- API access for external integrations
- White-label customization options

---

## 💡 RISK MITIGATION

### Technical Risks
**Database Performance (High Impact, Medium Probability)**
- Mitigation: Comprehensive performance testing with realistic data
- Fallback: Implement query timeouts and pagination
- Timeline Impact: +2 days if optimization needed

**Arquero Integration Complexity (Medium Impact, Low Probability)**
- Mitigation: Prototype complex calculations early
- Fallback: Pure PostgreSQL solution for critical metrics
- Timeline Impact: +3 days if major refactoring needed

**UI/UX Complexity (Medium Impact, Medium Probability)**
- Mitigation: Start with mock data, iterate based on user feedback
- Fallback: Simplified UI for MVP, enhance post-launch
- Timeline Impact: +2 days for UX refinements

### Business Risks
**Metric Accuracy Requirements (High Impact, Low Probability)**
- Mitigation: Extensive validation against existing tools
- Fallback: Audit trail and calculation transparency
- Timeline Impact: +1 week for comprehensive validation

**User Adoption Challenges (Medium Impact, Medium Probability)**
- Mitigation: User research and iterative design
- Fallback: Comprehensive training materials and support
- Timeline Impact: +1 week for additional UX work

---

## 🎯 CONCLUSION

This implementation plan provides a comprehensive roadmap for delivering cohort analysis functionality while establishing the foundation for TraffBoard's Report Factory architecture. The approach:

1. **Leverages Existing Assets**: Builds on 90% complete CSV infrastructure
2. **Follows Proven Strategy**: Implements documented PostgreSQL-Arquero architecture
3. **Delivers MVP Value**: Focuses on core functionality with clear upgrade path
4. **Enables Future Growth**: Establishes reusable patterns for additional reports

### Key Success Factors
- **Pragmatic Approach**: MVP-first with solid engineering foundations
- **Performance Focus**: Sub-5-second queries, intelligent caching
- **User Experience**: Intuitive UI following established patterns
- **Scalability**: Architecture ready for gambling industry data volumes
- **Maintainability**: Clean code, comprehensive testing, thorough documentation

### Next Steps
1. Review and approve implementation plan
2. Set up development environment and tooling
3. Begin Task 1: Complete CSV Upload System
4. Establish performance monitoring and testing frameworks
5. Start parallel work on database optimization (Task 2)

This plan ensures TraffBoard will have enterprise-grade cohort analysis capabilities within 3 weeks while building the foundation for rapid development of additional analytics features.