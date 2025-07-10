# Universal Filter System for Report Factory

## 🎯 Project Goal
Build universal cascading filter system that works for any report type with minimal setup. Focus on cohort implementation as reference architecture.

**Duration:** 4-5 days  
**Result:** Complete universal system ready for Financial/Marketing/Other reports

---

## 🏗️ Universal Architecture Design

### **Core Universal Components**

#### **1. Universal Report Header**
**File:** `/src/components/reports/universal/report-header.tsx` ✅ (exists, enhance)
- Report title + description
- Filter button with active count badge
- Filter chips display
- **Reusable for ANY report type**

#### **2. Universal Filter Modal**
**File:** `/src/components/reports/filters/universal-filter-modal.tsx` (rename from enhanced)
- General Filters tab (universal across reports)
- Report-Specific tab (custom per report)
- Params tab (tagOs, tagSource, tagSub2, tagWebId)
- **Auto-detects available tabs based on props**

#### **3. Universal Cascading Engine**
**Files to create:**
- `/src/lib/reports/filters/cascade-engine.ts` - Core dependency logic
- `/src/lib/reports/filters/cascade-config.ts` - Dependency definitions
- `/src/lib/reports/filters/ftd-calculator.ts` - Universal FTD calculations

---

## 🔗 Universal Cascading System

### **Cascade Hierarchy (Universal Pattern)**
```
Partner → Campaign → Geography (Country, OS) → Params (tagOs, tagSource, etc.)
```

### **API Pattern (Universal)**
```
GET /api/{reportType}/filter-options?type={filterType}&currentFilters={json}
```

**Examples:**
- `/api/cohort/filter-options?type=campaigns&currentFilters={"partners":["123"]}`
- `/api/financial/filter-options?type=sources&currentFilters={"revenue":["high"]}`
- `/api/marketing/filter-options?type=channels&currentFilters={"budget":["premium"]}`

---

## 📱 Three-Tab System

### **Tab 1: General Filters (Universal)**
- Date Range (This month default)
- Partners (cascades to campaigns)
- Campaigns (filtered by partners)
- Countries (filtered by campaigns)
- OS (filtered by campaigns)

### **Tab 2: Report-Specific**
**Cohort Example:**
- Cohort Mode (Daily/Weekly/Monthly)
- Primary Metric (DEP2COST focus)

**Future Financial Example:**
- Revenue Range
- Transaction Type

### **Tab 3: Params** 
- tagOs (Prisma field) 
- tagSource (Prisma field)
- tagSub2 (Prisma field)
- tagWebId (Prisma field)
- **Same fields for ALL reports**

---

## 🚀 Implementation Plan

### **PHASE 1: Universal Filter Foundation** 
**Duration:** Day 1-2 (12-16 hours)

#### **Deliverable 1.1: Universal Components**
**Files Created/Modified:**
- `/src/components/reports/universal/report-header.tsx` - Enhance existing
- `/src/components/reports/filters/universal-filter-modal.tsx` - Rename + enhance
- `/src/lib/reports/filters/cascade-engine.ts` - NEW universal cascading logic
- `/src/lib/reports/filters/cascade-config.ts` - NEW dependency definitions

**User Test:**
- ✅ Any report page shows: Title + Filter Button + Active Chips
- ✅ Filter button shows count: "Filters (3 active)"
- ✅ Click filter → Universal modal with 3 tabs: General, Report, Params

#### **Deliverable 1.2: Three-Tab System**
**User Test:**
- ✅ General tab: Date, Partners, Campaigns, Countries, OS
- ✅ Report tab: Shows "Cohort Analysis" with mode/metric
- ✅ Params tab: Shows tagOs, tagSource, tagSub2, tagWebId
- ✅ Tab switching preserves filter state

---

### **PHASE 2: Universal Cascading System**
**Duration:** Day 2-3 (12-16 hours)

#### **Deliverable 2.1: Cascade Engine**
**Files Created/Modified:**
- `/src/app/api/universal/filter-options/route.ts` - NEW universal API
- `/src/lib/reports/filters/cascade-engine.ts` - Core dependency logic
- Update AutocompleteFilterInput for cascading

**User Test:**
- ✅ Select Partner → Only campaigns from that partner available
- ✅ Select Campaign → Only countries from that campaign available  
- ✅ Change Partner → Campaign/Country selections clear automatically
- ✅ Params filters work independently

#### **Deliverable 2.2: FTD Integration**
**User Test:**
- ✅ All dropdowns show: "123 - Partner Name (1,234 FTD)"
- ✅ FTD counts update in real-time with cascading
- ✅ Debounce prevents excessive API calls (300ms)
- ✅ Loading states during FTD recalculation

