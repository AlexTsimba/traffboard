"use client";

import { Monitor, Smartphone, Tablet, MapPin, Calendar, Shield, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

import { revokeSessionAction, revokeAllOtherSessionsAction } from "../_actions/session-actions";

const formatDate = (dateString: string) => {
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

const parseUserAgent = (userAgent: string | null) => {
  if (!userAgent) return { browser: "Unknown", os: "Unknown" };

  // Simple user agent parsing (you could use a library like ua-parser-js for more accuracy)
  let browser = "Unknown";
  let os = "Unknown";

  // Detect browser
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";

  // Detect OS
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS")) os = "iOS";

  return { browser, os };
};

interface Session {
  sessionToken: string;
  expires: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

interface SessionManagementProps {
  readonly initialSessions: Session[];
}

export function SessionManagement({ initialSessions }: SessionManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleRevokeSession = (sessionToken: string) => {
    setRevoking(sessionToken);
    startTransition(async () => {
      try {
        const result = await revokeSessionAction(sessionToken);
        
        if (result.success) {
          toast({
            title: "Success",
            description: result.message,
          });
          router.refresh(); // Refresh to show updated session list
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setRevoking(null);
      }
    });
  };

  const handleRevokeAllOtherSessions = () => {
    setRevokingAll(true);
    startTransition(async () => {
      try {
        const result = await revokeAllOtherSessionsAction();
        
        if (result.success) {
          toast({
            title: "Success",
            description: `${result.revokedCount} sessions revoked successfully`,
          });
          router.refresh(); // Refresh to show updated session list
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setRevokingAll(false);
      }
    });
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const otherSessions = initialSessions.filter((session) => !session.isCurrent);
  const currentSession = initialSessions.find((session) => session.isCurrent);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Session Management
        </CardTitle>
        <CardDescription>
          Manage your active sessions across different devices and locations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Session */}
        {currentSession && (
          <div>
            <h3 className="mb-3 text-sm font-medium">Current Session</h3>
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getDeviceIcon(currentSession.deviceType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {currentSession.browser || parseUserAgent(currentSession.userAgent).browser} on{" "}
                        {currentSession.os || parseUserAgent(currentSession.userAgent).os}
                      </p>
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      {currentSession.ipAddress && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {currentSession.ipAddress}
                          {currentSession.city && currentSession.country && (
                            <span className="ml-1">
                              ({currentSession.city}, {currentSession.country})
                            </span>
                          )}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Active {getRelativeTime(currentSession.lastActivity)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Started {formatDate(currentSession.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Sessions */}
        {otherSessions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Other Sessions</h3>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending || revokingAll}
                  >
                    {revokingAll ? "Revoking..." : "Revoke All"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke All Other Sessions</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sign you out of all other devices. You'll need to sign in again on those devices.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleRevokeAllOtherSessions()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Revoke All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="space-y-3">
              {otherSessions.map((session) => {
                const { browser, os } = parseUserAgent(session.userAgent);
                const isRevoking = revoking === session.sessionToken;

                return (
                  <div key={session.sessionToken} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getDeviceIcon(session.deviceType)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {session.browser || browser} on {session.os || os}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {session.ipAddress && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.ipAddress}
                                {session.city && session.country && (
                                  <span className="ml-1">
                                    ({session.city}, {session.country})
                                  </span>
                                )}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Active {getRelativeTime(session.lastActivity)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Started {formatDate(session.createdAt)}
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending || isRevoking}
                          >
                            <Trash2 className="h-4 w-4" />
                            {isRevoking ? "Revoking..." : "Revoke"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will sign out this device. You'll need to sign in again on that device.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeSession(session.sessionToken)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke Session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Other Sessions */}
        {otherSessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No other active sessions</p>
            <p className="text-xs mt-1">You're only signed in on this device</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}