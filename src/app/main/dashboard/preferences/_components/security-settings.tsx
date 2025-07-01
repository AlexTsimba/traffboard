"use client";

import { Shield, Key, Eye, EyeOff, Smartphone, Monitor, MapPin, Clock } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { TwoFactorAuth } from "./two-factor-auth";

export function SecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loginNotifications, setLoginNotifications] = useState(true);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Left Column */}
      <div className="space-y-3">
        {/* Password Change */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Key className="h-4 w-4" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Current Password</Label>
              <div className="relative">
                <Input
                  className="h-7 pr-7 text-sm"
                  placeholder="Enter current password"
                  type={showCurrentPassword ? "text" : "password"}
                />
                <Button
                  className="absolute top-0 right-0 h-7 w-7 p-0"
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCurrentPassword(!showCurrentPassword);
                  }}
                >
                  {showCurrentPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">New Password</Label>
                <div className="relative">
                  <Input
                    className="h-7 pr-7 text-sm"
                    placeholder="New password"
                    type={showNewPassword ? "text" : "password"}
                  />
                  <Button
                    className="absolute top-0 right-0 h-7 w-7 p-0"
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowNewPassword(!showNewPassword);
                    }}
                  >
                    {showNewPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Confirm</Label>
                <Input className="h-7 text-sm" placeholder="Confirm password" type="password" />
              </div>
            </div>

            <Button className="h-7 w-full text-xs" size="sm">
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Security Notifications */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Email alerts</Label>
                <p className="text-muted-foreground text-xs">Security notifications</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Login alerts</Label>
                <p className="text-muted-foreground text-xs">New sign-in notifications</p>
              </div>
              <Switch checked={loginNotifications} onCheckedChange={setLoginNotifications} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-3">
        {/* Two-Factor Authentication */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TwoFactorAuth />
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="gap-2 py-3">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Current Session */}
            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Monitor className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Current Device</p>
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <MapPin className="h-2 w-2" />
                    <span>Kyiv</span>
                    <Clock className="ml-1 h-2 w-2" />
                    <span>Active</span>
                  </div>
                </div>
              </div>
              <Badge className="text-xs" variant="secondary">
                Current
              </Badge>
            </div>

            {/* Other Session */}
            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <Smartphone className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">iPhone Safari</p>
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Clock className="h-2 w-2" />
                    <span>2h ago</span>
                  </div>
                </div>
              </div>
              <Button className="h-6 px-2 text-xs" size="sm" variant="outline">
                Revoke
              </Button>
            </div>

            <Button className="h-7 w-full text-xs" size="sm" variant="outline">
              Sign out all other sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
