# TraffBoard Business Logic Nuances

## ⚠️ CRITICAL ATTRIBUTION LOGIC

### Registration Attribution
- **Rule**: Include ALL lifetime value from players grouped by registration date (signUpDate)
- **Business Intent**: "What's the total value of players who came on this date?"
- **SQL Pattern**: `GROUP BY signUpDate, SUM(ftdSum) FROM all players with that signUpDate`
- **Example**: 
  - 10 players registered Jan 1
  - 5 deposited Jan 1 ($500), 5 deposited Jan 3-7 ($800)  
  - **Result**: Jan 1 cohort = 10 players, $1300 total value
- **Edge Cases**: Include players with signUpDate but no FTD (ftdCount=0, ftdSum=0)

### FTD Attribution  
- **Rule**: Only players who made FTD, grouped by actual FTD date (firstDepositDate)
- **Business Intent**: "How much money actually came in on this date?"
- **SQL Pattern**: `GROUP BY firstDepositDate WHERE firstDepositDate IS NOT NULL`
- **Example**:
  - Same 10 players as above
  - **Result**: Jan 1 = 5 players $500, Jan 3 = 2 players $300, Jan 5 = 3 players $500
- **Edge Cases**: Exclude players with no FTD entirely

### Attribution Switching Impact
- **Critical**: Different attribution modes produce completely different cohort structures
- **UI Requirement**: Clear indicators which attribution mode is active
- **Performance**: Queries may have different optimization strategies per attribution

---

## 🎯 COHORT ANALYSIS RULES

### Breakpoints (IMMUTABLE)
- **DAY_BREAKPOINTS**: `[1, 3, 5, 7, 14, 17, 21, 24, 27, 30]`
- **WEEK_BREAKPOINTS**: `[7, 14, 21, 28, 35, 42]`
- **MONTH_BREAKPOINTS**: `[30, 60, 90, 120, 180, 365]`
- **Rule**: Never modify these without business approval - metrics depend on consistency

### Cohort Modes
- **Daily Mode**: Monday start, Sunday view, use DAY_BREAKPOINTS
- **Weekly Mode**: Monday start, use WEEK_BREAKPOINTS  
- **Monthly Mode**: 1st of month start, use MONTH_BREAKPOINTS

### Metrics Calculation
- **DEP2COST**: (Total Deposits / Total Marketing Cost) * 100
- **ROAS**: (Revenue / Ad Spend) * 100
- **AVG DEPOSIT SUM**: Total Deposits / Number of Depositing Players
- **RETENTION RATE**: (Active Players at Day X / Initial Cohort Size) * 100

---

## ⚡ PERFORMANCE REQUIREMENTS

### Database Queries (NON-NEGOTIABLE)
- **Fresh Queries**: <3 seconds response time
- **Cached Queries**: <100ms response time
- **Cache Hit Rate**: >80% required
- **Concurrent Users**: Support 50+ simultaneous cohort analyses

### UI Response Times
- **Filter Changes**: <200ms to show loading state
- **Tab Switching**: <100ms transition
- **Modal Opening**: <150ms animation
- **Export Generation**: <5 seconds for CSV, <10 seconds for PDF

### Memory Usage
- **Client Side**: <50MB per cohort report
- **Server Side**: <200MB per query processing
- **Database Connections**: Pool limit 20, timeout 30s

---

## 🔄 FILTER SYSTEM LOGIC

### Filter Hierarchy (MANDATORY ORDER)
1. **Date Range** (temporal boundary)
2. **Partners** (traffic source)
3. **Campaigns** (marketing campaign)
4. **Countries** (geography)
5. **OS** (device/platform)
6. **Custom Tags** (tagOs, tagSource, tagSub2, tagWebId)

### Cascading Rules
- **Partner → Campaign**: Campaigns filtered by selected partners
- **Country + OS**: Independent filters (no cascading)
- **Date Range**: Affects ALL other filter options
- **Attribution**: Affects ALL filter statistics

### Filter State Management
- **URL Persistence**: All filters must be shareable via URL
- **Modal State**: Temporary changes until "Apply" clicked
- **Reset Behavior**: "Clear" resets to default date range (This Month)

---

## 📱 UI/UX CRITICAL RULES

### Responsive Design (MOBILE-FIRST)
- **Breakpoint**: 320px minimum width support
- **Cards**: Must stack vertically on mobile
- **Tables**: Horizontal scroll with sticky columns
- **Modals**: Full-screen on mobile, centered on desktop

