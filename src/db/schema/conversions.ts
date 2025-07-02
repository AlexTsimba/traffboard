import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, serial, integer, numeric, jsonb } from "drizzle-orm/pg-core";

import { users } from "./users";

// CSV upload tracking table
export const conversionUploads = pgTable("conversion_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // File Information
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),

  // Processing Status
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  totalRows: integer("total_rows").default(0).notNull(),
  processedRows: integer("processed_rows").default(0).notNull(),
  errorRows: integer("error_rows").default(0).notNull(),

  // Error Tracking
  errors: jsonb("errors").default([]), // Array of processing errors
  processingLog: jsonb("processing_log").default([]), // Processing steps log

  // Timestamps
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Main conversions table - NO PII, NO computed fields
export const conversions = pgTable("conversions", {
  id: serial("id").primaryKey(),
  uploadId: integer("upload_id")
    .notNull()
    .references(() => conversionUploads.id, { onDelete: "cascade" }),

  // Business Identifiers (anonymized)
  partnerId: varchar("partner_id", { length: 100 }),
  campaignId: varchar("campaign_id", { length: 100 }),
  adGroupId: varchar("ad_group_id", { length: 100 }),
  keywordId: varchar("keyword_id", { length: 100 }),

  // Traffic Source Information
  trafficSource: varchar("traffic_source", { length: 100 }),
  medium: varchar("medium", { length: 100 }),
  campaign: varchar("campaign", { length: 255 }),
  adGroup: varchar("ad_group", { length: 255 }),
  keyword: varchar("keyword", { length: 255 }),

  // Geo/Device Information (anonymized)
  country: varchar("country", { length: 10 }), // ISO country codes
  region: varchar("region", { length: 100 }),
  city: varchar("city", { length: 100 }),
  deviceType: varchar("device_type", { length: 50 }),
  deviceCategory: varchar("device_category", { length: 50 }),

  // Date Information
  trafficDate: timestamp("traffic_date", { withTimezone: true }).notNull(),

  // Raw Metrics (NO computed fields - calculated on demand)
  clicks: integer("clicks").default(0).notNull(),
  impressions: integer("impressions").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),

  // Financial Data (in cents for precision)
  cost: numeric("cost", { precision: 15, scale: 2 }).default("0").notNull(),
  revenue: numeric("revenue", { precision: 15, scale: 2 }).default("0").notNull(),

  // Gaming-specific metrics (from demo data)
  registrations: integer("registrations").default(0),
  firstTimeDeposits: integer("first_time_deposits").default(0),
  depositCount: integer("deposit_count").default(0),
  depositAmount: numeric("deposit_amount", { precision: 15, scale: 2 }).default("0"),
  withdrawalCount: integer("withdrawal_count").default(0),
  withdrawalAmount: numeric("withdrawal_amount", { precision: 15, scale: 2 }).default("0"),

  // Casino-specific metrics
  casinoBets: integer("casino_bets").default(0),
  casinoBetAmount: numeric("casino_bet_amount", { precision: 15, scale: 2 }).default("0"),
  casinoWinAmount: numeric("casino_win_amount", { precision: 15, scale: 2 }).default("0"),

  // Additional tracking
  rawData: jsonb("raw_data"), // Store original CSV row for debugging

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// TypeScript types for schema inference
export type ConversionUpload = typeof conversionUploads.$inferSelect;
export type NewConversionUpload = typeof conversionUploads.$inferInsert;

export type Conversion = typeof conversions.$inferSelect;
export type NewConversion = typeof conversions.$inferInsert;

// Upload status enum
export const UPLOAD_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type UploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];

// Device type enum
export const DEVICE_TYPES = {
  DESKTOP: "desktop",
  MOBILE: "mobile",
  TABLET: "tablet",
  UNKNOWN: "unknown",
} as const;

export type DeviceType = (typeof DEVICE_TYPES)[keyof typeof DEVICE_TYPES];

// Traffic source enum
export const TRAFFIC_SOURCES = {
  ORGANIC: "organic",
  PAID: "paid",
  DIRECT: "direct",
  REFERRAL: "referral",
  SOCIAL: "social",
  EMAIL: "email",
  UNKNOWN: "unknown",
} as const;

export type TrafficSource = (typeof TRAFFIC_SOURCES)[keyof typeof TRAFFIC_SOURCES];
