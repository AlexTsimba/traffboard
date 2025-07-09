"use client";

import React, { useState, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  getBreakpointValue,
  getCohortColorSafe,
  getChartDataProperty,
  setChartDataProperty,
  getValidBreakpointValues,
} from "./chart-utils";

interface CohortData {
  cohortDate: string;
  ftdCount: number;
  breakpointValues: Record<number, number | null>;
}

export interface BreakpointChartProps {
  readonly data: CohortData[];
  readonly metric: "dep2cost" | "roas" | "avgDepositSum" | "retentionRate";
  readonly breakpoints: number[];
  readonly title?: string;
  readonly description?: string;
  readonly className?: string;
  readonly showAverage?: boolean;
  readonly showConfidenceBands?: boolean;
}

const metricConfigs = {
  dep2cost: {
    label: "DEP2COST",
    color: "#ef4444",
    format: (value: number) => `$${value.toFixed(2)}`,
    yAxisDomain: [0, "auto"] as [number, string],
  },
  roas: {
    label: "ROAS",
    color: "#22c55e",
    format: (value: number) => `${value.toFixed(2)}x`,
    yAxisDomain: [0, "auto"] as [number, string],
  },
  avgDepositSum: {
    label: "AVG DEPOSIT SUM",
    color: "#3b82f6",
    format: (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    yAxisDomain: [0, "auto"] as [number, string],
  },
  retentionRate: {
    label: "RETENTION RATE",
    color: "#8b5cf6",
    format: (value: number) => `${(value * 100).toFixed(1)}%`,
    yAxisDomain: [0, 1] as [number, number],
  },
} as const;

const cohortColors = [
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#14b8a6",
] as const;

export function BreakpointChart({
  data,
  metric,
  breakpoints,
  title = "Breakpoint Analysis",
  description,
  className,
  showAverage = true,
  showConfidenceBands = false,
}: BreakpointChartProps) {
  const [cohortFilter, setCohortFilter] = useState<"all" | "selected" | "top" | "recent">("all");
  const [topCount, setTopCount] = useState(5);
  const [chartType, setChartType] = useState<"line" | "area">("line");

  // eslint-disable-next-line security/detect-object-injection
  const metricConfig = metricConfigs[metric];

  // Filter cohorts based on selection
  const filteredCohorts = useMemo(() => {
    let filtered = [...data];

    if (cohortFilter === "top") {
      // Sort by average performance across all breakpoints
      const sortedFiltered = filtered
        .map((cohort) => {
          const validValues: number[] = [];
          for (const bp of breakpoints) {
            const value = getBreakpointValue(cohort.breakpointValues, bp);
            if (typeof value === "number") {
              validValues.push(value);
            }
          }
          const avgValue =
            validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
          return { ...cohort, avgValue };
        })
        .toSorted((a, b) => b.avgValue - a.avgValue);
      filtered = sortedFiltered.slice(0, topCount);
    } else if (cohortFilter === "recent") {
      const sortedByDate = filtered.toSorted(
        (a, b) => new Date(b.cohortDate).getTime() - new Date(a.cohortDate).getTime(),
      );
      filtered = sortedByDate.slice(0, topCount);
    }
    // For "selected" and "all" cases, return filtered as is

    return filtered;
  }, [data, cohortFilter, topCount, breakpoints]);

  // Transform data for chart
  const chartData = useMemo(() => {
    return breakpoints.map((breakpoint) => {
      let dataPoint: Record<string, unknown> = {
        breakpoint,
        day: `Day ${breakpoint}`,
      };

      // Add data for each cohort using safe property access
      for (const [index, cohort] of filteredCohorts.entries()) {
        const value = getBreakpointValue(cohort.breakpointValues, breakpoint);
        if (value !== null) {
          const cohortKey = `cohort_${index}`;
          const labelKey = `cohort_${index}_label`;

          dataPoint = setChartDataProperty(dataPoint, cohortKey, value);
          dataPoint = setChartDataProperty(dataPoint, labelKey, new Date(cohort.cohortDate).toLocaleDateString());
        }
      }

      // Calculate average if enabled
      if (showAverage) {
        const validValues = getValidBreakpointValues(filteredCohorts, breakpoint);

        if (validValues.length > 0) {
          dataPoint.average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        }
      }

      return dataPoint;
    });
  }, [filteredCohorts, breakpoints, showAverage]);

  // Chart configuration for shadcn/ui ChartContainer
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};

    for (const [index, cohort] of filteredCohorts.entries()) {
      config[`cohort_${index}`] = {
        label: new Date(cohort.cohortDate).toLocaleDateString(),
        color: getCohortColorSafe(cohortColors, index),
      };
    }

    if (showAverage) {
      config.average = {
        label: "Average",
        color: "hsl(var(--foreground))",
      };
    }

    return config;
  }, [filteredCohorts, showAverage]);

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          domain={metricConfig.yAxisDomain}
          tickFormatter={metricConfig.format}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                if (name === "average") {
                  return [metricConfig.format(Number(value)), "Average"];
                }
                const cohortIndexString = String(name);
                const cohortIndex = cohortIndexString.split("_")[1];
                const label = getChartDataProperty(chartData[0] ?? {}, `cohort_${cohortIndex ?? ""}_label`) as string;
                return [metricConfig.format(Number(value)), label || cohortIndexString];
              }}
              labelFormatter={String}
            />
          }
        />
        <Legend content={<ChartLegendContent />} />

        {/* Individual cohort lines */}
        {filteredCohorts.map((cohort, index) => (
          <Line
            key={cohort.cohortDate}
            type="monotone"
            dataKey={`cohort_${index}`}
            stroke={getCohortColorSafe(cohortColors, index)}
            strokeWidth={2}
            dot={{ r: 3, fill: getCohortColorSafe(cohortColors, index) }}
            activeDot={{ r: 5, fill: getCohortColorSafe(cohortColors, index) }}
            connectNulls={false}
          />
        ))}

        {/* Average line */}
        {showAverage && (
          <Line
            type="monotone"
            dataKey="average"
            stroke="hsl(var(--foreground))"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: "hsl(var(--foreground))" }}
            activeDot={{ r: 6, fill: "hsl(var(--foreground))" }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          domain={metricConfig.yAxisDomain}
          tickFormatter={metricConfig.format}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                if (name === "average") {
                  return [metricConfig.format(Number(value)), "Average"];
                }
                const cohortIndexString = String(name);
                const cohortIndex = cohortIndexString.split("_")[1];
                const label = getChartDataProperty(chartData[0] ?? {}, `cohort_${cohortIndex ?? ""}_label`) as string;
                return [metricConfig.format(Number(value)), label || cohortIndexString];
              }}
              labelFormatter={String}
            />
          }
        />
        <Legend content={<ChartLegendContent />} />

        {/* Individual cohort areas */}
        {filteredCohorts.map((cohort, index) => (
          <Area
            key={cohort.cohortDate}
            type="monotone"
            dataKey={`cohort_${index}`}
            stroke={getCohortColorSafe(cohortColors, index)}
            fill={getCohortColorSafe(cohortColors, index)}
            fillOpacity={0.1}
            strokeWidth={1.5}
            dot={{ r: 3, fill: getCohortColorSafe(cohortColors, index) }}
            activeDot={{ r: 5, fill: getCohortColorSafe(cohortColors, index) }}
            connectNulls={false}
          />
        ))}

        {/* Average area */}
        {showAverage && (
          <Area
            type="monotone"
            dataKey="average"
            stroke="hsl(var(--foreground))"
            fill="hsl(var(--foreground))"
            fillOpacity={0.2}
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: "hsl(var(--foreground))" }}
            activeDot={{ r: 6, fill: "hsl(var(--foreground))" }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
            <p className="text-muted-foreground mt-2 text-xs">{metricConfig.label} evolution across breakpoints</p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <Select
              value={cohortFilter}
              onValueChange={(value: typeof cohortFilter) => {
                setCohortFilter(value);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cohorts</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="top">Top Performers</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>

            {(cohortFilter === "top" || cohortFilter === "recent") && (
              <Select
                value={topCount.toString()}
                onValueChange={(value) => {
                  setTopCount(Number(value));
                }}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Metric Badge */}
        <div className="mt-4 flex items-center space-x-2">
          <Badge
            variant="default"
            style={{
              backgroundColor: metricConfig.color,
              color: "white",
            }}
          >
            {metricConfig.label}
          </Badge>
          {showAverage && <Badge variant="outline">Average Included</Badge>}
          {showConfidenceBands && <Badge variant="outline">Confidence Bands</Badge>}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="cohorts">Cohort List</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-4">
            <ChartContainer config={chartConfig}>
              <Tabs defaultValue={chartType} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="line"
                    onClick={() => {
                      setChartType("line");
                    }}
                  >
                    Line Chart
                  </TabsTrigger>
                  <TabsTrigger
                    value="area"
                    onClick={() => {
                      setChartType("area");
                    }}
                  >
                    Area Chart
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="line" className="mt-4">
                  {renderLineChart()}
                </TabsContent>

                <TabsContent value="area" className="mt-4">
                  {renderAreaChart()}
                </TabsContent>
              </Tabs>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="cohorts" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {cohortFilter === "all" && "All Cohorts"}
                {cohortFilter === "selected" && "Selected Cohorts"}
                {cohortFilter === "top" && `Top ${topCount} Performers`}
                {cohortFilter === "recent" && `${topCount} Most Recent Cohorts`}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCohorts.map((cohort, index) => {
                  const validValues: number[] = [];
                  for (const bp of breakpoints) {
                    const value = getBreakpointValue(cohort.breakpointValues, bp);
                    if (typeof value === "number") {
                      validValues.push(value);
                    }
                  }
                  const avgValue =
                    validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;

                  return (
                    <Card key={cohort.cohortDate}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{new Date(cohort.cohortDate).toLocaleDateString()}</CardTitle>
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: getCohortColorSafe(cohortColors, index) }}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">FTD Count:</span>
                          <span className="font-medium">{cohort.ftdCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Average {metricConfig.label}:</span>
                          <span className="font-medium">{metricConfig.format(avgValue)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Data Points:</span>
                          <span className="font-medium">
                            {validValues.length}/{breakpoints.length}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Breakpoint Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Breakpoint</th>
                        <th className="p-2 text-center">Average</th>
                        <th className="p-2 text-center">Min</th>
                        <th className="p-2 text-center">Max</th>
                        <th className="p-2 text-center">Std Dev</th>
                        <th className="p-2 text-center">Data Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((point) => {
                        const breakpoint = point.breakpoint as number;
                        const values = getValidBreakpointValues(filteredCohorts, breakpoint);

                        if (values.length === 0) return null;

                        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                        const min = Math.min(...values);
                        const max = Math.max(...values);
                        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
                        const stdDev = Math.sqrt(variance);

                        return (
                          <tr key={breakpoint} className="hover:bg-muted/50 border-b">
                            <td className="p-2 font-medium">Day {breakpoint}</td>
                            <td className="p-2 text-center">{metricConfig.format(avg)}</td>
                            <td className="p-2 text-center">{metricConfig.format(min)}</td>
                            <td className="p-2 text-center">{metricConfig.format(max)}</td>
                            <td className="p-2 text-center">{metricConfig.format(stdDev)}</td>
                            <td className="p-2 text-center">{values.length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Insights */}
              <div>
                <h4 className="mb-2 font-semibold">Key Insights</h4>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <Card>
                    <CardContent className="p-4">
                      <h5 className="mb-2 font-medium">Performance Trend</h5>
                      <p className="text-muted-foreground">
                        {(() => {
                          const firstPoint = chartData[0]?.average as number;
                          const lastPoint = chartData.at(-1)?.average as number;
                          if (firstPoint && lastPoint) {
                            const change = ((lastPoint - firstPoint) / firstPoint) * 100;
                            return change > 0
                              ? `Improving trend: +${change.toFixed(1)}% from Day ${breakpoints[0]} to Day ${breakpoints.at(-1)}`
                              : `Declining trend: ${change.toFixed(1)}% from Day ${breakpoints[0]} to Day ${breakpoints.at(-1)}`;
                          }
                          return "Insufficient data for trend analysis";
                        })()}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h5 className="mb-2 font-medium">Variability</h5>
                      <p className="text-muted-foreground">
                        {(() => {
                          const avgStdDev =
                            chartData.reduce((sum, point) => {
                              const breakpoint = point.breakpoint as number;
                              const values = getValidBreakpointValues(filteredCohorts, breakpoint);

                              if (values.length > 1) {
                                const avg = values.reduce((s, v) => s + v, 0) / values.length;
                                const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
                                return sum + Math.sqrt(variance);
                              }
                              return sum;
                            }, 0) / chartData.length;

                          return avgStdDev > 0
                            ? `Average variability: ${metricConfig.format(avgStdDev)} across breakpoints`
                            : "Low variability across cohorts";
                        })()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
