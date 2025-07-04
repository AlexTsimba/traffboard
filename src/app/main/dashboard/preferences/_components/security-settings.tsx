"use client";

import type { SafeSession } from "@/lib/data/sessions";

import { SessionManagement } from "./session-management";
import { TwoFactorSetup } from "./two-factor-setup";

interface SecuritySettingsProps {
  readonly initialSessions: SafeSession[];
}

export function SecuritySettings({ initialSessions }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <TwoFactorSetup />
      <SessionManagement initialSessions={initialSessions} />
    </div>
  );
}
