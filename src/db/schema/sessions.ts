import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, serial, integer, jsonb } from "drizzle-orm/pg-core";

import { users } from "./users";

// NextAuth.js standard sessions table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// User sessions table for security UI and session management
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull(), // Reference to NextAuth session

  // Device and Browser Information
  deviceInfo: jsonb("device_info").default({
    type: "unknown",
    model: null,
    vendor: null,
  }),
  browserInfo: jsonb("browser_info").default({
    name: "unknown",
    version: null,
    engine: null,
  }),
  osInfo: jsonb("os_info").default({
    name: "unknown",
    version: null,
  }),

  // Network Information
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 support
  location: jsonb("location").default({
    country: null,
    city: null,
    region: null,
  }),

  // Session State
  isActive: boolean("is_active").default(true).notNull(),
  isCurrent: boolean("is_current").default(false).notNull(), // Current active session

  // Activity Tracking
  firstActivity: timestamp("first_activity", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  lastActivity: timestamp("last_activity", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// NextAuth.js accounts table (for OAuth providers if needed later)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  idToken: text("id_token"),
  sessionState: varchar("session_state", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// TypeScript types for schema inference
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

// Session status enum
export const SESSION_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  REVOKED: "revoked",
} as const;

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];
