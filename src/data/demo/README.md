# Demo Data Files

This directory contains **SAMPLE DATA ONLY** for testing and development purposes. All data is completely fictional and safe for public repositories.

## 🚨 Security Notice
- **NO REAL DATA** is stored in this directory
- All partner emails, player IDs, and metrics are **FAKE**
- Safe for version control and public repositories

## Available Demo Files

### 1. Player Data (`sample_players.csv`)
**Sample player records** with casino gaming metrics - 5 fictional records

**Features:**
- Fictional player IDs and partner information
- Sample dates, currencies, and gaming metrics
- Safe demo data for testing CSV import functionality

### 2. Traffic Data (`sample_traffic.csv`) 
**Sample traffic reports** with click and conversion data - 8 fictional records

**Features:**
- Fictional campaign and partner IDs
- Sample traffic sources and device types
- Demo conversion metrics for testing

## Data Processing Notes

- **partnersEmail field**: Present in CSV but **excluded from database** during processing
- **Conversion rate fields (cr, cftd, cd, rftd)**: Present in CSV but **excluded from database** during processing
- All sample data designed to test the complete CSV processing pipeline safely

## Usage

These files can be used to test:
- CSV upload functionality
- Data transformation and validation
- Database import processes
- Field exclusion logic

**Perfect for development and testing without any privacy concerns!** ✅
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