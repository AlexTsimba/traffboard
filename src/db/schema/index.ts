// Main schema exports
export * from "./users";
export * from "./sessions";
export * from "./conversions";

// Type exports for better organization
export type {
  // Users
  User,
  NewUser,
  UserRole,
} from "./users";

export type {
  // Sessions
  Session,
  NewSession,
  UserSession,
  NewUserSession,
} from "./sessions";

export type {
  // Conversions & Analytics
  ConversionUpload,
  NewConversionUpload,
  PlayerData,
  NewPlayerData,
  TrafficReport,
  NewTrafficReport,

  // Enums
  UploadStatus,
  FileType,
  DeviceType,
} from "./conversions";

// Re-export common enums for convenience
export { USER_ROLES } from "./users";
export { UPLOAD_STATUS, FILE_TYPES, DEVICE_TYPES } from "./conversions";
