# Cohort Filter System Migration Plan

## 🎯 Goal
Complete universal filter system with UI and backend functions. General filters shared, report-specific filters modular. Focus: cohort analysis with DEP2COST metric, extensible architecture for ROAS/ADPU/RETENTION.

## 🏗️ Architecture Overview

### Current State
- Enhanced Filter Modal with General/Cohort tabs ✅
- Report Factory Foundation ✅ 
- Basic cohort-specific filters ❌ (needs cohort mode)
- API endpoint structure ❌ (needs cohort mode support)

### Target Architecture
```
Universal Filter System
├── General Filters (shared)
│   ├── Date Range (This month default)
│   ├── Partners/Campaigns (autocomplete)
│   └── Countries/OS (multiselect)
└── Report-Specific Filters
    └── Cohort Analysis
        ├── Cohort Mode (daily/weekly/monthly)
        └── Primary Metric (dep2cost/roas/adpu/retention)
```

## 📂 Key Files

### Frontend Components
- `/src/components/reports/filters/enhanced-filter-modal.tsx` - Universal modal
- `/src/lib/reports/cohort/cohort-specific-filters.ts` - Cohort filters config
- `/src/lib/reports/cohort/breakpoints-config.ts` - **NEW** Cohort mode logic
- `/src/components/reports/universal/report-header.tsx` - Universal header

### Backend API
- `/src/app/api/cohort/data/route.ts` - Main cohort API endpoint  
- `/src/lib/reports/cohort/cohort-data-service.ts` - Data processing service
- `/src/lib/reports/cohort/ui-filter-conversion.ts` - Filter conversion

### Configuration
- `/src/components/reports/filters/filter-composer.ts` - General filters
- `/src/types/reports.ts` - TypeScript interfaces

## 🔄 Cohort Mode System

### Three Modes (One Dropdown)
```typescript
type CohortMode = "daily" | "weekly" | "monthly";

const COHORT_CONFIGS = {
  daily: {
    label: "Daily Cohorts",
    breakpoints: [1,4,7,11,14,17,21,24,27,30], // days
    groupBy: "day"
  },
  weekly: {
    label: "Weekly Cohorts", 
    breakpoints: [1,2,3,4], // weeks
    groupBy: "week", // Monday start, Sunday view
  },
  monthly: {
    label: "Monthly Cohorts",
    breakpoints: [1,2,3,4,5,6], // months
    groupBy: "month"
  }
};
```

### API Request Structure
```typescript
interface CohortDataRequest {
  filters: AppliedFilter[];        // General filters
  cohortMode: CohortMode;          // Replaces separate breakpoints
  metric: "dep2cost";              // Focus metric
  dateRange: { start: string; end: string };
}
```

## 📋 Migration Subtasks

### 1. **Create Breakpoints Configuration**
- File: `/src/lib/reports/cohort/breakpoints-config.ts`
- Constants for all three modes
- Helper functions for breakpoint calculation
- Week logic (Monday-Sunday)

### 2. **Update Cohort-Specific Filters**
- File: `/src/lib/reports/cohort/cohort-specific-filters.ts`
- Replace `cohortStep` with `cohortMode` dropdown
- Remove separate `breakpoints` filter
- Add "monthly" option
- Focus on `dep2cost` metric

### 3. **Migrate API Endpoint**
- File: `/src/app/api/cohort/data/route.ts`
- Accept `cohortMode` instead of `breakpoints`
- Auto-determine breakpoints from mode
- Validate cohort modes
- Update response metadata

### 4. **Update Data Service**
- File: `/src/lib/reports/cohort/cohort-data-service.ts`
- Integrate with breakpoints-config
- Add weekly/monthly grouping logic
- DEP2COST calculation focus

### 5. **Update TypeScript Interfaces**
- File: `/src/types/reports.ts`
- Add `CohortMode` type
- Update `CohortDataRequest` interface
- Remove old breakpoints types

### 6. **Test Filter Integration**
- Verify Enhanced Filter Modal works
- Test General + Cohort-specific filters
- Ensure URL persistence works
- Validate API request/response

### 7. **UI Polish & Documentation**
- Update cohort mode selector UI
- Remove breakpoints UI elements
- Test all three modes
- Document for future report types

## 🚀 Extensibility Design

### For New Reports
1. Create `/src/lib/reports/{report-type}/{report-type}-specific-filters.ts`
2. Add to Enhanced Filter Modal props
3. API endpoint at `/src/app/api/{report-type}/data/route.ts`
4. Reuse Report Header component

### For New Cohort Metrics
- Add to `metric` options in cohort-specific-filters.ts
- Extend data service calculations
- No architectural changes needed

## ✅ Success Criteria
- [ ] Universal filter system works for any report type
- [ ] Cohort analysis with DEP2COST fully functional
- [ ] Three cohort modes (daily/weekly/monthly) working
- [ ] Clean separation: General vs Report-specific filters
- [ ] Easy extensibility for new reports/metrics
- [ ] Report Factory architecture preserved
