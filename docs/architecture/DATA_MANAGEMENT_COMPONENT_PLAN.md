# Data Management Component Implementation Plan

## Overview
Production-ready CSV import system for TrafficReport and PlayerTransaction data with asynchronous processing, auto-detection, and comprehensive error handling.

## Architecture

### Database Schema Addition
```sql
-- Add to schema.prisma
model ImportJob {
  id            String   @id @default(cuid())
  userId        String
  type          String   // 'traffic_report' | 'player_transaction'
  status        String   // 'uploading' | 'processing' | 'completed' | 'failed'
  filename      String
  totalRows     Int?
  processedRows Int      @default(0)
  errors        Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, status])
  @@index([createdAt])
  @@map("import_job")
}
```

### API Routes Structure
```
src/app/api/admin/data/
├── upload/route.ts         # File upload + job creation
├── process/route.ts        # Background CSV processing
├── status/[jobId]/route.ts # Job progress polling
└── database-status/route.ts # DB monitoring
```

### Component Structure
```
src/app/settings/admin/data/
├── page.tsx                    # Server component with admin auth
├── data-management-client.tsx  # Main client component
└── components/
    ├── upload-section.tsx      # File upload with validation
    ├── import-progress.tsx     # Job tracking display
    ├── database-status.tsx     # DB metrics dashboard
    └── import-history.tsx      # Recent imports table
```

## Implementation Details

### 1. CSV Detection Rules
```typescript
const CSV_SCHEMAS = {
  traffic_report: {
    requiredColumns: ['date', 'foreignBrandId', 'foreignPartnerId', 'foreignCampaignId', 'allClicks', 'uniqueClicks'],
    expectedColumnCount: 19,
    uniqueConstraint: ['date', 'foreignPartnerId', 'foreignCampaignId', 'foreignLandingId', 'deviceType', 'osFamily', 'country']
  },
  player_transaction: {
    requiredColumns: ['playerId', 'originalPlayerId', 'partnerId', 'ftdSum', 'depositsSum'],
    expectedColumnCount: 35,
    uniqueConstraint: ['playerId', 'date']
  }
}
```

### 2. File Upload Process
```typescript
// POST /api/admin/data/upload
export async function POST(request: NextRequest) {
  // 1. Admin auth check
  // 2. File validation (size: 50MB max, type: CSV only)
  // 3. Store in temp directory with UUID filename
  // 4. Quick CSV header analysis for type detection
  // 5. Create ImportJob record
  // 6. Return job ID for polling
}
```

### 3. Background Processing
```typescript
// POST /api/admin/data/process  
export async function POST(request: NextRequest) {
  // 1. Load job by ID
  // 2. Parse CSV with csv-parse library (streaming)
  // 3. Validate data in chunks of 500 records
  // 4. Use raw SQL for efficient upserts:
  //    INSERT ... ON CONFLICT (...) DO UPDATE SET ...
  // 5. Update job progress every 500 records
  // 6. Handle errors and partial failures
  // 7. Clean up temp file on completion
}
```

### 4. Efficient Database Operations
```sql
-- TrafficReport upsert template
INSERT INTO traffic_report (date, foreign_partner_id, foreign_campaign_id, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (date, foreign_partner_id, foreign_campaign_id, foreign_landing_id, device_type, os_family, country)
DO UPDATE SET 
  all_clicks = EXCLUDED.all_clicks,
  unique_clicks = EXCLUDED.unique_clicks,
  updated_at = NOW();

-- PlayerTransaction upsert template  
INSERT INTO player_transaction (player_id, date, partner_id, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (player_id, date)
DO UPDATE SET
  ftd_sum = EXCLUDED.ftd_sum,
  deposits_sum = EXCLUDED.deposits_sum,
  updated_at = NOW();
```

### 5. Progress Tracking
```typescript
// GET /api/admin/data/status/[jobId]
export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  // 1. Fetch job by ID
  // 2. Return status, progress %, errors
  // 3. Cache for 2 seconds to prevent spam
}

// Client polling every 3 seconds during active imports
```

### 6. Data Validation Rules
```typescript
const VALIDATION_RULES = {
  traffic_report: {
    date: (val: string) => !isNaN(Date.parse(val)),
    foreignBrandId: (val: string) => /^\d+$/.test(val),
    allClicks: (val: string) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    uniqueClicks: (val: string) => !isNaN(parseInt(val)) && parseInt(val) >= 0
  },
  player_transaction: {
    playerId: (val: string) => /^\d+$/.test(val),
    signUpDate: (val: string) => !isNaN(Date.parse(val)),
    ftdSum: (val: string) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    depositsSum: (val: string) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0
  }
}
```

### 7. Security Measures
- File type validation (CSV only, check magic bytes)
- Size limits (50MB max to handle large datasets)
- CSV injection protection (sanitize cell values)
- Admin-only access via Better Auth
- Rate limiting: max 3 concurrent imports per user
- Temp file cleanup after processing

### 8. Error Handling
```typescript
interface ImportError {
  row: number;
  column: string;
  value: string;
  error: string;
  severity: 'warning' | 'error';
}

// Continue processing on warnings, halt on errors
// Store all errors in ImportJob.errors field
// Allow partial imports with warning summary
```

### 9. Toast Integration
```typescript
// Add to toast-utils.ts
export const adminNotifications = {
  data: {
    uploadStarted: (filename: string) => toast.success("Upload started", {
      description: `Processing ${filename}...`
    }),
    importProgress: (processed: number, total: number) => 
      toast.loading(`Importing... ${processed}/${total} records`),
    importComplete: (type: string, count: number) => 
      toast.success("Import completed", {
        description: `Successfully imported ${count} ${type} records`
      }),
    importFailed: (error: string) => toast.error("Import failed", {
      description: error
    })
  }
}
```

### 10. Database Status Dashboard
```typescript
// GET /api/admin/data/database-status
interface DatabaseStatus {
  connection: 'connected' | 'disconnected';
  tables: {
    traffic_report: {
      count: number;
      dateRange: { min: string; max: string } | null;
    };
    player_transaction: {
      count: number;
      dateRange: { min: string; max: string } | null;
    };
  };
  activeImports: number;
  lastImport: string | null;
}
```

## Dependencies to Add
```json
{
  "csv-parse": "^5.5.2",
  "csv-stringify": "^6.4.4"
}
```

## Implementation Order
1. **Database**: Add ImportJob model, run migration
2. **API**: Upload endpoint with file validation
3. **API**: Background processing with raw SQL upserts
4. **API**: Status polling and database monitoring
5. **UI**: Upload component with drag/drop
6. **UI**: Progress tracking with polling
7. **UI**: Database status dashboard
8. **Testing**: Error scenarios and edge cases

## Performance Targets
- Handle CSV files up to 50MB (≈100k records)
- Process 1000 records per second
- UI updates every 3 seconds during import
- Complete import jobs auto-cleanup after 7 days

## Error Recovery
- Resumable imports (store last processed row)
- Partial import support with detailed error reporting
- Automatic retry for transient database errors
- Manual retry option for failed imports