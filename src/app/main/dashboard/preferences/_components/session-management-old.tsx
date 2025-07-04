"use client";

import { Monitor, Smartphone, Tablet, MapPin, Calendar, Shield, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { SessionsResponse, SessionRevocationResponse, ErrorResponse, SessionData } from "@/types/api";

const _formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
};

const getRelativeTime = (dateString: string) => {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
};

// SessionData type imported from @/types/api

export function SessionManagement() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/account/sessions");
        if (!response.ok) {
          throw new Error("Failed to fetch sessions");
        }

        const data = (await response.json()) as SessionsResponse;
        setSessions(data.sessions);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load sessions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchSessions();
  }, [toast]);

  const revokeSession = async (sessionToken: string) => {
    setRevoking(sessionToken);
    try {
      const response = await fetch(`/api/account/sessions/${sessionToken}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = (await response.json()) as ErrorResponse;
        throw new Error(error.error || "Failed to revoke session");
      }

      // Remove the revoked session from the list
      setSessions(sessions.filter((s) => s.sessionToken !== sessionToken));

      toast({
        title: "Success",
        description: "Session revoked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke session",
        variant: "destructive",
      });
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    setRevokingAll(true);
    try {
      const response = await fetch("/api/account/sessions", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = (await response.json()) as ErrorResponse;
        throw new Error(error.error || "Failed to revoke sessions");
      }

      const result = (await response.json()) as SessionRevocationResponse;

      // Keep only the current session
      setSessions(sessions.filter((s) => s.isCurrent));

      toast({
        title: "Success",
        description: `${result.revokedCount} sessions revoked successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke sessions",
        variant: "destructive",
      });
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile": {
        return <Smartphone className="h-5 w-5" />;
      }
      case "tablet": {
        return <Tablet className="h-5 w-5" />;
      }
      case undefined: {
        return <Monitor className="h-5 w-5" />;
      }
      default: {
        return <Monitor className="h-5 w-5" />;
      }
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>Manage your active sessions across different devices and browsers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Session */}
        {sessions
          .filter((s) => s.isCurrent)
          .map((session) => (
            <div key={session.sessionToken} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                {getDeviceIcon(session.deviceType)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {session.browser ?? "Unknown Browser"} on {session.os ?? "Unknown OS"}
                    </span>
                    <Badge variant="default">Current</Badge>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.city && session.country
                        ? `${session.city}, ${session.country}`
                        : (session.ipAddress ?? "Unknown location")}
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Active {getRelativeTime(session.lastActivity)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

        {/* Other Sessions */}
        {otherSessions.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Other Sessions</h4>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={revokingAll}>
                    {revokingAll ? "Revoking..." : "Revoke All Others"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke All Other Sessions</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sign you out of all other devices and browsers except this one. You will need to sign in
                      again on those devices.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        void revokeAllOtherSessions();
                      }}
                    >
                      Revoke All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="space-y-3">
              {otherSessions.map((session) => (
                <div key={session.sessionToken} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(session.deviceType)}
                    <div>
                      <div className="font-medium">
                        {session.browser ?? "Unknown Browser"} on {session.os ?? "Unknown OS"}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.city && session.country
                            ? `${session.city}, ${session.country}`
                            : (session.ipAddress ?? "Unknown location")}
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Last active {getRelativeTime(session.lastActivity)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={revoking === session.sessionToken}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Session</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will sign out this device/browser. You will need to sign in again on that device.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            void revokeSession(session.sessionToken);
                          }}
                        >
                          Revoke Session
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </>
        )}

        {otherSessions.length === 0 && (
          <div className="text-muted-foreground py-8 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No other active sessions</p>
            <p className="text-sm">You are only signed in on this device</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
