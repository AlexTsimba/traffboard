"use client";

import type { SafeSession } from "@/lib/data/sessions";
import type { Safe2FAStatus } from "@/lib/data/two-factor";

import { SessionManagement } from "./session-management";
import { TwoFactorSetup } from "./two-factor-setup";

interface SecuritySettingsProps {
  readonly initialSessions: SafeSession[];
  readonly initial2FAStatus?: Safe2FAStatus | null;
}

export function SecuritySettings({ initialSessions, initial2FAStatus = null }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <TwoFactorSetup initialStatus={initial2FAStatus} />
      <SessionManagement initialSessions={initialSessions} />
    </div>
  );
}
