import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
  numeric,
  jsonb,
  index,
  check,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./users";

// Enums for upload status and file types
export const UPLOAD_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const FILE_TYPES = {
  PLAYER_DATA: "player_data",
  TRAFFIC_REPORT: "traffic_report",
} as const;

export const DEVICE_TYPES = {
  PHONE: "Phone",
  DESKTOP: "Desktop",
  TABLET: "Tablet",
} as const;

export type UploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];
export type FileType = (typeof FILE_TYPES)[keyof typeof FILE_TYPES];
export type DeviceType = (typeof DEVICE_TYPES)[keyof typeof DEVICE_TYPES];

// CSV upload tracking table
export const conversionUploads = pgTable(
  "conversion_uploads",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // File Information
    filename: varchar("filename", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(), // player_data, traffic_report

    // Processing Status
    status: varchar("status", { length: 20 }).notNull().default(UPLOAD_STATUS.PENDING),
    totalRows: integer("total_rows").default(0),
    processedRows: integer("processed_rows").default(0),
    errorRows: integer("error_rows").default(0),
    errors: jsonb("errors").$type<string[]>().default([]),

    // Timestamps
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    // Performance indexes for upload management
    index("idx_conversion_uploads_user_id").on(table.userId),
    index("idx_conversion_uploads_status").on(table.status),
    index("idx_conversion_uploads_file_type").on(table.fileType),
    index("idx_conversion_uploads_uploaded_at").on(table.uploadedAt),

    // Composite indexes for common queries
    index("idx_conversion_uploads_user_status").on(table.userId, table.status),
    index("idx_conversion_uploads_user_type").on(table.userId, table.fileType),

    // CHECK constraints for data integrity
    check(
      "chk_conversion_uploads_valid_status",
      sql`
        ${table.status} IN ('pending', 'processing', 'completed', 'failed')
      `,
    ),
    check(
      "chk_conversion_uploads_valid_file_type",
      sql`
        ${table.fileType} IN ('player_data', 'traffic_report')
      `,
    ),
    check(
      "chk_conversion_uploads_positive_file_size",
      sql`
        ${table.fileSize} > 0
      `,
    ),
    check(
      "chk_conversion_uploads_positive_rows",
      sql`
        ${table.totalRows} >= 0 AND 
        ${table.processedRows} >= 0 AND 
        ${table.errorRows} >= 0
      `,
    ),
    check(
      "chk_conversion_uploads_row_logic",
      sql`
        ${table.processedRows} + ${table.errorRows} <= ${table.totalRows}
      `,
    ),
  ],
);

