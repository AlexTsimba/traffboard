# TraffBoard Cohort Analysis Report Factory - Implementation Documentation

## 🎯 PROJECT OVERVIEW

**Objective**: Create a comprehensive cohort analysis system with universal report factory foundation for TraffBoard analytics platform.

**Technical Stack**: 
- Frontend: Next.js 15 + React 19 + TypeScript + shadcn/ui + TanStack Table + Recharts
- Backend: PostgreSQL + Prisma + Server Actions
- State: Zustand stores for report management
- Architecture: PostgreSQL-Arquero data pipeline strategy

**Scope**: Build enterprise-grade cohort analysis with 4 metrics (DEP2COST, ROAS, AVG DEPOSIT, PLAYER COUNT), saved reports, and reusable architecture for future report types.

---

## 📋 TASK BREAKDOWN & SPECIFICATIONS

### **Task 1: Report Factory Foundation Architecture**
**Duration**: 1 day | **Dependencies**: None | **Priority**: Critical

#### Strategic Purpose
Create the foundational architecture that will support cohort analysis and all future report types. This task establishes the design patterns, interfaces, and infrastructure needed for rapid report development.

#### 1.1 Universal Report Framework Design
**Deliverable**: Core report architecture with TypeScript interfaces

**Components to Build**:
- `ReportProvider`: React context for universal report state management
- `ReportLayout`: Consistent layout structure (header, sidebar, content, footer)
- `ReportConfig`: TypeScript interfaces for report configuration
- `ReportRegistry`: Plugin system for registering report types

**Key Interfaces**:
```typescript
interface ReportConfig {
  id: string;
  name: string;
  type: 'cohort' | 'funnel' | 'retention';
  dataSources: string[];
  filters: FilterDefinition[];
  metrics: MetricDefinition[];
  cacheStrategy: CacheConfig;
}

interface FilterDefinition {
  key: string;
  type: 'select' | 'multiselect' | 'date_range' | 'toggle';
  label: string;
  required: boolean;
  options?: FilterOption[];
  dependencies?: string[];
}
```

#### 1.2 Universal Filter System
**Deliverable**: Reusable filter components and state management

**Components to Build**:
- `FilterProvider`: Context for filter state across all reports
- `BaseFilter`: Abstract filter component with common patterns
- `FilterSelect`: Single/multi-select with search capabilities
- `FilterDateRange`: Date range picker with presets
- `FilterToggle`: Boolean toggles with descriptions
- `FilterPresets`: Save/load filter combinations

**State Management**:
- Zustand store for filter state with persistence
- URL synchronization for shareable filter states
- Cross-filter validation and dependency management

#### 1.3 Data Pipeline Architecture
**Deliverable**: PostgreSQL-Arquero processing pipeline

**Components to Build**:
- `ReportDataSource`: Abstract interface for data sources
- `DataProcessor`: Pipeline orchestration (PostgreSQL → Arquero → UI)
- `QueryBuilder`: Dynamic SQL generation based on filters
- `CacheManager`: Intelligent caching with tag-based invalidation

**Performance Strategy**:
- PostgreSQL: Heavy data lifting, filtering, basic aggregations
- Arquero: Business logic, dynamic calculations, data transformations
- Caching: Multiple layers (query cache, computation cache, UI cache)

#### 1.4 Export & Persistence Framework
**Deliverable**: Universal export and save functionality

**Components to Build**:
- `ExportEngine`: Multi-format export (CSV, Excel, PDF, PNG)
- `SavedReports`: Persistent storage for report configurations
- `ShareableLinks`: URL-based sharing with authentication
- `ReportHistory`: Audit trail for report generations

---

### **Task 2: Cohort Analysis Data Engine**
**Duration**: 1.5 days | **Dependencies**: Task 1 | **Priority**: Critical

#### Strategic Purpose
Implement the core cohort calculation engine using the PostgreSQL-Arquero strategy. This task focuses on accurate data processing, performance optimization, and support for both daily and weekly cohort modes.

#### 2.1 Cohort Configuration System
**Deliverable**: Type-safe cohort configuration and validation

**Components to Build**:
- `CohortConfig`: Interface for cohort-specific configuration
- `BreakpointEngine`: Dynamic breakpoint mapping and validation
- `CohortModes`: Day/week mode logic with proper date handling
- `AttributionMethods`: FTD vs Registration date attribution

