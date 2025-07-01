"use client";

import { useState } from "react";

import { QrCode, CheckCircle, AlertTriangle, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TwoFactorAuth() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center justify-between">
        <Badge variant={isEnabled ? "default" : "secondary"} className="flex items-center gap-1">
          {isEnabled ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Enabled
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3" />
              Disabled
            </>
          )}
        </Badge>
      </div>

      {!isEnabled ? (
        /* Setup 2FA */
        <div className="space-y-3">
          {!showQR ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Use an authenticator app like Google Authenticator or Authy for additional security.
              </p>
              <Button onClick={() => setShowQR(true)} size="sm" className="h-8 w-full">
                Setup Two-Factor Authentication
              </Button>
            </div>
          ) : (
            /* QR Code Setup */
            <div className="space-y-3">
              {/* Mock QR Code */}
              <div className="flex justify-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                  <QrCode className="text-muted-foreground h-12 w-12" />
                </div>
              </div>

              {/* Backup Code */}
              <div className="space-y-1">
                <Label className="text-xs">Manual Setup Code</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value="JBSWY3DPEHPK3PXP" className="h-7 font-mono text-xs" />
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-1">
                <Label htmlFor="verificationCode" className="text-xs">
                  Verification Code
                </Label>
                <Input id="verificationCode" placeholder="Enter 6-digit code" maxLength={6} className="h-7 text-sm" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowQR(false)} size="sm" className="h-7 flex-1 text-xs">
                  Back
                </Button>
                <Button onClick={() => setIsEnabled(true)} size="sm" className="h-7 flex-1 text-xs">
                  Verify & Enable
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2FA Enabled */
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Recovery Codes</Label>
            <div className="grid grid-cols-2 gap-1 font-mono text-xs">
              <div className="bg-muted rounded p-1 text-xs">1A2B-3C4D</div>
              <div className="bg-muted rounded p-1 text-xs">5E6F-7G8H</div>
              <div className="bg-muted rounded p-1 text-xs">9I0J-1K2L</div>
              <div className="bg-muted rounded p-1 text-xs">3M4N-5O6P</div>
            </div>
            <Button variant="outline" size="sm" className="h-7 w-full text-xs">
              Download Recovery Codes
            </Button>
          </div>

          <Button variant="destructive" onClick={() => setIsEnabled(false)} size="sm" className="h-7 w-full text-xs">
            Disable Two-Factor Authentication
          </Button>
        </div>
      )}
    </div>
  );
}