// Player Data Table - EXACTLY matching overall_players_demo.csv structure (34 fields, removed Partners email PII)
export const playerData = pgTable(
  "player_data",
  {
    id: serial("id").primaryKey(),
    uploadId: integer("upload_id")
      .notNull()
      .references(() => conversionUploads.id, { onDelete: "cascade" }),

    // EXACT CSV FIELDS (34 fields, Partners email removed as PII)
    playerId: varchar("player_id", { length: 50 }).notNull(),
    originalPlayerId: varchar("original_player_id", { length: 50 }),
    signUpDate: timestamp("sign_up_date", { withTimezone: true }),
    firstDepositDate: timestamp("first_deposit_date", { withTimezone: true }),
    partnerId: varchar("partner_id", { length: 50 }),
    companyName: varchar("company_name", { length: 255 }),
    // Partners email REMOVED - PII
    partnerTags: varchar("partner_tags", { length: 500 }),
    campaignId: varchar("campaign_id", { length: 50 }),
    campaignName: varchar("campaign_name", { length: 255 }),
    promoId: varchar("promo_id", { length: 50 }),
    promoCode: varchar("promo_code", { length: 100 }),
    playerCountry: varchar("player_country", { length: 10 }),
    tagClickid: varchar("tag_clickid", { length: 255 }),
    tagOs: varchar("tag_os", { length: 100 }),
    tagSource: varchar("tag_source", { length: 100 }),
    tagSub2: varchar("tag_sub2", { length: 100 }),
    tagWebId: varchar("tag_web_id", { length: 100 }),
    date: timestamp("date", { withTimezone: true }),
    prequalified: integer("prequalified").default(0),
    duplicate: integer("duplicate").default(0),
    selfExcluded: integer("self_excluded").default(0),
    disabled: integer("disabled").default(0),
    currency: varchar("currency", { length: 10 }),
    ftdCount: integer("ftd_count").default(0),
    ftdSum: numeric("ftd_sum", { precision: 15, scale: 2 }).default("0"),
    depositsCount: integer("deposits_count").default(0),
    depositsSum: numeric("deposits_sum", { precision: 15, scale: 2 }).default("0"),
    cashoutsCount: integer("cashouts_count").default(0),
    cashoutsSum: numeric("cashouts_sum", { precision: 15, scale: 2 }).default("0"),
    casinoBetsCount: integer("casino_bets_count").default(0),
    casinoRealNgr: numeric("casino_real_ngr", { precision: 15, scale: 2 }).default("0"),
    fixedPerPlayer: numeric("fixed_per_player", { precision: 15, scale: 2 }).default("0"),
    casinoBetsSum: numeric("casino_bets_sum", { precision: 15, scale: 2 }).default("0"),
    casinoWinsSum: numeric("casino_wins_sum", { precision: 15, scale: 2 }).default("0"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    // Performance indexes for analytics dashboard queries
    index("idx_player_data_upload_id").on(table.uploadId),
    index("idx_player_data_date").on(table.date),
    index("idx_player_data_partner_campaign").on(table.partnerId, table.campaignId),
    index("idx_player_data_date_partner").on(table.date, table.partnerId),
    index("idx_player_data_player_id").on(table.playerId),
    index("idx_player_data_country").on(table.playerCountry),

    // Unique constraint to prevent duplicate player data per upload
    uniqueIndex("unique_player_per_upload").on(table.uploadId, table.playerId),

    // CHECK constraints for data integrity
    check(
      "chk_player_data_positive_amounts",
      sql`
        ${table.ftdSum} >= 0 AND 
        ${table.depositsSum} >= 0 AND 
        ${table.cashoutsSum} >= 0 AND 
        ${table.casinoBetsSum} >= 0 AND 
        ${table.casinoWinsSum} >= 0 AND
        ${table.casinoRealNgr} >= 0 AND
        ${table.fixedPerPlayer} >= 0
      `,
    ),
    check(
      "chk_player_data_positive_counts",
      sql`
        ${table.ftdCount} >= 0 AND 
        ${table.depositsCount} >= 0 AND 
        ${table.cashoutsCount} >= 0 AND 
        ${table.casinoBetsCount} >= 0
      `,
    ),
    check(
      "chk_player_data_boolean_flags",
      sql`
        ${table.prequalified} IN (0, 1) AND 
        ${table.duplicate} IN (0, 1) AND 
        ${table.selfExcluded} IN (0, 1) AND 
        ${table.disabled} IN (0, 1)
      `,
    ),
  ],
);

// Traffic Report Table - EXACTLY matching traffic_report_demo.csv structure (19 fields)
export const trafficReports = pgTable(
  "traffic_reports",
  {
    id: serial("id").primaryKey(),
    uploadId: integer("upload_id")
      .notNull()
      .references(() => conversionUploads.id, { onDelete: "cascade" }),

    // EXACT CSV FIELDS (19 fields)
    date: timestamp("date", { withTimezone: true }).notNull(),
    foreignBrandId: varchar("foreign_brand_id", { length: 50 }),
    foreignPartnerId: varchar("foreign_partner_id", { length: 50 }),
    foreignCampaignId: varchar("foreign_campaign_id", { length: 50 }),
    foreignLandingId: varchar("foreign_landing_id", { length: 50 }),
    trafficSource: varchar("traffic_source", { length: 100 }),
    deviceType: varchar("device_type", { length: 50 }),
    userAgentFamily: varchar("user_agent_family", { length: 255 }),
    osFamily: varchar("os_family", { length: 100 }),
    country: varchar("country", { length: 10 }),
    allClicks: integer("all_clicks").default(0),
    uniqueClicks: integer("unique_clicks").default(0),
    registrationsCount: integer("registrations_count").default(0),
    ftdCount: integer("ftd_count").default(0),
    depositsCount: integer("deposits_count").default(0),
    cr: numeric("cr", { precision: 10, scale: 2 }).default("0"),
    cftd: numeric("cftd", { precision: 10, scale: 2 }).default("0"),
    cd: numeric("cd", { precision: 10, scale: 2 }).default("0"),
    rftd: numeric("rftd", { precision: 10, scale: 2 }).default("0"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    // Performance indexes for traffic analytics
    index("idx_traffic_reports_upload_id").on(table.uploadId),
    index("idx_traffic_reports_date").on(table.date),
    index("idx_traffic_reports_date_partner").on(table.date, table.foreignPartnerId),
    index("idx_traffic_reports_date_campaign").on(table.date, table.foreignCampaignId),
    index("idx_traffic_reports_source_device").on(table.trafficSource, table.deviceType),
    index("idx_traffic_reports_country").on(table.country),

    // Composite index for dashboard queries
    index("idx_traffic_reports_analytics").on(
      table.date,
      table.foreignPartnerId,
      table.foreignCampaignId,
      table.deviceType,
    ),

    // CHECK constraints for data integrity
    check(
      "chk_traffic_reports_positive_counts",
      sql`
        ${table.allClicks} >= 0 AND 
        ${table.uniqueClicks} >= 0 AND 
        ${table.registrationsCount} >= 0 AND 
        ${table.ftdCount} >= 0 AND 
        ${table.depositsCount} >= 0
      `,
    ),
    check(
      "chk_traffic_reports_positive_rates",
      sql`
        ${table.cr} >= 0 AND 
        ${table.cftd} >= 0 AND 
        ${table.cd} >= 0 AND 
        ${table.rftd} >= 0
      `,
    ),
    check(
      "chk_traffic_reports_device_type",
      sql`
        ${table.deviceType} IS NULL OR ${table.deviceType} IN ('Phone', 'Desktop', 'Tablet')
      `,
    ),
    check(
      "chk_traffic_reports_clicks_logic",
      sql`
        ${table.uniqueClicks} <= ${table.allClicks}
      `,
    ),
  ],
);

// Types for better TypeScript integration
export type ConversionUpload = typeof conversionUploads.$inferSelect;
export type NewConversionUpload = typeof conversionUploads.$inferInsert;

export type PlayerData = typeof playerData.$inferSelect;
export type NewPlayerData = typeof playerData.$inferInsert;

export type TrafficReport = typeof trafficReports.$inferSelect;
export type NewTrafficReport = typeof trafficReports.$inferInsert;
