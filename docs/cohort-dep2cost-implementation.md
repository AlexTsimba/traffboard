# Cohort DEP2COST Implementation Plan (Revised)

## Project Context

**What**: Complete functional cohort report with DEP2COST metric and universal attribution-aware filter system  
**Why**: Analyze campaign effectiveness through deposits-to-cost ratio analysis with flexible attribution logic  
**Foundation**: Existing cohort UI at `/main/dashboard/cohorts` with 80% implementation complete

## Attribution Architecture

**Core Concept**: Attribution determines temporal grouping logic for ALL reports (not just cohorts)

### Attribution Impact
- **FTD Date Attribution**: Group data by `firstDepositDate` (when user made FTD)  
- **Registration Date Attribution**: Group data by `signUpDate` (when user registered)

**Example**: User registered yesterday, made FTD today
- FTD Attribution → counts as "today's" data  
- REG Attribution → counts as "yesterday's" data

**Implementation**: Dynamic `GROUP BY` field selection in SQL queries, no schema changes needed

## Current State Analysis

### ✅ Already Working
- Server Component cohort page with 4 metric tabs (dep2cost, roas, adpu, retention)
- Filter system with General + Report-Specific tabs (`EnhancedFilterModal`)
- `CohortDataService` integration with PostgreSQL-Arquero pipeline
- URL-based filter persistence with searchParams
- UI components: `CohortTable`, `CohortMetadata`, `ReportHeader`
- Database schema: `PlayerData` with `signUpDate` and `firstDepositDate` fields

### ❌ Current Issues  
- **Cascading filters broken**: Partner → Campaign → Country selection not working
- **Mock data only**: `CohortDataService` returns test data, real `CohortProcessor` commented out
- **No Attribution support**: Missing universal attribution logic for all reports
- **No Params filtering**: Missing tagOs, tagSource, tagSub2, tagWebId filters

## Implementation Plan

### Stage 1: Universal Attribution Foundation (Day 1)
**Target**: Attribution-aware data pipeline for all future reports

#### Deliverable 1.1: Universal Attribution API (4 hours)
**Files**: `/api/universal/filter-options/route.ts` (new), `cohort-sql.ts`
- Create universal API endpoint supporting attribution parameter
- Implement dynamic date field selection: `signUpDate` vs `firstDepositDate`
- Add attribution support to SQL query builder

**User Test**: API returns different data based on attribution parameter  
**Acceptance**: `/api/universal/filter-options?attribution=ftd&type=partners` works

#### Deliverable 1.2: Attribution Filter UI (3 hours)
**Files**: `filter-composer.ts`, `enhanced-filter-modal.tsx`
- Add "Attribution by" dropdown to General Filters: ["FTD Date", "Registration Date"]
- Integrate with URL params and universal filter state
- Ensure attribution applies to all report types

**User Test**: Attribution dropdown in General tab, selection affects URL globally  
**Acceptance**: Dropdown works, URL updates, ready for any report type

### Stage 2: Fix Existing Filter System (Day 1-2)
**Target**: Working cascading filters with params support

#### Deliverable 2.1: Fix Cascading Filters (4 hours)
**Files**: Updated universal API, `AutocompleteFilterInput.tsx`
- Debug and fix Partner → Campaign → Country filtering via universal API
- Implement proper cascading with attribution support
- Add loading states and debouncing

**User Test**: Select partner → campaigns dropdown shows only that partner's campaigns  
**Acceptance**: Cascading works through universal API with attribution

#### Deliverable 2.2: Params Filter Tab (4 hours)
**Files**: `enhanced-filter-modal.tsx`, universal API extension
- Add third "Params" tab to filter modal
- Implement tagOs, tagSource, tagSub2, tagWebId autocomplete filters
- Extend universal API to support params with attribution

**User Test**: Third "Params" tab visible, tag filters work with attribution logic  
**Acceptance**: Tab switching works, API returns tag options respecting attribution

### Stage 3: Real DEP2COST Implementation (Day 2)
**Target**: Actual calculations with attribution support

#### Deliverable 3.1: Attribution-Aware CohortProcessor (6 hours)
**Files**: `cohort-data-service.ts`, `cohort-processor.ts`, `cohort-sql.ts`
- Uncomment and debug existing `CohortProcessor` code
- Implement attribution logic in SQL: dynamic GROUP BY field selection
- Support all filter types through universal API

**User Test**: Apply filters with different attribution → see different cohort groupings  
**Acceptance**: Real data loads, attribution changes results, no mock data

#### Deliverable 3.2: DEP2COST Calculations (4 hours)
**Files**: `cohort-metrics.ts`, `cohort-sql.ts`
- Implement formula: `sum(depositsSum) / sum(fixedPerPlayer)` per breakpoint
- Add percentage formatting with attribution-based grouping
- Support day/week breakpoints: [1,3,5,7,14,17,21,24,27,30] and [7,14,21,28,35,42]

**User Test**: DEP2COST tab shows percentages, attribution switching changes results  
**Acceptance**: Percentages display correctly, attribution affects calculations

### Stage 4: Universal System Validation (Day 3)
**Target**: Confirm attribution works for future reports

#### Deliverable 4.1: End-to-End Attribution Testing (4 hours)
- Test attribution with all filter combinations
- Validate universal API works for cohort report type
- Performance check: sub-3 second query times with attribution switching
- Document attribution integration pattern for future reports

**User Test**: Switch attribution → all data recalculates correctly  
**Acceptance**: Attribution universally affects data grouping, performance acceptable

## Universal Architecture Benefits

**For Current Cohorts**:
- ✅ Working DEP2COST with attribution-based cohort grouping
- ✅ Complete filter system with cascading and params

**For Future Reports**:
- ✅ Financial reports inherit attribution logic automatically
- ✅ Marketing reports get attribution support out-of-the-box  
- ✅ Any new report type can use universal filter system

**Technical Foundation**:
- ✅ Universal API supports any report type with attribution
- ✅ PostgreSQL-Arquero pipeline is attribution-aware
- ✅ Filter system scales to unlimited report types

## Success Criteria

**Functional Requirements**:
- ✅ Universal attribution affecting all data grouping
- ✅ Working cascading filters (Partner → Campaign → Country)  
- ✅ Params filtering (tagOs, tagSource, tagSub2, tagWebId)
- ✅ Real DEP2COST calculations with attribution support
- ✅ Responsive triangular cohort table with percentage display

**Technical Requirements**:
- ✅ Zero TypeScript compilation errors
- ✅ Query performance under 3 seconds with attribution switching
- ✅ Universal API ready for Financial/Marketing reports
- ✅ All filters persist in URL for shareability

**Demo-Ready Criteria**:
- ✅ DEP2COST tab fully functional with real attribution-based data
- ✅ Attribution switching visibly changes results
- ✅ Filter system works universally
- ✅ 3 other metric tabs show UI with "Coming Soon" data

## Approval Process

**Critical**: Each deliverable requires explicit user approval before proceeding to next stage. No deliverable is considered complete until user testing criteria are met and approved.

**Estimated Timeline**: 3 days for production-ready cohort DEP2COST report with universal attribution system