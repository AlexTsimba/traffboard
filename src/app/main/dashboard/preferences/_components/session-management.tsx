"use client";

import { Shield, Info } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SessionManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Session Management
        </CardTitle>
        <CardDescription>Session management information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Session management is no longer available.</strong>
            <br />
            TraffBoard now uses secure JWT tokens for authentication. Sessions are automatically managed and cannot be
            individually revoked. Your security is maintained through token expiration and secure authentication.
          </AlertDescription>
        </Alert>

        <div className="text-muted-foreground py-8 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="text-sm">JWT Token Authentication</p>
          <p className="mt-1 text-xs">Secure, stateless authentication without session management</p>
        </div>
      </CardContent>
    </Card>
  );
}