**Key Configuration**:
```typescript
interface CohortConfig extends ReportConfig {
  mode: 'day' | 'week';
  breakpoints: number[];
  attributionMethod: 'ftd' | 'registration';
  metrics: ('dep2cost' | 'roas' | 'avg_deposit' | 'player_count')[];
}

const DAY_BREAKPOINTS = [1, 3, 5, 7, 14, 17, 21, 24, 27, 30];
const WEEK_BREAKPOINTS = [7, 14, 21, 28, 35, 42]; // Monday start, Sunday end
```

#### 2.2 PostgreSQL Cohort Queries
**Deliverable**: Optimized SQL queries for cohort data

**SQL Components to Build**:
- `CohortQueryBuilder`: Dynamic query generation
- Weekly logic: `DATE_TRUNC('week', date + INTERVAL '1 day') - INTERVAL '1 day'`
- Cumulative calculations using window functions
- Performance indexes for cohort-specific queries

**Query Strategy**:
- Filter large datasets in PostgreSQL (millions → thousands of rows)
- Calculate cumulative metrics using window functions
- Handle both FTD and registration date attribution
- Optimize for gambling industry data patterns

#### 2.3 Arquero Processing Pipeline
**Deliverable**: Business logic processing in JavaScript

**Components to Build**:
- `CohortProcessor`: Main processing orchestrator
- `MetricCalculators`: Calculate DEP2COST, ROAS, AVG DEPOSIT, PLAYER COUNT
- `TriangleBuilder`: Build triangular cohort structure
- `WeightedAverages`: Calculate bottom-row weighted averages

**Processing Logic**:
```typescript
// Breakpoint mapping
function mapToBreakpoint(age: number, breakpoints: number[], mode: 'day' | 'week'): number {
  const adjustedAge = mode === 'week' ? Math.floor(age / 7) : age;
  return breakpoints.find(bp => adjustedAge <= bp) || breakpoints[breakpoints.length - 1];
}

// Triangle structure: newer cohorts have fewer periods
// Weighted averages: size-weighted calculations for summary row
```

#### 2.4 Cohort Validation & Error Handling
**Deliverable**: Robust error handling and data validation

**Components to Build**:
- `DataValidation`: Check cohort data integrity and business rules
- `PerformanceMonitoring`: Track query timing and suggest optimizations
- `ErrorRecovery`: Fallback strategies for calculation failures
- `ProgressTracking`: Real-time progress for long-running cohorts

---

### **Task 3: Universal UI Component Library**
**Duration**: 2 days | **Dependencies**: Task 1 | **Priority**: High

#### Strategic Purpose
Build a comprehensive library of reusable UI components using shadcn/ui patterns. These components will be used across all report types, ensuring consistency and reducing future development time.

#### 3.1 Report Layout Components
**Deliverable**: Standard layout components for all reports

**Components to Build**:
- `ReportHeader`: Title, description, last updated, export actions
- `ReportSidebar`: Collapsible sidebar with filters and saved reports
- `ReportContent`: Main content area with responsive grid system
- `ReportFooter`: Pagination, row counts, performance metrics

**Design Principles**:
- Mobile-first responsive design
- Consistent spacing and typography using shadcn/ui tokens
- Accessibility compliance (WCAG AA)
- Dark/light theme support

#### 3.2 Filter Component System
**Deliverable**: Complete filter UI library

**Components to Build**:
- `FilterContainer`: Collapsible sections with persistence
- `DateRangeFilter`: Advanced date picker with business presets
- `MultiSelectFilter`: Search, select all, hierarchical options
- `ToggleFilter`: Switch components with descriptions
- `NumericFilter`: Range sliders with validation

**Features**:
- Real-time validation and error states
- Dependency management (filter B depends on filter A)
- Preset management (save/load common filter combinations)
- URL synchronization for sharing

#### 3.3 Data Visualization Components
**Deliverable**: TanStack Table and Recharts integration

**Components to Build**:
- `UniversalTable`: TanStack Table wrapper with common features
- `TableCellRenderer`: Pluggable renderers (heatmap, currency, percentage)
- `ChartContainer`: Recharts wrapper with consistent theming
- `ResponsiveCharts`: Auto-responsive charts for different screen sizes
- `InteractiveTooltips`: Rich tooltips with contextual information

