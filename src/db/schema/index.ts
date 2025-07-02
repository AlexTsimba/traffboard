// Export all database schemas and types
export * from "./users";
export * from "./sessions";
export * from "./conversions";

// Re-export commonly used schemas for convenience
export { users, USER_ROLES } from "./users";
export { sessions, userSessions, accounts, SESSION_STATUS } from "./sessions";
export { conversions, conversionUploads, UPLOAD_STATUS, DEVICE_TYPES, TRAFFIC_SOURCES } from "./conversions";

// Type exports for easier imports
export type { User, NewUser, UserRole } from "./users";

export type { Session, NewSession, UserSession, NewUserSession, Account, NewAccount, SessionStatus } from "./sessions";

export type {
  Conversion,
  NewConversion,
  ConversionUpload,
  NewConversionUpload,
  UploadStatus,
  DeviceType,
  TrafficSource,
} from "./conversions";
