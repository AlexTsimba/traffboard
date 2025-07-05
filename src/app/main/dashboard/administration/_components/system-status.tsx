"use client";

import { CheckCircle, XCircle, AlertCircle, Activity, Database, Server, Clock } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    server: string;
    database: {
      status: "healthy" | "unhealthy";
      latency?: number;
      error?: string;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

function StatusIcon({ status }: { readonly status: string }) {
  switch (status) {
    case "healthy":
    case "ok": {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    case "degraded": {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    case "unhealthy":
    case "error": {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    default: {
      return <Activity className="h-5 w-5 text-gray-500" />;
    }
  }
}

type StatusType = "healthy" | "ok" | "degraded" | "unhealthy" | "error";

function StatusBadge({ status }: { readonly status: string }) {
  const variants = new Map<StatusType, "default" | "secondary" | "destructive">([
    ["healthy", "default"],
    ["ok", "default"],
    ["degraded", "secondary"],
    ["unhealthy", "destructive"],
    ["error", "destructive"],
  ]);

  const variant = variants.get(status as StatusType) ?? "outline";

  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function SystemStatus() {
  const [healthData, setHealthData] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthData = async () => {
    try {
      setError(null);
      const response = await fetch("/api/health");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as HealthCheck;
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to fetch health data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHealthData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      void fetchHealthData();
    }, 30_000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-lg bg-gray-200"></div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-32 rounded-lg bg-gray-200"></div>
            <div className="h-32 rounded-lg bg-gray-200"></div>
            <div className="h-32 rounded-lg bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            System Status Unavailable
          </CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              void fetchHealthData();
            }}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon status={healthData.status} />
              System Status
            </div>
            <StatusBadge status={healthData.status} />
          </CardTitle>
          <CardDescription>
            Last updated: {lastUpdated?.toLocaleTimeString()} • Environment: {healthData.environment} • Version:{" "}
            {healthData.version}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">Uptime:</span>
              <span className="font-mono text-sm">{formatUptime(healthData.uptime)}</span>
            </div>
            <Button
              onClick={() => {
                void fetchHealthData();
              }}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Server Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" />
              Server
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <StatusBadge status={healthData.checks.server} />
              <StatusIcon status={healthData.checks.server} />
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <StatusBadge status={healthData.checks.database.status} />
              <StatusIcon status={healthData.checks.database.status} />
            </div>
            {healthData.checks.database.latency && (
              <div className="text-muted-foreground text-xs">Latency: {healthData.checks.database.latency}ms</div>
            )}
            {healthData.checks.database.error && (
              <div className="text-xs text-red-600">Error: {healthData.checks.database.error}</div>
            )}
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Memory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span className="font-mono">{healthData.checks.memory.percentage}%</span>
              </div>
              <Progress value={healthData.checks.memory.percentage} className="h-2" />
            </div>
            <div className="text-muted-foreground text-xs">
              {Math.round(healthData.checks.memory.used / 1024 / 1024)}MB /{" "}
              {Math.round(healthData.checks.memory.total / 1024 / 1024)}MB
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw Data (for debugging) */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm">Raw Health Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-muted-foreground overflow-auto text-xs">{JSON.stringify(healthData, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
