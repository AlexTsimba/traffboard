import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, serial, integer, numeric, index, check } from "drizzle-orm/pg-core";

/**
 * Player Data - Time Series Table
 *
 * Based on actual CSV structure from overall_rows (3).csv:
 * Player ID,Original player ID,Sign up date,First deposit date,Partner ID,Company name,
 * Partners email,Partner tags,Campaign ID,Campaign name,Promo ID,Promo code,
 * Player country,Tag: clickid,Tag: os,Tag: source,Tag: sub2,Tag: webID,Date,
 * Prequalified,Duplicate,Self-excluded,Disabled,Currency,FTD count,FTD sum,
 * Deposits count,Deposits sum,Cashouts count,Cashouts sum,Casino bets count,
 * Casino Real NGR,Fixed per player,Casino bets sum,Casino wins sum
 *
 * Note: NGR (Net Gaming Revenue) can be negative - this is normal in casino data
 * when a player wins more than they bet on a given day.
 */
export const playerData = pgTable(
  "player_data",
  {
    // Primary key for the record
    id: serial("id").primaryKey(),

    // Player identification
    playerId: varchar("player_id", { length: 50 }).notNull(),
    originalPlayerId: varchar("original_player_id", { length: 50 }),

    // Player lifecycle dates
    signUpDate: timestamp("sign_up_date", { withTimezone: true }),
    firstDepositDate: timestamp("first_deposit_date", { withTimezone: true }),

    // Attribution data
    partnerId: integer("partner_id"),
    companyName: varchar("company_name", { length: 255 }),
    partnerTags: varchar("partner_tags", { length: 500 }),
    campaignId: integer("campaign_id"),
    campaignName: varchar("campaign_name", { length: 255 }),
    promoId: integer("promo_id"),
    promoCode: varchar("promo_code", { length: 100 }),

    // Player characteristics
    playerCountry: varchar("player_country", { length: 3 }), // ISO country codes
    currency: varchar("currency", { length: 3 }), // ISO currency codes

    // Tracking tags (from URL parameters)
    tagClickid: varchar("tag_clickid", { length: 255 }),
    tagOs: varchar("tag_os", { length: 100 }),
    tagSource: varchar("tag_source", { length: 100 }),
    tagSub2: varchar("tag_sub2", { length: 100 }),
    tagWebId: varchar("tag_web_id", { length: 100 }),

    // Time dimension - the date this record represents
    date: timestamp("date", { withTimezone: true }).notNull(),

    // Player status flags (boolean as integers: 0 = false, 1 = true)
    prequalified: integer("prequalified").notNull().default(0),
    duplicate: integer("duplicate").notNull().default(0),
    selfExcluded: integer("self_excluded").notNull().default(0),
    disabled: integer("disabled").notNull().default(0),

    // Financial metrics - Deposits
    ftdCount: integer("ftd_count").notNull().default(0), // First Time Deposit count
    ftdSum: numeric("ftd_sum", { precision: 15, scale: 2 }).notNull().default("0.00"),
    depositsCount: integer("deposits_count").notNull().default(0),
    depositsSum: numeric("deposits_sum", { precision: 15, scale: 2 }).notNull().default("0.00"),

    // Financial metrics - Withdrawals
    cashoutsCount: integer("cashouts_count").notNull().default(0),
    cashoutsSum: numeric("cashouts_sum", { precision: 15, scale: 2 }).notNull().default("0.00"),

    // Gaming metrics
    casinoBetsCount: integer("casino_bets_count").notNull().default(0),
    casinoBetsSum: numeric("casino_bets_sum", { precision: 15, scale: 2 }).notNull().default("0.00"),
    casinoWinsSum: numeric("casino_wins_sum", { precision: 15, scale: 2 }).notNull().default("0.00"),

    // Revenue metrics - IMPORTANT: NGR can be negative!
    casinoRealNgr: numeric("casino_real_ngr", { precision: 15, scale: 2 }).notNull().default("0.00"),
    fixedPerPlayer: numeric("fixed_per_player", { precision: 15, scale: 2 }).notNull().default("0.00"),

    // Audit timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    // Time-series optimized indexes - most queries filter by date first
    index("idx_player_data_date").on(table.date),
    index("idx_player_data_date_player").on(table.date, table.playerId),
    index("idx_player_data_date_partner").on(table.date, table.partnerId),
    index("idx_player_data_date_campaign").on(table.date, table.campaignId),

    // Player-centric indexes
    index("idx_player_data_player_id").on(table.playerId),
    index("idx_player_data_player_lifecycle").on(table.playerId, table.signUpDate, table.firstDepositDate),

    // Attribution indexes
    index("idx_player_data_partner").on(table.partnerId),
    index("idx_player_data_campaign").on(table.campaignId),
    index("idx_player_data_partner_campaign").on(table.partnerId, table.campaignId),

    // Analytics indexes
    index("idx_player_data_country").on(table.playerCountry),
    index("idx_player_data_currency").on(table.currency),
    index("idx_player_data_ngr").on(table.date, table.casinoRealNgr),

    // Composite index for common analytics queries
    index("idx_player_analytics").on(
      table.date,
      table.partnerId,
      table.campaignId,
      table.playerCountry,
      table.currency,
    ),

    // Data integrity constraints
    check(
      "chk_player_positive_amounts",
      sql`
        ${table.ftdSum} >= 0 AND 
        ${table.depositsSum} >= 0 AND 
        ${table.cashoutsSum} >= 0 AND 
        ${table.casinoBetsSum} >= 0 AND 
        ${table.casinoWinsSum} >= 0 AND
        ${table.fixedPerPlayer} >= 0
      `,
    ),
    check(
      "chk_player_positive_counts",
      sql`
        ${table.ftdCount} >= 0 AND 
        ${table.depositsCount} >= 0 AND 
        ${table.cashoutsCount} >= 0 AND 
        ${table.casinoBetsCount} >= 0
      `,
    ),
    check(
      "chk_player_boolean_flags",
      sql`
        ${table.prequalified} IN (0, 1) AND 
        ${table.duplicate} IN (0, 1) AND 
        ${table.selfExcluded} IN (0, 1) AND 
        ${table.disabled} IN (0, 1)
      `,
    ),
    // NOTE: NO constraint on casinoRealNgr being positive - it can be negative!
    // This is normal in casino data when players win more than they bet.
  ],
);

// TypeScript types
export type PlayerData = typeof playerData.$inferSelect;
export type NewPlayerData = typeof playerData.$inferInsert;