**TanStack Table Features**:
- Virtual scrolling for large datasets
- Column resizing, reordering, pinning
- Global and column-specific filtering
- Multi-column sorting
- Export functionality

#### 3.4 Loading & Error States
**Deliverable**: Comprehensive state management UI

**Components to Build**:
- `ReportSkeleton`: Loading skeletons for different report types
- `ProgressIndicator`: Real-time progress for data processing
- `ErrorFallback`: User-friendly error messages with recovery actions
- `EmptyStates`: Helpful empty states with next-step guidance

---

### **Task 4: Cohort-Specific UI Implementation**
**Duration**: 2 days | **Dependencies**: Task 2, Task 3 | **Priority**: High

#### Strategic Purpose
Build the cohort analysis user interface using the universal components from Task 3 and data from Task 2. Focus on the gambling industry UX patterns and the triangular cohort visualization.

#### 4.1 Cohort Configuration Panel
**Deliverable**: User-friendly cohort setup interface

**Components to Build**:
- `CohortModeSelector`: Toggle between Day/Week with visual preview
- `BreakpointSelector`: Visual breakpoint selector with drag-and-drop
- `MetricSelector`: 4-metric toggle (DEP2COST, ROAS, AVG DEPOSIT SUM, RETENTION RATE)
- `AttributionSelector`: FTD vs Registration with impact explanations

**UX Features**:
- Visual preview of configuration changes
- Intelligent defaults based on data size
- Configuration validation with helpful error messages
- Save/load configuration presets

#### 4.2 Cohort Data Table
**Deliverable**: Professional heatmap-style cohort table

**Components to Build**:
- `CohortTable`: TanStack Table with cohort-specific features
- `HeatmapCell`: Color-coded cells with hover details
- `TriangleLayout`: Proper triangular structure (newer cohorts → fewer columns)
- `WeightedAverageRow`: Calculated summary row with highlighting
- `ResponsiveBreakpoints`: Mobile-friendly column management

**Visual Design**:
```typescript
// Heatmap color scheme based on demo
const heatmapColors = {
  growth_200_up: '#065f46',    // Dark green
  growth_150_199: '#10b981',   // Green
  growth_120_149: '#34d399',   // Light green
  growth_110_119: '#6ee7b7',   // Very light green
  growth_100_104: '#d1fae5',   // Pale green
  growth_95_99: '#fef3c7',     // Yellow
  growth_below_95: '#dc2626'   // Red
};
```

#### 4.3 Cohort Visualizations
**Deliverable**: Interactive charts for cohort analysis

**Components to Build**:
- `CohortHeatmap`: Interactive heatmap with zoom/pan capabilities
- `RetentionCurves`: Line charts for retention trend analysis
- `CohortComparison`: Side-by-side comparison of selected cohorts
- `MetricEvolution`: Time-series evolution charts

**Chart Features**:
- Recharts integration with consistent theming
- Interactive legends and data point selection
- Export capabilities (PNG, SVG, PDF)
- Responsive design for mobile viewing

#### 4.4 Cohort Interactions
**Deliverable**: Advanced interaction features

**Components to Build**:
- `DrillDown`: Click-to-drill into specific cohort details
- `CohortFiltering`: Filter cohorts by performance thresholds
- `CohortSorting`: Sort cohorts by various metrics
- `CohortSelection`: Multi-select cohorts for comparison

---

### **Task 5: Saved Cohorts & State Management**
**Duration**: 1.5 days | **Dependencies**: Task 4 | **Priority**: Medium-High

#### Strategic Purpose
Implement comprehensive state management and persistence for cohort reports. Enable users to save, share, and collaborate on cohort analyses.

#### 5.1 Saved Reports System
**Deliverable**: Complete report persistence infrastructure

**Components to Build**:
- `SavedReportsStore`: Zustand store for saved configurations
- `ReportTemplates`: Pre-built report templates for common use cases
- `ReportFavorites`: Star/favorite frequently used reports
- `ReportSharing`: Generate shareable URLs with access control

