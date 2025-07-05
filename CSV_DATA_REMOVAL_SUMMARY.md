# CSV Data Removal Summary

## 🔒 Data Privacy & Processing Restrictions

This document outlines the data fields that are **EXCLUDED** during CSV processing for privacy and business logic reasons.

---

## 📧 Player Data - Email Removal

### **Field Removed:**
- `partnersEmail` from PlayerData table

### **Implementation:**
- **Source:** `src/lib/data-transformers.ts` - `TransformedPlayerData` interface
- **Transform:** `transformPlayerData()` function excludes partnersEmail field
- **Import:** `src/lib/data/players.ts` - `createPlayersFromImport()` sets partnersEmail to `null`

### **Database Behavior:**
```sql
-- During CSV import, partnersEmail is always set to NULL
INSERT INTO player_data (..., partners_email, ...) 
VALUES (..., NULL, ...);
```

### **Business Logic:**
- ✅ Partner emails are **never stored** during CSV imports
- ✅ Field remains in schema for manual data entry if needed
- ✅ Privacy compliance - email data is excluded from bulk imports

---

## 📊 Traffic Data - Conversion Rate Removal

### **Fields Removed:**
- `cr` (Conversion Rate) - Decimal(5,2)
- `cftd` (Conversion to FTD) - Decimal(5,2)  
- `cd` (Conversion to Deposit) - Decimal(5,2)
- `rftd` (Registration to FTD) - Decimal(5,2)

### **Implementation:**
- **Source:** `src/lib/data-transformers.ts` - `TransformedTrafficData` interface
- **Transform:** `transformTrafficData()` function excludes conversion rate fields
- **Import:** `src/lib/data/traffic.ts` - `createTrafficFromImport()` sets rates to default 0.00

### **Database Behavior:**
```sql
-- During CSV import, conversion rates use schema defaults
INSERT INTO traffic_reports (..., cr, cftd, cd, rftd, ...) 
VALUES (..., 0.00, 0.00, 0.00, 0.00, ...);
```

### **Business Logic:**
- ✅ Conversion rates are **calculated separately** after import
- ✅ CSV data contains raw click/conversion counts only
- ✅ Rates are computed from actual performance data, not imported values
- ✅ Default values (0.00) are applied during import process

---

## 🔍 Technical Implementation Details

### **Data Flow:**
1. **CSV Upload** → Raw CSV data received
2. **Parse & Transform** → Data parsed, excluded fields removed
3. **Database Insert** → Clean data inserted with defaults for excluded fields
4. **Post-Processing** → Conversion rates calculated separately (if needed)

### **Files Modified:**
- ✅ `src/lib/data-transformers.ts` - Updated interfaces and transform functions
- ✅ `src/lib/data/players.ts` - Updated import function for email exclusion
- ✅ `src/lib/data/traffic.ts` - Updated import function for rate exclusion

### **Schema Compliance:**
- ✅ Database schema unchanged - fields still exist
- ✅ Default values used for excluded fields during CSV import
- ✅ Manual data entry can still populate these fields if needed
- ✅ Existing data unaffected

---

## 🛡️ Security & Privacy Benefits

### **Partner Email Protection:**
- Partner contact information not exposed in bulk data imports
- Reduces risk of accidental email data leakage
- Maintains GDPR/privacy compliance for contact data

### **Business Logic Integrity:**
- Conversion rates calculated from verified internal data
- Prevents import of potentially inaccurate rate calculations
- Ensures data consistency across all traffic reports

---

## 📋 Verification Checklist

- [x] Partner emails excluded from CSV player imports
- [x] Conversion rates excluded from CSV traffic imports  
- [x] Default values applied during database insertion
- [x] Existing manual data entry capabilities preserved
- [x] All linting errors resolved
- [x] Type safety maintained throughout data pipeline
- [x] Audit logs updated to reflect data exclusion policies

**Status: ✅ IMPLEMENTED & VERIFIED**
