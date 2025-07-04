# Demo Data Files

This directory contains demo data files that match the structure of real TraffBoard CSV uploads, but with fake data for testing and development purposes.

## Available Demo Files

### 1. Player Data (`overall_players_demo.csv`)
**35 columns** - Individual player records with casino gaming metrics

**Structure:**
- Player identification and tracking
- Partner and campaign information  
- Financial metrics (deposits, cashouts, casino activity)
- Gaming performance indicators (NGR, bet amounts, win amounts)
- Temporal data (sign up dates, deposit dates, record dates)

**Key Fields:**
- `Player ID`, `Original player ID` - Player identification
- `Partner ID`, `Company name`, `Campaign ID` - Business tracking
- `FTD count/sum`, `Deposits count/sum` - Deposit metrics  
- `Casino bets count/sum`, `Casino Real NGR` - Gaming metrics
- `Currency`, `Player country` - Localization data

### 2. Traffic Reports (`traffic_report_demo.csv`)
**19 columns** - Daily traffic aggregates and conversion metrics

**Structure:**
- Traffic source and campaign tracking
- Device and user agent information
- Click and conversion metrics
- Conversion rate calculations

**Key Fields:**
- `foreign_brand_id`, `foreign_partner_id`, `foreign_campaign_id` - Business IDs
- `traffic_source`, `device_type`, `os_family` - Traffic classification
- `all_clicks`, `unique_clicks`, `registrations_count` - Traffic metrics
- `cr`, `cftd`, `cd`, `rftd` - Conversion rates

## Data Characteristics

### Demo Data Features
- **Realistic Structure**: Matches production CSV format exactly
- **Fake Values**: All data is generated for testing purposes
- **No PII**: Contains no personally identifiable information
- **Consistent Relationships**: Foreign keys and references are logically consistent

### Usage in Development
- **CSV Upload Testing**: Test file parsing and validation logic
- **Database Schema Validation**: Verify schema matches real data structure  
- **Dashboard Development**: Populate charts and analytics components
- **Performance Testing**: Test query performance with realistic data volumes

### File Sizes
- `overall_players_demo.csv`: ~15 rows
- `traffic_report_demo.csv`: ~30 rows

## Integration Notes

### Database Tables
These demo files correspond to the following database tables:
- `overall_players_demo.csv` → `player_data` table
- `traffic_report_demo.csv` → `traffic_reports` table

### Upload Process
Both files are uploaded through the `conversion_uploads` table with:
- `file_type` field indicating "players" or "traffic"
- Processing status tracking
- Error logging and validation

### Testing Strategy
Use these files for:
1. **Unit Testing**: CSV parsing functions
2. **Integration Testing**: Full upload workflow
3. **UI Testing**: Dashboard components with real data structure
4. **Performance Testing**: Query optimization with representative data