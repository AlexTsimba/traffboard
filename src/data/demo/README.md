# Demo Data for TraffBoard Testing

This directory contains demo CSV files for testing TraffBoard's upload and analytics functionality.

## Files

### 1. `overall_players_demo.csv`
**Player-level transaction data** (similar to casino/gaming affiliate data)

**Structure:**
- **Player Info**: Player ID, Original player ID, Sign up date, First deposit date
- **Partner Data**: Partner ID, Company name, Partners email, Partner tags
- **Campaign Tracking**: Campaign ID, Campaign name, Promo ID, Promo code
- **Geo & Tracking**: Player country, Click IDs, OS, Source, Web ID
- **Transaction Metrics**: FTD (First Time Deposit), Deposits, Cashouts, Casino bets
- **Financial Data**: NGR (Net Gaming Revenue), Bet sums, Win sums

**Key Columns:**
- `FTD count/sum` - First Time Deposits
- `Deposits count/sum` - Total deposits
- `Casino Real NGR` - Net Gaming Revenue
- `Casino bets/wins sum` - Betting activity

### 2. `traffic_report_demo.csv`
**Daily aggregated traffic statistics**

**Structure:**
- **Date & IDs**: Date, Brand ID, Partner ID, Campaign ID, Landing ID
- **Traffic Source**: Source, Device type, User agent, OS, Country
- **Click Metrics**: All clicks, Unique clicks
- **Conversion Metrics**: Registrations, FTD count, Deposits count
- **Conversion Rates**: CR (Conversion Rate), CFTD, CD, RFTD

**Key Columns:**
- `all_clicks/unique_clicks` - Traffic volume
- `registrations_count` - Sign-ups
- `ftd_count` - First deposits
- `cr/cftd/cd/rftd` - Various conversion rates

## Usage

These files can be used to:
1. **Test CSV upload functionality** with realistic data structures
2. **Validate data parsing** and field mapping
3. **Test dashboard analytics** with multi-dimensional data
4. **Performance testing** with reasonable data volumes
5. **UI/UX testing** with realistic content

## Data Characteristics

- **Realistic but fake data** - All values are generated for testing
- **Multiple traffic sources** - FB, Google, TikTok, Instagram, etc.
- **Various device types** - Mobile, Desktop, different browsers
- **Geographic diversity** - US, CA, UK, AU, EU countries
- **Time series data** - Sequential dates for trend analysis
- **Conversion funnels** - Clicks → Registrations → Deposits
- **Financial metrics** - Revenue, costs, profit calculations

## Schema Mapping

For database schema design, these CSV structures map to:

### Players Data → Database Tables:
- `conversion_uploads` (metadata about the upload)
- `conversions` (individual player transactions)
- `users` (who uploaded the data)

### Traffic Data → Database Tables:
- `conversion_uploads` (metadata about the upload)  
- `conversions` (daily aggregated metrics)
- `users` (who uploaded the data)

Both file types can use the same database schema with different data granularity levels.