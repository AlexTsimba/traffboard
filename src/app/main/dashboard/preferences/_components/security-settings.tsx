"use client";

import type { SessionData } from "@/types/api";

import { SessionManagement } from "./session-management";
import { TwoFactorSetup } from "./two-factor-setup";

interface SecuritySettingsProps {
  readonly initialSessions: SessionData[];
}

export function SecuritySettings({ initialSessions }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <TwoFactorSetup />
      <SessionManagement initialSessions={initialSessions} />
    </div>
  );
}
