/**
 * TraffBoard Database Schema
 *
 * Time-series focused schema for casino traffic and player analytics.
 * Designed for high-volume time-series data with proper indexing
 * for analytics queries.
 */

// Export all table definitions
export * from "./traffic-reports";
export * from "./player-data";

// Re-export types for convenience
export type { TrafficReport, NewTrafficReport, DeviceType } from "./traffic-reports";

export type { PlayerData, NewPlayerData } from "./player-data";

// Export constants
export { DEVICE_TYPES } from "./traffic-reports";
