# Database Schema Requirements

## Data Sources
- **traffic_report.csv**: Marketing attribution data (4,141 rows, 19 columns)
- **overall_rows.csv**: Player transaction history (6,460 rows, 35 columns)

## Data Loading Strategy

### Ingestion Method
- **Current**: CSV batch upload via `/src/app/settings/administration/data/page.tsx`
- **Future**: API endpoints post-MVP
- **Frequency**: Multiple times per day (partial data loads)

### Loading Requirements
- Single component handles both CSV types with auto-detection
- Batch processing with proper deduplication
- Handle incremental updates (not full replacement)

### Data Exclusions
- **Partners email**: Present in CSV but excluded from database (PII)
- **Calculated fields**: Remove cr, cftd, cd, rftd from traffic_report

## Schema Design Decisions

### Normalization Strategy
- **Denormalized approach** for performance
- Keep flat structure similar to CSV format
- Avoid foreign key relationships for faster queries

### Performance Priorities
1. Fast time-series queries for dashboards
2. Player-based analytics
3. Campaign performance analysis
4. Bulk data operations

### Technology Stack
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Data Flow**: CSV → Database → Prisma → Frontend calculations

## Indexing Strategy

### Primary Indexes
- **traffic_report**: Composite primary key on (date, foreign_partner_id, foreign_campaign_id, foreign_landing_id, device_type, os_family, country)
- **overall_rows**: Composite primary key on (player_id, date)

### Secondary Indexes
- Date-based indexes for time-series queries
- Partner/campaign indexes for performance analysis
- Country indexes for geographic reporting

### Deduplication Strategy
- Use composite primary keys to prevent duplicates
- Upsert operations for incremental loads
- Handle partial CSV updates without full table replacement

## Data Quality Considerations
- Handle empty/null values appropriately
- Maintain referential consistency within denormalized structure
- Support negative NGR values in financial data
- Preserve all original data types and precision