### Loading States (MANDATORY)
- **Skeleton Loaders**: For table content, chart areas
- **Spinners**: For filter options, modal content  
- **Progress Bars**: For export generation, large data processing
- **Placeholder Text**: "Loading..." with context

### Empty States (USER-FRIENDLY)
- **No Data**: "No data found for selected filters" + suggestion to adjust
- **No Results**: "Try different date range or partners"
- **Error States**: "Failed to load data" + retry button
- **Initial State**: "Select filters to view cohort analysis"

### Accessibility (WCAG AA)
- **Keyboard Navigation**: All interactive elements
- **Screen Readers**: ARIA labels on all charts and tables
- **Color Contrast**: 4.5:1 minimum ratio
- **Focus Indicators**: Visible focus states

---

## 🔒 SECURITY & DATA RULES

### Data Access Patterns
- **Authentication**: NextAuth.js v5 required for all cohort queries
- **Authorization**: Role-based access (admin, analyst, viewer)
- **Data Filtering**: Only show data user has permission to see
- **Audit Logging**: Log all filter changes and exports

### SQL Injection Prevention
- **Prisma Only**: Never use raw SQL with user inputs
- **Parameter Validation**: Zod schemas for all filter inputs
- **Whitelist Approach**: Enum validation for all dropdown values
- **Escape Sequences**: Proper handling in LIKE queries

### Performance Security
- **Query Limits**: Max 100,000 records per query
- **Rate Limiting**: 60 requests per minute per user
- **Resource Monitoring**: Alert on queries >5 seconds
- **Connection Pooling**: Prevent connection exhaustion

---

## 🎨 COMPONENT ARCHITECTURE RULES

### Server vs Client Components
- **Server Components**: Main pages, data-heavy components
- **Client Components**: Interactive elements (modals, charts, filters)
- **Hybrid Approach**: Server data + client interactivity

### State Management Patterns
- **URL State**: Filters, pagination, sort order
- **React State**: Modal visibility, temporary form data
- **Zustand Store**: Complex application state (if needed)
- **Context**: Shared configuration, theme

### File Structure Conventions
- **Pages**: `/src/app/main/dashboard/[report]/page.tsx`
- **Components**: `/src/components/reports/[report]/`
- **APIs**: `/src/app/api/[report]/[endpoint]/route.ts`
- **Types**: `/src/types/[report].ts`

---

## 🧪 TESTING REQUIREMENTS

### Test Coverage Minimums
- **Unit Tests**: >80% coverage for business logic
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user journeys (filter → view → export)
- **Performance Tests**: Database query optimization

### Real Data Testing
- **PostgreSQL**: Use real database, no mocking
- **Test Data**: Realistic datasets with edge cases
- **Seed Data**: Consistent test data for reproducible results
- **Performance**: Test with production-scale data volumes

### Error Scenario Testing
- **Network Failures**: API timeout handling
- **Database Errors**: Connection failures, query errors
- **Invalid Data**: Null values, malformed inputs
- **Edge Cases**: Empty datasets, single records, large datasets

---

## 🚨 CRITICAL BUSINESS DECISIONS

### Attribution Default Behavior
- **Default Mode**: FTD Attribution (backward compatibility)
- **UI Indicator**: Always show which attribution is active
- **Switching**: Preserve other filters when changing attribution
- **Documentation**: Clear explanation in UI tooltips

### Date Range Defaults
- **Initial Load**: "This Month" pre-selected
- **Reset Behavior**: Return to "This Month" not "All Time"
- **Validation**: Prevent date ranges >1 year for performance

### Export Limitations
- **CSV**: Max 50,000 rows
- **Excel**: Max 1M cells (Excel limitation)
- **PDF**: Max 10 pages for readability
- **Timeout**: 30 seconds max export time

---

## 📝 DOCUMENTATION REQUIREMENTS

### Code Documentation
- **Functions**: JSDoc comments for all business logic
- **Interfaces**: TypeScript documentation for all types
- **Components**: Props documentation and usage examples
- **APIs**: OpenAPI/Swagger documentation

### Business Logic Documentation
- **Decision Records**: Why certain attribution rules were chosen
- **Change Log**: Track all business rule modifications
- **Examples**: Concrete examples for each business rule
- **Edge Cases**: Document known edge cases and handling

---

**Last Updated**: July 10, 2025  
**Version**: 1.0  
**Owner**: TraffBoard Project Team

> ⚠️ **IMPORTANT**: These rules are derived from real production requirements and user feedback. Any changes must be approved by business stakeholders and thoroughly tested.