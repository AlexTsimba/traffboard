"use client";

import type { Safe2FAStatus } from "@/lib/data/two-factor";

import { SessionManagement } from "./session-management";
import { TwoFactorSetup } from "./two-factor-setup";

interface SecuritySettingsProps {
  readonly initial2FAStatus?: Safe2FAStatus | null;
}

export function SecuritySettings({ initial2FAStatus = null }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <TwoFactorSetup initialStatus={initial2FAStatus} />
      <SessionManagement />
    </div>
  );
}
