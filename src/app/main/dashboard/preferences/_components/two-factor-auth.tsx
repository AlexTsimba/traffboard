"use client";

import { QrCode, CheckCircle, AlertTriangle, Copy } from "lucide-react";
import { useState } from "react";

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
        <Badge className="flex items-center gap-1" variant={isEnabled ? "default" : "secondary"}>
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

      {isEnabled ? (
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
            <Button className="h-7 w-full text-xs" size="sm" variant="outline">
              Download Recovery Codes
            </Button>
          </div>

          <Button
            className="h-7 w-full text-xs"
            size="sm"
            variant="destructive"
            onClick={() => {
              setIsEnabled(false);
            }}
          >
            Disable Two-Factor Authentication
          </Button>
        </div>
      ) : (
        /* Setup 2FA */
        <div className="space-y-3">
          {showQR ? (
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
                  <Input readOnly className="h-7 font-mono text-xs" value="JBSWY3DPEHPK3PXP" />
                  <Button className="h-7 w-7 p-0" size="sm" variant="outline">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="verificationCode">
                  Verification Code
                </Label>
                <Input className="h-7 text-sm" id="verificationCode" maxLength={6} placeholder="Enter 6-digit code" />
              </div>

              <div className="flex gap-2">
                <Button
                  className="h-7 flex-1 text-xs"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowQR(false);
                  }}
                >
                  Back
                </Button>
                <Button
                  className="h-7 flex-1 text-xs"
                  size="sm"
                  onClick={() => {
                    setIsEnabled(true);
                  }}
                >
                  Verify & Enable
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Use an authenticator app like Google Authenticator or Authy for additional security.
              </p>
              <Button
                className="h-8 w-full"
                size="sm"
                onClick={() => {
                  setShowQR(true);
                }}
              >
                Setup Two-Factor Authentication
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
