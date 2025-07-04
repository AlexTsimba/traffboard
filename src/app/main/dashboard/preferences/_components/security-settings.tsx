"use client";

import { SessionManagement } from "./session-management";
import { TwoFactorSetup } from "./two-factor-setup";

interface Session {
  sessionToken: string;
  expires: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

interface SecuritySettingsProps {
  readonly initialSessions: Session[];
}

export function SecuritySettings({ initialSessions }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <TwoFactorSetup />
      <SessionManagement initialSessions={initialSessions} />
    </div>
  );
}
