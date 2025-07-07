# Report Factory System

## 🎯 Overview
Modular reporting architecture supporting cohort analysis, funnel reports, retention analysis, and future report types through reusable components.

## 🏗️ Core Components

### Filter System
Universal filter components with modal interface and active chips display:

```typescript
// Filter Configuration
interface FilterDefinition {
  key: string;
  type: 'select' | 'multiselect' | 'date_range' | 'toggle';
  label: string;
  required: boolean;
  options?: FilterOption[];
  dependencies?: string[];
}

// Usage Pattern
const cohortFilters: FilterDefinition[] = [
  {
    key: 'partner_ids',
    type: 'multiselect',
    label: 'Partners',
    required: true,
    options: partnerOptions
  },
  {
    key: 'date_range',
    type: 'date_range', 
    label: 'Cohort Period',
    required: true
  }
];
```

### Data Pipeline Architecture
Modular processing pipeline for complex data transformations:

```typescript
// Pipeline Flow
1. Data Extraction  → PostgreSQL queries with filtering
2. Transformation   → Arquero business logic processing  
3. Caching         → Multi-layer result caching
4. Export          → CSV, Excel, PDF generation

// Example Usage
const pipeline = await DataPipelineManager.execute({
  source: { type: 'prisma', model: 'PlayerData' },
  transforms: [
    { type: 'filter', config: filters },
    { type: 'cohort', config: cohortConfig },
    { type: 'aggregate', config: metrics }
  ],
  cache: { ttl: 300, tags: ['cohort'] }
});
```

### Plugin System
Extensible architecture for adding new report types:

```typescript
// Plugin Registration
PluginRegistry.register({
  id: 'cohort-analysis',
  name: 'Cohort Analysis',
  type: 'report',
  dependencies: [],
  dataProcessor: CohortDataProcessor,
  component: CohortReportComponent
});

// Plugin Usage
const processor = PluginRegistry.getDataProcessor('cohort-analysis');
const result = await processor.process(data, config);
```

## 📊 Report Components

### Universal Components
- **ReportContext** - State management across report components
- **ReportHeader** - Title, description, last updated, export actions
- **FilterSystem** - Modal-based filter interface with active chips
- **DataTable** - Sortable, paginated data display
- **ExportButton** - Multi-format export functionality

### Report-Specific Components
- **CohortHeatmap** - Triangular cohort visualization
- **CohortBreakpoints** - Day/week mode selector
- **MetricCards** - Key performance indicators

## 🔧 Usage Patterns

### Basic Report Implementation
```typescript
// Report Page Component
export default function CohortReportPage() {
  return (
    <ReportProvider reportType="cohort">
      <ReportHeader 
        title="Cohort Analysis"
        description="Track player behavior over time"
      />
      
      <FilterSystem filters={cohortFilters} />
      
      <Suspense fallback={<ReportSkeleton />}>
        <CohortResultsTable />
        <CohortHeatmap />
      </Suspense>
      
      <ExportButton formats={['csv', 'excel']} />
    </ReportProvider>
  );
}
```

### Custom Data Processing
```typescript
// Custom Transform Implementation
export const customTransform: TransformFunction = {
  type: 'custom',
  process: async (data, config) => {
    return data
      .filter(config.filterPredicate)
      .groupby('cohort_date')
      .summarize({
        total_players: op.count(),
        avg_deposits: op.mean('deposits')
      });
  }
};

// Register and Use
TransformBuilder.registerTransform(customTransform);
```

## 🚀 Performance Features

### Caching Strategy
- **Query Cache**: PostgreSQL results (5 min TTL)
- **Computation Cache**: Processed results (30 min TTL)
- **Component Cache**: React query caching
- **Tag-based Invalidation**: Smart cache clearing

### Optimization Techniques
- **Incremental Loading**: Progressive data fetching
- **Background Processing**: Heavy computations off main thread
- **Memory Management**: Efficient data structure usage
- **Query Optimization**: PostgreSQL-first approach

## 🧪 Testing Coverage

### Filter System Tests (506 lines)
- Modal open/close interactions
- Filter validation and dependencies
- Active filter chips functionality
- Cross-filter state management

### Plugin System Tests (258 lines)  
- Plugin registration/unregistration
- Dependency validation
- Data processor functionality
- Integration safety checks

### State Management Tests (359 lines)
- Zustand store operations
- Persistence mechanisms
- Performance with large datasets
- Concurrent operation handling

### Integration Tests (392 lines)
- Complete reporting workflows
- Filter → Data → Display pipeline
- Export functionality
- Error handling and recovery

## 🎯 Current Implementation Status

### ✅ Completed Components
- **Filter System**: Modal interface, active chips, validation
- **Data Pipeline**: Modular architecture with 7 specialized modules
- **Plugin Registry**: Extensible system for report types
- **State Management**: Zustand store with persistence
- **Export System**: Multi-format export foundation
- **Universal UI**: ReportHeader, context providers

### 🚧 In Development
- **Cohort Analysis**: Core metrics and breakpoint handling
- **Performance Optimization**: Advanced caching and query optimization
- **Export Enhancements**: PDF generation, chart exports

### 📋 Planned Features
- **Funnel Analysis**: Conversion tracking reports
- **Retention Analysis**: Player lifecycle reports  
- **Attribution Analysis**: Marketing effectiveness reports
- **Real-time Updates**: Live data refresh capabilities 