---

### **PHASE 3: Server-Side Integration**
**Duration:** Day 3-4 (12-16 hours)

#### **Deliverable 3.1: Universal API Processing**
**Files Created/Modified:**
- `/src/app/api/cohort/data/route.ts` - Accept universal filter format
- `/src/lib/reports/cohort/cohort-data-service.ts` - Process all filter types
- `/src/app/main/dashboard/cohorts/page.tsx` - Server component integration

**User Test:**
- ✅ Apply filters → URL updates with all selections
- ✅ Server component receives all filter types
- ✅ Cohort table shows filtered data
- ✅ Params filters affect data results

#### **Deliverable 3.2: Real Cohort Table**
**User Test:**
- ✅ DEP2COST calculations based on applied filters
- ✅ Empty state when no data matches filters
- ✅ Performance: Table loads within 2 seconds
- ✅ All filter combinations work correctly

---

### **PHASE 4: Extensibility & Documentation**
**Duration:** Day 4-5 (8-12 hours)

#### **Deliverable 4.1: New Report Template**
**Files Created:**
- `/docs/report-factory/adding-new-reports.md` - Complete guide
- `/examples/financial-report-setup.md` - Example implementation
- `/src/lib/reports/templates/report-template.ts` - Boilerplate

**Developer Test:**
- ✅ New report can be added in 30 minutes
- ✅ General filters work automatically
- ✅ Only need to define report-specific filters
- ✅ Cascading works out of the box

#### **Deliverable 4.2: System Validation**
**User Test:**
- ✅ Complete user flow: Open cohorts → Filter → See real data
- ✅ All three tabs functional
- ✅ Cascading works smoothly
- ✅ Performance criteria met (<300ms interactions)

---

## 📁 Universal File Structure

```
src/
├── components/reports/
│   ├── universal/
│   │   └── report-header.tsx ✅ Universal header for ANY report
│   └── filters/
│       ├── universal-filter-modal.tsx ✅ Universal 3-tab modal
│       ├── autocomplete-filter-input.tsx ✅ Enhanced with cascading
│       └── params-filter-tab.tsx ✅ NEW - tagOs, tagSource, etc.
├── lib/reports/
│   ├── filters/
│   │   ├── cascade-engine.ts ✅ Universal dependency logic
│   │   ├── cascade-config.ts ✅ Dependency definitions
│   │   └── ftd-calculator.ts ✅ Universal FTD calculations
│   └── templates/
│       └── report-template.ts ✅ Boilerplate for new reports
├── app/api/
│   ├── universal/
│   │   └── filter-options/route.ts ✅ Universal cascading API
│   └── cohort/
│       └── data/route.ts ✅ Enhanced for all filter types
└── docs/report-factory/
    ├── adding-new-reports.md ✅ Developer guide
    └── filter-system-architecture.md ✅ Technical docs
```

---

## 🎯 Universal Usage Examples

### **Adding Financial Report (Future)**
```typescript
// 1. Create financial-specific-filters.ts
const financialFilters = [
  { id: "revenueRange", label: "Revenue Range", type: "select" },
  { id: "transactionType", label: "Transaction Type", type: "multiselect" }
];

// 2. Use Universal Report Header
<ReportHeader 
  title="Financial Analysis"
  filters={{ general: GENERAL_FILTERS, specific: financialFilters }}
/>

// 3. Cascading works automatically!
```

### **Adding Marketing Report (Future)**
```typescript
// Same pattern - just define specific filters
const marketingFilters = [
  { id: "channel", label: "Marketing Channel", type: "select" },
  { id: "budget", label: "Budget Range", type: "range" }
];
```

---

## ✅ Success Criteria

### **Universal System Test:**
1. **Reusability:** New report type can be added in 30 minutes
2. **Cascading:** Partner → Campaign → Geography works universally
3. **Performance:** All interactions <300ms, FTD calculations accurate
4. **Tabs:** General + Report-Specific + Params tabs functional
5. **Integration:** Filters actually affect server-side data processing
6. **Extensibility:** Clear documentation and templates for new reports

### **Cohort Implementation Test:**
1. **Complete Flow:** Filter selection → Apply → Real cohort table
2. **DEP2COST:** Accurate calculations based on all applied filters
3. **All Filter Types:** Date, Partners, Campaigns, Countries, OS, Params
4. **User Experience:** Intuitive, responsive, reliable

**Result:** Universal Filter System ready for any report type + Working cohort implementation as reference.
