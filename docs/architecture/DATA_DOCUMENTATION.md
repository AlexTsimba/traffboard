# Traffboard Data Documentation

## Overview
The system contains two primary data sources representing a casino affiliate marketing operation:
- **Traffic Report**: Aggregated daily marketing performance metrics
- **Player Data**: Individual player transaction history (time-series)

## Data Sources

### 1. traffic_report.csv
**Purpose**: Daily aggregated marketing attribution and conversion metrics  
**Granularity**: One row per date/campaign/device/country combination  
**Time Period**: 2025-05-01 (observed data)

#### Schema
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | DATE | Yes | Activity date (YYYY-MM-DD) |
| foreign_brand_id | INTEGER | Yes | Brand identifier |
| foreign_partner_id | INTEGER | Yes | Affiliate partner identifier |
| foreign_campaign_id | INTEGER | Yes | Campaign identifier |
| foreign_landing_id | INTEGER | Yes | Landing page identifier |
| traffic_source | STRING | No | Traffic source identifier (can be empty) |
| device_type | STRING | Yes | Device type (Phone, Computer, Tablet) |
| user_agent_family | STRING | Yes | Browser/app identifier |
| os_family | STRING | Yes | Operating system (iOS, Android, Windows, Linux, Other) |
| country | STRING | Yes | ISO country code (AU, DE, CA, CH, AT, US) |
| all_clicks | INTEGER | Yes | Total clicks |
| unique_clicks | INTEGER | Yes | Unique clicks |
| registrations_count | INTEGER | Yes | Registration count |
| ftd_count | INTEGER | Yes | First-time deposit count |
| deposits_count | INTEGER | Yes | Total deposits count |

**Removed Fields**: cr, cftd, cd, rftd (conversion rate calculations)

### 2. overall_rows.csv  
**Purpose**: Individual player transaction history  
**Granularity**: One row per player per date  
**Time Period**: Sign-ups 2023-2024, Transactions 2025-05-01 to 2025-06-28

#### Schema
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Player ID | INTEGER | Yes | Unique player identifier |
| Original player ID | INTEGER | Yes | Original system player ID |
| Sign up date | DATETIME | Yes | Player registration timestamp (UTC) |
| First deposit date | DATETIME | No | First deposit timestamp (UTC) |
| Partner ID | INTEGER | Yes | Affiliate partner identifier |
| Company name | STRING | Yes | Partner company name |
| Partner tags | STRING | Yes | Partner classification tags |
| Campaign ID | INTEGER | Yes | Campaign identifier |
| Campaign name | STRING | Yes | Campaign display name |
| Promo ID | INTEGER | Yes | Promotion identifier |
| Promo code | STRING | Yes | Promotional code |
| Player country | STRING | Yes | Player country code |
| Tag: clickid | STRING | No | **Optional** - Click tracking ID |
| Tag: os | STRING | No | **Optional** - Operating system tag |
| Tag: source | STRING | No | **Optional** - Traffic source tag |
| Tag: sub2 | STRING | No | **Optional** - Additional tracking parameter |
| Tag: webID | STRING | No | **Optional** - Web identifier |
| Date | DATETIME | Yes | **Time-series key** - Transaction date (UTC) |
| Prequalified | INTEGER | Yes | Prequalification status (0/1) |
| Duplicate | INTEGER | Yes | Duplicate flag (0/1) |
| Self-excluded | INTEGER | Yes | Self-exclusion status (0/1) |
| Disabled | INTEGER | Yes | Account disabled status (0/1) |
| Currency | STRING | Yes | Transaction currency (EUR observed) |
| FTD count | INTEGER | Yes | First-time deposit count |
| FTD sum | DECIMAL | Yes | First-time deposit amount |
| Deposits count | INTEGER | Yes | Total deposits count |
| Deposits sum | DECIMAL | Yes | Total deposits amount |
| Cashouts count | INTEGER | Yes | Cashout transactions count |
| Cashouts sum | DECIMAL | Yes | Total cashouts amount |
| Casino bets count | INTEGER | Yes | Number of casino bets |
| Casino Real NGR | DECIMAL | Yes | Net Gaming Revenue |
| Fixed per player | DECIMAL | Yes | Fixed commission amount |
| Casino bets sum | DECIMAL | Yes | Total bet amounts |
| Casino wins sum | DECIMAL | Yes | Total win amounts |

**Removed Fields**: Partners email (contains PII)

## Data Relationships

### Primary Keys
- **traffic_report**: Composite key (date, foreign_partner_id, foreign_campaign_id, foreign_landing_id, device_type, os_family, country)
- **overall_rows**: Composite key (Player ID, Date)

### Foreign Key Relationships
- `traffic_report.foreign_partner_id` → `overall_rows.Partner ID`
- `traffic_report.foreign_campaign_id` → `overall_rows.Campaign ID`
- `traffic_report.country` → `overall_rows.Player country`

## Time-Series Characteristics

### Traffic Report
- **Frequency**: Daily aggregations
- **Partitioning**: By date
- **Retention**: Current period data only

### Player Data  
- **Frequency**: Daily player activity records
- **Partitioning**: By date and player
- **Retention**: Historical player lifecycle data
- **Time Gaps**: Players may have inactive periods (missing dates)

## Data Patterns Observed

### Geographic Distribution
- Primary market: Australia (AU)
- Secondary markets: Germany (DE), Canada (CA), Switzerland (CH), Austria (AT), United States (US)

### Partner Distribution
- **149232**: Rockit Media FB
- **153278**: Makeberry FB

### Device Preferences
- Mobile-first platform (Phone >> Computer/Tablet)
- iOS and Android dominant platforms

### Traffic Sources
- Heavy Facebook advertising focus
- Source identifiers: fb_android_pwa, fb_ios, fb_android, fb

## Data Quality Notes

### Known Issues
1. Empty traffic_source values in traffic_report
2. Optional tag fields frequently empty in overall_rows
3. Zero values common in conversion metrics
4. Some negative NGR values in casino data

### Data Validation Rules
- All monetary amounts in EUR
- Dates must be UTC timestamps
- Country codes must be valid ISO codes
- Boolean flags represented as integers (0/1)
- Player IDs must be positive integers

## Technical Considerations

### Storage Requirements
- **traffic_report**: ~50 rows/day (estimated based on sample)
- **overall_rows**: Variable, player-dependent

### Indexing Recommendations
- Primary indexes on composite keys
- Secondary indexes on: date, partner_id, campaign_id, player_country
- Time-series optimized storage for overall_rows

### ETL Considerations
- Daily batch processing for traffic_report
- Real-time/near-real-time for player transactions
- Data retention policies needed for GDPR compliance