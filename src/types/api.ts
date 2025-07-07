// API Response Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  totpSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  lastModifiedBy: string | null;
}

export interface ProfileResponse {
  user: User;
}

export interface SessionData {
  sessionToken: string;
  userId: string;
  expires: string;
  browser: string | null;
  os: string | null;
  deviceName: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  isCurrent: boolean;
  createdAt: string;
  lastActiveAt: string;
  lastActivity: string;
}

export interface SessionsResponse {
  sessions: SessionData[];
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface ErrorResponse {
  error: string;
}

// 2FA Setup Response
export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  serviceName: string;
  accountName: string;
}

// Session revocation response
export interface SessionRevocationResponse {
  success: boolean;
  revokedCount: number;
}

// Password change response
export interface PasswordChangeResponse {
  success: boolean;
  message?: string;
}

// 2FA enable/disable response
export interface TwoFactorToggleResponse {
  success: boolean;
  message?: string;
}

// Form Data Types
export interface ProfileFormData {
  name: string;
  email: string;
}

export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorFormData {
  token: string;
}
