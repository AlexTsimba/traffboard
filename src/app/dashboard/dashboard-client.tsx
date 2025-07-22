'use client';

import * as React from 'react';
import { AreaGraph } from '~/features/overview/components/area-graph';
import { AreaGraphSkeleton } from '~/features/overview/components/area-graph-skeleton';
import { BarGraph } from '~/features/overview/components/bar-graph';
import { BarGraphSkeleton } from '~/features/overview/components/bar-graph-skeleton';
import { PieGraph } from '~/features/overview/components/pie-graph';
import { PieGraphSkeleton } from '~/features/overview/components/pie-graph-skeleton';
import { RecentSales } from '~/features/overview/components/recent-sales';
import { RecentSalesSkeleton } from '~/features/overview/components/recent-sales-skeleton';
import { Badge } from '~/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '~/components/ui/card';
import { ChartErrorBoundary } from '~/components/chart-error-boundary';
import { IconTrendingUp } from '@tabler/icons-react';

export function DashboardClient() {
  const [mounted, setMounted] = React.useState(false);
  const [chartsLoaded, setChartsLoaded] = React.useState(0);

  React.useEffect(() => {
    setMounted(true);
    const timers: NodeJS.Timeout[] = [];
    
    // Stagger chart loading to prevent simultaneous ResponsiveContainer calculations
    for (let i = 0; i < 4; i++) {
      timers.push(
        setTimeout(() => setChartsLoaded(prev => prev + 1), i * 150)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:px-6 min-h-[calc(100dvh-52px)]">
      {/* Welcome Header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Hi, Welcome back 👋
        </h2>
      </div>

      {/* Statistics Cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              $45,231.89
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +20.1%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Trending up this month <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Revenue growth exceeded targets
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Subscriptions</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              +2,350
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +180.1%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Strong subscription growth <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              New subscribers from last month
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Sales</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              +12,234
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +19%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Sales performance strong <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Conversion rates improving
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Active Now</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              +573
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +201
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              High user activity <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Users active since last hour
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Chart Components Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <ChartErrorBoundary>
            {chartsLoaded >= 1 ? <BarGraph /> : <BarGraphSkeleton />}
          </ChartErrorBoundary>
        </div>
        <div className="col-span-4 md:col-span-3">
          <ChartErrorBoundary>
            {chartsLoaded >= 2 ? <RecentSales /> : <RecentSalesSkeleton />}
          </ChartErrorBoundary>
        </div>
        <div className="col-span-4">
          <ChartErrorBoundary>
            {chartsLoaded >= 3 ? <AreaGraph /> : <AreaGraphSkeleton />}
          </ChartErrorBoundary>
        </div>
        <div className="col-span-4 md:col-span-3">
          <ChartErrorBoundary>
            {chartsLoaded >= 4 ? <PieGraph /> : <PieGraphSkeleton />}
          </ChartErrorBoundary>
        </div>
      </div>
      </div>
  )
}