import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, serial, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"),

  // Two-Factor Authentication
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"), // Encrypted TOTP secret
  recoveryCodes: text("recovery_codes").array(), // Array of encrypted recovery codes

  // Notification Preferences
  notificationPreferences: jsonb("notification_preferences")
    .default({
      email: true,
      loginAlerts: true,
      securityAlerts: true,
      systemUpdates: false,
    })
    .notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// TypeScript types for schema inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// User roles enum for type safety
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPERUSER: "superuser",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