**Data Structures**:
```typescript
interface SavedCohortReport {
  id: string;
  name: string;
  description?: string;
  config: CohortConfig;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  isPublic: boolean;
  tags: string[];
  favorite: boolean;
}
```

#### 5.2 Cohort Persistence UI
**Deliverable**: User interface for managing saved reports

**Components to Build**:
- `SaveCohortDialog`: Modal for saving cohort configurations
- `SavedCohortsList`: Sidebar list with search and categories
- `CohortTabs`: Tab system for multiple open cohorts
- `QuickSave`: One-click save for current configuration

**UX Features**:
- Auto-save drafts to prevent data loss
- Duplicate detection and merge suggestions
- Bulk operations (delete, export, share multiple reports)
- Search and filtering of saved reports

#### 5.3 State Persistence
**Deliverable**: Robust state management architecture

**Components to Build**:
- `LocalStorage`: Client-side persistence for user preferences
- `DatabasePersistence`: Server-side storage for shared reports
- `StateHydration`: SSR-friendly state restoration
- `ConflictResolution`: Handle concurrent modifications

**Zustand Stores**:
- `ReportStore`: Global report state and configuration
- `CohortStore`: Cohort-specific state and calculations
- `FilterStore`: Filter state with URL synchronization
- `UIStore`: UI state (loading, errors, modals)

#### 5.4 Collaboration Features
**Deliverable**: Team collaboration capabilities

**Components to Build**:
- `ReportComments`: Add notes and comments to saved cohorts
- `TeamSharing`: Share reports within organization
- `VersionHistory`: Track changes to saved reports
- `AccessControl`: Permission-based access to reports

---

### **Task 6: Performance Optimization & Caching**
**Duration**: 1 day | **Dependencies**: Task 2, Task 4 | **Priority**: Medium

#### Strategic Purpose
Implement enterprise-grade performance optimizations to ensure the system can handle large datasets and high concurrency typical of gambling industry analytics.

#### 6.1 Intelligent Caching
**Deliverable**: Multi-layer caching system

**Components to Build**:
- `QueryCache`: Cache PostgreSQL results with smart invalidation
- `ComputationCache`: Cache Arquero processing results
- `UICache`: Cache rendered components and visualizations
- `PreloadingStrategy`: Preload popular cohort configurations

**Caching Strategy**:
```typescript
interface CacheStrategy {
  queryCache: {
    ttl: 300; // 5 minutes for raw data
    tags: ['player_data', 'partner_id', 'date_range'];
  };
  computationCache: {
    ttl: 1800; // 30 minutes for processed results
    tags: ['cohort_results', 'config_hash'];
  };
  preloading: {
    popularConfigs: boolean;
    recentReports: boolean;
    userFavorites: boolean;
  };
}
```

#### 6.2 Performance Monitoring
**Deliverable**: Comprehensive performance tracking

**Components to Build**:
- `PerformanceMetrics`: Track query timing, rendering performance
- `OptimizationSuggestions`: Suggest better configurations for performance
- `ResourceMonitoring`: Monitor memory usage during processing
- `AlertThresholds`: Alert on slow queries or high resource usage

**Key Metrics**:
- Query execution time (target: <5 seconds)
- Cache hit rate (target: >80%)
- UI render time (target: <200ms)
- Memory usage (target: <500MB for large cohorts)

#### 6.3 Progressive Loading
**Deliverable**: Smooth user experience for large datasets

**Components to Build**:
- `DataStreaming`: Stream large cohort results progressively
- `LazyLoading`: Load cohort details on demand
- `BackgroundRefresh`: Refresh data in background
- `CancellableRequests`: Cancel long-running requests

---

### **Task 7: Integration Testing & Quality Assurance**
**Duration**: 1 day | **Dependencies**: All previous tasks | **Priority**: High

#### Strategic Purpose
Ensure all components work together seamlessly and meet enterprise quality standards through comprehensive testing and validation.

#### 7.1 End-to-End Integration
**Deliverable**: Complete system integration

**Integration Points**:
- Report factory → Cohort analysis integration
- Authentication → Report access control
- Navigation → Cohort analysis pages
- Export → All supported formats

**Testing Scenarios**:
- Complete cohort workflow (configure → generate → save → share)
- Multi-user collaboration scenarios
- Large dataset processing (100K+ records)
- Mobile device compatibility

