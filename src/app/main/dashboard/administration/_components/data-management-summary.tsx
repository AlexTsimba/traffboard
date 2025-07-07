import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";

interface DataStats {
  readonly playerCount: number;
  readonly conversionCount: number;
  readonly totalUploadCount: number;
  readonly recentUploadCount: number;
  readonly playerDateRange: {
    readonly earliest: string | null;
    readonly latest: string | null;
  };
  readonly conversionDateRange: {
    readonly earliest: string | null;
    readonly latest: string | null;
  };
  readonly lastUploadDate: string | null;
}

async function getDataStats(): Promise<DataStats> {
  try {
    // Run all queries in parallel for better performance
    const [
      playerCount,
      conversionCount,
      totalUploadCount,
      recentUploadCount,
      playerDateRange,
      conversionDateRange,
      lastUpload,
    ] = await Promise.all([
      prisma.playerData.count(),
      prisma.conversion.count(),
      prisma.conversionUpload.count(),
      prisma.conversionUpload.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      prisma.playerData.aggregate({
        _min: { date: true },
        _max: { date: true },
      }),
      prisma.conversion.aggregate({
        _min: { date: true },
        _max: { date: true },
      }),
      prisma.conversionUpload.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    return {
      playerCount,
      conversionCount,
      totalUploadCount,
      recentUploadCount,
      playerDateRange: {
        earliest: playerDateRange._min.date?.toISOString() ?? null,
        latest: playerDateRange._max.date?.toISOString() ?? null,
      },
      conversionDateRange: {
        earliest: conversionDateRange._min.date?.toISOString() ?? null,
        latest: conversionDateRange._max.date?.toISOString() ?? null,
      },
      lastUploadDate: lastUpload?.createdAt.toISOString() ?? null,
    };
  } catch (error) {
    console.error("Failed to fetch data stats:", error);
    return {
      playerCount: 0,
      conversionCount: 0,
      totalUploadCount: 0,
      recentUploadCount: 0,
      playerDateRange: { earliest: null, latest: null },
      conversionDateRange: { earliest: null, latest: null },
      lastUploadDate: null,
    };
  }
}

function DataStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-1 h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const formatDateRange = (range: { readonly earliest: string | null; readonly latest: string | null }) => {
  if (!range.earliest || !range.latest) return "No data";
  const earliest = new Date(range.earliest).toLocaleDateString();
  const latest = new Date(range.latest).toLocaleDateString();
  if (earliest === latest) return earliest;
  return `${earliest} - ${latest}`;
};

const formatTimeAgo = (dateString: string | null) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

async function DataStatsContent() {
  const stats = await getDataStats();

  const metrics = [
    {
      title: "Player Records",
      value: stats.playerCount.toLocaleString(),
      subtitle: formatDateRange(stats.playerDateRange),
    },
    {
      title: "Conversions",
      value: stats.conversionCount.toLocaleString(),
      subtitle: formatDateRange(stats.conversionDateRange),
    },
    {
      title: "Total Uploads",
      value: stats.totalUploadCount.toLocaleString(),
      subtitle: `${stats.recentUploadCount} this week`,
    },
    {
      title: "Last Upload",
      value: formatTimeAgo(stats.lastUploadDate),
      subtitle: stats.lastUploadDate ? new Date(stats.lastUploadDate).toLocaleDateString() : "No uploads yet",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">{metric.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-muted-foreground mt-1 text-xs">{metric.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DataManagementSummary() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold">Data Overview</h4>
        <p className="text-muted-foreground text-sm">Database statistics and recent activity</p>
      </div>
      <Suspense fallback={<DataStatsSkeleton />}>
        <DataStatsContent />
      </Suspense>
    </div>
  );
}
