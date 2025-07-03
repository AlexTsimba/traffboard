import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
  numeric,
  index,
  check,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Traffic Reports - Time Series Table
 * 
 * Based on actual CSV structure from traffic_report (20).csv:
 * date,foreign_brand_id,foreign_partner_id,foreign_campaign_id,foreign_landing_id,
 * traffic_source,device_type,user_agent_family,os_family,country,all_clicks,
 * unique_clicks,registrations_count,ftd_count,deposits_count,cr,cftd,cd,rftd
 * 
 * This is pure time-series data where the same combination of dimensions
 * can appear on different dates with different metrics.
 */
export const trafficReports = pgTable(
  "traffic_reports",
  {
    // Primary key for the record
    id: serial("id").primaryKey(),
    
    // Time dimension - core of time series
    date: timestamp("date", { withTimezone: true }).notNull(),
    
    // Dimensional attributes (foreign keys to other systems)
    foreignBrandId: integer("foreign_brand_id"),
    foreignPartnerId: integer("foreign_partner_id"),
    foreignCampaignId: integer("foreign_campaign_id"),
    foreignLandingId: integer("foreign_landing_id"),
    
    // Traffic characteristics
    trafficSource: varchar("traffic_source", { length: 100 }),
    deviceType: varchar("device_type", { length: 50 }),
    userAgentFamily: varchar("user_agent_family", { length: 255 }),
    osFamily: varchar("os_family", { length: 100 }),
    country: varchar("country", { length: 3 }), // ISO country codes
    
    // Metrics - Traffic volume
    allClicks: integer("all_clicks").notNull().default(0),
    uniqueClicks: integer("unique_clicks").notNull().default(0),
    
    // Metrics - Conversion funnel
    registrationsCount: integer("registrations_count").notNull().default(0),
    ftdCount: integer("ftd_count").notNull().default(0),
    depositsCount: integer("deposits_count").notNull().default(0),
    
    // Metrics - Conversion rates (percentage, 2 decimal places)
    cr: numeric("cr", { precision: 5, scale: 2 }).notNull().default("0.00"), // Conversion Rate
    cftd: numeric("cftd", { precision: 5, scale: 2 }).notNull().default("0.00"), // Conversion to FTD
    cd: numeric("cd", { precision: 5, scale: 2 }).notNull().default("0.00"), // Conversion to Deposit
    rftd: numeric("rftd", { precision: 5, scale: 2 }).notNull().default("0.00"), // Registration to FTD
    
    // Audit timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    // Time-series optimized indexes - most queries will filter by date first
    index("idx_traffic_reports_date").on(table.date),
    index("idx_traffic_reports_date_partner").on(table.date, table.foreignPartnerId),
    index("idx_traffic_reports_date_campaign").on(table.date, table.foreignCampaignId),
    
    // Dimensional indexes for filtering
    index("idx_traffic_reports_partner").on(table.foreignPartnerId),
    index("idx_traffic_reports_campaign").on(table.foreignCampaignId),
    index("idx_traffic_reports_country").on(table.country),
    index("idx_traffic_reports_device").on(table.deviceType),
    index("idx_traffic_reports_source").on(table.trafficSource),
    
    // Composite index for common analytics queries
    index("idx_traffic_analytics").on(
      table.date,
      table.foreignPartnerId,
      table.foreignCampaignId,
      table.deviceType,
      table.country
    ),
    
    // Data integrity constraints
    check(
      "chk_traffic_positive_metrics",
      sql`
        ${table.allClicks} >= 0 AND 
        ${table.uniqueClicks} >= 0 AND 
        ${table.registrationsCount} >= 0 AND 
        ${table.ftdCount} >= 0 AND 
        ${table.depositsCount} >= 0
      `
    ),
    check(
      "chk_traffic_rate_bounds",
      sql`
        ${table.cr} >= 0 AND ${table.cr} <= 100 AND
        ${table.cftd} >= 0 AND ${table.cftd} <= 100 AND
        ${table.cd} >= 0 AND ${table.cd} <= 100 AND
        ${table.rftd} >= 0 AND ${table.rftd} <= 100
      `
    ),
    check(
      "chk_traffic_click_logic",
      sql`${table.uniqueClicks} <= ${table.allClicks}`
    ),
    check(
      "chk_traffic_device_type",
      sql`
        ${table.deviceType} IS NULL OR 
        ${table.deviceType} IN ('Phone', 'Desktop', 'Tablet', 'Computer')
      `
    ),
  ]
);

// TypeScript types
export type TrafficReport = typeof trafficReports.$inferSelect;
export type NewTrafficReport = typeof trafficReports.$inferInsert;

// Constants for device types (matching CSV data)
export const DEVICE_TYPES = {
  PHONE: "Phone",
  DESKTOP: "Desktop", 
  TABLET: "Tablet",
  COMPUTER: "Computer",
} as const;

export type DeviceType = (typeof DEVICE_TYPES)[keyof typeof DEVICE_TYPES];