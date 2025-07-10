# Cohort Filter System Implementation Plan

## 🎯 Project Overview
Transform existing filter system into cascading filters with FTD counts, cohort-specific filters redesign, and full server-side data integration for DEP2COST analysis.

**Duration:** 3-4 days  
**Scope:** MVP ready for extension to other report types

---

## 📊 Current Codebase Analysis

### ✅ **Keep (Working Components)**
- `/src/components/reports/filters/enhanced-filter-modal.tsx` - Main filter modal structure
- `/src/components/reports/filters/autocomplete-filter-input.tsx` - Already supports partners/campaigns
- `/src/app/api/cohort/filter-options/route.ts` - Good structure, needs cascading logic
- `/src/app/main/dashboard/cohorts/page.tsx` - Server component structure good
- `/src/components/reports/filters/filter-composer.ts` - General filters definitions

### 🔧 **Modify (Needs Updates)**
- `/src/lib/reports/cohort/cohort-specific-filters.ts` - Complete redesign needed
- Enhanced Filter Modal - Add cascading clear logic
- Server component - Add full filter processing
- API route - Add currentFilters parameter

### ❌ **Delete/Replace**
- Current `cohortStep` radio implementation → `cohortMode` select
- Static `breakpoints` multiselect → Dynamic based on mode
- Mock data in server component → Real filtered data

---

## 🚀 Deliverables & User Testing

### **PHASE 1: Cohort-Specific Filters Redesign**
**Duration:** Day 1 (6-8 hours)

#### **Deliverable 1.1: Cohort Mode Dropdown**
**Files Modified:**
- `/src/lib/reports/cohort/cohort-specific-filters.ts` - Complete rewrite
- `/src/lib/reports/cohort/breakpoints-config.ts` - NEW FILE

**User Test:** 
- ✅ Open cohort filters → "Cohort Specific" tab 
- ✅ See "Cohort Mode" dropdown with: Daily, Weekly, Monthly
- ✅ Default selection: "Daily"
- ✅ No breakpoints selector visible (auto-determined)

#### **Deliverable 1.2: Metric Focus**
**User Test:**
- ✅ See "Primary Metric" dropdown 
- ✅ Default selection: "DEP2COST"
- ✅ Options: DEP2COST, ROAS, ADPU, Retention

---

### **PHASE 2: Cascading Filters + FTD Counts**
**Duration:** Day 2 (8 hours)

#### **Deliverable 2.1: Partner → Campaign Dependencies**
**Files Modified:**
- `/src/app/api/cohort/filter-options/route.ts` - Add currentFilters logic
- `/src/components/reports/filters/enhanced-filter-modal.tsx` - Add clearing logic

**User Test:**
- ✅ Select Partner X → Campaign dropdown shows only campaigns from Partner X
- ✅ Change Partner X to Y → Campaign selection clears automatically
- ✅ Campaign dropdown shows "Loading..." during fetch

#### **Deliverable 2.2: Real-time FTD Counts**
**User Test:**
- ✅ Partner dropdown shows: "153278 - Partner Name (1,234 FTD)"
- ✅ Select Partner → Campaign FTD counts update within 300ms
- ✅ All filters show accurate FTD numbers based on current selection

---

### **PHASE 3: Server-Side Data Integration**
**Duration:** Day 3 (8 hours)

#### **Deliverable 3.1: Filter Application**
**Files Modified:**
- `/src/app/main/dashboard/cohorts/page.tsx` - Process all filters
- `/src/app/api/cohort/data/route.ts` - Accept and process filters

**User Test:**
- ✅ Apply filters → Click "Apply Filters" button
- ✅ URL updates with all selected filters
- ✅ Page refreshes with filtered data
- ✅ Cohort table shows only data matching filters

#### **Deliverable 3.2: DEP2COST Calculations**
**User Test:**
- ✅ Cohort table shows DEP2COST values
- ✅ Values change when filters applied
- ✅ "No data" message when filters return empty result
- ✅ Loading spinner during data fetch

---

### **PHASE 4: UI Polish + Extensibility**
**Duration:** Day 4 (6 hours)

#### **Deliverable 4.1: UI Improvements**
**Files Modified:**
- Enhanced Filter Modal styling
- Loading states polish
- Error handling

**User Test:**
- ✅ Filter modal opens/closes smoothly
- ✅ Clear visual feedback for loading states
- ✅ Disabled states for unavailable options
- ✅ Responsive design works on mobile

#### **Deliverable 4.2: Architecture Documentation**
**Files Created:**
- `/docs/adding-new-reports.md` - Guide for new report types

**Developer Test:**
- ✅ New report type can be added by creating specific-filters.ts
- ✅ Enhanced Filter Modal automatically supports new report
- ✅ Clear separation between general and specific filters

---

## 🎯 Final System Test

### **Complete User Flow Test:**
1. ✅ Open cohorts page → See filter button with active filters count
2. ✅ Click filter button → Modal opens with General/Cohort tabs
3. ✅ Select "This month" date range → Auto-applied
4. ✅ Select Partner → Only related campaigns available
5. ✅ Select Campaign → Country options show real data for that campaign
6. ✅ Switch to "Cohort Specific" tab → See Daily/Weekly/Monthly modes
7. ✅ Select "Weekly" → Breakpoints auto-configured for weeks
8. ✅ Click "Apply Filters" → Modal closes, URL updates
9. ✅ Cohort table shows filtered DEP2COST data
10. ✅ Filter chips display active selections with clear options

### **Performance Test:**
- ✅ Filter changes respond within 300ms
- ✅ Large datasets (1000+ partners) load smoothly
- ✅ Debounce prevents excessive API calls
- ✅ FTD counts accurate and up-to-date

### **Extensibility Test:**
- ✅ Architecture ready for Financial/Marketing/Other reports
- ✅ Adding new filter type requires minimal code changes
- ✅ General filters work across all report types

---

## 📁 File Structure After Implementation

```
src/
├── app/api/cohort/
│   ├── filter-options/route.ts ✅ Enhanced with cascading
│   └── data/route.ts ✅ Full filter processing
├── components/reports/filters/
│   ├── enhanced-filter-modal.tsx ✅ Cascading logic
│   └── autocomplete-filter-input.tsx ✅ FTD display
├── lib/reports/cohort/
│   ├── cohort-specific-filters.ts ✅ Redesigned
│   ├── breakpoints-config.ts ✅ NEW - Mode configurations
│   └── cohort-data-service.ts ✅ Filter integration
└── app/main/dashboard/cohorts/
    └── page.tsx ✅ Server-side filter processing
```

---

## ✅ Success Criteria

1. **Cascading Filters:** Partner selection filters campaigns with accurate FTD counts
2. **Cohort Modes:** Daily/Weekly/Monthly with auto-breakpoints 
3. **Data Integration:** Filters actually affect displayed cohort data
4. **Performance:** All interactions respond within 300ms
5. **Extensibility:** Architecture ready for new report types
6. **User Experience:** Intuitive, responsive, and reliable filtering

**Ready for implementation?** Each phase builds on the previous and delivers testable user value.