#### 7.2 Data Integration Testing
**Deliverable**: Data accuracy and performance validation

**Components to Test**:
- PostgreSQL query accuracy against manual calculations
- Arquero processing correctness for all 4 metrics
- Cache invalidation and consistency
- Error handling for malformed data

**Performance Benchmarks**:
- 10K records: <2 seconds
- 100K records: <10 seconds
- 1M records: <60 seconds
- Cache hit: <100ms

#### 7.3 User Experience Testing
**Deliverable**: UX validation and accessibility compliance

**Testing Areas**:
- Usability testing with real gambling industry users
- Responsive design across devices and screen sizes
- Accessibility compliance (WCAG AA)
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

---

### **Task 8: Production Deployment & Documentation**
**Duration**: 0.5 days | **Dependencies**: Task 7 | **Priority**: Medium

#### Strategic Purpose
Prepare the cohort analysis system for production deployment with comprehensive documentation and deployment procedures.

#### 8.1 Technical Documentation
**Deliverable**: Complete technical documentation

**Documentation to Create**:
- API documentation for all cohort endpoints
- Component documentation with Storybook
- Architecture documentation with diagrams
- Performance optimization guide

#### 8.2 User Documentation
**Deliverable**: End-user documentation and training materials

**Documentation to Create**:
- User guide for cohort analysis features
- Video tutorials for common workflows
- FAQ with troubleshooting guide
- Best practices for gambling industry analytics

---

## 🏗️ ARCHITECTURAL DECISIONS

### **Component Hierarchy**
```
src/
├── components/
│   ├── reports/
│   │   ├── universal/          # Task 3: Universal components
│   │   ├── cohort/            # Task 4: Cohort-specific components
│   │   └── filters/           # Task 1: Filter system
├── lib/
│   ├── reports/
│   │   ├── cohort/            # Task 2: Cohort engine
│   │   ├── cache/             # Task 6: Caching system
│   │   └── export/            # Task 1: Export system
├── stores/
│   ├── reportStore.ts         # Task 5: State management
│   ├── cohortStore.ts
│   └── filterStore.ts
└── pages/
    └── reports/
        └── cohort/            # Task 4: Cohort pages
```

### **State Management Architecture**
- **Zustand**: Primary state management for reports and UI state
- **URL State**: Synchronization for shareable configurations
- **Local Storage**: User preferences and draft states
- **Database**: Persistent storage for saved reports

### **Performance Strategy**
- **PostgreSQL**: Heavy data operations, filtering, aggregations
- **Arquero**: Business logic, dynamic calculations, transformations
- **React**: Optimized rendering with useMemo, useCallback, React.memo
- **Caching**: Multi-layer caching with intelligent invalidation

---

## 🎯 SUCCESS CRITERIA

### **Functional Requirements**
- ✅ Complete cohort analysis with 4 metrics (DEP2COST, ROAS, AVG DEPOSIT, PLAYER COUNT)
- ✅ Day/Week mode switching with proper date calculations
- ✅ Triangular cohort table with heatmap visualization
- ✅ Save, load, and share cohort configurations
- ✅ Export functionality (CSV, Excel, PDF, PNG)
- ✅ Mobile-responsive design
- ✅ Real-time collaboration features

### **Technical Requirements**
- ✅ Built on shadcn/ui component library
- ✅ TanStack Table integration for data display
- ✅ Recharts integration for visualizations
- ✅ TypeScript strict mode compliance
- ✅ Zero runtime errors and proper error handling
- ✅ WCAG AA accessibility compliance
- ✅ Cross-browser compatibility

### **Performance Requirements**
- ✅ <5 seconds for cohort generation (100K records)
- ✅ <100ms for cached results
- ✅ >80% cache hit rate for common configurations
- ✅ <500MB memory usage for large cohorts
- ✅ Mobile-optimized performance

### **Business Requirements**
- ✅ Report factory foundation ready for future report types
- ✅ Reusable filter system across all reports
- ✅ Enterprise-grade collaboration features
- ✅ Production-ready deployment configuration
- ✅ Comprehensive documentation and training materials

This implementation plan provides a comprehensive roadmap for building an enterprise-grade cohort analysis system with a solid foundation for future report development.
