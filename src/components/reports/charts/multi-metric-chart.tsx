"use client";

import React, { useState, useMemo } from "react";
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { getMetricConfig, buildChartConfig } from "./chart-utils";

interface CohortMetrics {
  cohortDate: string;
  ftdCount: number;
  dep2cost: number | null;
  roas: number | null;
  avgDepositSum: number | null;
  retentionRate: number | null;
}

export interface MultiMetricChartProps {
  readonly data: CohortMetrics[];
  readonly selectedMetrics?: ("dep2cost" | "roas" | "avgDepositSum" | "retentionRate")[];
  readonly title?: string;
  readonly description?: string;
  readonly className?: string;
  readonly chartType?: "line" | "bar" | "combined";
  readonly showNormalized?: boolean;
}

const metricConfigs = {
  dep2cost: {
    label: "DEP2COST",
    color: "#ef4444",
    format: (value: number) => `$${value.toFixed(2)}`,
    unit: "$",
  },
  roas: {
    label: "ROAS",
    color: "#22c55e",
    format: (value: number) => `${value.toFixed(2)}x`,
    unit: "x",
  },
  avgDepositSum: {
    label: "AVG DEPOSIT SUM",
    color: "#3b82f6",
    format: (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    unit: "$",
  },
  retentionRate: {
    label: "RETENTION RATE",
    color: "#8b5cf6",
    format: (value: number) => `${(value * 100).toFixed(1)}%`,
    unit: "%",
  },
} as const;

export function MultiMetricChart({
  data,
  selectedMetrics = ["dep2cost", "roas", "avgDepositSum", "retentionRate"],
  title = "Multi-Metric Comparison",
  description,
  className,
  chartType = "line",
  showNormalized = false,
}: MultiMetricChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(selectedMetrics));
  const [normalized, setNormalized] = useState(showNormalized);

  // Chart configuration
  const chartConfig = useMemo(() => {
    const configEntries: [string, { label: string; color: string }][] = [];

    for (const metric of selectedMetrics) {
      if (activeMetrics.has(metric)) {
        const metricConfigEntry = getMetricConfig(metricConfigs, metric);
        if (metricConfigEntry) {
          configEntries.push([
            metric,
            {
              label: metricConfigEntry.label,
              color: metricConfigEntry.color,
            },
          ]);
        }
      }
    }

    return buildChartConfig(configEntries);
  }, [selectedMetrics, activeMetrics]);

  const toggleMetric = (metric: string) => {
    const newActiveMetrics = new Set(activeMetrics);
    if (newActiveMetrics.has(metric)) {
      newActiveMetrics.delete(metric);
    } else {
      newActiveMetrics.add(metric);
    }
    setActiveMetrics(newActiveMetrics);
  };

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="cohortDate"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickFormatter={(value) => new Date(String(value)).toLocaleDateString()}
        />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const metric = name as keyof typeof metricConfigs;
                const metricConfigEntry = getMetricConfig(metricConfigs, String(metric));
                return [
                  metricConfigEntry?.format(Number(value)) ?? String(value),
                  metricConfigEntry?.label ?? String(name),
                ];
              }}
              labelFormatter={(label) => `Cohort: ${new Date(String(label)).toLocaleDateString()}`}
            />
          }
        />
        <Legend content={<ChartLegendContent />} />

        {selectedMetrics.map((metric) => {
          if (!activeMetrics.has(metric)) return null;

          const metricConfigEntry = getMetricConfig(metricConfigs, metric);
          if (!metricConfigEntry) return null;

          return (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={metricConfigEntry.color}
              strokeWidth={2}
              dot={{ r: 4, fill: metricConfigEntry.color }}
              activeDot={{ r: 6, fill: metricConfigEntry.color }}
              connectNulls={false}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="cohortDate"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickFormatter={(value) => new Date(String(value)).toLocaleDateString()}
        />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const metric = name as keyof typeof metricConfigs;
                const metricConfigEntry = getMetricConfig(metricConfigs, String(metric));
                return [
                  metricConfigEntry?.format(Number(value)) ?? String(value),
                  metricConfigEntry?.label ?? String(name),
                ];
              }}
              labelFormatter={(label) => `Cohort: ${new Date(String(label)).toLocaleDateString()}`}
            />
          }
        />
        <Legend content={<ChartLegendContent />} />

        {selectedMetrics.map((metric) => {
          if (!activeMetrics.has(metric)) return null;

          const metricConfigEntry = getMetricConfig(metricConfigs, metric);
          if (!metricConfigEntry) return null;

          return <Bar key={metric} dataKey={metric} fill={metricConfigEntry.color} opacity={0.8} />;
        })}
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
            <p className="text-muted-foreground mt-2 text-xs">Compare multiple metrics across cohorts</p>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="normalized" className="text-sm">
              Normalize
            </Label>
            <Switch id="normalized" checked={normalized} onCheckedChange={setNormalized} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {selectedMetrics.map((metric) => {
            const metricConfigEntry = getMetricConfig(metricConfigs, metric);
            if (!metricConfigEntry) return null;

            return (
              <Badge
                key={metric}
                variant={activeMetrics.has(metric) ? "default" : "outline"}
                className="cursor-pointer"
                style={
                  activeMetrics.has(metric)
                    ? {
                        backgroundColor: metricConfigEntry.color,
                        color: "white",
                      }
                    : {}
                }
                onClick={() => {
                  toggleMetric(metric);
                }}
              >
                {metricConfigEntry.label}
              </Badge>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <Tabs defaultValue={chartType} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="line">Line Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            </TabsList>

            <TabsContent value="line" className="mt-4">
              {renderLineChart()}
            </TabsContent>

            <TabsContent value="bar" className="mt-4">
              {renderBarChart()}
            </TabsContent>
          </Tabs>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
