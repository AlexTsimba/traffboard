"use client";

import { SessionManagement } from "./session-management";
import { TwoFactorSetup } from "./two-factor-setup";

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <TwoFactorSetup />
      <SessionManagement />
    </div>
  );
}
