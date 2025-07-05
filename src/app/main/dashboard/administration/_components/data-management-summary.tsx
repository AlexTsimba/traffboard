import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";

interface DataStats {
  readonly playerCount: number;
  readonly conversionCount: number;
  readonly playerDateRange: {
    readonly earliest: string | null;
    readonly latest: string | null;
  };
  readonly conversionDateRange: {
    readonly earliest: string | null;
    readonly latest: string | null;
  };
}

async function getDataStats(): Promise<DataStats> {
  try {
    // Get player data count and date range
    const playerCount = await prisma.playerData.count();
    const playerDateRange = await prisma.playerData.aggregate({
      _min: { date: true },
      _max: { date: true },
    });

    // Get conversion data count and date range
    const conversionCount = await prisma.conversion.count();
    const conversionDateRange = await prisma.conversion.aggregate({
      _min: { date: true },
      _max: { date: true },
    });

    return {
      playerCount,
      conversionCount,
      playerDateRange: {
        earliest: playerDateRange._min.date?.toISOString() ?? null,
        latest: playerDateRange._max.date?.toISOString() ?? null,
      },
      conversionDateRange: {
        earliest: conversionDateRange._min.date?.toISOString() ?? null,
        latest: conversionDateRange._max.date?.toISOString() ?? null,
      },
    };
  } catch (error) {
    console.error("Failed to fetch data stats:", error);
    // Return fallback data
    return {
      playerCount: 0,
      conversionCount: 0,
      playerDateRange: { earliest: null, latest: null },
      conversionDateRange: { earliest: null, latest: null },
    };
  }
}

function DataStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-24" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-32" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="mt-2 h-4 w-48" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-24" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-32" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="mt-2 h-4 w-48" />
        </CardContent>
      </Card>
    </div>
  );
}

const formatDateRange = (range: { readonly earliest: string | null; readonly latest: string | null }) => {
  if (!range.earliest || !range.latest) return "No data";
  const earliest = new Date(range.earliest).toLocaleDateString();
  const latest = new Date(range.latest).toLocaleDateString();
  return `${earliest} - ${latest}`;
};

async function DataStatsContent() {
  const stats = await getDataStats();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Player Data</CardTitle>
          <CardDescription>Total player records imported</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.playerCount.toLocaleString()}</div>
          <p className="text-muted-foreground text-sm">Date range: {formatDateRange(stats.playerDateRange)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversions</CardTitle>
          <CardDescription>Total conversion records imported</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.conversionCount.toLocaleString()}</div>
          <p className="text-muted-foreground text-sm">Date range: {formatDateRange(stats.conversionDateRange)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function DataManagementSummary() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold">Data Overview</h4>
        <p className="text-muted-foreground text-sm">Current database statistics and date ranges</p>
      </div>
      <Suspense fallback={<DataStatsSkeleton />}>
        <DataStatsContent />
      </Suspense>
    </div>
  );
}
